import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PASSWORD_RECOVERY_KEY = "body-burner:password-recovery";

export function isPasswordRecoveryUrl(value: string) {
  try {
    const url = new URL(value);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    return (
      url.searchParams.get("type") === "recovery" ||
      hash.get("type") === "recovery"
    );
  } catch {
    return false;
  }
}

export const supabase =
  url && key
    ? createBrowserClient(url, key, {
        cookieOptions: {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 400 * 24 * 60 * 60,
        },
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

function legacyStorageKey(projectUrl: string) {
  try {
    const projectRef = new URL(projectUrl).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

export function parseLegacySession(
  value: string | null,
): Pick<Session, "access_token" | "refresh_token"> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<Session>;
    if (
      typeof parsed.access_token !== "string" ||
      typeof parsed.refresh_token !== "string"
    )
      return null;
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    };
  } catch {
    return null;
  }
}

/** Restore the durable cookie session and migrate the previous localStorage session once. */
export async function restoreSession() {
  if (!supabase) return { session: null, error: null };

  const current = await supabase.auth.getSession();
  if (
    current.data.session ||
    current.error ||
    !url ||
    typeof window === "undefined"
  )
    return { session: current.data.session, error: current.error };

  const storageKey = legacyStorageKey(url);
  const legacy = storageKey
    ? parseLegacySession(window.localStorage.getItem(storageKey))
    : null;
  if (!legacy) return { session: null, error: null };

  const migrated = await supabase.auth.setSession(legacy);
  if (!migrated.error && storageKey) window.localStorage.removeItem(storageKey);
  return { session: migrated.data.session, error: migrated.error };
}

export async function api(path: string, options: RequestInit = {}) {
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "The request could not be completed.");
  return data;
}
