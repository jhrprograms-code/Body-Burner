import { createClient } from "@supabase/supabase-js";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function authorized(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new ApiError(
      "Connect Supabase and sign in to use online features. Manual logging works in local mode.",
      503,
    );
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError("Sign in to use this feature.", 401);
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user)
    throw new ApiError("Your session expired. Please sign in again.", 401);
  const member = await client.rpc("is_member");
  if (member.error || !member.data)
    throw new ApiError(
      "Your account setup is incomplete. Sign out, sign in again, and retry.",
      403,
    );
  return { client, user: data.user };
}
export async function consume(
  client: Awaited<ReturnType<typeof authorized>>["client"],
  kind: "ai" | "food",
) {
  const { data, error } = await client.rpc("consume_request", {
    request_kind: kind,
  });
  if (error)
    throw new ApiError("Usage checks are unavailable. Try again later.", 503);
  if (!data)
    throw new ApiError("Request limit reached. Please try again later.", 429);
}
export function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "The service could not complete this request. Please try again.",
    },
    {
      status: error instanceof ApiError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function limitedJson(request: Request, maxBytes: number) {
  if (Number(request.headers.get("content-length") || 0) > maxBytes)
    throw new ApiError("Upload is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Request body is missing.");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ApiError("Upload is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError("Invalid request format.");
  }
}
