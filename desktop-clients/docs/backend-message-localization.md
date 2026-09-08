# Backend message localization

## Contract

The API returns language-neutral message keys and parameters alongside its
existing readable English fields. It does not translate customer names, comments,
record IDs, configured stage names or other business data.

```json
{
  "message": "Submitted for Finance review",
  "messageKey": "api.approval.submitted",
  "messageValues": { "stage": "Finance review" }
}
```

An HTTP error retains its existing status and `error` field and adds an
`errorMessage` object containing `messageKey` and `messageValues`. Partial approval
results use the same envelope per failed record. Record-panel activity retains
`detail` and adds message metadata. This is backward compatible with older clients.

`dummy-api/config/api-messages.json` maps legacy static messages to stable catalog
keys. `dummy-api/message-descriptors.mjs` adds metadata at the HTTP response
boundary, so old persisted notifications and activity work without rewriting
records. Dynamic approval notices pass stage names as parameters.

The shared `en.json`, `ar.json`, `hi.json` and `ml.json` catalogs contain the text.
Product catalogs can override the same keys. Keep assigned keys when wording
changes; do not generate a new identifier merely to correct a translation.

## Frontend integration

`localizeApiMessage(descriptor, fallback, t)` validates the descriptor and resolves
it through the selected language's catalog. It retains a readable fallback for
unknown product keys or malformed descriptors. Interpolated values are not
recursively interpreted as message keys or placeholders.

`useProductRequest` localizes JSON HTTP error text for the existing record,
import, approval and panel adapters. It preserves status codes, headers and other
response fields. Its stable request identity does not remount record editors when
the language changes; subsequent errors use the current translator. Already
captured transient error strings update on the next request. Notifications and
activity resolve their descriptors during rendering and react to language changes.

Legacy consumers can still display `error` or translate a known English source
message. Unknown provider diagnostics use `api.error.unknown` with the original
`detail`, so their text is not silently lost or misrepresented as fully translated.
Pre-authentication sign-in still uses the English fallback.

For another application, return the same metadata through its ProductServices
adapter and register its keys in the product catalogs. Use placeholders for
variable record/stage names. Return unknown diagnostics separately from stable
user-facing messages where possible. Backend job messages should use this same
contract when a report delivery service is integrated.

## Checks

- `npm run verify:localization`: catalogs, placeholders, static UI copy, and all
  125 audited literal HTTP errors. Startup configuration-loader exceptions are
  diagnostic failures and excluded from the HTTP copy check.
- `node --test dummy-api/message-descriptors.test.mjs`: compatibility, interpolation
  metadata, old activity, unknown diagnostics and catalog coverage.
- `npm run e2e:backend-messages`: actual API error/notification/activity descriptors
  rendered in all four languages, with unchanged comment content. Isolated API only.

The audit covers literal HTTP errors; it does not promise machine translation of
arbitrary errors returned by external providers. No translation service or user
content is sent to a third party.
