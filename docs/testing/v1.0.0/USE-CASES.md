# Library acceptance cases — guide 1.0.0

Stable IDs describe acceptance responsibilities, not a count of individual Vitest assertions. Consult the release evidence for execution status.

| ID | Trigger | Expected result | Evidence source |
| --- | --- | --- | --- |
| LIB-01 | Visit every Library destination | Registered page opens through its intended renderer; no uncaught page errors; shared routes remain managed | `e2e/library-preferences.ts`, inventory/static gate |
| LIB-02 | Render all named templates with compact/spacious values | Managed tables use the chosen density, wrapping, stripes and sticky-header settings | Template preference-compliance tests |
| LIB-03 | Supply conflicting local layout and locked policy | Locked layout wins and cannot be overridden locally | Template policy test; browser locked selector |
| LIB-04 | Change policy while a page is mounted, then unlock | Managed value replaces the local choice; obsolete local override is not resurrected | usePreferenceChoice regression case |
| LIB-05 | Change a locked/unavailable page-size or view control | Control is disabled; managed value remains; no prohibited host update | Template, catalog and query tests |
| LIB-06 | Select different currency/date/number preferences | Values, billing, statistics and inline read-only display use host formatters | Catalog tests, generated-example checks |
| LIB-07 | Change table settings | Computed padding/wrapping follows the preference; selected rows retain meaning; badges remain on one line | Browser table/CSS checks; shared tests |
| LIB-08 | Change independent form/result text and set radius to zero | Regions resolve their own scales and managed rectangular surfaces become square | Focused browser computed-style assertions |
| LIB-09 | Disable custom shortcuts | Query/detail custom listeners do not remain active; normal tab navigation remains available | Query test and keyboard contracts |
| LIB-10 | Select CSV or Excel, confirm query export | Export calls the shared exporter using the selected format | Query export test |
| LIB-11 | Select a clinical preview mode under a policy | Supported drawer/card/modal is used; locked inline/view controls cannot bypass policy | Query/preview tests and browser flow |
| LIB-12 | Open the six reference destinations | Each has dedicated content and no untranslated newly added keys in the tested baseline | Reference page tests; localization gate |
| LIB-13 | Copy a component or template example | Code reflects the rendered source and imports public contracts | Generated-example gates |
| LIB-14 | Add a page, change a referenced path or edit a release record | Documentation/navigation inventory gate detects missing IDs, files, required fields or invalid publication state | Documentation tool tests and static gate |
| LIB-15 | Run WebKit/native Tauri or obtain wording acceptance | Report actual environment and outcome; do not substitute another browser or catalog check | Separate acceptance; pending/blocked in current record |

Prefixes can expand for future features. Keep existing IDs stable and record changed meaning in a new guide version.

## Billing Clinic

| ID | Trigger | Expected result | Evidence source |
| --- | --- | --- | --- |
| CLINIC-01 | Convert prescription, add service, issue invoice, pay partially, refund and export | API changes persist; invoice orders cannot be billed twice; receipts/history remain visible | `e2e/clinic-billing.mjs`, clinic billing store tests |
| CLINIC-02 | Repeat a mutation or use a stale version / another tenant / read-only role | Stable operation receipts prevent duplicates; version and server permission checks reject invalid writes; tenants remain isolated | Clinic billing store tests |
| CLINIC-03 | Change a locked form layout during editing, then encounter a network failure | Effective layout changes without losing input; retry reuses the same payload and operation ID | Billing workspace tests |
| CLINIC-04 | Select whole-number display or another preferred currency | Billing monetary display/exports retain cents and API ledger currency; quantities retain number settings | Billing formatter test and real CSV/Excel download checks |
| CLINIC-05 | Use Arabic, Hindi or Malayalam | Catalog keys resolve, direction follows the language, desktop page width stays contained | Isolated Chromium language checks; native wording acceptance remains pending |

## Clinical Triage

| ID | Trigger | Expected result | Evidence source |
| --- | --- | --- | --- |
| TRIAGE-01 | Open default rail layout at 1600 × 900 | All three sections and completion action fit above the shell status bar; no horizontal overflow | Registered clinical-triage browser suite |
| TRIAGE-02 | Save, reload, complete and reassess | Draft persists; completed form locks; new assessment has blank readings; history opens previous record | Browser suite and triage store tests |
| TRIAGE-03 | Submit missing/manual choices, malformed readings, stale version, retry, wrong role or tenant | Required fields and server scope/version/permission checks apply; repeated operation has one result | Triage store tests |
| TRIAGE-04 | Change locked form navigation or retry a failed request | Effective preference wins; mounted input and retry identity survive | Triage editor tests |
| TRIAGE-05 | Select Arabic, Hindi, Malayalam and English | Keys resolve, direction is correct and desktop width stays contained | Browser suite; native wording approval remains pending |

