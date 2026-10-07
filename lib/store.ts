"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { emptyState, type State } from "./domain";
const LOCAL_KEY = "body-burner-local-v1";
export function useStore(owner: string | null) {
  const [state, setState] = useState<State>(emptyState);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading your space…");
  const [blocked, setBlocked] = useState(false);
  const version = useRef(0),
    baseline = useRef(""),
    pending = useRef<State | null>(null),
    saving = useRef(false),
    locked = useRef(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let next = emptyState();
        if (owner && supabase) {
          const membership = await supabase.rpc("is_member");
          if (membership.error || !membership.data)
            throw new Error("Invitation required.");
          const { data, error } = await supabase
            .from("app_state")
            .select("payload,version")
            .eq("user_id", owner)
            .maybeSingle();
          if (error) throw error;
          if (data) {
            next = data.payload;
            version.current = data.version;
          }
        } else {
          const local = localStorage.getItem(LOCAL_KEY);
          if (local) next = JSON.parse(local);
        }
        if (
          next.version !== 1 ||
          !next.profile ||
          !Array.isArray(next.foods) ||
          !Array.isArray(next.sessions)
        )
          throw new Error("Saved data could not be read.");
        next = {
          ...next,
          profile: { ...next.profile, days: 6 },
        };
        if (alive) {
          baseline.current = JSON.stringify(next);
          setState(next);
          setReady(true);
          setStatus(owner ? "All changes saved" : "Saved on this device");
        }
      } catch {
        if (alive) {
          locked.current = true;
          setBlocked(true);
          setReady(true);
          setStatus(
            owner
              ? "Could not open your account. Check your connection, then reload."
              : "Could not load your saved data. Reload before editing.",
          );
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [owner]);
  useEffect(() => {
    if (!ready || locked.current) return;
    const json = JSON.stringify(state);
    if (json === baseline.current) return;
    if (!owner) {
      try {
        localStorage.setItem(LOCAL_KEY, json);
        baseline.current = json;
        setStatus("Saved on this device");
      } catch {
        setStatus("Device storage is full. Export your data now.");
      }
      return;
    }
    pending.current = state;
    setStatus("Saving…");
    const timeout = setTimeout(async () => {
      if (saving.current || locked.current || !supabase) return;
      saving.current = true;
      while (pending.current && !locked.current) {
        const snapshot = pending.current;
        pending.current = null;
        const { data, error } = await supabase.rpc("save_state", {
          new_payload: snapshot,
          expected_version: version.current,
        });
        if (error) {
          locked.current = true;
          setBlocked(true);
          setStatus(
            error.message.includes("SYNC_CONFLICT")
              ? "Another device changed your data. Export these edits, then reload."
              : "Cloud save failed. Export these edits, then reload.",
          );
          break;
        }
        version.current = Number(data);
        baseline.current = JSON.stringify(snapshot);
      }
      saving.current = false;
      if (!locked.current) setStatus("All changes saved");
    }, 600);
    return () => clearTimeout(timeout);
  }, [state, ready, owner]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (pending.current || saving.current || locked.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  return { state, setState, ready, status, blocked };
}
export function exportData(state: State) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "body-burner-data.json";
  a.click();
  URL.revokeObjectURL(url);
}
export async function compressImage(file: File): Promise<string> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 20000000
  )
    throw new Error("Choose a JPEG, PNG or WebP under 20 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image tools are unavailable.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}
