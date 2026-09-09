# Clinical Triage — 9 September 2026

Implemented locally on top of `1be944d`. This delivery is not committed, pushed or deployed.

## Added and changed

- **Clinical Triage** follows Billing Clinic under **Library → Page templates**. Library inventory now contains 136 destinations and five Page templates.
- A compact desktop assessment with patient/encounter context, complaint and allergy review, manual priority, eight vital fields, missing-reading reason and handoff.
- CSV-backed API drafts, immutable completion, reassessment/history, optimistic versions, retry receipts, tenant isolation and server authorization.
- Shared controls and effective preferences, public TypeScript integration example, four-language catalogs, help/tour/feature alert `2026-09-09-clinical-triage`.
- Shared segmented controls now allow keyboard entry when no option has been selected and use the managed radius token.

See the [user and integration guide](../../features/clinical-triage.md) and [TRIAGE acceptance cases](../../testing/v1.0.0/USE-CASES.md#clinical-triage).

## Verification

- **19 clinical API tests passed**, including the new triage persistence, validation, retry, version, role and tenant cases; backend TypeScript checking passed.
- **15 frontend tests passed** across triage, shared segmented controls and Billing Clinic regression tests. Locked layout changes retain edits; retries reuse the original request.
- The registered Chromium suite passed against a fresh isolated demo API: save draft → browser reload → resume → complete → read-only history → blank reassessment. The default English 1600 × 900 action and horizontal geometry checks passed.
- Arabic, Hindi, Malayalam and English browser checks passed for catalog rendering, document direction and desktop width. These checks do not constitute native-speaker approval.
- Both web and desktop production builds passed. Localization/API-message, documentation, shared-component/form-control, Library preference/navigation, E2E registry and generated-example gates passed. The documentation checker and whitespace check passed.
- A final help-copy correction changed “two-column” to “three-column” in all four catalogs. Localization/documentation checks and both builds were repeated after this text-only correction.
- [Evidence and source hashes](evidence/clinical-triage/manifest.json), [API tests](evidence/clinical-triage/api-tests.txt), [frontend tests](evidence/clinical-triage/frontend-tests.txt), [browser checks](evidence/clinical-triage/browser.txt), [builds](evidence/clinical-triage/build.txt), [static gates](evidence/clinical-triage/gates.txt) and [final copy checks](evidence/clinical-triage/copy-checks.txt) identify the local tree.
- Fictional screenshots: [desktop form](evidence/clinical-triage/triage-initial.png), [completed assessment](evidence/clinical-triage/triage-completed.png), [Arabic](evidence/clinical-triage/triage-ar.png), [Hindi](evidence/clinical-triage/triage-hi.png) and [Malayalam](evidence/clinical-triage/triage-ml.png).

Reproduce with the desktop Vite shell pointing at an isolated local API, then run `node e2e/run.mjs features --suite=clinical-triage.mjs --managed-api` from `desktop-clients`, supplying matching `E2E_API`, `E2E_DESKTOP` and `PLAYWRIGHT_PATH`. The suite writes fictional assessments to disposable demo storage. No live patient data was changed.

## Remaining boundaries

No clinical scoring or automatic care routing is implemented. Native-speaker/clinical protocol acceptance, production EHR/database integration, native executable testing, remote CI and deployment are not claimed. Saved API drafts persist; unsaved browser-close restoration is not connected for this workspace.
