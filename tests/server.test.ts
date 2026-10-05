import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, authorized, limitedJson, failure } from "../lib/server";
import { POST as ai } from "../app/api/ai/route";
import { GET as foods } from "../app/api/foods/route";
test("JSON byte cap rejects oversized body even without content-length", async () => {
  const request = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ text: "x".repeat(100) }),
  });
  await assert.rejects(
    () => limitedJson(request, 20),
    (e: any) => e.status === 413,
  );
});
test("malformed JSON returns a controlled client error", async () => {
  await assert.rejects(
    () =>
      limitedJson(
        new Request("http://localhost", { method: "POST", body: "{" }),
        100,
      ),
    (e: any) => e.status === 400,
  );
});
test("internal errors never expose API keys or implementation details", async () => {
  const r = failure(new Error("SECRET API KEY"));
  assert.equal(r.status, 500);
  assert.doesNotMatch(await r.text(), /SECRET/);
});
test("configured API endpoints reject anonymous callers before contacting providers", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";
  const a = await ai(
    new Request("http://localhost/api/ai", { method: "POST", body: "{}" }),
  );
  const f = await foods(new Request("http://localhost/api/foods?q=banana"));
  assert.equal(a.status, 401);
  assert.equal(f.status, 401);
});
test("unconfigured online services return an explicit unavailable status", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  await assert.rejects(
    () => authorized(new Request("http://localhost")),
    (e: any) => e.status === 503,
  );
});
