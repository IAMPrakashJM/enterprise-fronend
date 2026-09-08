# Localization deployment and verification — 8 September 2026

## Status

The previously tested formatting fixes were deployed first as
`20260908092521895-95ebd3af` and verified on both public demo sites. The additional
changes below were then tested and deployed as
`20260908095706252-a12ab449`. Both frontend services and the updated dummy API
are running. The previous frontend release and API configuration snapshots are
retained under `.deploy/` for rollback.

## Completed engineering work

- Added API message keys and parameters for notifications, record-panel activity,
  HTTP errors and partial approval failures. The registry covers 125 audited static
  errors. Unknown diagnostics remain readable; business data is preserved.
- Fixed workbook exports to use translated column headings and stable filenames.
- Fixed invoice amount/date formatting, while retaining the invoice's currency.
- Replaced the inactive Download PDF button with Save as PDF, which opens browser
  printing. Dedicated print styling outputs only the invoice, not application chrome.
- Removed the scheduled-report success toast that previously appeared without a
  backend job. Schedule creation now stays disabled with a localized explanation.
- Fixed a native Tauri close-listener race when a detached window label is reused.
  Listeners are released, stale callbacks cannot destroy a replacement window,
  and logout performs a single teardown.

## Verification

| Area | Result |
| --- | --- |
| Frontend tests | 81 files, 1,372 tests passed |
| Focused API/HTTP tests | 12 passed |
| Catalogs | 14,061 keys across four languages; placeholder and static-copy checks passed |
| TypeScript and production builds | Passed for web and desktop |
| Chromium | Four-language page workflows, backend messages, actual XLSX contents, print-to-PDF artifacts and unavailable scheduling state passed |
| Firefox | Four-language page workflows passed |
| WebKit browser | Four-language page workflows passed |
| Native Tauri on Linux/WebKitGTK | Record load, detach, title, close, reattach, reopen, parent/child logout passed without runtime errors |
| Native language display | Arabic, Hindi and Malayalam billing pages, direction, stable IDs and no preference writes passed |
| Final public release | Both live sites passed in English, Arabic, Hindi and Malayalam: API error metadata, preference formatting, invoice currency, print preview and no runtime errors |

Verified sites: https://front-design.pepbits.com and
https://desktop.front-design.pepbits.com. All eight final public checks passed
against release `20260908095706252-a12ab449`.

Tests used isolated data for mutations. Public checks used temporary intercepted
preferences. The native tests used a debug application under Xvfb with isolated
application data. This is not Windows/macOS testing, Safari certification or a
signed native-installer release.

## Files checked

The browser downloaded real customer `.xlsx` files in all four languages. Tests
opened each workbook, checked native headings, and confirmed stable record IDs.
Chromium also generated four invoice PDFs from the application's print layout.
The Arabic PDF was rendered and visually inspected: one A4 page, native headings,
correct invoice values, and no application sidebar or toolbar.

The app uses browser print-to-PDF. It does not provide a separate server-side PDF
renderer. Spreadsheet Studio retains its workbook column contract for re-import;
localized customer-worklist exports use display headings.

## Still outstanding

1. **Native-speaker approval.** No human reviewer has approved the translations.
   [Review sheets and samples](localization-review/README.md) are ready for Arabic,
   Hindi and Malayalam. AI-authored wording and automated tests do not establish
   native-speaker approval.
2. **Scheduled delivery.** There is no connected reporting job service, queue or
   delivery provider. No report was scheduled or emailed. The UI now states that
   limitation instead of falsely reporting success. Integrating delivery requires
   a service contract, persistence, timezone handling, retries and delivery status.
3. **Other native operating systems.** Windows and macOS builds were not tested.

## Integration and reruns

See [Backend message localization](backend-message-localization.md) for the API
contract. Run `e2e:backend-messages`, `e2e:localized-exports` and
`e2e:native-localization` from `desktop-clients`. The existing `e2e:native` checks
native lifecycle behavior. Use `E2E_BROWSER=firefox` or `E2E_BROWSER=webkit` with
`e2e/page-body-localization.mjs` for the additional browser engines. These commands
require the matching installed browser/runtime dependencies and isolated services.
