# Authoritative prediction v2 release correction

## Scope
- Replace exactly the 14 matching project paths from the uploaded archive, byte-for-byte.
- Make no edits outside those archive paths.
- Keep Cache backend flags and treasury seeding untouched.

## Validation and release
- Confirm all copied files match the archive checksums.
- Run the TypeScript typecheck and production build.
- Confirm `xnull-proxy` includes `X-TXN-Token` and `Idempotency-Key` CORS/forwarding from the authoritative source.
- Deploy `xnull-proxy` and `auto-create-sports-markets` and record deployed versions.
- Run a security scan status check, publish to the existing 0xnull.io deployment and record the public asset hash.
- Verify rendered public DOM on `/predict` and `/payouts` for all exact required positive strings, and verify prediction navigation excludes `Flash` and `My slips`.
