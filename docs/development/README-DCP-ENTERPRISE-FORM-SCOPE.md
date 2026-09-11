# DCP enterprise page and form designer: frontend scope

Date: 11 September 2026. The user's supplied 18-part enterprise scope remains the target requirements. This document records the first implementation boundary and reuse decisions; it does not narrow the advanced roadmap or claim backend/production completion. The backend is owned by another session.

## Non-negotiable integration boundaries

Use the existing host shell, typed page engines, ops-ui controls, effective preferences, canonical localization, recovery services and platform ports. Tenant metadata must not execute uploaded JavaScript/SQL. Host services authorize scope, validate pinned definitions and domain invariants, own transactions and use the existing DCP persistence families. No platform database, new standalone form service, tenant control plane or duplicate production DCP storage is introduced.

Backend definitions, datasets, bindings, answers and revisions belong to the tenant database through the host's verified datasource selection. A frontend demo CSV file is not evidence of that production persistence contract. Published versions must remain immutable, records retain pinned versions and storage mode/owner identity must be explicit.

## Source reconciliation performed for this increment

Reviewed this repository's development/testing rules, shared template field/section renderer, preference host, authenticated adapters, CSV demo storage and navigation/help lifecycle. Read the backend repository's `dcp/README.md`, `dcp/OPERATIONS.md`, `application/README.md`, developer/AI guide, testing pointer and `dcp/frontend/dcp-authoring.js` through read-only GitHub access.

Backend evidence establishes existing Form/Section/Field records, an expression model, authoring controls, opt-in application integration and host-owned API/transactions. It does not establish wire equivalence to this frontend's TemplateField. No backend source or migration was changed. Physical migration lineages and production HTTP/save contracts remain to be reconciled before production adapter work; the current frontend does not issue backend publication or domain-save commands.

| Requirement | Existing reuse | First increment / remaining work |
| --- | --- | --- |
| Visual field/section composition | TemplateField, TemplateSection, shared controls | Implemented palette, ordering, properties, duplication and preview |
| Form state | Existing TemplateFields value/change contract | Preview-only values; no second runtime form library |
| Designer drag/drop | dnd-kit core/sortable/utilities | Pinned dependencies; pointer, keyboard and move buttons |
| Preferences and localization | PreferenceHost, PresentationProvider, canonical catalogs | Host settings/locks; translated framework text; tenant label dictionaries remain pending |
| Persistence | Existing scoped demo CSV snapshot utility | Demo draft save/restore, expected revision and bounded retry receipts; production DCP mapping pending |
| Native/web | Shared React packages in Next.js and Vite shells | Shared implementation; actual Tauri acceptance separate |
| Help/examples | Existing documentation API and Page Library catalog | Dedicated guide and public adapter example |

## Full delivery roadmap

1. Reconcile the backend wire model, capabilities, ownership, migration lineages and versioned testing contract with the other session. Review compatibility rather than creating competing models.
2. Complete core runtime/entity extension and independent-document integration, server normalization and version-pinned records through authorized host endpoints.
3. Add dataset management: staged CSV/XLSX import, mapping/errors, stable string IDs, revisions, dependent and multi-parent sources, stale-response cancellation and safe activation.
4. Add rule/dependency designers, bounded typed expressions, required/range/format rules, explicit hidden/default semantics and matching server fixtures.
5. Add entity/scope assignment, permissions, review/publication/retirement, optional workflow/attestation, file references and authoritative history.
6. Add repeatable groups/grids, visual/capture/domain packs, layout variants, worklists, print and reporting through existing page engines and platform ports.
7. Run declared PostgreSQL workloads, tenant upgrade/restore, cross-scope denials, concurrency/idempotency, RTL/accessibility and actual native/device acceptance. Engineering latency targets are not measured guarantees.

## Initial visual designer acceptance

Palette add, section/field selection and reordering; stable identity through label changes; explicit cross-section moves; shared control preview; required/number/email/option feedback; bounded schema checks; saved draft restore; recoverable save failure and identical retry; stale revision and cross-scope denial; tenant presentation locks; contextual help and API-backed capabilities.

