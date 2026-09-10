# Catalog notice deployment — 10 September 2026

Committed and pushed `144608f4040f5c7931146a4aeb80ae013dd70215`. Release `20260910073724156-d1fc5041` is active on the [web demo](https://front-design.pepbits.com/library/billing-clinic) and [desktop browser demo](https://desktop.front-design.pepbits.com/library/billing-clinic). This supersedes the local-only publication status of the [implementation record](catalog-notices-2026-09-10.md).

## Delivered behavior

The shared page notice card appears only on List of pages. Billing Clinic no longer shows the Billing corrections and shared clinical rail card or its Read explanation and Dismiss buttons. Other working pages also omit shell release notices. Catalog notices still respect documentation preferences and read/dismiss state. Explicit Documentation Center access and release history remain available.

No API configuration, localization catalog, data migration or preference policy changed. The API did not require a restart. No reading-state reset was performed. Existing operational error/recovery controls remain separate from documentation notices.

## Verification

Both shells rebuilt and passed packaged HTML/asset checks on isolated ports. Activation restarted both frontend services and passed application health checks. Earlier type checks and 26 component tests are retained in the implementation record.

Live Chromium checks at 1700 × 1050 passed on both hosts: exact release identity, catalog notice present before and after navigation, notice absent from all eight Page Library working pages, and Billing Clinic title/Dismiss controls absent. No JavaScript page errors occurred. No record, preference or reading-state values were changed. These are browser-rendered demos, not native executable tests.

Evidence: [manifest](evidence/catalog-notices-deployment/manifest.json), [prepare](evidence/catalog-notices-deployment/prepare.txt), [activation](evidence/catalog-notices-deployment/activate.txt), [live checks](evidence/catalog-notices-deployment/live.txt), [web Billing Clinic](evidence/catalog-notices-deployment/web-billing.png), [desktop Billing Clinic](evidence/catalog-notices-deployment/desktop-billing.png), [web catalog](evidence/catalog-notices-deployment/web-catalog.png), [desktop catalog](evidence/catalog-notices-deployment/desktop-catalog.png).

Remote [CI run 34450877386](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34450877386) was in progress when this evidence was recorded. The previous delivery's four feature-browser failures remain unresolved; this deployment does not claim a green CI run. No native executable, other browser engine or translation acceptance was performed for this edit.

## Recovery and publication

Previous release `20260910071728997-8c827861` is retained. With Node 24, use `npm run deploy --prefix desktop-clients -- --activate 20260910071728997-8c827861` to roll back both shells. No backend or record rollback is needed. Runtime source is the commit above; later documentation-only commits do not change the deployed artifact. No package publication or release tag is claimed.
