# Desktop worklists, views and form rules

Updated 7 September 2026. Shared frontend behavior for web and desktop; the API
in this repository is a persisted demonstration adapter, not a production ERP backend.

## Worklists

Search, filters, sort, page size and page number are sent to `POST /worklists/search`.
The service returns one page and the full matching count. Refresh queries the service
again. Superseded requests are cancelled and stale responses ignored. An unavailable
service shows an error with retry; generated rows do not masquerade as live results.
Saved form records are included in searches. Selection applies to the current page;
changing the query, order or page clears it. Export/print cover the current page or
explicit selection, and describe that scope in the UI.

`POST /worklists/archive` returns one `{id, ok, error?}` result per selected record.
Acknowledged records disappear on refresh; failures stay visible and selected for
retry. The demo persists archive membership by tenant, product and page. Repeating
an archive is idempotent. Unknown IDs and locked rows fail individually. This does
not implement production deletion, retention policy, audit or workflow approval.
Inline cell edits remain a demo session store; production adapters must reconcile
these with versioned record saves rather than maintain competing data stores.

## Personal views

`POST /personal-views` supports list/create/rename/delete/default. A view includes
filters, visible column keys, sort and page size, and belongs to an account, tenant,
product and page. Updates require the current version; stale windows receive 409
and can reload. Only one view is default per scope. A default applies on opening a
list unless an explicit shared view or intervening interaction takes precedence.
Deleting a view leaves its records untouched. The existing opaque shared-filter
link remains separate from personal layouts.

The demo stores these layouts in `workspaces.json`, including filter values. A real
service needs the product's access, retention and encryption controls. Limits are
50 views per scope and 80 characters per name. No filter values are put in URLs.

## Forms

`FormFieldSchema` supports `visibleWhen`, `requiredWhen`, `optionsByField`, `min`,
`max` and `notBefore`. Shared rules determine visibility, dependent options and
validation. Changing a parent clears an invalid dependent selection. Hidden values
are retained for toggling back, but hidden fields do not block validation.

Customer country/state and credit-hold notes demonstrate the rules. Geographic
options are illustrative; replace them with the product's reference-data adapter.
Generic effective dates demonstrate cross-field validation. The demo record API
validates registered form schemas on save/create and returns 422 with `fieldErrors`.
Drafts may be incomplete. Custom product schemas require registration in their
service adapter. Errors attach to controls, open the affected section and permit
correction. Empty numeric fields remain empty rather than turning into zero.

## Desktop validation

The workflow browser suite covers paging, refresh, partial archive failures,
personal view lifecycle and default restoration, nested modal focus, split
worklist/form panes, and dependent/conditional fields. It audits the worklist in
Nexora, Midnight and High Contrast with axe. This is targeted coverage, not a claim
that every application screen has been checked in every theme or native OS.

Help is in the header so it cannot cover pagination. Modal Escape/Tab behavior
belongs to the top dialog. Document tabs support Arrow/Home/End navigation and
Delete to close; the active document also has a keyboard-accessible close button.
Search clear has an accessible name and form controls expose invalid states.

Run fixtures in isolation:

```sh
NEXORA_DATA_DIR=/tmp/nexora-workflows PORT=3330 node ../dummy-api/server.mjs
# In a second terminal:
VITE_API_URL=http://localhost:3330 npm run dev -w desktop -- --port 3109
# With Playwright installed:
node e2e/workflows.mjs
node --test ../dummy-api/*test.mjs
```

The browser suite intentionally creates views and archives demo records. Do not
point it at a shared deployment. Windows/macOS native and physical multi-monitor
validation, complete theme sweeps and RTL checks remain separate work.

## Release validation

Activated release `20260907172055053-faace50b` with its matching API on 7 September
2026. Both public hosts passed release identity, authenticated worklist and
personal-view reads, header help and API health checks with no browser runtime
errors. Public smoke checks did not create, modify or archive records.

Validation: 1,320 frontend tests across 70 files, 12 API tests, all package type
checks, structural verification, and isolated production builds/assets for both
shells. The targeted Chromium workflow suite passed all scenarios above.
The previous frontend release is `20260907163215381-b9dabe79`; a restricted API
source/data backup is retained under `.deploy/api-backups/20260907172055053-faace50b`.
