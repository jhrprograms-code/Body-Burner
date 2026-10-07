# Deploy Body Burner to your Supabase and Vercel accounts

## 1. Create a private GitHub repository

Create an empty private repository named `body-burner` in your GitHub account. Do not initialize it with a different README. In the extracted source folder:

```bash
git init
git add .
git commit -m "Build Body Burner first release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/body-burner.git
git push -u origin main
```

Use your own GitHub authentication locally. `.env.local`, dependencies, build output and unlicensed/paid GIF assets are excluded by `.gitignore`. The source contains no personal logs or body photographs.

## 2. Configure Supabase

1. Create a new project, preferably in a region appropriate to you and your friends. Keep its database password private.
2. Open **SQL Editor** and run the complete `supabase/migrations/001_body_burner.sql` file once. This creates `members`, `app_state`, request counters, restricted functions and a private `progress` image bucket with owner policies.
3. In **Authentication**, keep **Allow new users to sign up**, **Confirm email**, and the **Email** provider enabled. New verified email users receive membership automatically.
4. Configure a custom SMTP provider for reliable delivery to your friends. Supabase's default mail service has restrictions and is not a production email solution. Use a provider whose cost/privacy terms you accept.
5. Copy the project URL and its **publishable/anon** key into Vercel. Do not use a service-role key. This app never needs a service-role secret in normal operation.

## 3. Deploy Vercel

Import the private GitHub repository into Vercel. Select the Next.js framework preset, repository root directory, default build command `npm run build`, and Node.js 22 or 24.

Add these variables in **Project Settings → Environment Variables**:

| Name                            | Value                          | Visibility                |
| ------------------------------- | ------------------------------ | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL      | Public; expected          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key  | Public; protected by RLS  |
| `FOOD_API_CONTACT`              | Your app support/contact email | Server-only configuration |
| `USDA_API_KEY`                  | FoodData Central API key       | Secret, server only       |
| `GEMINI_API_KEY`                | Google AI Studio API key       | Secret, server only       |
| `GEMINI_MODEL`                  | `gemini-3.1-flash-lite`        | Server configuration      |
| `AI_ENABLED`                    | `true` only when ready         | Server configuration      |

You can deploy with `AI_ENABLED=false` and add AI later. Public variables are embedded at build time, so **redeploy after adding or changing them**. Do not expose production credentials to untrusted preview deployments.

Copy the resulting `https://...vercel.app` URL. In Supabase Auth URL configuration:

- Set **Site URL** to that production origin.
- Add the exact production origin to allowed redirect URLs.
- For local development only, add `http://localhost:3000`.
- Only add trusted preview origins, not an unrestricted redirect wildcard.

Open Body Burner, enter any email you control, and follow its confirmation link. Email links use the Supabase browser client's default implicit flow. Confirm your profile and manually chosen nutrition targets under Settings.

## 4. Configure food and AI services

### FoodData Central

Get a key at https://fdc.nal.usda.gov/api-key-signup. Set `USDA_API_KEY`. The integration requests complete nutrient records and does not invent missing values. No demo key is used in production.

### Open Food Facts

Set `FOOD_API_CONTACT` to identify the app. Search is submit-driven, not search-as-you-type. The database is crowd-sourced and licensed under ODbL; attribution is displayed and retained with food records. See https://openfoodfacts.github.io/openfoodfacts-server/api/ for usage and licence obligations, particularly if you later publish/export a combined food database.

### Gemini

Create an API key in a Google project with suitable billing/privacy settings. Review https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/pricing before sending personal data. Prefer a paid project for the relevant data-use treatment; do not assume a free tier provides the same terms.

The default model is configurable. The pricing/deprecation pages were checked during development; providers can change availability. Gemini 2.5 models were restricted for new projects at that check. Recheck the configured model before deployment. Model retirement should be handled by changing `GEMINI_MODEL` and rerunning AI acceptance tests.

Set budget alerts and appropriate provider quotas. This app's request limits are not a guaranteed CAD spending cap. Limits are 20 AI attempts per account per UTC day, 200 globally per UTC day and 6 per account per minute. Failed provider attempts count, so retries cannot bypass the budget controls.

## 5. Complete live acceptance testing before inviting friends

Use two distinct verified email accounts and one unauthenticated browser profile. Test in separate browser profiles:

- Sign in via email; sign out; verify the second user never sees the first user's logs or cached photos.
- Log a meal, finish a workout, reload, then open on a second device. Confirm saved values.
- Edit the same account on two devices: verify a stale writer gets a conflict rather than overwriting the other device's changes.
- Verify an unauthenticated or non-member request cannot use `/api/ai` or `/api/foods`.
- Add a progress photo. Its bucket must remain private; an unsigned object URL must not work. A different account must not access the object path.
- Test barcode camera permission on HTTPS, denial/fallback, and a real Canadian package. Verify nutrition/units against the label.
- Try USDA whole foods and packaged search. Confirm raw/cooked preparation and g/ml units.
- Test one known meal photograph. Check the editable range, oil questions, modified portions, and confirmation step before saving.
- Send a non-food image; verify it produces no food entry. Ask the coach for a precise body-fat percentage; it should explain the limitation.
- Check AI disabled, invalid-key, timeout and quota-reached states. Do not display provider secrets in errors.
- Export and then erase a test journal. Confirm its photo objects and database row are gone and another user's journal remains intact.
- Test mobile layout at 390 px and desktop at 1440 px, keyboard navigation, modal focus, rest timer and background/resume behavior.

`docs/INTEGRATION-TEST.sql` is an optional development-database transaction that checks state ownership, conflicts and cross-user erasure. Review it and run only in a development project. It rolls back its fixtures; it does not replace the storage/auth/browser checks above.

## What to send back for the next setup step

The GitHub repository URL, Vercel project URL and Supabase project URL are sufficient to identify the projects. Keep private keys in their dashboards, not in chat. If access tools are unavailable, the steps above let you deploy without sharing secrets.
