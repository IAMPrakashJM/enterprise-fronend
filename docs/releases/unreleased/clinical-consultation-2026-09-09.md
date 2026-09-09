# Clinical Consultation — 9 September 2026

Implemented in `f146d67713130da7bf9ee684d29cc62d46bff070`. Committed, pushed and deployed to both demo sites on 9 September 2026 (UTC). Earlier local verification statements below preserve their original scope.

## Added and changed

- Clinical Consultation follows Clinical Triage under Library → Page templates. The inventory contains 137 destinations and six Page templates.
- Direct-entry history, examination/assessment and care-plan sections, explicit clinician and visit selection, allergy-review status, saved drafts and completed-note history.
- Shared generic clinical-document contracts, adapter, workspace, editor and CSV store extracted from triage. Triage keeps its public API, CSV format, IDs, controls and workflow.
- Consultation-specific CSV storage and authenticated API with validation, scope/permission enforcement, optimistic revisions and repeat-safe saves.
- Four-language catalogs, public TypeScript example and documentation release/guide/tour/feature alert `2026-09-09-clinical-consultation`.

See the [user and integration guide](../../features/clinical-consultation.md) and [CONSULT acceptance cases](../../testing/v1.0.0/USE-CASES.md#clinical-consultation).

## Verification and boundaries

Final local evidence is recorded below. Tests use fictional isolated data. Live deployment, remote CI, clinical/native-speaker acceptance, production EHR integration and native executable execution are not claimed. Treatment and investigation fields are notes, not dispatched orders. Browser-close restoration covers explicitly saved API drafts only.

## Final local verification

- **20 clinical API tests passed**, including consultation persistence/reopen, completion validation, repeat-safe operations, immutable completion, clinician/encounter checks, roles and tenant/application isolation, plus existing triage, billing and patient CSV tests. Backend TypeScript checking passed.
- **8 frontend tests passed** across consultation, triage and Billing Clinic. These cover completion validation, retained input, exact-operation retries and shared layout behavior.
- The registered consultation Chromium suite passed against a fresh managed demo API: draft save → browser reload → resume → completion → locked history → new blank note. All sections/actions fit at the tested English 1600 × 900 default; no horizontal overflow or page errors.
- Arabic, Hindi, Malayalam and English checks passed for rendered catalog keys, direction and desktop width. Native wording acceptance is not implied.
- The existing triage browser suite passed the same lifecycle and language checks against fresh demo storage after the shared extraction.
- Both production builds and the full `npm run verify` chain passed. Workspace typechecking passed during implementation; final builds and API checks validated the final source. Documentation checker passed with 40 documents, and `git diff --check` passed.
- After browser acceptance, unused consultation catalog entries were removed, the feature alert summary was corrected, and internal generic-store error wording was cleaned up. API/frontend tests, both builds and full static verification were repeated; browser results apply to the unchanged form workflow.
- [Source/artifact hashes](evidence/clinical-consultation/manifest.json), [API](evidence/clinical-consultation/api-tests.txt), [frontend](evidence/clinical-consultation/frontend-tests.txt), [consultation browser](evidence/clinical-consultation/browser.txt), [triage browser regression](evidence/clinical-consultation/triage-regression.txt), [builds](evidence/clinical-consultation/build.txt), [verification](evidence/clinical-consultation/verify.txt).
- Fictional screenshots: [compact desktop](evidence/clinical-consultation/consultation-initial.png), [completed note](evidence/clinical-consultation/consultation-completed.png), [Arabic](evidence/clinical-consultation/consultation-ar.png), [Hindi](evidence/clinical-consultation/consultation-hi.png), [Malayalam](evidence/clinical-consultation/consultation-ml.png).

Reproduce with the desktop shell pointed at an isolated local API, using `node e2e/run.mjs features --suite=clinical-consultation.mjs --managed-api` from `desktop-clients`. Set matching `E2E_API`, `E2E_DESKTOP` and `PLAYWRIGHT_PATH`. Repeat with `--suite=clinical-triage.mjs` for the shared-workflow regression. The managed API uses disposable fictional data; live patient records were not changed.

## Verified deployment

- Active frontend release: `20260909192013277-c4aedb8e`, built in isolation from implementation commit `f146d67`. Both packaged shells passed isolated HTML/asset smoke tests before activation.
- The demo API was restarted with the consultation endpoint, shared clinical-document store and updated navigation/help/catalogs. Existing CSV hashes were unchanged after restart and live verification.
- Backup: `.deploy/backups/clinical-consultation-20260909T192024Z/` retains stopped API data and previous API source. Previous frontend release `20260909185538576-00ec1dd3` remains available for rollback.
- Chromium verified the active release, Clinical Consultation navigation, authenticated patient/config/assessment API, all three sections, blank initial assessment and no page errors on both `https://front-design.pepbits.com` and `https://desktop.front-design.pepbits.com`.
- Clinical Triage and Billing Clinic passed live navigation/API/section regression checks on both hosts. These checks did not save or complete patient records; write lifecycles were verified against disposable demo data during implementation.
- Retained results: [Consultation](evidence/clinical-consultation/live-consultation.txt), [Triage](evidence/clinical-consultation/live-triage.txt), [Billing Clinic](evidence/clinical-consultation/live-billing.txt), [activation](evidence/clinical-consultation/deployment.txt).
- Hosted CI run `34394445423` was still running at verification time. The previous baseline run `34392184342` failed four broad browser suites (Library preferences, clinical templates, page templates and documentation); those failures predate this consultation commit. Local targeted browser acceptance and full static verification passed, but broad remote CI success is not claimed. This documentation follow-up push starts a replacement CI run.
