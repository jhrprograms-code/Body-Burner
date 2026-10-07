# Verification report — October 4, 2026

## Completed

- `npm install` completed and a reproducible `package-lock.json` was generated.
- `npm run typecheck`: passes.
- `npm test`: **27 tests pass**, no failures or skipped tests.
- `npm run build`: production compilation, TypeScript checking and static page generation pass with Next.js 16.3.8 / React 19.3.0 on Node.js 24.19.0.
- Build output includes `/`, the not-found page, `/api/ai` and `/api/foods`.
- No secret key, service-role key, personal logs, user reference screenshots or body photos are bundled.
- Media manifest is empty and GIF assets are absent; placeholders are labelled in the interface. The importer tests use isolated disposable 1-pixel fixtures, not actual exercise demonstrations.

## Automated coverage

The tests check portion scaling and invalid portions; empty nutrient totals; starting-weight calibration; successful versus incomplete/unknown-effort/painful sets; limited load increments at light weights; the six-training-day/one-recovery-day program, 80–90 minute targets and dumbbell substitutions; comparable weight windows; completed-set volume; calendar boundaries; OFF missing and zero values; kJ conversion; USDA nutrient-ID/unit handling; liquid serving units; media licence confirmation, path traversal rejection and hashed asset imports; request byte limits; malformed JSON; safe error messages; anonymous API rejection; and explicit unavailable-service responses.

## Not yet verified

- A real Supabase migration, Auth email delivery, RLS policies under live tokens, storage ownership, cross-device save conflicts and journal erasure. A development SQL test and manual acceptance list are included.
- Real Gemini inference, provider privacy/billing configuration, model availability for this particular Google account, output quality on user meals, or request-limit behavior against a live database.
- Live USDA/OFF queries through a deployed account, real package matching, camera permissions or barcode scanning on the user's iPhone.
- Browser rendering, responsive screenshots, accessibility/focus behavior and interactive end-to-end flows. The managed workspace does not expose the required preview/browser capability; no preview server or substitute browser was started.
- No Vercel deployment or GitHub remote repository has been created; no external credentials were supplied.
- No media purchase, licence validation by counsel/provider, full 200-GIF visual review, clinical validation or qualified-coach approval.

Passing unit/build checks is evidence that the source compiles and the tested rules behave as intended. It is not evidence that unconfigured third-party integrations have been exercised. Complete `docs/DEPLOY.md` acceptance checks before relying on the app with friends.
