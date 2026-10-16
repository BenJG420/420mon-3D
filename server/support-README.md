# Ben's payment service — archived / skipped

**Owner instruction 2026-10-16: skip Ko-fi and payment-server work completely.**
This historical setup is not a pending task. The live game no longer wires this
counter, polling client or deployment URL. Do not configure or re-enable it as
part of the graphics packages. Existing code and receipt fields are retained for
compatibility; the instructions below are historical reference only.

GitHub Pages cannot run a webhook or store payment receipts. The game therefore
keeps payment actions closed until a separate HTTPS payment service is configured.
No deployment account, backend URL or payment credentials were available in the
v27 workspace. This service is supplied for deployment; payments are **not live**.

Use Node 22.13 or later. No additional npm dependency is needed. Mount a persistent
directory with restrictive permissions and set these **server-only** variables:

- `SUPPORT_DB_PATH`: SQLite file on the persistent volume; do not use `:memory:`.
- `SUPPORT_KOFI_TOKEN`: verification token from the owner's Ko-fi webhook settings.
- `SUPPORT_CODE_SECRET`: a newly generated random secret of at least 32 characters.
- `SUPPORT_ALLOWED_ORIGINS`: comma-separated exact browser origins, normally
  `https://benjg420.github.io`; add localhost only for local development.
- `SUPPORT_HOST`: defaults to `127.0.0.1`; use `0.0.0.0` inside a protected container.
- `PORT`: defaults to `8787`.

Start with `node server/support-server.mjs` behind an HTTPS reverse proxy. Keep
the database volume, its WAL files and backups together; never replace the volume
when deploying. Do not publish the database or secrets. Configure Ko-fi's webhook
to `https://YOUR-SERVICE/api/kofi`. Set the public **build** variable
`VITE_SUPPORT_API_URL=https://YOUR-SERVICE` and rebuild the test channel. This public
URL contains no credentials; the Pages workflow must pass it explicitly to Vite.
The included workflow already reads the GitHub repository variable
`SUPPORT_API_URL` into `VITE_SUPPORT_API_URL` for the evolving test channel only.
Leave that variable unset until the service and Ko-fi webhook are ready.

The original fixed rewards are preserved: EUR 3/8/20 correspond to
`klein`/`runde`/`keller`. Subscriptions, non-EUR receipts, invalid tokens and unknown
words never award items. The browser must register its private word before paying.
Receipt transaction IDs are unique. Word ownership binds a claim to the original
save key; retries by that owner return the same receipt. The browser stores receipt
IDs with the items in one save and rejects duplicates, including after reload.
Failed local persistence rolls back the item grant so it remains retryable.

An owner can issue a manual support code on the trusted server with
`node server/support-server.mjs mint klein` (or `runde`/`keller`). Deliver that code
privately. Codes use the new server secret, are claimed once globally, and can be
retried only by the original save. No mint endpoint or owner phrase exists in the
public client. Historical codes signed with the original game's embedded key are
deliberately unsupported; the original application and its database stay untouched.
When the configured server replaces an unknown imported Kassenwort, the game keeps
that old word in `supportPreviousWords` and displays it instead of losing it. Any
payment made to the original backend remains a claim against that original backend.

The save remains a local single-player save, not an authoritative online account.
Editing or restoring the complete local save is outside payment receipt integrity;
server claims still cannot be transferred to a different private save key.
