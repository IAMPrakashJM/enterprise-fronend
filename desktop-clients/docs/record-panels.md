# Reusable record panels

Attachments, comments, related records and recent activity are shared by the
record page wrapper in both shells. They save independently of the form. New
records must first receive a saved identity; previews and lists do not load panels.
The public component is `RecordPanelsPanel({pageId, recordId})`.

## Services and identity

`ProductServices.panels` accepts a `RecordPanelsAdapter`. When omitted, the shared
HTTP adapter uses the product's `request` transport and `POST /record-panels`.
Every request includes `scope: [productId, pageId, recordId]`; the demo service adds
the authenticated tenant. The demo validates source and related target identities
against its registered seed/saved records. Custom product catalogs must supply
an adapter that resolves their own identities and permissions.

The adapter provides `load(scope, signal)`, `change(scope, change, operationId)`
and `download(scope, attachmentId)`. List/change responses contain attachments,
comments, related records, activity and optional `permissions.write`. Product edit
permissions and returned service permissions both govern mutation controls.
The demo permits panel changes for finance-manager and enterprise-admin, and reads
for other authenticated roles. Only a comment's author or an administrator may
remove it. These demo roles are not a production authorization policy.

## Behavior

- Attachments: select a file (1 byte–2 MB), upload, authenticated download and
  confirmed removal. List responses omit file bytes. Downloads use an octet-stream
  blob rather than rendering supplied HTML/SVG. The demo stores base64 data in a
  private JSON file, limited to 20 attachments per record.
- Comments: plain text up to 4,000 characters, attributed author/time, removal
  confirmation and refresh. The demo caps a record at 200 comments.
- Related records: choose a configured page, enter an existing record ID and label,
  then link, open through the navigation port or remove the link. Self-links and
  duplicate links are rejected. Links stay within the product; unavailable pages
  cannot be opened. The demo caps a record at 100 links.
- Activity: server-authored attribution/time for successful panel changes, newest
  first, up to 500 entries. It is a recent panel history, not a complete record-save
  audit, tamper-proof compliance log or notification stream.

Mutations retain an operation ID across retries after unknown outcomes. A retry
cannot duplicate an acknowledged change. Definitive 4xx rejections preserve input
and allow correction. Retry receipts retain the last 500 operations per record.
An unmounted or changed record ignores stale responses. Refresh errors preserve
visible data instead of presenting a false empty result.

Comment/link inputs and pending operations survive desktop tab suspension in the
workspace's in-memory draft store. They are not durable recovery drafts; closing
the document or reloading before submission can discard unposted input. A form's
Save/Discard does not submit/remove panel content. Panel changes do not mark the
main form saved or clean.

## Production integration

Replace demo storage with an authorized file/object and record service before
using real application data. Upload scanning, signed object URLs, resumable/chunked
transfers, retention, download auditing, durable unsent-comment recovery and full
record activity feeds are separate integrations. Proxy upload limits may be lower
than the demo limit; oversized/non-JSON errors are shown as service failures.

## Validation

`npm run test:panels-api` covers persistence, download bytes, tenancy/product
isolation, ownership, read-only access, identity lookup, size limits and idempotency.
Component tests cover unsaved records, retry preservation, correctable rejection
and stale responses after switching records. `npm run e2e:panels` writes fixtures
against an isolated API and checks the desktop workflow plus panel accessibility.
Do not run the fixture browser suite against a shared deployment.


## Release validation

Activated release `20260908004731762-bb1d1b06` with the matching demo API on
8 September 2026. Both public hosts passed release identity, authenticated record
panel/worklist reads and API health with no browser runtime errors. Public checks
made no record or attachment mutations. The frontend rollback release is
`20260908002211440-aa85e69e`; the prior API source and data are backed up under
`.deploy/api-backups/20260908004731762-bb1d1b06` with restricted directory access.

Validation: 1,329 frontend tests across 73 files, 14 API tests, package typechecking,
structural checks and isolated production builds/assets for both shells. Chromium
verified attachment byte fidelity/removal, comments after reload, related navigation,
activity and panel accessibility against isolated fixture data.
