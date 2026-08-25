# Fix Twitch 403 on /predict and make the stream embed resilient

## What is wrong

The backend function `twitch-top-stream` asks Twitch for an app token using the stored Client ID and Client Secret. Twitch replies `403 invalid client secret`, which means the two stored values no longer belong to the same live Twitch application (the secret was rotated or the app was recreated). Because of this no stream metadata comes back, and the player area on /predict shows nothing useful.

## Part 1 — Get the credentials working again

1. Trace the live request: call the deployed function and read its logs to capture the exact Twitch response (status, error body, Client ID fingerprint and secret length only — never the secret itself).
2. Check the Client ID currently in use against the Twitch developer console app. If they differ, both values must come from the same app.
3. Reopen the secure secret form so you can paste a freshly generated `TWITCH_CLIENT_SECRET` (and `TWITCH_CLIENT_ID` if the app changed). Values go straight into the encrypted store — nothing is printed in chat and nothing ever reaches frontend code.
4. Redeploy the function, then re-run a token test and confirm a token is issued before touching /predict.
5. Load /predict and confirm a live stream renders.

## Part 2 — Embed must survive metadata failure

Today the player only renders when the metadata call succeeds, so a Twitch API outage or bad credentials means no player at all.

Changes to the stream component:
- Keep a configured fallback channel. When the metadata call fails or returns `unavailable`, still render the Twitch player for that fallback channel using the same parent-domain list already built from the current host.
- Show a small, non-blocking notice above the player ("Live metadata unavailable — showing default channel") rather than replacing the whole component with an error.
- If the fallback channel itself is offline, Twitch's own player shows its offline screen; add a clear offline state with a "Watch on Twitch" link and a retry button.
- Title, viewer count and game badge simply hide when metadata is missing, instead of blocking the render.

## Technical notes

- `supabase/functions/twitch-top-stream/index.ts`: already degrades to `{ channel: null, unavailable: true, reason: 'auth_failed' }` with status 200; keep that and make sure `reason` is always passed through so the UI can distinguish "no one live" from "service problem".
- `src/components/TwitchStreamEmbed.tsx`: derive `channelToRender = streamInfo?.channel ?? FALLBACK_CHANNEL`; build `iframeSrc` from that instead of from `streamInfo.channel` only. Parent list stays as-is (0xnull.io, www, current hostname/host, preview domains).
- Fallback channel defaults to the existing priority channel `awfdota`; easy to change in one constant.
- No secret ever enters client code; all Twitch auth stays in the Edge Function.

## Verification

- Function logs show a successful token fetch with an expiry.
- /predict renders a player both with working credentials and with a simulated metadata failure.
