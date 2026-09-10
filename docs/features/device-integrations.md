# Generic device integration library

Feature ID: DEVICE. State: implemented; verification recorded in the [release record](../releases/unreleased/device-integrations-2026-09-10.md). Testing guide: [1.0.0](../testing/README.md).

## User problem and outcome

POS, purchasing, healthcare billing and reporting need the same scanner intake, output routing and job tracking. The Library now includes Device integrations, Scanner workbench and Device automation. All use one typed workspace, shared controls and the authenticated demo API. Records and device definitions come from backend CSV/JSON files; job and setting changes are written to a scoped CSV snapshot.

## User and administrator flows

1. Open a workstation ID. It scopes personal device defaults and job history; it is not an authentication credential. Production applications should inject their provisioned workstation ID through the workspace prop.
2. Choose a device, source record and supported output. Save the workstation default if the tenant has not locked a destination. Queue a job, then Send / print. Browser receipt/report jobs open the browser print dialog, which also supports Save as PDF. Cancel applies only before dispatch.
3. Focus Scan code and scan with a keyboard-wedge reader configured to send Enter, or paste a code and press Enter. The demo API resolves it within POS, purchasing, billing, reports or laboratory context. Successful scans select the source record; failed scans keep the code. The component does not capture typing elsewhere or execute scanned URLs.
4. Administrators configure allowed copies, a locked destination and automatic demo routing. Rules map sale completion to receipt, goods received to label, finalized bill to receipt and ready report to browser output. Select a source record and use Simulate event. Automatic routing is off initially.
5. Demo transports produce a **simulated** status. Browser jobs remain queued until a user opens printing and then become **print-requested**. Neither means a physical printer delivered paper. Native jobs remain queued with a connector-unavailable message.

## Technical contract and integration

| Layer | Responsibility |
| --- | --- |
| erp-config | `IntegrationDevice`, `IntegrationJob`, `IntegrationRule`, `IntegrationPolicy`, `IntegrationCommand`, capability contracts |
| erp-data | `createIntegrationAdapter`, authenticated product-aware POST requests and localized failures |
| ops-ui | `ScannerInput`, shared form/card/table controls and `PrintDocument` |
| erp-screens | `DeviceIntegrationWorkspace`, `DeviceJobList`, `DeviceDocument`; host preferences and policy injection |
| platform-ports | `DeviceConnector`, `DeviceTicket`, `createDeviceConnector`; injected native transport with ticket expiry and acknowledgement validation |
| demo API | Trusted tenant/user scope, CSV source lookup, policy enforcement, routing, idempotency and job persistence |

`POST /device-integrations` requires the authenticated user's application access and Device integrations navigation permission. Mutations require a bounded `operationId`; stations are bounded identifiers. Lookup is exact within a context. Policies/rules and event simulation require the server-derived administrator role. Client-supplied identity never selects a tenant. Job access is scoped to tenant, application, owner and workstation, including for administrators. Policy version conflicts require refresh; dispatch checks current locks and copy limits again.

```ts
import { createIntegrationAdapter } from '@pepbits/erp-data';
import { DeviceIntegrationWorkspace } from '@pepbits/erp-screens';

const adapter = createIntegrationAdapter(authenticatedRequest, product.id);
// Render DeviceIntegrationWorkspace with adapter, scopeKey, pageId,
// provisioned stationId, preferences, preferencePolicy,
// preferencesAvailable and onPreferenceChange from your host.
await adapter.command({
  action: 'enqueue', stationId, operationId,
  deviceId, recordId, capability: 'receipt', copies: 1,
});
```

The demo enqueue endpoint uses its synthetic source records. A real adapter must resolve that application's authorized bill/report/item records on the backend. Barcode payloads and artwork stay in the existing [barcode library](barcode-qr-printing.md); a real label driver should consume its authorized immutable artifact rather than inventing barcode data in the UI. This library's simulated label queue does not send that artifact to hardware yet.

### Automatic business-event flow

```mermaid
sequenceDiagram
  participant App as POS / purchasing / billing
  participant API as Application backend
  participant Queue as Device job service
  participant Host as Workstation connector
  App->>API: Commit business transaction
  API->>Queue: Stable event ID + authorized record reference
  Queue->>Queue: Resolve rule, policy and destination; deduplicate
  Queue->>Host: Scoped immutable job ticket
  Host-->>Queue: Accepted / failed / unknown acknowledgement
  Queue-->>App: Job state and support reference
```

