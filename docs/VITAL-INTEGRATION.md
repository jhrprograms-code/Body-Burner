# Vital Animations integration

402 compressed MP4 files (56,907,933 bytes) are installed in the private Supabase `exercise-media` bucket. Originals and purchased catalogue files remain outside the public repository.

101 entries in `data/media.json` connect existing Body Burner exercises to these objects. Each enabled match was checked using sampled video frames for movement and equipment identity. This is not a comprehensive technique or coaching certification. Three candidate matches were excluded: the standing band chest press candidate showed a seated movement; cable lateral raise and machine lateral raise candidates did not clearly match the expected movement. Other exercises remain without an enabled animation where an equivalent was not established.

The player requests a one-hour signed URL only when the exercise detail is opened. It refreshes long-running playback authorization after 55 minutes and reacts to sign-in/out. The bucket's SELECT policy requires an entry in `public.members`; anonymous and non-member callers receive no access. Client uploads and changes to the licensed bucket are not permitted. No service-role key is used in the browser, and no signed URLs are committed.

The initial app database migration has been applied. Membership is invitation-only: create/invite each intended Supabase Auth user and add their actual user ID to `public.members`. There are currently no real registered app accounts. The owner's first account must be set up before signed-in playback can be verified in their session. The Supabase dashboard login is separate from an app login.

Verification: production build and 29 automated tests; database checks confirmed member access to all 402 objects and zero visibility for a non-member. The positive access test ran in a rolled-back transaction and left no test account. Authenticated browser playback remains to be verified after the first real app account is created.

The GIF importer is separate and accepts GIF files only. Never rename MP4 files to GIF or publish the purchased pack in GitHub.
