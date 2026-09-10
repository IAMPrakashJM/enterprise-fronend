# Billing catalog launch deployment — 10 September 2026

Source `fd275f19035d1faed72b7becbad57342becd5fd5` was committed and pushed. Release `20260910075313100-3c6ad150` is deployed to both [web](https://front-design.pepbits.com/library/list-of-pages) and [desktop browser](https://desktop.front-design.pepbits.com/library/list-of-pages) demos. This supersedes the pre-deployment status in the [implementation record](billing-catalog-launch-2026-09-10.md).

## Delivered flow

Under Billing Clinic in List of pages, search and select a patient. Selection opens a new browser tab on web or workspace tab on desktop, with the patient ID in the shared navigation target. The billing page retrieves that patient's ledger from the API. Web record URLs retain patient identity on reload. A billing route without an ID offers a return to the catalog.

The billing page omits the selector/demo card, summary statistics and workflow/currency/cashier banner. Existing order, invoice correction, payment, refund and export functionality remains. Preferences, localization, server permissions and monetary formatting still apply. The API was restarted to load updated four-language guide text; no schema or record migration was required.

## Verification and evidence

All packages typechecked. Eight component tests and the isolated demo API billing browser regression passed, as did project gates. Production preparation rebuilt both shells and verified packaged assets. Activation health checks passed. See the implementation record for earlier test scope.

Live Chromium checks (1700 × 1050, English) passed on both public hosts: release identity, API-backed patient selection, new-context launch, API response patient ID, removed introductory controls and no JavaScript errors. Web additionally passed record-URL and reload checks. Screenshots were captured after presentation animation settled. No live record, preference or reading-state mutations were requested. The isolated browser workflow exercised invoice/payment/refund/export writes only against disposable data.

Evidence: [manifest](evidence/billing-catalog-launch-deployment/manifest.json), [typecheck](evidence/billing-catalog-launch-deployment/typecheck.txt), [prepare](evidence/billing-catalog-launch-deployment/prepare.txt), [activation](evidence/billing-catalog-launch-deployment/activate.txt), [live checks](evidence/billing-catalog-launch-deployment/live.txt), [web catalog](evidence/billing-catalog-launch-deployment/web-catalog.png), [web billing](evidence/billing-catalog-launch-deployment/web-billing.png), [desktop catalog](evidence/billing-catalog-launch-deployment/desktop-catalog.png), [desktop billing](evidence/billing-catalog-launch-deployment/desktop-billing.png).

[Remote CI 34452225197](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34452225197) was in progress at recording time. Earlier unrelated CI failures are not resolved by this delivery. Other browser engines, native executable acceptance and native-speaker review were not performed here.

## Recovery and publication

Prior release `20260910073724156-d1fc5041` is retained. With Node 24, run `npm run deploy --prefix desktop-clients -- --activate 20260910073724156-d1fc5041` to roll back frontend behavior. If guide text also needs rollback, restore only the changed `template.clinic.guideFlow` values from parent `af09135` in canonical catalogs and restart the API; no billing-data rollback is needed. Later evidence-only commits do not change the deployed source. No package publication or release tag is claimed.