## Clinical Consultation

| ID | Trigger | Expected result | Evidence source |
| --- | --- | --- | --- |
| CONSULT-01 | Open default English layout at 1600 × 900 | Three sections and final actions fit above the status bar | Consultation browser suite |
| CONSULT-02 | Save, reopen, complete, open history and create a new note | Draft persists, completion locks, new note is blank | Consultation API and browser suites |
| CONSULT-03 | Retry or submit stale revision, unauthorized role/scope or invalid options | No duplicate write; server checks reject invalid operations | Consultation store tests |
| CONSULT-04 | Change layout during editing or retry a failed save | Input and retry identity survive shared editor changes | Consultation and triage frontend tests |
| CONSULT-05 | Switch four languages; re-exercise triage | Labels/direction resolve, width stays contained; existing triage flow works | Consultation and triage browser suites |
| CONSULT-06 | Open the expanded sections, enter notes and vitals, save and reload | 12 tabs remain usable, fields retain values and final actions fit the tested desktop viewport | Consultation browser suite |
| CONSULT-07 | Read an old note or update with a legacy payload | Missing optional fields render empty; load does not rewrite CSV; omitted expanded fields retain prior values | Consultation store compatibility test |
| CONSULT-08 | Save an invalid vital while its panel is hidden | The vital panel opens and the invalid field receives focus | Consultation frontend test |

## OP Consultation

| ID | Trigger | Expected result | Evidence source |
| --- | --- | --- | --- |
| OP-01 | Open OP with a completed triage and refresh reference | Real API context appears; detail opens; no copying into note | OP managed browser suite |
| OP-02 | Navigate 12 sections, save/reopen/complete and review | Values persist; full-note preview includes current unsaved entries; completed history locks | OP managed browser suite |
| OP-03 | Jump from summary and apply a locked layout | Related field opens; input survives; review does not call save | OP workspace unit test |
| OP-04 | Use four languages and default 1600 × 900 geometry | Direction/width and visible primary actions match tested scope | OP browser suite |

## Comprehensive Consultation

- CC-01: Specialty changes retain entered notes; full preview includes unsaved specialty entries. Managed form navigation overrides local layout.
- CC-02: Enter diagnoses and all four order types, edit linked details, reject duplicate diagnoses and dangling order links.
- CC-03: Scores distinguish zero, missing and not-testable inputs; E/M uses two of three levels with separate bounded time comparison.
- CC-04: Failed save preserves exact retry identity. Reopen CSV-backed records, attest and sign, verify immutable controls and tenant isolation. Editing invalidates prior attestation.
- CC-05: Four-language desktop rendering, API navigation and source/version evidence remain separate from native and clinical acceptance.

## Own Settings default module

- OWN-01: Only accessible API navigation modules appear; save persists for the account/application and survives restart.
- OWN-02: Tenant default/lock wins; direct overrides and unavailable modules fail on the server. Revoked access falls back without granting access.
- OWN-03: Desktop startup and web application home use the selected module; direct web URLs remain unchanged.
- OWN-04: Preference control uses the central update flow and cannot bypass unavailable or locked settings.

## Clinical workspace update

| ID | Flow | Expected result |
| --- | --- | --- |
| CW-01 | Open View bill and Edit bill | Full API invoice view; correction fields and reason; return to ledger |
| CW-02 | Save correction, retry lost response, reopen CSV | One correction; previous snapshot retained; authoritative totals |
| CW-03 | Edit paid/refunded/void invoice or stale/unauthorized request | Rejected server-side; protected UI |
| CW-04 | Switch triage/consultation rail sections and locked layout | Same master-record rail; one section; values retained |
| CW-05 | Save/reopen/complete clinical document | Existing API version, retry and immutable completion behavior retained |

## Page Library catalog

| ID | Flow | Expected result |
| --- | --- | --- |
| PL-01 | Open List of pages and search | All accessible Page Library entries in API order; no self/duplicate/unrelated entries |
| PL-02 | Open code and guide for each page | Correct public-import example and localized guide; access revocation removes an open resource |
| PL-03 | Open each working page; select a billing patient from the catalog | Functional workspace and patient controls remain; developer tabs/demo header moved to catalog; shell release notice cards appear only on List of pages, never Billing Clinic or another working page |

