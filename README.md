# Body Burner

A private, mobile-friendly fitness web app for you and friends. Black-and-white dark design, with training, nutrition and progress in one place. Built with Next.js, React, TypeScript and Supabase; ready to deploy on Vercel after configuration.

## What is implemented

- **Today:** a weekly calendar, daily calorie/macronutrient overview, workout entry point and completion checklist.
- **Training:** 3-, 4- or 5-day starter routines arranged across seven days including recovery; gym, dumbbell or bodyweight options; 200 searchable exercises; editable sets, loads, reps and RIR; rest timer; persistent active session; completed session history and summaries.
- **Progression:** compare previous sets; propose a small increase only after all working sets reach the upper rep range with effort recorded and no reported pain. Starting loads are calibrated, never inferred from body size or photos.
- **Nutrition:** breakfast, lunch and dinner logs, manual nutrients, saved foods/meals, portions in grams or millilitres, calorie/protein/carbohydrate/fat budgets, previous-day logs, Open Food Facts packaged-food/barcode lookup, USDA whole-food search, Kirkland search shortcut, camera barcode scanning.
- **AI meals:** optional compressed image and/or description sent to Gemini, structured estimate with calorie range and assumptions, editable items and a confirmation step. Nothing is logged automatically. Meal photos are not stored by the app.
- **Progress:** weight and waist measurements, steps, weight chart, comparable weekly averages, private side-by-side photo album (24 images), weekly subjective check-ins.
- **Coach:** optional AI guidance using selected recent account logs, plus a deterministic weekly snapshot that needs no AI. Progress photos are never submitted to the coach.
- **Accounts:** email-link authentication, invite-only membership, owner-scoped database/storage policies, private expiring photo URLs, state version checks, export and journal erasure.
- **Local mode:** manual tracking and progress photos work without keys. Cloud journals are separate from the local browser journal. Online food lookup and AI require an invited account.
- **Licensed media:** validated GIF importer. **No paid GIFs have been acquired or bundled.**

## Run locally

Use Node.js 22 or 24. From this directory:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open the localhost address shown by Next.js. Blank credentials start the local workspace. For cloud and AI, follow [DEPLOY.md](docs/DEPLOY.md). Do not put secret keys in client code or upload `.env.local` to GitHub.

```bash
npm test
npm run typecheck
npm run build
npm start
```

## Connect your services

1. Create a **private GitHub repository** and push this directory.
2. Create a Supabase project and run `supabase/migrations/001_body_burner.sql` once.
3. Configure invited users, email delivery and redirect URLs as described in the deployment guide.
4. Import the GitHub repository into Vercel; configure environment variables in its dashboard and redeploy.
5. Add your Google Gemini key and enable AI only after reviewing provider privacy/billing settings. USDA needs a separate free API key; Open Food Facts needs an app contact email.
6. Purchase an appropriate GIF licence and import only visually checked matches. See [MEDIA.md](docs/MEDIA.md).

**No account passwords or private API keys need to be sent in chat.**

## Important boundaries

This is a first release, not a clinically validated coaching service. A photo is not a reliable body-fat test, and food images cannot reveal exact portion weights or cooking oil. Starter programs and cues are editable draft content; no claim is made that a coach has reviewed all 200 movements. There is no automatic medical adaptation or automatic calorie prescription.

Food databases are broad but not exhaustive, and Costco stock/Canadian package formulations vary. Missing required nutrients are omitted from search results rather than assumed to be zero. Always check the label and portion basis.

Online services are implemented but require credentials and live acceptance testing. No deployment, live account, provider charge or GIF purchase has been performed. The installable web manifest supplies a home-screen app shell; there is no background service worker or guaranteed offline reload.

See [VALIDATION.md](docs/VALIDATION.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [COSTS.md](docs/COSTS.md) and [RESEARCH-NOTES.md](docs/RESEARCH-NOTES.md).
