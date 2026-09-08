# Desktop frontend design and development plan

Updated 7 September 2026. This is a reusable frontend foundation for multiple SaaS
products, delivered through desktop browsers and Tauri. Mobile support is optional.
The existing Nexora application is the first demonstration product.

## Design direction

Keep persistent navigation, dense worklists, document tabs, keyboard shortcuts,
optional split panes and optional native windows. Use semantic theme tokens and
existing components. Prioritize clear page identity, visible record status,
predictable actions and recovery from failures.

Check full-window layouts at 1280×800, 1440×900 and 1920×1080, plus resized windows,
split panes, comfortable/compact density and larger text. A narrow desktop pane
may scroll its table or collapse secondary details; essential actions must remain
reachable. RTL is an acceptance requirement for products that enable RTL locales.

## 1. Reliable desktop interactions — in progress

First development batch implemented in source:

- [x] Dirty-state reports target the owning document, including background saves.
- [x] Alt+S runs only in the active form; repeated presses do not duplicate saves.
- [x] New records show “Not saved”; save time appears only after completion.
- [x] Pending simulated saves are cancelled when changing records or unmounting.
- [x] Dialog autofocus preserves the opening control for focus return on close.

Remaining work in this phase:

- [x] Scope AI source publication and reads to each document and record.
- [x] Preserve schema-driven form drafts across suspension and define restore/discard behavior.
- [x] Adopt durable record/draft adapters in forms, billing and consultation.
- [x] Close detached windows and invalidate their sessions on logout (native-port tests and Linux native WebDriver lifecycle passed; Windows/macOS checks pending).
- [x] Prevent failed preference loads from triggering default-value writes.
- [x] Give page headings priority over subtitles; verified at 1280, 1440 and 1920px in both browser shells.
- [x] Check nested dialog focus, document-tab keys and split worklist/form panes; broader screen coverage remains.

Acceptance: two records can be edited independently; saving one cannot clean the
other. Background documents cannot handle active-document shortcuts. Switching,
closing and logging out have explicit, tested draft behavior. Core actions remain
usable in the desktop sizes above.

The shared record adapter now implements durable service drafts, acknowledged
record saves, retry and conflict review for forms, billing and consultation.
See [record-editing.md](record-editing.md); production workflow adapters remain
separate integration work.

## 2. Product configuration and service contracts — started

Implemented the initial product-profile boundary: branded sidebar, enabled module
switcher, scoped command search/help/page rendering and product-aware landing.
Both apps consume one composition choice; Nexora remains the default. A Ledger
finance-only profile is included and tested. Shell utilities remain shared.
See [product-profiles.md](product-profiles.md) for setup and current limits.


- Introduce a product definition for branding, modules, pages, capabilities,
  defaults, help and document identity. Keep Nexora as the default profile.
- Add replaceable records, preferences, reference-data, notification and file
  contracts incrementally; reuse existing navigation/session boundaries.
- Provide deterministic mock success, latency, validation, denied, failure and
  conflict responses. Define cancellation and stale-response behavior.
- Apply capability rules consistently to navigation, commands and record actions.
- Add a second small product profile proving the extension points.

Acceptance: switch product branding/navigation and record data without editing
shared shell or screen implementations. A mock save can succeed, fail and retry
without discarding edits. UI permissions communicate backend decisions.

## 3. Complete everyday worklists and forms

- Finish personal saved views: create, restore, rename, delete and default.
  Integrate existing shared-view links into the same user workflow.
- Wire refresh and bulk actions through data contracts; report partial failures.
- Add explicit server paging/sort/filter/count and selection semantics.
- Add conditional fields, dependent lookups, cross-field validation, repeatable
  sections and mapped field errors. Give Save draft distinct behavior.
- Reuse record summary, details, related records, attachments, comments and
  activity panels. Synchronize inbox and header notification counts.

Acceptance: configured views survive reopening; obsolete responses never replace
new results; selections have clear scope; errors preserve user input; all visible
actions have implemented behavior or an explicit unavailable state.

## 4. Reusable workflows and distribution

- Build import mapping, validation preview, confirmation and result reporting.
- Add attachment progress/retry and background-task feedback through adapters.
- Extend the existing Library with component states and desktop examples.
- Measure startup and lazy-load optional domain modules where useful.
- Supply a product starter, configuration examples and version/upgrade guidance.

Acceptance: a second product consumes the shared foundation without copied
framework internals. Its developer can inspect supported states in the Library
and replace mocks using documented contracts.

## Validation and release

Use targeted regression tests for ownership, shortcuts, asynchronous transitions
and focus behavior, followed by workspace typechecking. Before releasing a batch,
run relevant browser journeys and builds through isolated deployment preparation.
Keep deployment activation separate from source implementation status.

Release `20260907152207170-63028a2b` is active on both public shells.
The workspace/form batch, initial product profiles and reliability fixes are included.

Validation: 93 targeted tests passed; package and desktop typechecks passed;
isolated Next and Vite production builds, parity and deployment checks passed.
Browser checks covered both shells at 1280, 1440 and 1920px, heading visibility,
command-palette focus restoration and the web new-record state. No page errors
were observed in those journeys. Public HTTPS release identity, HTML, assets and
API health checks passed after activation. The previous release remains available
for rollback.

These are selected checks, not a complete native Tauri or split-pane audit.
The broader pre-existing suite has known export cleanup errors; those remain
tracked separately rather than being treated as a clean baseline.

The deployed reliability batch is documented in [desktop-reliability.md](desktop-reliability.md).

The worklist/views/form-rules batch is deployed. See [worklist-workflows.md](worklist-workflows.md) for behavior, API contracts and validation.


## Product starter batch — 8 September 2026

Implemented application-owned `products/active.ts`, safe product generation,
page selection/labels, role-filtered navigation and direct action checks, login
branding, and replaceable record/worklist transport composition in both shells.
Ledger browser checks cover all three demo roles. See [product-profiles.md](product-profiles.md)
for setup, adapter boundaries and upgrade guidance. Custom module/schema registration,
auth/preferences/notification/file adapters and independent browser storage namespaces
remain follow-up work.


## Record panel batch — 8 September 2026

Reusable attachments, comments, related-record links and recent panel activity are
implemented through `ProductServices.panels` and the shared record wrapper. The
matching API/frontend release is deployed. See [record-panels.md](record-panels.md)
for validation and boundaries: production file storage, durable unsent input and
full record audit feeds remain adapter/integration work.

## CSV import batch — 8 September 2026

Implemented the five-step Customer Master CSV import workflow with reusable parsing,
schema validation and replaceable `ProductServices.imports`. Durable job receipts,
per-row results and deterministic record IDs support partial failures and resume.
See [csv-import.md](csv-import.md) for behavior, limits and verification.

Release `20260908011625901-fddb7b51` is active on both public shells with the
updated API. Public authenticated worklist/import-dialog and release identity
checks passed without record writes. API restart requires a fresh sign-in.
Previous frontend release `20260908004731762-bb1d1b06` and a private API/data
backup are retained for rollback.

## Approval workflow batch — 8 September 2026

Implemented saved-record submission, administrator-configured stages/roles,
commented decisions, an inbox with filters and bulk actions, persistent history
and requester notices. See [approvals.md](approvals.md) for scope and boundaries.

Approval release `20260908020453305-9fbd513a` is active on both shells. Full suite,
targeted approval tests, API tests, typechecks, repository verification, production
builds and the isolated three-role browser journey passed; see `approvals.md`.
