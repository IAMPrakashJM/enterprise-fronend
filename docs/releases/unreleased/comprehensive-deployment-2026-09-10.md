# Comprehensive Consultation deployment — 10 September 2026

Release `20260910023723076-286aac07` is active on both demo sites. Application commit `33af6ebc88dcdb67ac23cc195dce62959bd682c1` was pushed to main.

- https://front-design.pepbits.com/library/comprehensive-consultation
- https://desktop.front-design.pepbits.com — Library → Page templates → Comprehensive Consultation

This delivery supersedes the local-only status in the [implementation record](comprehensive-consultation-2026-09-10.md). Its historical evidence is preserved. An intervening documentation commit `c466309` changed only the engineering review; the tested runtime sources retained their recorded hashes. Release preparation preceded the application commit. The only later source change was synchronization in an existing draft test; deployed runtime bytes match the committed application.

## Checks and activation

The initial broad unit run passed 1,510 tests and failed one existing draft-recovery test. The isolated draft file passed. Review found that the test could click the review action before loading had enabled it. The test now waits for enabled review/discard actions and the resulting restore state. No draft runtime behavior changed. The final full run passed **1,511 tests in 109 files**.

General API tests passed 61 tests; clinical API tests passed 24, suite registry passed 2 and deployment tests passed 14. Source-identical typecheck, focused browser, localization and structural results are retained in the implementation record.

`npm run deploy:prepare --prefix desktop-clients` built both production shells in isolation and verified packaged HTML/assets. `npm run deploy --prefix desktop-clients -- --activate 20260910023723076-286aac07` activated the package and passed shell health checks. The demo API was stopped for a consistent backup and restarted with the new endpoint, navigation, help and catalogs. Existing sessions may need to sign in again.

Public Chromium checks at 1600 × 1000 passed on both hosts: release identity, demo sign-in, authenticated comprehensive API loading, 17 specialties, 8 services, 5 score instruments, 5 service-code systems, all 9 main sections, full preview, visible actions, no horizontal page overflow and no page JavaScript errors. These live checks did not save or sign clinical records. Write/retry/sign coverage used isolated fictional data before deployment.

[Retained logs, screenshots and hashes](evidence/comprehensive-deployment/manifest.json) identify the evidence. Remote CI run `34430388852` for the application commit was still in progress when this record was written; no remote success claim is made. A later documentation push may trigger another run.

## Recovery and boundaries

Previous release `20260910010741034-8948cc53` remains available through the activation command. Restricted backup `.deploy/backups/comprehensive-consultation-20260910/` contains previous API/config source, CSV hashes and data archive; it is excluded from Git. API rollback is separate from frontend activation. Inspect subsequent writes before any data restoration.

This deploys the demo consultation workflow. Native executable acceptance, native-speaker/clinical review, current payer-rule approval, real order dispatch, billing/HIE/regulatory submissions and certified digital signatures remain outside this delivery.
