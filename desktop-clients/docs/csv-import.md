# CSV import

Customer Master → More worklist actions → Import records opens the shared import
workflow in both shells. Nexora remains the active product.

1. Upload UTF-8 comma-separated CSV (maximum 2 MB, 500 data rows, 80 columns).
   Headers must be unique and non-empty. Quoted commas, escaped quotes, multiline
   cells, BOM and Windows line endings are supported. Preview shows five rows.
2. Map columns to schema fields. Matching field names and labels are suggested;
   each source column can map to one field. Unmapped fields use schema defaults;
   mapped empty cells remain empty. Required fields without defaults must be mapped.
3. Validate all rows on the server. Required/conditional fields, email, numeric
   ranges, option values, dependent options and date rules use the form schema.
   Numbers exclude currency/grouping; toggles accept true/false, yes/no and 1/0;
   multiselect values use semicolons. Customer codes are compared after trimming
   and case folding against the file and saved/seeded customers. All occurrences
   of a duplicate within the file are excluded.
4. Review per-row field errors, filter error rows, download an error CSV, or change
   the mapping. Explicit confirmation creates only the valid rows. Existing
   records are never overwritten. Correct invalid rows in the source CSV and
   validate a new import. Data-row numbers exclude the header and blank rows.
5. Process ten rows per acknowledged batch with progress and partial results.
   Closing pauses after the current batch; reopening or reloading restores the
   latest server job. Resume processes pending rows. Retry failed rows retries
   only transient failures, preserving successes. A code created since validation
   becomes a non-retryable error requiring a corrected CSV. Finish pending work
   and retry transient failures before starting another import.

## Reuse and persistence

`erp-config/src/imports.ts` defines the supported entity and shared validation.
`erp-data/src/csv-import.ts` provides the parser, mapping helpers and `ImportAdapter`.
`ProductServices.imports` can replace the HTTP adapter; otherwise the product's
request transport calls authenticated `POST /imports` with `preview`, `latest`
or `run` actions. Add an import definition and backend entity persistence mapping
when enabling another application entity. Customer import is configured today.

The demo service persists jobs in `imports.json` under the record data directory,
scoped to tenant, user, product and page. Admin and finance-manager may import;
other roles cannot write. Customer records use the existing record store and
appear in worklists after each acknowledged batch. Preview UUIDs are idempotent;
deterministic job/row record IDs recover safely if a write succeeded but its job
receipt or HTTP response was lost. Completed rows are not submitted again.

The demo retains at most 20 jobs per user/product/page, pruning older unconfirmed
or completed jobs. Canonical row values are stored in private files; original CSV
files are not retained. Only the latest job is exposed in this UI. Production
adapters should supply transactional uniqueness, managed storage/retention,
server-side authorization and background workers for larger imports. This demo
processes bounded batches in a single API process; it is not a distributed queue.

## Verification

Run `npm run test:imports-api`, `npm test` and `npm run typecheck` with Node 24.
`npm run e2e:imports` writes fixtures: run only against an isolated API data directory
and frontend configured to use it. It covers mapping, invalid/duplicate rows,
confirmation, multiple batches, error export and restored results after reload.
Store tests inject partial failures and lost job receipts; component tests cover
confirmation, failed-row retry and interrupted-request resume.

Validated on 8 September 2026: the full frontend suite passed 1,336 tests; the
additional adapter-response test and final targeted run passed all eight import
parser/component tests. All 17 API tests, all package typechecks and repository
verification checks passed. Chromium exercised a 15-row CSV (12 imported across
two batches, three excluded), duplicate prevention on re-upload, restored results,
error-report download and the dialog accessibility audit with no serious/critical
findings or runtime errors. Next and Vite production builds and isolated packaged
HTML/asset checks passed for release `20260908011625901-fddb7b51`.

Release `20260908011625901-fddb7b51` is active on both public shells with the
updated API. Public authenticated worklist/import-dialog and release identity
checks passed without record writes. API restart requires a fresh sign-in.
Previous frontend release `20260908004731762-bb1d1b06` and a private API/data
backup are retained for rollback.
