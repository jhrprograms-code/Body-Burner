# Vital Animations integration status

The owner purchased the Vital Animations pack and supplied its licence and private source folder. The folder contains 402 MP4 files (1,670,465,556 bytes). The three supplied JSON catalogues contain 402 rows, including one row with an empty exercise ID. Catalogue wording and filename matches are not evidence that a demonstration has been visually checked.

`scripts/prepare-vital.py` prepares compressed private copies. Keep purchased videos and catalogue files outside this public repository. The app's exercise demonstration component supports MP4 playback with controls and existing GIF/image URLs. Videos load only when a technique detail is opened, and do not autoplay.

The production media manifest remains empty until reviewed exercise matches have permanent authorized delivery URLs. Downloading and compressing the pack does not make it available in the deployed app. Do not commit temporary signed URLs to `data/media.json`.

Next integration steps:

1. Upload optimized videos to a private Supabase Storage bucket through authorized storage administration access.
2. Match purchased demonstrations to Body Burner's exercise IDs; visually check movement, equipment and variation before enabling a match.
3. Deliver short-lived signed playback URLs to authenticated invited members; keep storage writes restricted to the administrator.
4. Verify playback on mobile and desktop, including expired sessions and missing media.

The existing GIF importer handles GIF files only. Do not feed MP4 files into it or rename MP4 files to GIF.
