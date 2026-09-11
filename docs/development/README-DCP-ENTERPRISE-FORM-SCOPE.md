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
