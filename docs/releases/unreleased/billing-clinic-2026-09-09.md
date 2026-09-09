# Billing Clinic — 9 September 2026

Implemented in `30789e9672c41153a14f5f2ab491cbe2ce148d47`, with verification logs added in `fff513c1965b6d692f9e0640c142f118623c9f79`. Committed, pushed and deployed to both demo sites on 9 September 2026 (UTC). Earlier local verification statements below preserve their original scope.

## Added and changed

- Added **Billing Clinic** to **Library → Page templates** and its public component/adapter contracts.
- Patient identity and visit context, prescription conversion, service orders, insurance estimates, immutable invoices, partial payments, full-payment refunds, unpaid cancellation, receipt views and history.
- Authenticated CSV-backed demo ledger with integer monetary calculations, tenant/application/patient isolation, server write authorization, version conflicts and retry receipts.
- Shared component composition and effective tenant-locked preferences; CSV/Excel export preference and whole-document print/PDF output. Billing money retains cents even when the general number setting displays whole units. Ledger currency comes from the API, not a display conversion.
- Four-language catalogs, generated fallbacks, API error keys, public TypeScript example, authored help, tour target and documentation release/feature alert `2026-09-09-billing-clinic`.
- Library inventory now has 135 destinations: 102 standard named templates, four Page templates, and the existing other destinations.

## User and integration instructions

See [Billing Clinic](../../features/billing-clinic.md) for workflows, storage format, adapter example, settings, error recovery and production boundaries. Stable acceptance IDs: [CLINIC-01–05](../../testing/v1.0.0/USE-CASES.md#billing-clinic).

## Verification

- Backend TypeScript and 16 clinical/CSV/billing API tests passed, including permission/version enforcement, duplicate retries, tenant isolation, invoice/payment calculations, refunds and unpaid cancellations.
- All workspace packages and the desktop application passed TypeScript checking before the monetary formatter follow-up; final targeted/build results are recorded below.
- Focused frontend regressions passed: 34 tests across seven files before the monetary-precision regression was added. The added formatter test passed with the two billing workspace tests (three tests total); these counts overlap and must not be summed.
- Chromium against a real isolated demo API passed prescription → order → invoice → partial payment → refund → CSV download → PDF rendering, without intercepted requests or page errors. An actual API restart preserved invoice, payment, refund and export history in CSV.
- Arabic, Hindi, Malayalam and English browser checks passed for rendered key resolution, document direction and desktop width. This is not native-speaker approval.
- Both web and desktop production builds passed before the final monetary-precision follow-up. Final results below identify the final tree.

## Completion boundary

This is a frontend template and single-process demo API, not a production healthcare billing service. Real payer authorization/claims, payment capture and reconciliation, accounting integration, certified tax/tariff rules, item-level credits and production audit/database concurrency remain application responsibilities. Browser-close draft restoration is not connected for this new workspace; recoverable failures preserve mounted input and operation identity.

Native executable testing, native-speaker/domain acceptance, remote CI and deployment are not claimed. No live patient or billing data was modified by these implementation tests.

## Final verification and retained evidence

- Final web and desktop production builds passed after the monetary-precision correction.
- Final frontend regression run: **61 tests passed across eight files**, including the billing workspace, monetary formatting, existing clinical templates, registry templates, export policy and shared CSV/Excel exporter.
- Final clinical API run: **16 tests passed**, with backend TypeScript checking.
- The registered managed browser suite passed against a fresh real demo API. It verified both CSV and Excel downloads with all three line items and preserved cents (`76.50`, `22.50`, `135.00`), a rendered PDF, payment/refund receipts and absence of page errors.
- Localization/API-message, documentation, Library preference/navigation, component/form-control, export-safety, E2E registry and generated component/template-example gates passed. Documentation checker passed with 36 documents; `git diff --check` passed.
- [Source and artifact hashes](evidence/billing-clinic/manifest.json) identify the local delivery. Retained logs: [browser](evidence/billing-clinic/browser.log), [language layout](evidence/billing-clinic/languages.log), [API](evidence/billing-clinic/api-tests.log), [frontend](evidence/billing-clinic/frontend-tests.log), [build](evidence/billing-clinic/build.log).
- Fictional artifacts: [desktop screenshot](evidence/billing-clinic/clinic-workflow.png), [CSV](evidence/billing-clinic/clinic-invoice.csv), [Excel](evidence/billing-clinic/clinic-invoice.xlsx), [PDF](evidence/billing-clinic/clinic-invoice.pdf). PDF generation was exercised in Chromium; printer-device acceptance and native-language PDF acceptance were not performed.

Reproduce the browser suite with a Vite desktop shell pointing at the chosen local API origin, then run `node e2e/run.mjs features --suite=clinic-billing.mjs --managed-api` from `desktop-clients`, setting matching `E2E_API`, `E2E_DESKTOP` and `PLAYWRIGHT_PATH`. The managed API creates fresh disposable data; do not run the write workflow against live patient records.

## Verified deployment

- Frontend release: `20260909172532776-1997e17d`, built in isolation from implementation commit `30789e9`. Both packaged applications passed independent HTML/asset smoke tests before activation.
- API: restarted with the Billing Clinic implementation and updated navigation, messages and documentation configuration. Existing clinical CSV SHA-256 remained unchanged through deployment and verification. The new live billing CSV exists with mode `0600`.
- Backup: `.deploy/backups/billing-clinic-20260909T172706Z/` contains stopped API data and previous API source. Previous frontend release `20260909161011864-64158fe3` remains available for rollback.
- On both `https://front-design.pepbits.com` and `https://desktop.front-design.pepbits.com`, Chromium verified release identity, Billing Clinic navigation, authenticated patient/catalog/ledger responses, all five sections and no page errors.
- Worklist Query, Master Record - Main and 360 Data also passed navigation/render checks on both hosts. Live verification did not create invoices, collect payments or refund money; the complete write flow was verified on the isolated demo API.
- The first remote CI run failed because ignored `.log` files were missing from Git. Commit `fff513c` included the five referenced verification logs. Replacement run `34382948256` was in progress when deployment verification finished; remote CI completion is not claimed.
- [Live Billing Clinic checks](evidence/billing-clinic/live-billing.txt) and [existing template checks](evidence/billing-clinic/live-patient-templates.txt) retain the observed results.