The [feature guide](../features/dcp-designer.md) lists supported controls and exact limits. The [release record](../releases/unreleased/dcp-designer-2026-09-11.md) separates local tests, browser checks and publication/deployment status. None of these establishes the entire 18-part enterprise scope as complete.

## Dependent-dropdown increment

Single-parent mappings, five-link dependency chains, bounded API option lookup, descendant clearing, stale-response protection and server preview membership validation are implemented through existing template fields and demo adapters. Uploaded datasets, multi-parent rules and production backend DCP codecs remain in the roadmap. See the [designer guide](../features/dcp-designer.md).

## Reusable catalog increment

Tenant/application-shared value-set and relationship revisions, API-backed administration, explicit form references and upgrades are implemented in the demo designer. The existing CSV snapshot store owns demo persistence. Production DCP mapping, approval/retirement, inactive values, value-level permissions and large dataset operations remain pending.

### Bounded CSV option staging — 11 September 2026

The frontend reuses the shared CSV parser and controls to map and review up to 50 text-ID options. Applying stages the complete set in the existing catalog editor; saving uses its authenticated, revision-checked API command and atomic CSV snapshot write. No production backend contracts or migrations change. This is not the planned large dataset import-job/atomic activation engine: XLSX, paged lookups, background staging and relationship imports remain pending. See the DCP designer feature guide and DCP-04 tests.

### Enterprise runtime implementation — 11 September 2026

Typed range/integer/text rules, normalization, bounded arithmetic and cross-field visibility/required/read-only conditions now use shared client/demo-server evaluation. Demo review/approve/publish/retire and new-draft flows preserve published schema snapshots. Registered synthetic owners load shared tenant/application answers by exact release, with revision checks and read-only submission. Stacked/tabbed/stepped layouts reuse the same section renderer. CSV/XLSX catalog staging accepts up to 1,000 rows per revision; workbook parsing is isolated and timed out, and preview is paged locally. A host-codec adapter accepts explicit application wire conversion and structured errors; no live production endpoint is configured.

Still required for the complete supplied scope: production wire mapping/authorization/domain transactions and backend acceptance; scalable staged/paged datasets, multi-parent relations and bulk dataset governance; exact decimals and full backend rule AST; repeating groups and the advanced component/domain/capture catalog; attestation/amendment/workflow integration; local shared draft recovery; tenant-authored translations; native/device and workload acceptance. These are not marked complete by the new demo lifecycle. The backend is owned by another session; the live host endpoint and current contracts have been requested.

### Frontend-owner backend handoff and current v1 integration

The frontend session read Jira attachment 10000 on PLIBRYBEND-206, including the versioned guide and actual-engine fixtures. The [frontend acknowledgement and backend requirements](https://pepbits.atlassian.net/browse/PLIBRYBEND-206?focusedCommentId=10095) were posted and read back successfully on 11 September 2026. Existing backend stories 172–202 already cover the pending groups; no duplicate backlog or backend code change was created here. Production route wiring remains host-owned.

The shared frontend now includes a bounded v1 response/patch validator, authenticated load/preview/save adapter, masked/writable field handling, string revisions, row-specific permissions, nested collection editing, 422 error navigation, explicit CAS recovery and tenant-controlled shared draft recovery. The Library uses the existing demo API/CSV storage. The authoring designer additionally supports four-parent filtering, translated field/section labels, alternative shared controls and release comparison. See the feature guide for exact boundaries.

Full frontend completion is still being worked on. These additions do not remove the advanced catalog, enterprise administration, staged dataset job, file/capture, workflow/signing, report/print and native acceptance requirements. Backend implementation and production/domain acceptance remain with the other session; the posted Jira handoff separates those responsibilities.

Repeatable designer sections now support bounded row add/remove, stable occurrence identities, per-row normalization/calculations, validation paths and CSV demo answer round trips. Copying an example remaps internal rule/dependency references. This is one-level authoring repetition; nested runtime collections use the separate supplied v1 contract. Advanced nested authoring grids and remote row-dependent lookup jobs remain pending.
