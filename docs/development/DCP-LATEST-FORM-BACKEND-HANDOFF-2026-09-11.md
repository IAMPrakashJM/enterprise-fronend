# Latest form structure and backend handoff

Date: 11 September 2026. Frontend implementation: `0cab668d3dc816ff6f855cc5911c2b4bad5e1b75`; deployment documentation: `3244587aab98cacc3bd2b171fe95889dfd4f8b11`; deployed demo release: `20260911145802227-397d1cf5`.

This document records what the latest frontend expects from the backend team. It does not claim production integration or full enterprise frontend completion. Backend implementation belongs to the other session. The supplied backend v1 fixture package is acknowledged; the requests below extend that baseline rather than replacing it.

## 1. The structure in simple language

A form has a stable identity and published versions. A version contains sections. Each section contains fields, or a repeatable group of fields. Fields have stable IDs, types, labels/translations, presentation choices, rules and optional lookup references. A layout arranges sections into a stacked page, tabs or steps and one to three columns.

A form is assigned to a registered business entity and trigger. One concrete owner, such as employee 123 or a particular lab order item, owns an answer document. A document keeps its form version, revision and row identities. The selected language changes labels and formatting, not IDs or stored answers. Backend authorization and business rules remain authoritative.

```text
Registered entity / trusted owner context
  -> Applicable published form version
     -> Layout (stacked / tabs / steps, columns)
        -> Section
           -> Field (stable ID, type, labels, rules, source)
        -> Repeatable section (minimum / maximum rows)
           -> Occurrence ID + fields
  -> Answer document (owner, pinned version, exact revision, status)
     -> Scalar values and occurrence values
     -> Authorized history / files / attestations when supported
```

The current designer supports one level of repeated sections. The separate DCP v1 runtime renders nested COLLECTION fields. A general page designer with every clinical/capture/report widget is still future scope.

## 2. Two contracts that must not be confused

| Layer | Existing frontend structure | Backend expectation |
| --- | --- | --- |
| Visual authoring | `DesignerDefinition`: title, labels, layout, columns, binding, sections; fields have id/type/control/rules/options/dependencies | Provide a versioned authoring transport or explicit codec into existing DCP definitions. Preserve layout/presentation/translation metadata alongside the authoritative rules. Do not require blindly posting this JSON as `Dcp.Form`. |
| Resolved runtime | Supplied v1 `DcpLoaded`/`DcpRuntimeView`, `DcpSave`, `DcpSaved` | Preserve the supplied contract and provide actual authenticated, owner-bound host routes. |
| Demo lifecycle/catalog | DesignerRecord, DesignerRelease, CatalogSet/Relationship, DesignerAnswer | Map to existing backend definition/catalog/document lifecycle, permissions and history. Demo numeric revisions and operation IDs are not the production revision contract. |
| Recovery | Existing shared DCP draft service | Provide the host adapter for authorized draft retention/exclusions and revision-safe restoration; do not introduce a separate browser store. |

The [complete example](examples/dcp-latest-form-structure.json) is valid current **frontend authoring JSON**, not a production payload. It includes Lotus Limited/Leo Limited text IDs, India/UAE dependent states, an additional entity-type parent, translated labels, conditional review reason and repeated numeric observations. The labels/companies are synthetic; identifier options are not legal identity rules.

The example passed the current definition guard and preview validation, including repeated answers and rejection of Dubai when India is selected. No backend fixture equivalence is claimed for that authoring example.

## 3. Current supported design metadata

- Designer scalar types: text, textarea, email, number, date, time, select and checkbox. Alternative controls: searchable select, radio, segmented choice, toggle, slider, numeric rating and read-only presentation.
- Section layout: stacked/tabs/steps, one to three columns. Repeated sections have `repeatable`, `minItems`, `maxItems`; at most 100 rows in the current authoring guard, default maximum 10. Form limit: 20 sections and 100 fields. These are frontend profile limits, not backend scalability promises.
- Stable field/section IDs survive label edits. Copying an approved sample remaps internal references. Repeating occurrences have independent identities and values.
- Framework messages use the existing canonical localization catalogs. Tenant labels are dictionaries for en/ar/hi/ml with selected locale -> English -> original fallback. Field/section translation editors exist. Form/option dictionaries exist in the type model, but all corresponding administration controls are not complete.
- Rules: min/max, integer, text length, ASCII/Unicode letters, uppercase, alphanumeric; trim or trim-uppercase normalization; equals/not-equals/filled conditions for visibility/required/read-only; sum/difference/product/ratio calculations. Numeric operations are demonstrations using finite JavaScript numbers.
- Sources: inline lists or pinned `valueSet: {id, revision}`. Catalog-backed child fields pin a `relationship` revision; extra parents each pin their relationship. Inline and catalog sources cannot be mixed in the same dependency pair.
- Up to four conjunctive parents and five dependency edges per path. Country -> state and country + entity type -> identifier type are supported. Parent changes clear descendants; all parents must match. Each current relationship maps a child to one parent value; arbitrary many-to-many relationship modeling is not yet claimed.
- CSV/XLSX option staging is bounded to 1,000 rows, with explicit mapping, whole-revision validation and save. Production upload jobs, huge datasets and remote paged row-dependent lookups remain pending.

