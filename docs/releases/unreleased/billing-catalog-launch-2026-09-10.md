# Billing entry from the page catalog — 10 September 2026

## Changed

Patient selection moves to the Billing Clinic card in List of pages. Selecting an API search result opens a patient-specific billing tab through the shared navigation port. Web uses a browser tab and the existing record URL; desktop uses a workspace tab. Billing loads the patient ID from navigation and retrieves its ledger through the demo API. Bare billing routes link back to List of pages.

Removed from hosted billing: Search/Select patient/demo card, the four introductory statistics, and the workflow/currency/cashier banner. Operational sections and server permissions remain. No financial calculation or CSV storage contract changed. Standalone integrations may retain the existing inline selector; the public example now shows external selection. Effective preferences and canonical four-language guide text remain supported. See the [feature and integration guide](../../features/page-library-catalog.md#billing-patient-navigation).

## Validation

Eight tests across billing workspace and catalog passed. The billing browser regression passed against disposable demo API data on port 3210 with Vite/Chromium on 3109: selection from the catalog, prescription/order/invoice, correction, partial payment, refund, exports and print. The regression now returns to the patient-specific workspace tab after changing export preferences, rather than opening an empty billing route. Project verification gates passed. [Source and evidence hashes](evidence/billing-catalog-launch/manifest.json) identify this local acceptance. Type checking and release build/activation are recorded in the subsequent deployment evidence.

No browser record writes target live data. No new backend endpoint, data migration, reading-state reset or authorization mechanism is introduced. Invalid IDs retain API error recovery. A patient or scope change remounts the editor to avoid mixing drafts across records. Unrelated previous CI failures and native/domain review remain outside this change.

This implementation record precedes deployment; see the later deployment record for actual publication identity and public-site checks. Rollback restores the prior frontend release and prior guide catalog text; no billing data rollback is required.
