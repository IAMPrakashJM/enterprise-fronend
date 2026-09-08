# Release, report delivery and server controls — 8 September 2026

## Release status

The frontend/review changes were committed as `1254c07`. Remote CI exposed an
API prerequisite in rate verification; `2a8cf7c` changed that check to use a fresh
isolated API. All jobs passed in Actions run `34225080199`.

Release `20260908121202814-fa32f40d` was activated on both public demo hosts.
Application HTML, assets, API health, sign-in, navigation and Arabic catalogs
passed public HTTPS checks. The previous release is retained for rollback.

The additional work below is a separate server/frontend release. Its final
commit, CI and activation results will be recorded after verification.

## Scheduled reports: user flow

1. Open a report and select **Schedule**.
2. Enter a name, frequency, start date and delivery time. Times are explicitly UTC.
3. Create the schedule. It captures the selected interface language.
4. The server generates the report in the background. Keep using the application;
   the schedule remains stored if you close the browser or the API restarts.
5. Reopen Schedule to see deliveries. Select **Download** on a ready delivery.
6. Failed jobs retry automatically up to five attempts, with increasing delays.
   **Retry** starts another attempt series. **Pause** stops future scheduled runs;
   **Resume** enables them again. Existing queued deliveries are not cancelled.

The implemented delivery channel is the signed-in user's report inbox in this
modal. Output is UTF-8 CSV with translated headings and localized numbers.
Email, arbitrary recipient lists, scheduled PDF/XLSX generation and secure email
links are not implemented or claimed. No emails have been sent.

The source is the same four-branch demo summary used on the report screen. It is
not a real accounting query, and it does not apply the screen's simulated filters.
The screen states that these are scheduled demo summaries. A production product
must replace the server renderer with its own authorized report query.

## Report architecture and integration

- `erp-data/src/report-data.ts` supplies the shared demo rows.
- `reports/schedule-modal.tsx` uses `useProductRequest`; each application can
  supply its backend through `ProductServices.request`.
- `POST /report-schedules` accepts `list`, `create`, `toggle`, `retry` and
  `download` actions, together with `productId` and `pageId`.
- `create` additionally accepts `name`, `frequency` (`daily`, `weekly`,
  `monthly`, `quarterly`), `startAt` (ISO UTC) and `language`.
- Tenant and owner come from the authenticated session, not the payload.
  Navigation access is checked at the request and again when a job renders.
- `report-scheduler.mjs` stores schedules and deliveries in SQLite. Unique
  schedule/due pairs prevent duplicate inbox deliveries. Transactional claims,
  five-minute leases and retry state recover work after interruptions.
- A worker checks every five seconds while the API is running. After downtime it
  queues one overdue run and advances to the next occurrence; it does not send
  a separate backlog report for every missed interval.
- Monthly/quarterly schedules preserve the original day, clamping to the last
  day of a shorter month. UTC avoids ambiguous daylight-saving transitions.
- Each user may keep up to 50 schedules. The modal lists the most recent 100
  deliveries; delivery files expire after 30 days.

For another backend, preserve these ownership and state contracts. Replace the
`render(user, spec)` callback with the application's permission-checked data
service. Before adding email or a webhook, configure an approved delivery
service, verified recipients, retention rules and an idempotency contract.
A provider accepting a message is distinct from a recipient receiving it.

## Audit and AI controls

See [the current AI hardening ledger](ai-hardening-ledger.md) for the exact
controls and limitations. New functionality includes persistent metadata-only
audit events and queries, encrypted credential storage, 90-day credential
expiry, server context restrictions, fixed provider origins, strict CORS origins
and per-user request limits inside tenant limits.

These changes intentionally refuse clinical provider requests, external clinical
speech and unrestricted free text. They do not silently mask text and tell the
user an unchanged prompt was sent. The existing clinical screen/mock remains a
frontend demonstration.

## Operator handover

Back up `audit.sqlite` and `reports.sqlite` using SQLite's backup facilities, or
stop the API and copy each database together with its WAL/SHM files. Copying only
an open main database can omit committed WAL entries. This repository does not
provision off-host backups or an immutable production audit service.

Back up the credential master key separately from data. Historical plaintext
credential backups predate this migration and remain an operator responsibility.
Do not delete rollback backups without reviewing their recovery requirements.
The default key path, retention configuration, allowed origins and audit query
contract are documented in the ledger.

## External completion requirements

Actual native-speaker approval has not been received. The Arabic, Hindi and
Malayalam CSV review sheets retain Pending status, including the new wording.
Assign reviewers and return their signed-off corrections before marking this
complete. Automated tests check encoding, layout and placeholder consistency;
they do not certify natural wording.

Managed KMS/Vault, a trusted production identity service, a contracted clinical
provider and region, off-host audit retention, report email delivery and provider
key revocation require the operator's services, credentials or decisions. These
remain open; completing local code cannot manufacture those approvals.

## Local validation before the follow-up release

- 1,396 unit tests across 83 files passed; all packages typechecked.
- 35 API tests passed, including persistence, encryption migration, wrong-key
  refusal, tenant/user isolation, calendar recurrence, retry recovery and the
  HTTP schedule/delivery path.
- Production web and desktop builds and repository verification passed.
- The new scheduled-report browser suite passed creation, background delivery,
  real CSV download and pause.
- Localized export checks passed for English, Arabic, Hindi and Malayalam,
  including real XLSX contents, invoice PDFs and the updated schedule modal.
- The explicit registry now contains 27 E2E suites. Full remote execution is
  required for the follow-up commit; the earlier green run tested 26 suites.