## 4. Immediate host runtime contracts required

The host application supplies relative `load`, `preview` and `save` paths to `createDcpRuntimeAdapter`. The frontend does not invent production URLs. GET load returns `DcpLoaded`; POST preview/save accepts `DcpSave`. Requests use `Pepbits-Contract-Version: 1`; cross-origin hosts must allow that header. Authentication, tenant resolution, owner binding and transactions remain host-owned.

```json
{
  "expectedVersion": "0",
  "checksum": "authoritative-definition-checksum",
  "mode": "PINNED",
  "patch": {
    "name": "Example",
    "consent": false,
    "notes": null,
    "observations": [
      {"_id": "existing-server-row-id", "note": "Amended draft row"},
      {"note": "New row without a server ID"},
      {"_id": "another-existing-row-id", "_delete": true}
    ]
  }
}
```

IDs/checksum above are placeholders. The existing-record IDs must come from an authorized load, not from the UI. The backend owns final normalization, validation, permission checks and row assignment.

Required existing v1 semantics:

1. Keep `version`/`expectedVersion` as exact strings, including values above JavaScript's safe integer range. Load includes mode and view; save/preview response includes version, view and changedPaths. Do not convert production revision strings to the demo designer's numeric revision shape.
2. Preserve contractVersion=1, label, positive integer definitionVersion, checksum, sections, values, violations and rowFields. Fields contain code, label, type, required, writable, masked, maxLength, minimum/maximum, options, children and maxItems. Current field/view guards reject unknown keys and unsupported types. Do not silently add layout/help/type extensions to these objects; agree a versioned envelope or negotiated contract update first.
3. Omitted patch fields/rows retain values; null clears explicitly. Existing rows use `_id`, new rows omit it, and deletion uses `_id` plus `_delete:true`. The visual authoring demo's local occurrence IDs must not be passed as new server row IDs.
4. Provide authorized `rowFields` for every existing rendered collection occurrence, including nested paths. Missing per-row metadata fails closed. Filter hidden/masked values on the server and reject unauthorized writes even if the UI omitted them.
5. Preview is non-persisting and does not increment revision or consume durable row identities. Return a consistent normalized view and field/occurrence violations. A 422 save is not success and must not persist answers. The frontend retains permitted edits.
6. Successful save returns the normalized saved values and authoritative revision. Reauthorize at write time and enforce expected revision/checksum. A 409 or uncertain network outcome requires read/reconciliation. Current v1 has no durable replay receipt; frontend does not automatically retry writes.
7. Provide 401/403/404/409/422/429/5xx examples, bounded response sizes, cancellation/deadline behavior and a non-sensitive incident reference, currently consumed from `X-Sentinel-Reference`. Errors and logging must not leak another owner's values.

## 5. Decisions needed before mapping the visual design

| Topic | Concrete decision / backend deliverable |
| --- | --- |
| Presentation versus data type | TEXT currently renders as a text input in v1; it does not distinguish textarea/email/rich text. CHOICE does not carry radio/search/segmented presentation. Supply negotiated layout/control metadata preserving type semantics. |
| Time-only values | Designer time is a wall-clock time; v1 has DATE and DATETIME instants, no time-only type. Do not invent a date/timezone conversion. Define an explicit mapping or versioned capability and reject unsupported publication. |
| Boolean semantics | v1 required Boolean false is present. The current designer's required checkbox uses acceptance semantics, and its filled condition treats false as empty. Define presence versus must-be-true separately and require an explicit codec/migration decision. Do not silently change published rules. |
| Decimals | v1 supports bounded JSON numbers, not arbitrary decimal strings; frontend profile is at most 15 significant digits and safe integers. Exact currency/quantity precision needs an agreed new serialization capability before use. |
| Row limits and actions | v1 has maxItems, but not minimum row count or distinct create/delete permission metadata. Specify how minItems and action grants are resolved/enforced without overloading writable. |
| New-row errors | Agree deterministic correlation for validation errors on unsaved rows. Current UI does not send local UI keys to v1; server-generated preview IDs cannot reliably identify the local row. At present summary navigation falls back to the collection when no exact input path matches. Supply fixtures and a versioned correlation solution. |
| Dynamic visibility and defaults | Preserve persisted hidden values unless an explicit approved policy says otherwise; visibility is not authorization. Specify retain/clear/exclude and do-not-overwrite-user-edit default semantics, plus normalization order and missing-value behavior. |
| Translations | Authoring transports preserve tenant dictionaries; runtime returns labels for the requested authorized locale, or negotiated metadata for client resolution. Return stable localized error keys/arguments through the agreed error contract; labels and display text are never stored answer IDs. |
| Compatibility | Publish component/type/control capabilities and minimum renderer versions. Unsupported required controls must fail visibly and block incompatible publication/runtime; metadata-only updates must not bypass installed client capabilities. |

