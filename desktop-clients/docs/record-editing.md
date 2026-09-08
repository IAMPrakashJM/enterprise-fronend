# Record saving and recovery

Implemented 7 September 2026 for the desktop-first shared frontend.

## User behavior

Schema-driven forms, billing and consultation use the same editor controller.
It loads the saved record and any recovery draft before enabling editing. The
user chooses **Restore draft** or **Discard recovery draft** when recovery exists.
A restored draft remains an unsaved change to the record.

Edits queue a recovery write after 800 ms without another edit. **Save draft**
requests that write immediately, including incomplete forms. **Save**, **Save
invoice** and **Save consultation** commit a versioned record. Forms and invoices
check their required inputs before committing; consultations may be saved while
incomplete because saving documentation does not sign it. Invoice posting,
clinical signing and other business workflows require a product-specific service.

The interface distinguishes pending recovery, acknowledged recovery, saving,
saved records and failures. Recovery after refresh/restart covers acknowledged
service drafts. Changes made while offline or in the debounce/request interval
are not crash-protected. Record content is never stored in localStorage,
preferences or workspace restore metadata.

A successful save acknowledges only the submitted values. Typing during a save
keeps subsequent edits dirty. Retry resends the original operation identity, so a
lost response does not create the record twice. Definitive validation/size
rejections allow correcting the inputs and submitting a new operation. A version conflict stops writes:
review the latest saved values and any competing recovery draft, then explicitly
keep your edits for a subsequent save or use the saved version. There is no
silent overwrite or automatic conflict merge.

Drafts are scoped to account + tenant + product + record. Saved records are shared
within the tenant/product. Native windows use the same service; concurrent draft
writes are version checked. Suspended desktop screens retain their controller.
Closing with discard waits for an in-flight write before removing the service
draft. If removal fails or conflicts, a notice explains that recovery remains.
Logout immediately removes the workspace; an expired session cannot send further
writes. Already acknowledged drafts remain recoverable after signing in again.

New schema records receive UUID identities on creation, separate from their
editable business codes. The source new-record draft is cleared atomically.
Worklists load saved/new records over their existing preview rows and refresh when
focused. A failed list read has a visible retry action. The demo worklist's
server-side search/export workflows remain separate contracts.

Billing retains document fields, customer/contact edits, tax selections and line
items across tabs and reloads; its invoice preview uses current document fields.
Payments and audit history remain preview fixtures. Consultation retains its
composition/wizard position, narrative, selected prompts, codes, orders, E/M
inputs and checkboxes. Audio buffers and AI replies are transient.

## Product integration

`@pepbits/erp-data` exports `RecordAdapter`, `RecordEditor`, `RecordConflict` and
`createHttpRecordAdapter`. The transport is independent of React and the shell.
`@pepbits/erp-screens` exports `RecordAdapterProvider`, `useRecordEditor`,
`useRecordField` and `RecordSaveStatus`.

The default uses the authenticated API configured for each shell. A product can
wrap its screens in `<RecordAdapterProvider value={adapter}>` to replace it.
Implement `load`, `list`, `create`, `save`, `draft` and `discard`. Enforce
authorization, validation and version checks in your service. Return compatible
value shapes, monotonically increasing versions and ISO timestamps; incompatible
saved shapes are rejected without replacing the editor. Evolve schemas through
an explicit migration in the product adapter.

HTTP contract (all routes require a bearer session):

| Request | Result |
| --- | --- |
| `GET /records/:key` | `{ record, draft, draftVersion }` |
| `GET /records?scope=...` | `{ records: [{ key, record }] }` |
| `PUT /records/:key` | Save `{ values, version, draftVersion, operationId }` |
| `PUT /records/:key/create` | Create `{ values, version: 0, draftVersion, destinationKey, operationId }`; return `recordKey` |
| `PUT /records/:key/draft` | Store `{ values, baseVersion, version, operationId }`; return draft snapshot |
| `PUT /records/:key/discard` | Clear `{ version, operationId }`; return 204 |

Keys encode `[productId, editorType:pageId:recordId]`. List scope encodes
`[productId, editorType:pageId:]`. A record snapshot is
`{ values, version, savedAt }`; a draft also has `baseVersion`. Draft deletion
retains a revision tombstone so late requests cannot recreate discarded drafts.
HTTP 409 indicates a conflict. Retries must keep the original operation ID and
payload. A repeated ID with a different payload is rejected.

The zero-dependency demo API persists atomic JSON replacements at
`dummy-api/data/records.json` (override the directory with `RECORD_DATA_DIR`). Its
existing demo authentication is not a production authorization model. It supports
one server process, limits write bodies to 256 KiB and retains the latest 200
idempotency results per record. Production implementations need transactional
storage, role/record permissions, retention rules and their own migration policy.
The compatible API and frontend release `20260907163215381-b9dabe79` were activated
on 7 September 2026. Both public hosts passed authenticated record reads, release
identity, HTML/assets and API health checks. Public browser checks performed no
record writes. The API restart invalidated previous demo login sessions.
The previous frontend release and an API data/source backup were retained.

## Verification

The broader regression passed 550 assertions across 26 files, including the
workspace, session, forms, worklists and record controllers. Nine persistence and
HTTP integration tests passed. The focused controller/form/specialized editor
suite passed 16 tests. Both production builds and the structural verification
suite passed. Browser checks passed recovery, discard, creation and worklist
discovery against an isolated service. These are frontend/demo-service checks;
no production business workflow or physical native-device audit is implied.

```bash
# Node 24, from repository root
node --test dummy-api/record-store.test.mjs dummy-api/records-http.test.mjs
npm --prefix desktop-clients test -- packages/erp-data/src/records.test.ts \
  packages/erp-screens/src/forms/dynamic-record-form.test.tsx \
  packages/erp-screens/src/records/specialized-editors.test.tsx
```

The browser regression runs separately from the general browser suite. Start an
isolated demo API and desktop shell; it creates demo records in that test store:

```bash
PORT=3330 RECORD_DATA_DIR=/tmp/nexora-record-test node dummy-api/server.mjs
# Another terminal, from desktop-clients/apps/desktop:
VITE_API_URL=http://localhost:3330 npm run dev -- --port 3109 --strictPort
# From desktop-clients, with Playwright available:
npm run e2e:records
```

Override `E2E_DESKTOP` and `E2E_API` together if needed. `PLAYWRIGHT_PATH` accepts
an existing Playwright installation. The browser test covers refresh recovery,
explicit discard, actual record creation and worklist discovery at 1440 × 900.
Preferences are stubbed to avoid changing the demo account's layout settings.
