# DCP visual template designer

Feature: DCP-01. This first frontend increment is a usable visual designer at **Library → Page Library → DCP Visual Designer** (`/library/dcp-designer`). Backend DCP publication and production entity storage are not connected.

## User workflow

1. Select a section. Click a palette item to add it there, or drag its handle onto a section. Supported types are text, long text, email, number, date, time, dropdown and checkbox.
2. Add sections. Select a field or section to edit properties. Stable IDs are generated once and remain read-only when labels change.
3. Drag handles reorder fields/sections. Keyboard drag uses Space, arrow keys and Escape; explicit Move up/down buttons provide another keyboard path. Field settings can move a field to another section.
4. Edit labels and required state, set a number minimum, or enter dropdown options as one `value|label` per line. Values remain strings, including leading zeros. Duplicate field creates a new ID. A section must be empty before removal.
5. Open Live preview to fill the same shared TemplateFields controls used by the existing page engines. Validate preview checks required fields, email, number minimum and selected-option membership. Preview answers are temporary and are never sent as business records.
6. Save design draft persists through the demo API. Open saved design restores it. Unsaved changes require explicit discard before switching; closing the tab uses the browser's unsaved-change prompt.

## Preferences, authorization and recovery

Shared controls receive effective preferences through PresentationProvider. Theme, density, font scales, radius and language follow the host and tenant locks. No independent shell, preference store or browser draft store is introduced. English, Arabic, Hindi and Malayalam framework labels and help are supplied by canonical catalogs. User-authored labels are literal strings in this first increment; versioned tenant label translations remain future integration work.

The demo API checks navigation access and requires the enterprise administrator role for writes. Designs are scoped by authenticated tenant, application and user. This is actor-owned draft storage; organizational sharing/reviewer/publisher permissions remain backend integration work.

Failed saves retain edits. Retry uses the same operation ID; edits produce a new operation. Expected revisions reject stale writes. Open the latest saved design after reviewing unsaved changes to resolve a conflict. Only the most recent 100 operation receipts per scope are retained; this is a bounded demo retry window, not permanent production deduplication.

## Architecture and public integration

- `erp-config`: DesignerDefinition reuses existing TemplateSection and TemplateField contracts, approved type list, bounded schema validation and preview checks.
- `erp-data`: DesignerAdapter and createDesignerAdapter perform authenticated POST requests and runtime response validation.
- `erp-screens`: DcpDesignerWorkspace composes palette, sortable canvas, property panels and existing TemplateFields preview.
- `ops-ui`: shared controls remain the visual foundation. Button now accepts a React 19 ref so drag handles can restore keyboard focus.
- `dnd-kit`: pinned core/sortable/utilities dependencies provide drag mechanics. No alternate form framework is installed.
- `dummy-api`: `/dcp-designer` supplies the initial configuration and capability types, reads/writes scoped CSV snapshots, authorizes saves and checks revisions/operation IDs. It is synthetic demonstration storage only.

Inject DesignerAdapter, authenticated scopeKey and the existing PreferenceHost into DcpDesignerWorkspace. A public TypeScript example is available in List of pages. The frontend never connects to PostgreSQL or imports Java libraries.

This draft definition is a frontend template contract, **not** the backend DCP JSON codec. The backend already has Form/Section/Field models, expressions and authoring/release services. A host adapter must explicitly map supported frontend types and stable IDs onto that model, enforce authority and reject unsupported conversion. No production DCP tables, migration runner or alternative persistence layer are introduced.

## Validation and limits

A design needs a nonblank title, at least one section, unique bounded IDs, nonblank labels and supported types. Maximum: 20 sections, 100 fields, 50 options per dropdown, 100 saved designs per user/application/tenant. Option values must be unique; empty dropdown lists and nonfinite minimums fail schema validation. Requests are bounded at the API. Schema validation runs on the server and returned JSON is checked at runtime by the client.

The preview uses the existing numeric TemplateField semantics. Exact decimal serialization, full rule AST parity, calculated values, dependencies, repeating occurrences and backend normalization are not claimed here.

## Remaining scope

Production DCP conversion and host endpoints; immutable review/publish/retire lifecycle; dataset CSV/XLSX import and atomic activation; dependent sources; rule authoring; entity bindings; shared scoped draft recovery beyond API design drafts; files/attestation; advanced component packs; responsive layout authoring and arbitrary column layouts; database/native/device/performance acceptance. Existing preview layout uses the shared two-column field layout.

The broad [enterprise scope and reuse assessment](../development/README-DCP-ENTERPRISE-FORM-SCOPE.md) remains the roadmap. This increment implements visual composition and draft persistence only. See [delivery evidence](../releases/unreleased/dcp-designer-2026-09-11.md).
