# Localization test report — 8 September 2026

## Result

The automated localization tests pass after fixing formatting issues found during
this test run. The fixes are in the workspace; this testing run did not deploy a
new release or change live account preferences.

## What was tested

| Check | Result |
| --- | --- |
| Full frontend component suite | 81 files, 1,370 tests passed |
| API configuration, approval and CSV import tests | 9 tests passed |
| Catalog coverage and static interface-copy checks | 13,790 keys across four languages passed |
| TypeScript | All packages passed |
| Production builds | Web and desktop passed |
| Repository verification | Passed; existing security ledger limitations remain declared |
| Language switching and reload | English, Arabic, Hindi and Malayalam passed |
| Desktop layout | Left/right sidebars, Arabic direction and stable record IDs passed |
| Representative page bodies | Dashboard, billing/print dialog, composed consultation, spreadsheet, reports, AI administration, CSV upload and approval inbox passed in four languages |
| Number/currency preferences | Arabic with German/EUR formatting and Hindi with Indian/INR formatting passed in an English-locale browser |
| Data preservation | Spreadsheet cell values and record identifiers remained unchanged |

Browser workflows used an isolated dummy API on port 3330 and frontend on 3109.
Preferences were intercepted in the browser. Consultation recovery drafts were
written only to temporary test data. The temporary servers were stopped afterward.

## Issues found and fixed

1. **Negative percentages could look positive.** With accounting notation, the
   number formatter removed the minus sign but the percentage formatter did not
   add parentheses. A value of -12.5 now displays as `(12.5%)` when two decimal
   places are allowed. Both direct formatting and percentage table cells have a
   regression test. Existing precision preferences still control rounding.
2. **Spreadsheet totals ignored account preferences.** The toolbar and footer
   used the browser locale and a fixed AED label. Both now use the shared money
   formatter, matching the account's number locale, currency, precision and
   negative-number preferences. Browser tests verify that cell values are not
   reformatted or rewritten.
3. **Some timestamps ignored account preferences.** Dynamic forms now use the
   shared time formatter for the last-saved indicator. AI prompt update timestamps
   use the shared localized date/time formatter instead of the browser default.

Added `packages/erp-config/src/localization-formatting.test.ts` with 13 cases for
month names, day periods, calendar dates, explicit number/currency settings,
approval notices and accounting percentages. Added
`e2e/localization-formatting.mjs` to the localization browser command.

## Remaining checks and integration work

- Automated catalog checks do not establish translation quality. Native speakers
  still need to review Arabic, Hindi and Malayalam wording, especially clinical
  and accounting terminology.
- Known approval notices and validation errors are translated at the display
  boundary. Unknown API messages and service-provided activity text retain their
  original content. A general backend message-key/parameter contract remains
  integration work; this test run did not implement it.
- Names, IDs, comments, imported cells and administrator-defined stage names are
  deliberately preserved as business content.
- Billing print-dialog text was exercised. This run did not certify every
  downloaded PDF, Excel workbook or scheduled report output.
- Browser results are from Chromium. Other desktop browsers and the native Tauri
  runtime were not exercised in this run.

## Run again

Use Node 24 and an isolated API/frontend as described above. From
`desktop-clients`:

```sh
npm run verify:localization
npm test
npm run typecheck
npm run build
npm run verify
npm run e2e:localization
```

The browser command requires Playwright and its browser dependencies. The API
checks can be run from the repository root:

```sh
node --test dummy-api/application-config.test.mjs dummy-api/approval-store.test.mjs dummy-api/import-store.test.mjs
```
