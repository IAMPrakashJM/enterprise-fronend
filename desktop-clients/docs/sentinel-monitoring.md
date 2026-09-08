# Sentinel: local demo error monitoring

Sentinel reports sanitized application failures to the existing dummy API. It does not use an external monitoring provider or an AI service. This implementation is local and has not been committed, pushed or deployed.

## What is captured

| Capture point | Behavior |
| --- | --- |
| JavaScript errors | Reports a fixed runtime-error code, page and available line/column |
| Unhandled promise rejections | Reports a fixed code; never reads the rejection reason |
| React rendering failures | Shows a localized Retry/Reload fallback with a searchable reference |
| Shared authenticated requests | Reports network failures, HTTP 5xx/429, and a diagnostic when a request exceeds 15 seconds |
| Custom screen request adapters | Report failed requests through the shared product service wrapper |
| Import, approval and selected worklist operations | Report caught failures without exception text |
| Other handled operations | Developers call the exported reporting helper at their catch boundary |
| Native Rust panics | Writes a fixed marker and emits a native event; a pending marker can be reported after the next authenticated startup |

The request-duration diagnostic does not cancel or retry the business operation. A slow request might still succeed. Caller cancellations are not reported as network failures. Expected field-level validation does not automatically become a global incident, although a caught import-parser failure is recorded as an operation failure.

No single listener catches every possible failure. Capture starts with the authenticated shell; errors that prevent JavaScript or the shell from starting, OS kills, segmentation faults, and failures before native setup are outside this collector. The explicit React reporting bus buffers a small number of render signals until the collector attaches.

## Data contract and privacy

An event contains only:

- Client-generated diagnostic reference.
- Fixed kind and code from the allowlist.
- Registered page ID and up to eight recent registered page IDs.
- Compiled release identifier and web/native platform.
- Optional HTTP status and line/column numbers.

The server validates and reconstructs this allowlist, rejecting unknown pages and dropping undeclared fields. It derives tenant/user identity from authentication. Raw exception messages, stack strings, filenames/URLs, request and response bodies, form values, patient data, cookies and credentials are not uploaded. Full stack/source-map analysis and browser-version diagnostics are not included in this first implementation.

A rendering fallback's reference is a client event ID. Error Monitor can search it to locate the server-generated incident ID. The backend keeps delivery receipts so resending the same event does not increment the occurrence count again.

## User and administrator flow

Users keep existing localized workflow error messages. A rendering failure replaces the affected shell with a localized recovery screen. Retry remounts the failed content; Reload restarts the page. These actions do not claim to preserve unsaved component state.

The demo `admin` account has the explicit backend permission `monitoring:manage`. Open **Error Monitor** through the application menu or command palette. Normal users can submit sanitized diagnostics but cannot list incidents or change their status.

1. Filter by page, status, or the exact user-facing reference.
2. Open an incident to inspect its release/platform, safe code, coordinates and recent page sequence.
3. Set its status to New, Investigating or Resolved.
4. Refresh or reopen details to see updated history. An occurrence after resolution reopens the incident.

List and detail endpoints are tenant/product scoped. Status updates include an optimistic revision: a stale update returns 409 instead of overwriting another administrator's work.

## Demo API

All endpoints use the authenticated product request adapter and `X-Product-Id`.

```text
POST  /monitoring/events
GET   /monitoring/incidents?status=new&pageId=preferences&reference=<event-uuid>&offset=0
GET   /monitoring/incidents/<incident-uuid>
PATCH /monitoring/incidents/<incident-uuid>
```

The collector sends batches of at most 10 events:

```json
{
  "events": [{
    "id": "11111111-1111-4111-8111-111111111111",
    "kind": "render",
    "code": "render-error",
    "pageId": "preferences",
    "release": "2026-09-08-documentation",
    "platform": "web",
    "breadcrumbs": ["finance-dashboard", "preferences"]
  }]
}
```

