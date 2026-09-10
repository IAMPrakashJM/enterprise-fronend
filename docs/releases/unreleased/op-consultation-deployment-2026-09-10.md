# OP Consultation deployment — 10 September 2026

Both demo sites serve release `20260910010741034-8948cc53`, from application commit `81033b6b7fd5c9f90fe945b7f4c3ae129c30e538`, pushed to main:

- https://front-design.pepbits.com/library/op-consultation
- https://desktop.front-design.pepbits.com (Library → Page templates → OP Consultation)

This deployment supersedes the local-only status in the [implementation record](op-consultation-2026-09-09.md), preserving its historical evidence. The prepared source bytes were unchanged from the implementation hash manifest; committing occurred after isolated preparation. The documentation-only follow-up records delivery without altering the deployed application.

## Verification

The broad local unit run passed 1,510 tests in 108 files. API suites passed 61 general and 21 clinical tests; suite registry passed 2 tests and deployment machinery passed 14 tests. Earlier source-identical typecheck, structural/localization gates and three focused four-language browser workflows are retained in the implementation record.

`npm run deploy:prepare --prefix desktop-clients` built both shells in isolation and smoke-tested packaged HTML/assets. `npm run deploy --prefix desktop-clients -- --activate 20260910010741034-8948cc53` activated the prepared release and passed health checks.

Public Chromium checks at 1600 × 900 passed on both hosts: release identity, demo sign-in, OP Consultation navigation, authenticated patient/config/assessment reads, 44 API fields, 12 clinical sections, blank note, visible completion action and no page JavaScript errors. These live checks did not save clinical records. Functional write/completion coverage used isolated fictional data before deployment. Native executable, native-speaker/domain review and production clinical integration remain unverified.

[Deployment logs, screenshots and hashes](evidence/op-consultation-deployment/manifest.json) retain the evidence. Remote CI run `34424330547` for the application commit was still in progress when recorded; local checks are not a remote CI success claim.

## API and rollback

The demo API was stopped for a consistent backup and restarted to load the navigation, localization and help catalogs. Existing demo sessions may need to sign in again. The restricted local backup `.deploy/backups/op-consultation-20260910/` holds prior API/config source, CSV hashes and data archive; it is excluded from Git.

Previous frontend release `20260909195817845-9b653707` remains available through the deployment activation command. Restoring prior API source/config and any necessary data is a separate recovery step; do not overwrite subsequent user data without checking changes.
