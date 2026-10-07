# Architecture and boundaries

## Stack

Next.js App Router, React, TypeScript, plain responsive CSS, lucide-react icons, Supabase Auth/Postgres/Storage, Vercel serverless route handlers. Google Gemini REST handles optional inference; Open Food Facts and USDA provide food lookup. ZXing decodes camera barcodes on the device.

## State and persistence

The initial app starts without fabricated history or personal defaults. An unsigned user writes their journal to localStorage and compressed progress photos to IndexedDB. Logging in mounts a new account workspace; local records are not silently imported into an account.

Authenticated records are stored in one owner-scoped `app_state` JSONB document, limited to 2 MB per account, with an integer version. The store serializes debounced saves through `save_state`. That function compares the expected version atomically; a conflict freezes editing and offers export/reload. Direct table writes by the browser are revoked. Reads use RLS. A database trigger gives each verified email signup a membership row, and a membership function gates private services and licensed media.

This document-per-account design is appropriate for a small friends-only first release. A long-lived/multi-year journal or commercial product should migrate food entries, workout sessions, measurements and check-ins to normalized tables with independent versioning and pagination. There is no multi-user shared journal, trainer dashboard or public social feed.

Cloud data is held in page memory rather than copied into the browser's local journal. The Supabase browser SDK manages its session; server routes verify bearer tokens with `auth.getUser()` and check membership. Ordinary operation requires no service-role key.

## Photos

Selected images are resized to at most 1280 px on the longest edge and re-encoded as JPEG via canvas. This avoids carrying original EXIF metadata into the new file. Progress photos live in a private bucket under `user_id/random_uuid.jpg` with owner-scoped select/insert/delete policies. Signed preview URLs expire after one hour. Reopening Progress refreshes access.

Meal-photo bytes are sent only when the user selects a photo and consents to the estimate. The app does not persist them. The provider's own processing/retention policies still apply. Body/progress images are never read by the coach route.

Photo uploads and metadata writes are not one database transaction. If a tab closes between them, an orphan photo may remain; the journal-erasure flow lists and removes the owner's stored files. There is no automatic retention job in this release. The UI album limit is 24 photos, not a server-enforced storage quota; monitor the private project storage.

## APIs and spending

Every online API call requires a verified signed-in user. Database request counters use a transaction lock so serverless instances share the same limits. Food lookup is limited to 8 requests globally per UTC minute, 6 per user per minute and 100 per user per UTC day. AI is limited to 20 per user/day, 200 globally/day and 6 per user/minute. Direct authenticated calls to the counter can consume that user's quota but cannot increase it or bypass the API's checks.

Inputs are bounded; images are MIME/signature checked; output is JSON-schema constrained and Zod validated. API errors do not expose provider response bodies or secrets. Routes return `Cache-Control: no-store`. User text is treated as untrusted by the model prompt. These controls reduce risk but do not make the model infallible. Food estimates always need confirmation.

The chat interface displays the current conversation in memory. Each answer receives the latest question, selected stored logs and up to six recent chat messages, capped at 1,500 characters each. There is no long-term conversational memory. Reloading or leaving Coach clears the visible chat. No voice transcription is included.

## Plan and nutrition logic

`lib/domain.ts` contains deterministic template selection, safe load-progression suggestions, portion scaling and weight trends. Nutrition targets are optional and user entered. The weekly review does not infer expenditure or automatically alter calories. No body-fat inference, crash-diet advice, dehydration/weight-cut workflow or automatic injury rehabilitation is implemented.

Suggested load increments are capped at 10% and rounded down to 0.5 kg, with a maximum 2.5 kg step. If no sufficiently small step is available, keep the load. These are proposals to review against real equipment. RIR and rep-range thresholds are practical starter heuristics, not individualized prescriptions or a claim that one protocol is universally optimal. Volume sums completed rep sets only, using the entered load; per-hand dumbbells are not doubled. Timed exercises have separate labels and do not contribute to kg × reps.

## Deliberate first-release limitations

No payments, wearable integrations, restaurant API, reliable exhaustive Costco inventory, medical record handling, community feed, background sync, offline service worker, voice logging, long-term chat memory or automated account deletion. Users can erase their journal; the owner can delete the Auth account. Saved meals use a single food/meal nutrient record; a recipe ingredient builder can follow later.
