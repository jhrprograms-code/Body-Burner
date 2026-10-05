# Cost choices — checked October 4, 2026

Body Burner defaults to inexpensive services, but no paid service was purchased or activated during development.

| Component | Starting choice | Cost notes |
|---|---|---|
| Web hosting | Vercel Hobby if the project qualifies | Personal/non-commercial use; recheck usage limits and terms before adding paid subscriptions. |
| Database/auth/photos | Supabase Free for initial friends-only testing | Published free allowances include 500 MB database and 1 GB file storage. Monitor storage, egress, inactivity and other plan limits. |
| Food data | Open Food Facts + USDA | No paid food database required. USDA API key needed; OFF attribution/ODbL obligations and request limits apply. |
| AI | Gemini 3.1 Flash-Lite, configurable | Listed input USD $0.25 per million text/image/video tokens, output USD $1.50 per million tokens. Use a suitable paid project for personal-data processing. |
| Email login | Custom SMTP provider | Cost depends on the selected provider. No provider has been selected or purchased. |
| Exercise GIFs | One-time licensed pack or individual assets | Not included. ExerciseDB.io displayed $199 Starter / $599 Pro; verify currency, taxes and licence at checkout. |

For planning only: 1,000 AI calls using an assumed average 2,000 input tokens and 800 output tokens each would cost about **USD $1.70** at those model rates. At an **illustrative, not current, conversion of CAD 1.40 per USD**, that is **CAD $2.38** before taxes and FX fees. Image tokenization, context length, thinking, retries and use vary; this is not a quote or a cap. A provisional **CAD $5–10 monthly AI allowance** is a reasonable small pilot budget to validate against actual usage; hosting/email/domain upgrades are separate.

There is a per-account/global request limit, not a dollar-denominated billing cap. Set provider budget alerts and quotas. The model can be switched with `GEMINI_MODEL`; newer model pricing may be different. As checked, the 3.1 model listed retirement on May 7, 2027, and legacy 2.5 access was restricted for new projects.

Official sources:

- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/deprecations
- https://vercel.com/docs/plans/hobby
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://fdc.nal.usda.gov/api-guide/
- https://openfoodfacts.github.io/openfoodfacts-server/api/
- https://exercisedb.io/pricing
- https://exercisedb.io/terms
