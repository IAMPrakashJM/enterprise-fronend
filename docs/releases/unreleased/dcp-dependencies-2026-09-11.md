# DCP dependent dropdowns — 11 September 2026

Status: implemented and locally verified; not deployed.

## Delivered behavior

The designer supports one dropdown parent per child, explicit option-to-parent mappings, bounded multi-level chains, parent removal protection and an API-provided Country → State example. India offers Kerala/Karnataka; UAE offers Abu Dhabi/Dubai. The same configuration supports Company → Branch and other relationships. Inserting examples creates fresh IDs and remaps dependencies.

Preview resolves options through the demo API, separates missing-parent/loading/empty/error states, clears descendants on parent changes, ignores stale responses and retries without discarding parent values. Schema edits prune invalid or removed preview selections. Explicit preview validation checks parent/child membership through the API without persisting answers. Saved designs preserve mappings in scoped demo CSV snapshots.

[Feature and API guide](../../features/dcp-designer.md), [enterprise scope](../../development/README-DCP-ENTERPRISE-FORM-SCOPE.md), DCP-02 in the [testing cases](../../testing/v1.0.0/USE-CASES.md).

## Verification and source

Source base `2f66cb5` plus the [working-tree source manifest](evidence/dcp-dependencies/source-manifest.json). No commit, push or deployment performed for this increment.

- Full local CI passed: 120 frontend files / 1,541 tests, 130 API tests, 2 suite-registry tests, 14 deployment-tool tests, both builds and repository gates. [CI log](evidence/dcp-dependencies/ci.log).
- While that run was in progress, two small UI corrections were completed: accessible names for mapping selectors and pruning invalid preview values after schema edits. The builds and final gates used those changes. Final-source verification then passed all package type checks and 14 focused tests covering the designer and shared page templates, including a new example-ID remapping case. These 14 tests overlap the full-suite count and must not be added to it. [Type checks](evidence/dcp-dependencies/typecheck.log), [focused tests](evidence/dcp-dependencies/ui.log).
- Four designer API tests cover persistence, scope, expected revisions, invalid membership, leading-zero IDs and malformed dependency graphs. [API log](evidence/dcp-dependencies/api.log).
- Isolated demo API / Chromium acceptance passed manual dropdown authoring, explicit mappings, saved draft metadata, India/UAE option filtering, descendant clearing, API validation and English/Arabic/Hindi/Malayalam layouts. Initial browser attempts exposed a test label mismatch and the mapping-control accessible-name issue; both were corrected before this passing run. [Browser log](evidence/dcp-dependencies/browser.log), [mapping screenshot](evidence/dcp-dependencies/mapping.png), [preview screenshot](evidence/dcp-dependencies/preview.png), [Arabic](evidence/dcp-dependencies/ar.png).

## Limits and integration

This is bounded dropdown metadata: at most 50 options per field, one parent per dropdown, five dependency links. Uploaded datasets, server-paged large catalogs, multi-parent conditions, full rule authoring and production DCP business-record validation remain separate work. No specific ERP product feature-parity or entire enterprise scope completion is claimed.

The existing TemplateFields renderer receives optional lookup field states; no parallel primitive library or shell was added. The demo API is the source for option fixtures and saved mappings. Unsaved preview definitions are administrator-authorized; saved-draft commands load their pinned authoritative revision. All business persistence remains outside preview.

New help snapshot `2026-09-11-dcp-dependencies` preserves prior releases and provides four-language instructions. Native-speaker, actual Tauri/device and production backend acceptance remain pending.
