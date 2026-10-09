import test from "node:test";
import assert from "node:assert/strict";
import { isPasswordRecoveryUrl, parseLegacySession } from "../lib/supabase";

test("reads the access and refresh tokens from a legacy browser session", () => {
  assert.deepEqual(
    parseLegacySession(
      JSON.stringify({
        access_token: "access",
        refresh_token: "refresh",
        expires_in: 3600,
        token_type: "bearer",
      }),
    ),
    { access_token: "access", refresh_token: "refresh" },
  );
});

test("rejects missing, malformed, or incomplete legacy sessions", () => {
  assert.equal(parseLegacySession(null), null);
  assert.equal(parseLegacySession("not-json"), null);
  assert.equal(
    parseLegacySession(JSON.stringify({ access_token: "access" })),
    null,
  );
});

test("detects password recovery links in query strings and URL fragments", () => {
  assert.equal(
    isPasswordRecoveryUrl("https://body-burner.vercel.app/#type=recovery&access_token=x"),
    true,
  );
  assert.equal(
    isPasswordRecoveryUrl("https://body-burner.vercel.app/?type=recovery"),
    true,
  );
  assert.equal(isPasswordRecoveryUrl("https://body-burner.vercel.app/"), false);
  assert.equal(isPasswordRecoveryUrl("not a URL"), false);
});
