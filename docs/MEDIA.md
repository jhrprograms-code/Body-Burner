# Exercise animations

No exercise GIF files are included or represented as licensed. The app currently displays original neutral dumbbell icons and technique text. An imported GIF appears automatically in the workout, exercise detail and plan cards.

## Buy once, then import

ExerciseDB.io lists a one-time Starter pack with 1,394 exercises, 180/360-pixel GIFs, at $199, and Pro at $599 with higher resolutions and additional data. The displayed currency was not independently confirmed; do not interpret those figures as CAD. Confirm currency, tax and app embedding/self-hosting rights at checkout:

- https://exercisedb.io/pricing
- https://exercisedb.io/terms

GymVisual offers individual licensed demonstrations. This project's earlier research includes 188 candidate mappings among 200 exercises; candidate matches are not final verified media matches. Twelve exercises lack a mapped candidate. That research package remains a separate deliverable.

1. Download your purchased GIFs to a local folder outside this repository.
2. Copy `docs/media-manifest.example.json` and map each Body Burner exercise ID to the correct local GIF filename. All 200 IDs are in `data/exercises.json`.
3. Watch each animation. Verify movement, equipment, grip, laterality and variant. Set `visuallyVerified` only after checking it.
4. Record the licence reference and provider. Set `licenseConfirmed` only if your licence permits embedding and serving the files in this private web app.
5. Run:

```bash
npm run media:import -- /absolute/path/to/your-manifest.json /absolute/path/to/licensed-gifs
npm run build
```

The importer validates the complete manifest, rejects duplicate/unknown IDs and path traversal, verifies GIF signatures, and writes hashed assets plus `data/media.json`. It does not download preview images, scrape providers, buy a licence or infer exercise matches.

## Deploying media

The import writes to `public/exercises`. Those files are intentionally excluded from Git by default so a stock pack cannot accidentally become a public repository download. For a **private repository**, after confirming licence terms, explicitly add only the imported app assets:

```bash
git add -f public/exercises/*.gif
git add data/media.json
```

Vercel's public assets have public URLs even though account data is protected. Standard web-embedding licences often allow this, but your contract is authoritative. If your provider requires authenticated media delivery, do not publish these public assets: move them to a private media bucket and add signed-URL delivery before importing. Never include licensed assets in a publicly shared source ZIP.

Keep your original provider licence and receipt privately. Do not put payment details or licence credentials in browser-delivered metadata. Rebuild after updating the manifest.
