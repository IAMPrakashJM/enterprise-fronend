# Billing rail alignment — 10 September 2026

Local implementation on base `2696b1b`; not committed, pushed or deployed.

## Problem and change

Billing used a record rail whose five items were distributed across the entire viewport, with labels wider than their available space. The highlighted orders section did not match the topmost visible patient section because every section was stacked.

Billing now opts into the shared `RecordSectionLayout` start-aligned rail and active-section rendering. Navigation items stay together at the top, long labels wrap, the active pane aligns alongside the rail and footer actions span the workspace width. Switching sections resets the content scroll position. Existing record pages retain their default rail spacing; other active-only consumers also receive the scroll reset. Effective tabs/wizard, density, font, direction and reduced-motion settings remain supported. No API, permission, patient selection or financial calculation changed. See the [feature guide](../../features/page-library-catalog.md#billing-rail-alignment).

## Verification and limits

Twelve billing and clinical-template component tests passed. All packages typechecked before the final scroll-reset effect was added; final component/browser checks include that effect. The isolated Chromium billing suite checks one active section, rail containment/spacing and footer viewport bounds, then prescription/order/invoice/correction/payment/refund/export/print workflows. Evidence is retained in the [manifest](evidence/billing-rail-alignment/manifest.json) and [screenshot](evidence/billing-rail-alignment/rail.png). Browser acceptance uses disposable demo API data on 3210 and Vite on 3109 at 1800 × 1100. No live record writes or PT-0003 patient inspection occurred. The shared layout correction applies to all patient IDs.

Documentation links and whitespace checks passed. No production build, deployment, new CI, native executable or additional language/browser acceptance is claimed. Prior CI failures remain separate. Revert the billing layout props and shared alignment/scroll additions to restore the prior presentation; no data rollback is needed.
