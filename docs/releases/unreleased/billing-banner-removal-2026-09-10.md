# Billing Clinic patient card removal — 10 September 2026

Removed the standalone patient summary card from Billing Clinic, including avatar, status, name and demographic/contact line. The patient selector and Patient & visit section continue to use the existing API. Shared patient banners on other pages are unchanged.

Local working tree on base `4f0e57509e26f10ee91c46499e8cfafdc2c30a57`. Not committed, pushed or deployed. The only runtime source change removes the PatientBanner import and render from `desktop-clients/packages/erp-screens/src/clinic-billing/workspace.tsx`; its SHA-256 is `771c7b53bd84a5b6ec75346b02a2fc2d10fa7fa4ff0231241eea9a921d878cf8`.

Verification under Node 24: `npm test --prefix desktop-clients -- --run packages/erp-screens/src/clinic-billing/workspace.test.tsx` passed all 4 existing tests ([log](evidence/billing-banner-removal/unit.txt)); `tsc -p desktop-clients/packages/erp-screens --noEmit` passed. Documentation checker and whitespace checks passed. No new tests were added for this presentation-only removal. Browser, native and live deployment checks were not rerun.

The [billing guide](../../features/billing-clinic.md) reflects the removal. Existing billing API, preferences and correction/payment behavior remain unchanged.
