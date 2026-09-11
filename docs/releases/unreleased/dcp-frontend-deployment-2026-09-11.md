# DCP frontend deployment — 11 September 2026

Status: committed, pushed, deployed and verified on both public demo sites. Release **20260911145802227-397d1cf5**, application commit **0cab668d3dc816ff6f855cc5911c2b4bad5e1b75**. This follow-up supersedes the local-only publication status in the earlier [frontend contract evidence](dcp-frontend-contract-2026-09-11.md); it does not mark the full enterprise scope complete.

## Delivered and verified

Both sites serve the shared designer/runtime, dependent dropdowns, value sets and bounded imports, repeatable sections, rules, translated labels, API preview, release/history views and shared recovery changes described in the [feature guide](../../features/dcp-designer.md).

- [Web designer](https://front-design.pepbits.com/library/dcp-designer)
- [Desktop-browser designer](https://desktop.front-design.pepbits.com/library/dcp-designer)

Preparation installed the lockfile and built both shells in isolation. Packaged HTML/assets, release identity, strict deployability and stylesheet parity passed before activation. Activation restarted the two release-backed shells and checked them again. Both public hosts returned HTTP 200 for their release metadata and API health.

Public Chromium checks passed on both sites: authenticated catalog/entity load, supplied v1 runtime rendering, repeatable visual authoring, independent row values, add-row bounds, API preview validation, desktop containment and absence of page errors. No designs, answers or preferences were saved. An initial test left the required Reference field blank and therefore did not trigger an API validation request; the test input was corrected and both sites passed. No application code changed during deployment.

## Evidence and source control

- [Release metadata](evidence/dcp-frontend-deployment/release.json), [artifact hashes](evidence/dcp-frontend-deployment/source-manifest.json)
- [Preparation](evidence/dcp-frontend-deployment/prepare.txt), [activation](evidence/dcp-frontend-deployment/activation.txt), [API restart](evidence/dcp-frontend-deployment/api-restart.txt)
- [Live browser checks](evidence/dcp-frontend-deployment/live.txt), [test source](evidence/dcp-frontend-deployment/live-check.mjs), [initial test timeout](evidence/dcp-frontend-deployment/live-initial.txt)
- [Web runtime](evidence/dcp-frontend-deployment/front-design.pepbits.com-runtime.png), [web repetition](evidence/dcp-frontend-deployment/front-design.pepbits.com-repeating.png), [desktop runtime](evidence/dcp-frontend-deployment/desktop.front-design.pepbits.com-runtime.png), [desktop repetition](evidence/dcp-frontend-deployment/desktop.front-design.pepbits.com-repeating.png)

The local CI evidence remains attached to the implementation record: 1,569 frontend tests, 137 API tests, both builds and repository gates, plus the subsequent focused repeating-section check. The implementation source hashes matched before committing. Raw historical logs retain original whitespace and bytes; they were not reformatted to satisfy whitespace checks.

Previously ignored documentation evidence logs were included, and `.gitignore` now permits reviewed release evidence logs. A clean index snapshot passed the documentation checker. This fixes the missing-log cause of the previous hosted documentation failure without altering historical test results.

[Hosted CI for the application commit](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34613301569) passed its documentation stage and was still running when the [status snapshot](evidence/dcp-frontend-deployment/remote-ci.json) was captured. This document does not claim every remote job passed. A subsequent documentation-only push has the same application source and may supersede that run under the existing branch concurrency rule.

## API restart and recovery

The demo API was stopped for a consistent data backup and restarted to load DCP contracts and the updated documentation catalogs. Existing demo sessions may require signing in again. Previous API source and data remain locally under `.deploy/api-backups/20260911145802227-397d1cf5/`; no production backend or database migration was introduced.

Previous frontend release **20260911105427634-cc931847** remains available. With Node 24, `npm run deploy --prefix desktop-clients -- --activate 20260911105427634-cc931847` restores the previous shells. API restoration is a separate coordinated operation using the retained source/data backup.

Backend implementation remains assigned through [PLIBRYBEND-206](https://pepbits.atlassian.net/browse/PLIBRYBEND-206?focusedCommentId=10095). Advanced frontend authoring/administration, large dataset jobs, capture/signing/reporting and native acceptance remain as documented. Public browser success is not native execution, actual device acceptance, native-speaker review or live Spring Boot/PostgreSQL integration.