Billing rail follow-up: the billing browser suite asserts one active section, rail label containment, closely grouped navigation items and a footer inside the desktop viewport before executing the ledger workflow.


## Documentation lifecycle

| ID | Action | Expected result |
| --- | --- | --- |
| DOC-01 | Open a catalog guide and current-page Help in each supported language | Same versioned API article and language; Arabic direction; no separate guide prose |
| DOC-02 | Modify a tracked source without a receipt | Lifecycle check fails and identifies the source |
| DOC-03 | Add a page with missing/reference/placeholder documentation | Registration check fails; required sections and stable tour anchors required |
| DOC-04 | Change guide text, field rules or translated text after review | Translation becomes outdated and review becomes pending |
| DOC-05 | Modify a published snapshot | History comparison fails; a new release snapshot is required |
| DOC-06 | Run strict acceptance with pending authoring/native reviews | Strict check fails; normal checks retain the explicit inherited backlog |

DOC-01 is registered in `unified-help.mjs`; contract tests exercise source fingerprints and translation invalidation. The lifecycle checker enforces registration/history/strict acceptance. These are distinct from reviewer approval and native executable tests.

## OP Registration

| Case | Expected result | Automated scope |
| --- | --- | --- |
| OPREG-01 | Five steps and six care tabs stay in one page; progress and bottom actions remain visible while content scrolls. | Chromium browser journey and screenshots |
| OPREG-02 | Required identity/consent, minor representative, duplicate visits, authorization and stale versions are rejected server-side. | Focused API tests; representative/date rules require additional domain acceptance |
| OPREG-03 | Nursing review, signed immutable note, service completion, charges, payment and checkout persist. | API tests and browser journey with reload |
| OPREG-04 | Repeated operation IDs do not duplicate writes; recovery preserves input; tenant/user scope and draft exclusions apply. | API tests and injected browser network failure |
| OPREG-05 | Appointment booking rejects a duplicate provider/date/time slot. | API test |
| OPREG-06 | Four interface languages render without message keys; Arabic uses RTL; shared presentation consumes effective preferences. | Browser language checks; native-speaker review pending |

## Barcode and QR printing

- LABEL-01: Backend renders all supported code templates from file-backed records; caller-supplied payloads cannot override identifiers.
- LABEL-02: Batch copies retain physical sheet dimensions; incompatible stock is rejected.
- LABEL-03: Tenant/application/user isolation and idempotent mutation retries survive store reload.
- LABEL-04: First print records requested; reprints require allowed policy and reason; no physical success is inferred.
- LABEL-05: Payment generation/printing never marks paid; simulation requires administrator authority; expiry blocks printing.
- LABEL-06: Printer locks and copy limits are enforced in the server and frontend; preference defaults persist through the API.

LABEL-07: Save wristband stock as a personal default, then open Payment QR. A4 is selected without changing the saved default. An incompatible tenant lock remains enforced with a printer-field message and disabled generation. The API independently rejects incompatible stock with `fieldErrors.profileId`.

## Generic device integrations

- DEVICE-01: Focused scan → exact API lookup within application context; success selects record; failure keeps input; no global key capture.
- DEVICE-02: Queue persists across store recreation; same operation returns the original job; changed payload conflicts.
- DEVICE-03: Tenant/application/user/workstation isolation and administrator-only policy/rule/event changes.
- DEVICE-04: Unsupported device capability, copy limits, stale versions and changed dispatch locks are rejected server-side.
- DEVICE-05: Automatic simulation is opt-in; repeated event identity returns one job; changed record/event conflicts.
- DEVICE-06: Browser dispatch records requested only; demo dispatch is simulated; native-unavailable job stays queued; cancellation prevents dispatch. Native ticket wrapper rejects expired/mismatched acknowledgements.

## Identity devices

- IDENTITY-01: Card/passport synthetic capture shows document fields and never authenticates or updates a patient.
- IDENTITY-02: Tenant/application/operator/workstation scope and selected patient/reader binding cannot be overridden.
- IDENTITY-03: Biometric opt-in, permission acknowledgement, current reader locks and policy versions are enforced by the API.
- IDENTITY-04: Exact retries reuse requests; different payloads, expired challenges and consumed/cancelled requests are rejected.
- IDENTITY-05: Mismatch, expired document, unavailable connector and manual fallback remain distinct; raw biometric input is rejected and never stored.