The 202 response contains event-to-incident references. Incidents group by safe code, kind, page, release, platform, status and coordinates. These groups identify similar failure locations, not proven root causes.

A status update is:

```json
{ "status": "investigating", "revision": 1 }
```

Relevant statuses: 400 invalid input, 401 unauthenticated, 403 missing management permission, 404 unavailable scoped incident, 409 stale revision, 429 collection rate limit. Lists are paginated at 50 rows. The API's body-size limit also applies.

## Delivery, limits and storage

- Queue: at most 50 pending events in memory; repeated matching pending failures are suppressed.
- Upload: every five seconds and on reconnect; one batch in flight at a time.
- Upload timeout: ten seconds. Failed uploads back off exponentially up to sixty seconds.
- Rate limit: sixty submitted events per authenticated user/tenant per minute, across products.
- No business-operation retry is performed by Sentinel.
- Monitoring requests are excluded from request-error instrumentation. A monitoring-only 401 stops reporting without signing the user out. Delivery/capture failures are swallowed so monitoring cannot recursively break the app.
- Queues stop and clear on session/shell teardown. Browser offline queues are not durable across reloads, and pending browser events can be lost on a crash or closed tab.
- Storage: `dummy-api/data/monitoring.sqlite`, with WAL transactions and file mode 0600.
- Incidents, receipts and history older than thirty days are pruned during ingestion. Duplicate receipt protection is therefore bounded by this retention window.

Back up SQLite with its backup facilities or stop the API before copying the data directory. Production retention, storage limits and operator access policies remain integration choices.

## Integrating another product or operation

The shared shell installs Sentinel automatically. Product-specific request adapters are also used for monitoring. They must route `/monitoring/*` to the demo service or an implementation of the same contract.

For an explicitly handled failure:

```ts
import { reportOperationFailure } from '@pepbits/auth';

try {
  await performOperation();
} catch (error) {
  reportOperationFailure(); // Do not pass error, record or form contents.
  // Preserve the existing user-facing error and recovery behavior.
}
```

Native command adapters can call `reportOperationFailure('native')`. The fixed-code `reportSentinelFailure` helper is available for shared infrastructure. New codes require updating the client/server allowlist and all language catalogs. Never introduce free-form diagnostic properties casually.

The native application exposes `sentinel_pending_failure` and `sentinel_acknowledge_failure`. The collector clears the fixed panic marker only after a successful upload response. Native panic reports detected on a later launch use that launch's authenticated context; they do not reconstruct the previous user's page, stack or identity. A native event cannot be guaranteed to reach a terminating webview, which is why the marker exists.

## Validation and remaining boundaries

The implementation has store and HTTP tests for permission enforcement, tenant/product isolation, rate limiting, redaction, duplicate delivery, persistence, reopening and revision conflicts. Client tests cover queue bounds, backoff, serialized delivery, render recovery and isolation from malformed diagnostic objects. The browser suite triggers runtime and promise failures, examines the actual upload for sensitive strings, opens the administrator screen, resolves an incident and verifies non-admin denial.

The native Linux debug application passed all three native suites: window lifecycle, Arabic/Hindi/Malayalam rendering, and a real panic/process-exit/restart test. The restart test verified authenticated delivery, sanitized incident storage and marker acknowledgement. The one-use `NEXORA_SENTINEL_TEST_PANIC_ONCE` file trigger is compiled only into debug builds. No live crash was intentionally induced. Native source maps, OS crash dumps, server-process crash collection, external alert delivery and full cross-browser crash testing are not implemented. Human translation review remains pending.

Validation recorded: 1,405 unit tests across 85 files; 48 API tests; Sentinel browser collection/management/redaction and monitoring-auth isolation checks; both production builds; repository verification; native Rust `cargo check`. Native crash/restart runtime verification passed on Linux under Xvfb. No remote CI or live deployment was performed for this change.
