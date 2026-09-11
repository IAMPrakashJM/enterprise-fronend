# DCP reusable value sets — 11 September 2026

Status: implemented and locally verified; not committed, pushed or deployed.

## Delivered behavior

The designer now has **Manage value sets** for reusable dropdown options and parent/child relationships. Administrators create catalogs once and reference their revisions from multiple forms. The demo API shares catalogs within tenant/application scope while keeping form drafts scoped to their author. Other tenants and applications remain isolated.

Country and State seed sets demonstrate India → Kerala/Karnataka and UAE → Abu Dhabi/Dubai. Catalog-backed fields store references rather than copied options. The API resolves exact revisions and validates membership. Updates append catalog revisions; existing forms keep their pinned versions until explicitly changed. These catalog revisions do not constitute production form publication or an attestation service.

Catalog editing preserves unsaved form changes. Retry retains the operation ID and editor values; stale writers receive a conflict. Refresh retrieves the current catalog without erasing edits. Switching or closing an unsaved catalog editor requires an explicit discard choice. Shared controls and effective preferences remain in the existing designer shell. Framework messages and new help follow the four-language pipeline.

See the [feature and integration guide](../../features/dcp-designer.md), [enterprise scope](../../development/README-DCP-ENTERPRISE-FORM-SCOPE.md) and DCP-03 in the [test cases](../../testing/v1.0.0/USE-CASES.md).

## Source and verification

Source base `2f66cb5` plus the [working-tree source manifest](evidence/dcp-value-sets/source-manifest.json). This includes the preceding uncommitted dependent-dropdown increment. No remote CI, deployment or production integration was performed.

- [Full local CI](evidence/dcp-value-sets/ci.log): 121 frontend test files / 1,545 tests; 132 API tests; 2 registry tests; 14 deployment-tool tests; package type checks, Next.js and Vite builds, localization, API error, example, navigation, bundle and documentation gates passed.
- A final localized catalog-limit error message was added during that run. [Final focused API tests](evidence/dcp-value-sets/api.log) passed all 6 designer cases, including shared references, immutable revisions, retries, conflicts, authorization and scope isolation. These overlap the full-suite counts.
- [Chromium catalog acceptance](evidence/dcp-value-sets/browser.log) passed creation, revision, relationship authoring, preservation of form edits, reference-only persistence, old-version options and explicit upgrade. The first attempt exposed a preview-selection clearing issue while relationship settings were temporarily incomplete; the implementation was corrected before the passing run. [Catalog screenshot](evidence/dcp-value-sets/catalog.png), [preview screenshot](evidence/dcp-value-sets/preview.png).
- [Chromium inline regression](evidence/dcp-value-sets/inline-browser.log) passed dependent dropdown authoring, India/UAE filtering, descendant clearing, API validation and English/Arabic/Hindi/Malayalam layouts. Browser runs used isolated synthetic API storage. The new catalog dialog itself has not received a separate four-language browser acceptance pass.

## Boundaries and remaining work

The demo reuses the existing CSV snapshot store, not a new production database. Catalogs have at most 50 options per set and 100 retained revisions per catalog kind/scope. Relationships map each child option to one parent value; multi-parent/many-to-many conditions are not delivered. The bounded catalog is fetched as a whole. Idempotency receipts retain the most recent 100 operations; this is not indefinite replay protection.

Large paged datasets, CSV/XLSX catalog imports, inactive/retired options, governed approval/publication, business-record bindings and production DCP adapter compatibility remain separate work. No Oracle Fusion or Cerner feature parity is claimed. Existing API-backed form drafts and preview answers do not establish durable production answer history.

Help snapshot `2026-09-11-dcp-value-sets` preserves earlier snapshots. Native-speaker review, actual Tauri execution, devices, production PostgreSQL and workload acceptance remain pending.