## 6. Backend work mapped to existing Jira stories

| Story | Deliverable expected by the frontend |
| --- | --- |
| PLIBRYBEND-194 / PLIBRYBEND-206 | Versioned JSON contracts, authenticated host route example, binding codec, request/response/error fixtures and explicit ready/pending capability matrix; attach updates to 206. |
| PLIBRYBEND-172 / PLIBRYBEND-184 | Authoring/runtime component and layout metadata; stable fragments/IDs, renderer compatibility and immutable resolved publication snapshots. |
| PLIBRYBEND-178 | Typed authoritative rules, normalization, dependency cycle/depth limits, cross-client fixtures, conditional required/read-only/visibility and row calculations; resolve Boolean/time/decimal gaps above. |
| PLIBRYBEND-174 / PLIBRYBEND-176 | Staged CSV/XLSX jobs, mapping/types/limits, row errors/progress, cancel/resume/retry, atomic revision activation, insert/upsert policy; authorized cursor-based lookups with all parent IDs, search, scope, pinned revisions and inactive historical labels. |
| PLIBRYBEND-180 / PLIBRYBEND-182 | Entity registry; trusted owner/context resolution; tenant/application/legal-entity/business/branch assignments, triggers/effective dates/occurrences; registered domain commands and mandatory-form enforcement. |
| PLIBRYBEND-186 | Exact-revision document reads/drafts/submission/history, stable row identities, concurrency and durable idempotency where supported, amendments preserving history, owner lifecycle and server validation transactionality. |
| PLIBRYBEND-196 | Shared recovery adapter with tenant/app/actor/scope/owner/form/version/occurrence identity, retention/exclusions, stale draft handling and permission revocation. Recoverable draft storage is not a confirmed business save. |
| PLIBRYBEND-188 / PLIBRYBEND-190 / PLIBRYBEND-198 | Optional private attachment processing/download/version references, workflow/attestation commands, exact signed revision and amendments, capture/device/domain capabilities and unsupported fallbacks. These frontend areas are also incomplete; this is not a frontend-ready claim. |
| PLIBRYBEND-192 / PLIBRYBEND-200 / PLIBRYBEND-202 | Authorized worklist/filter/sort/cursor/count contracts, repeated-occurrence query correlation, export/print/report jobs and operational recovery permissions. |
| PLIBRYBEND-44 | Real host/PostgreSQL acceptance, tenant/application/branch isolation, owner foreign keys, transaction rollback, migrations and declared performance/restore evidence. |

Reuse existing DCP/Application/Tenancy/Security/Storage/Workflow/Attestation families. All definitions, datasets and answer metadata remain tenant-owned. No parallel form database, standalone form service, automatic endpoints, unrestricted SQL/URLs or tenant executable code. Optional infrastructure must remain optional.

## 7. Acceptance package requested from the backend session

For each contract group, provide an exact versioned schema/example, actual-engine valid/invalid fixtures, endpoint ownership and authentication instructions, permission semantics, limits, enabled/disabled capability examples, and a list of deferred behavior. Update PLIBRYBEND-194 readiness and attach the bundle to PLIBRYBEND-206. Existing backend package attachment 10000 remains the accepted v1 starting point, not full enterprise acceptance.

Mandatory fixture scenarios:

- India -> Kerala/Karnataka; UAE -> Abu Dhabi/Dubai; reject forged country/state; multi-parent intersection; stale lookup response/cursor and inactive historical selection.
- Integer 0/10 valid, -1/11/fraction invalid; trim-uppercase distinct from uppercase-only; false required Boolean present versus explicit acceptance validation.
- Repeated row add/edit/delete, nested row permission denial, minimum/maximum, duplicate/unknown IDs, unsaved-row error correlation and per-occurrence calculations.
- Preview performs no durable write; 422 preserves stored revision/values; save returns normalized values; concurrent/stale edits and duplicate/uncertain requests have deterministic documented outcomes.
- Old documents and drafts keep schema/dataset meaning after publication; translations do not change IDs; incompatible renderer/control metadata is rejected.
- Cross-tenant/application/branch/actor/owner denial across API/cache/drafts/history/files/export; scope claims are revalidated by the host.
- Mandatory domain transition rolls back together with the form when using the same database transaction; external-service ownership has an explicit non-atomic protocol.

Frontend references at the application commit: `desktop-clients/packages/erp-config/src/dcp-{designer,rules,catalog,lifecycle,runtime}.ts`, `desktop-clients/packages/erp-data/src/dcp-{host,runtime}.ts`, the `erp-screens/src/dcp-designer/` renderer and `erp-data/src/fixtures/dcp-v1/`. The integration example remains in the [feature guide](../features/dcp-designer.md). Latest deployment evidence is in the [release follow-up](../releases/unreleased/dcp-frontend-deployment-2026-09-11.md).
