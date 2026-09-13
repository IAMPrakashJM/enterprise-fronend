# Frontend delivery changelog

## 13 September 2026 — Repository documentation audit

Reconciled current release indexes, added DCP coverage to the root/workspace architecture map, updated the demo API overview against its current dependencies, endpoint families and SQLite preferences, and removed stale DCP completion statements. Historical evidence remains unchanged. See the [audit and remaining gaps](unreleased/documentation-audit-2026-09-13.md). Documentation checks do not resolve hosted browser failures or certify missing domain/native reviews.


## Release evidence review — 11 September 2026

Reconciled the current release pointers with retained deployment evidence and Git publication. Clarified that the latest release is the latest recorded deployment, without implying a fresh live check. Historical evidence remains unchanged. See the [review record](unreleased/documentation-review-2026-09-11.md).

## Current documentation reconciliation — 11 September 2026

Updated the project overview, documentation index, feature status, testing evidence pointers and delivery index to reflect the deployed framework. Regenerated the page-help backlog without marking missing authoring or native review complete. See the [refresh record](unreleased/documentation-refresh-2026-09-11.md).

## Delivered demo additions — 10 September 2026

- Page Library catalog, API-backed patient query/master/360, billing corrections and shared clinical workspaces.
- OP Registration, Emergency Registration, Inpatient Admission and two consultation reference designs.
- Barcode/QR printing, scanner/device routing and identity-reader demonstration contracts.
- API-backed personal default module and shared page-help/documentation lifecycle.
- Shared components, preference policies, canonical translations, examples and feature-specific recovery/validation supporting these additions.

The latest recorded demo release is `20260910173632033-48931d24`; [deployment evidence](unreleased/care-page-deployment-2026-09-10.md) identifies its exact scope. Native-speaker review and production connectors remain pending. No new package version or tag is implied. Earlier delivery entries below preserve their original state.

## Historical baseline — 9 September 2026

### Added

- Generic UI presentation context, typed preference-host/local-choice contract and Library route manifest.
- Dedicated Theme Studio, Accessibility, Page Catalog, Component Contracts, Keyboard Shortcuts and Integration Guide pages.
- Library preference regression tests and route/CSS browser suite.
- Root documentation index, detailed feature/architecture guides, development rules, versioned testing inventory, release templates and documentation validation.

### Changed and fixed

- Managed table presentation and supported page controls follow effective user preferences and tenant locks.
- Hosted examples use current formatting; generated examples show public contracts and preference integration.
- Clinical form/result typography and rectangular radii use appropriate tokens.
- Patient Query honors custom-shortcut enablement, export format and supported preview settings.
- Status badges remain readable when surrounding table text wraps.

### Deprecated and removed

The generic fallback content for six named Library destinations was replaced with dedicated content. No public API removal or stored-data migration is claimed in this change.

### Delivery state

Implementation and local validation are recorded in [the unreleased delivery](unreleased/README.md). No new commit, tag, push, hosted CI execution, package publication or deployment is claimed. WebKit/native/wording acceptance remains separately tracked.
