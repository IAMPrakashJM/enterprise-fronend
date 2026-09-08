# Reusable record approvals

Customer Master has an **Approval inbox** button. Saved customer records have a
**Record approval** section. The shared UI runs in both desktop and web shells.

## Workflow

- Save the record, add a comment and confirm **Submit for approval**. Submission
  captures the current saved record fingerprint and configured stages.
- An administrator opens the inbox → **Configure stages** to define one to five
  ordered stages with names and one or more approver roles. Default: Finance review,
  approvable by finance-manager or enterprise-admin. All approvers are forbidden
  from deciding their own requests. Configuration has optimistic version checks.
  Changes apply to future submissions/resubmissions; active requests keep their stages.
- Approvers inspect a saved record and approve, reject or request changes with a
  required comment. Approving advances one stage, with final approval after the
  last stage. Rejection or requested changes ends the current review. The original
  requester can revise/save and resubmit, retaining the earlier history.
- Inbox filters cover status, current stage, requester/assigned ownership and
  record/requester search. Pages contain 25 rows. Select eligible rows on the page
  and confirm a bulk decision; each result is reported separately. The backend
  accepts at most 100 distinct records per action and checks every record/version.
- Requesters receive persistent in-app approval notifications for submission,
  stage advancement, final approval, rejection and requested changes. Expand
  **My approval notifications** in the inbox or record panel to open the record
  or mark notices read. **Refresh approvals** retrieves changes from other users.
  History contains the actor, stage, decision, comment and timestamp.

Saved-record changes during review block decisions until the requester resubmits.
Editing a previously approved record does not transfer approval to the new version;
resubmit the updated saved record to approve it. The displayed approval history/status
belongs to its submitted version. Approvals do not lock forms or execute downstream
business actions. Save form edits before submitting: unsaved local drafts are not
part of an approval.

## Adapter and service

`ProductServices.approvals` accepts the `ApprovalAdapter` exported by `erp-data`.
The default adapter uses the product request transport with authenticated
`POST /approvals`: `read`, `configure`, `submit`, `decide` and `mark-read` actions.
Customer Master is the configured entity today. Register additional supported page
identities and saved-record resolvers before enabling the shared workspace elsewhere.

The demo API persists configuration, requests, immutable history entries, notifications
and idempotency receipts atomically in private `approvals.json`. Scope is tenant,
product and page; notification recipients and request visibility are checked server-side.
Approver roles are snapshotted at submission. Admins can view the scope; other users
see their own requests or requests containing one of their approver roles. Admin
visibility does not bypass a stage's approver roles or the self-approval prohibition.

Version checks prevent stale decisions and configuration overwrites. Operation IDs
make retries after lost responses safe, including partially successful bulk actions.
The UI preserves an uncertain operation for exact retry; after reload, refresh the
server state before another action. A new stale action cannot repeat a completed
stage because its expected version no longer matches.

Production integrations should provide a transactional database, indexed/paginated
queries, retention policies, account-aware approver assignment, and background
notification delivery where required. Configure stages with an available approver
other than the requester. This implementation provides in-app notices on refresh,
not email, push, or a global notification-bell integration. The demo keeps complete
approval history and receipts; its inbox fetches the current scope then paginates
locally. The most recent 100 requester notices are displayed.

## Checks

`npm run test:approvals-api` covers ordered stages, role/self-approval checks,
configuration snapshots, stale/changed records, scope isolation, partial results,
resubmission, durable history/notifications and idempotent recovery. Component tests
cover explicit confirmation, uncertain outcome retry, bulk eligibility and row errors.
`npm run e2e:approvals` writes fixtures and must use an isolated API data directory.
It exercises the administrator → requester → finance reviewer → administrator →
requester journey in Chromium, including filters, notifications and accessibility.

`ApprovalWorkspace` and `RecordApproval` are exported by `erp-screens` for product
composition; `ApprovalWorkspace` accepts a page ID and an optional saved record ID.

Validation on 8 September 2026: 1,339 frontend tests passed in the full suite;
the final targeted approval run passed three tests including the added changed-record
warning test. All 20 API tests, package typechecks, repository verification checks,
Next/Vite builds and the three-role Chromium journey passed. The inbox accessibility
audit found no serious/critical violations; the journey had no runtime errors.

Release `20260908020453305-9fbd513a` was activated with the matching API on both
public shells. The previous frontend `20260908011625901-fddb7b51` and a private
API/data backup are retained. API restart requires signing in again.

Public HTTPS checks passed on both hosts for release identity, authenticated
approval inbox/configuration availability and record controls, with no approval
writes or runtime errors. Isolated test servers were stopped after verification.
