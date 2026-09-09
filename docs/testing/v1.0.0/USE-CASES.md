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
