# Expanded consultation workspace — 9 September 2026

Local implementation on top of `34f1549`. Not committed, pushed or deployed.

## Changed

The existing Clinical Consultation page now has 12 one-click sections across three columns and 44 persisted fields. Optional history, vitals, allergies, systems review, results, procedures, medicines, referrals and education fields complement the original visit/assessment/plan form. Section counts indicate entered fields; switching preserves values. Core completion requirements, tenant preferences and server permissions remain.

Consultation CSV reads normalize missing optional fields without rewriting old records. Legacy updates preserve omitted expanded values. The shared store sanitizer can receive the previous values; Triage's sanitizer retains its existing behavior. Hidden-field validation waits for the nested panel before focusing the control.

Four-language labels and versioned help/alert `2026-09-09-consultation-expanded` accompany the page. All note-based future integrations remain explicit: no order dispatch, triage import, signature or clinical scoring is added.

## Verification

Final local results and evidence follow. Tests use isolated fictional records; no live records were modified. Native-speaker acceptance, native executable testing, production EHR integrations and deployment are not claimed.

See the [updated feature guide](../../features/clinical-consultation.md#expanded-consultation-workspace).

## Final local results

- **21 API tests passed**, including optional-field persistence, legacy update preservation, old-record read normalization without rewriting CSV, malformed expanded input and numeric validation.
- **9 frontend tests passed** across consultation, triage and Billing Clinic. Expanded-panel changes retain input and hidden invalid readings receive focus.
- The real managed-API consultation browser suite exercised all 12 panels, populated new fields, saved/reopened/completed notes and verified immutable history and a new blank note. English default 1600 × 900 geometry checks kept actions visible while visiting expanded panels.
- Consultation and Triage browser suites passed Arabic/Hindi/Malayalam/English catalog, direction and width checks. These are rendering tests, not native-speaker approval.
- Both production builds and the full static verification chain passed. Documentation checks and whitespace checks passed. Help/alert copy and formatting were finalized after consultation browser acceptance; subsequent unit/API/build/static checks and triage browser regression cover that final source.
- [Source/artifact hashes](evidence/consultation-expanded/manifest.json), [API](evidence/consultation-expanded/api.txt), [frontend](evidence/consultation-expanded/frontend.txt), [consultation browser](evidence/consultation-expanded/browser.txt), [triage regression](evidence/consultation-expanded/triage-regression.txt), [build](evidence/consultation-expanded/build.txt), [verification](evidence/consultation-expanded/verify.txt).
- Fictional screenshots: [12-section overview](evidence/consultation-expanded/consultation-initial.png), [vitals and entered-section counts](evidence/consultation-expanded/consultation-expanded.png), [Arabic](evidence/consultation-expanded/consultation-ar.png), [Hindi](evidence/consultation-expanded/consultation-hi.png), [Malayalam](evidence/consultation-expanded/consultation-ml.png).

Reproduce with a Vite desktop shell pointed at an isolated local API and `node e2e/run.mjs features --suite=clinical-consultation.mjs --managed-api`, supplying matching `E2E_API`, `E2E_DESKTOP` and `PLAYWRIGHT_PATH`. The triage regression uses `--suite=clinical-triage.mjs`. Both suites use disposable fictional data.