The demo implements rule selection, event deduplication and simulated delivery; the production outbox and connector exchanges in this diagram are integration responsibilities. Never emit a real “sale completed” event merely because a screen opened or a scan arrived. Real backends should publish from a transactional outbox after commit. Use a stable domain event ID and target routing identity. The demo deduplicates by owner/workstation/event ID and rejects reusing an ID for another record/event; production consumer identity must remain stable across retries.

A device host implements `DeviceConnector` using an authenticated, allowlisted transport. Ticket expiry and matching acknowledgement IDs are checked by the supplied wrapper, but server-side ticket signatures, pairing and permissions must also be verified by the host. Do not expose unrestricted shell commands, local file paths, raw printer addresses or unauthenticated localhost endpoints to page code. Spooler acceptance and verified paper output are separate states; ambiguous outcomes need reconciliation before another physical send.

## Compatibility, localization and accessibility

Shared presentation preferences govern fonts, theme, density, table styling and page size; device defaults are API-backed and tenant locks are enforced server-side. Scanner capture requires explicit field focus and Enter and is independent of optional global shortcuts. Arabic, Hindi and Malayalam UI/help use canonical catalogs and regenerated fallbacks. Native-language review remains pending. Backend synthetic names/codes are data, not translated business copy. Printed documents use a legible paper layout, separate from the screen theme.

Browser printing opens a dialog ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)). Silent OS printing requires a supported host, for example Electron's printer APIs ([Electron](https://www.electronjs.org/docs/latest/api/web-contents)). WebUSB has limited browser availability and secure-context requirements ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API)); USB, serial and HID devices cannot be treated as universally interchangeable browser devices.

## Acceptance, completed and pending work

DEVICE-01..06 cover scan success/recovery, scoped queue persistence, duplicate prevention, device capabilities, policy locks, automatic demo routing and print-request semantics. Completed: three Library destinations; focused scanner component; typed native extension point; API-backed configuration, rules, jobs and personal defaults; tenant policy; document print/PDF; demo receipt/label/drawer signals; TypeScript integration example.

Pending: actual printer model drivers and connector installation/pairing, signed job tickets and a durable production worker/outbox, physical scanner/thermal printer acceptance, camera decoding, direct USB/HID/serial transport, document scanner/TWAIN integration, actual scales and cash drawers, payment terminal integration, printer discovery/status and real application record adapters. No implementation can guarantee every printer without device/OS-specific validation. The existing barcode library still generates real barcode artwork from the demo backend; this addition does not replace it.

## Operations and support

Use Refresh devices and policy after a conflict. Network retries retain operation identity and selected values; validation permits correction. Changing the workstation clears the prior view and ignores stale responses. CSV writes are atomic in the single demo API process; this is not a multi-node production job broker. Copy limits are server-enforced; browser print-dialog settings remain controlled by the person printing. No OS printer is silently selected by a browser profile.

### Reuse scanner and native adapters

`ScannerInput` is exported from `@pepbits/ops-ui`. The Library form-controls page includes it in the text-input example, with runnable source: focus the scanner field and press Enter to copy the accepted value into the example search field. This catalog example stays local; the Scanner workbench performs API-backed lookup. Supply an async `onScan(code)` callback that calls your authenticated lookup adapter, hands the resolved record to the POS/purchase/clinical controller and returns true only when accepted. Return false after showing a localized lookup failure to retain the entered code. Scanning alone should not finalize a sale, payment or purchase.

```ts
import { createDeviceConnector } from '@pepbits/platform-ports';
const connector = createDeviceConnector(authenticatedHostCall);
// Obtain this ticket from the authorized job service; never construct a
// privileged ticket from arbitrary page text or a scanned URL.
const acknowledgement = await connector.submit(serverIssuedTicket, abortSignal);
// Persist acknowledgement through the application's job service.
// Accepted means the connector accepted it, not confirmed paper output.
```

A real `IntegrationAdapter` can return `accepted`, `failed` or `unknown` job states from that service; the shared history renders them. The demo API does not fabricate those native acknowledgements. The supplied port validates expiry and response identity, while connector signature verification, device pairing and allowed operations remain duties of the real host. Unknown outcomes require status reconciliation rather than blind physical resending.
