# DCP rules, release and entity runtime — 11 September 2026

Status: implemented and locally verified frontend/demo increment. Full enterprise scope is not complete. No commit, push or deployment performed.

## Changes

- Typed validation and normalization, cross-field conditions, bounded arithmetic and cycle checks shared by preview and demo API. Hidden values are retained; presentation rules do not grant authorization.
- Review/request-changes/approve/publish/retire/new-draft controls. Published definitions are snapshotted; later drafts preserve earlier releases. Demo administrator role previews all lifecycle actions.
- Registered synthetic patient, encounter, order-item, employee and item owners; release-pinned answer loading, draft saves, server validation, revision conflict checks, idempotent submission and submitted read-only records. Answers and revision snapshots are tenant/application/owner scoped in existing demo CSV storage.
- Shared stacked/tabbed/stepped sections, configurable one-to-three columns and first-error section selection. Checkbox disabled field-state handling now honors the same injected state as other shared inputs.
- CSV/XLSX staging up to 1,000 options per revision, local fifty-row preview pages and a 10,000 retained-option budget. Workbook parsing runs in a worker with a five-second timeout, 2 MB input and 16 MB expanded-data limits. Formula cells, macros, external-link parts and unsupported ZIP structures are rejected. No partial revision is activated.
- Existing SheetJS consumers upgraded together to publisher-distributed 0.20.3; lockfile records the distribution integrity. See [publisher guidance](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). This upgrade is included in the final tests, not inferred from an earlier run.
- Host adapter seam with application-owned wire codecs, response validation, mapped errors/incident references, relative paths and a request timeout. No actual Spring Boot connection or Java/migration changes.

[User and integration guide](../../features/dcp-designer.md), [scope assessment](../../development/README-DCP-ENTERPRISE-FORM-SCOPE.md), DCP-05 in [test cases](../../testing/v1.0.0/USE-CASES.md).

## Verification

Source base `2f66cb5` plus the [working-tree manifest](evidence/dcp-enterprise-runtime/source-manifest.json), including earlier uncommitted increments. Prior dependency, catalog and CSV evidence remains historical and is not relabeled.

- [Full local CI](evidence/dcp-enterprise-runtime/ci.txt), Node 24: 125 frontend files / 1,555 tests; 134 API tests; 2 registry tests; 14 deployment-tool tests; all package type checks, Next.js/Vite builds and repository gates passed. An earlier attempt failed on an explicit-extension Node export, corrected before this run. A subsequent run had one five-second timeout in the existing all-template rendering test; [timeout evidence](evidence/dcp-enterprise-runtime/ci-timeout.txt) is retained. The clean rerun passed without increasing the test timeout.
- After full CI, a small error-navigation correction made repeated identical validation failures return to the first invalid section. [Final targeted tests](evidence/dcp-enterprise-runtime/final-targeted.txt) passed 5 section/worker tests, including one new case; the [shared-screen type check](evidence/dcp-enterprise-runtime/final-types.txt) exited successfully with no output. This does not relabel the full-suite count as 1,556. Earlier [17 focused tests](evidence/dcp-enterprise-runtime/focused-tests.txt) and [8 API cases](evidence/dcp-enterprise-runtime/api.txt) overlap those broader counts.
- [Desktop-browser acceptance](evidence/dcp-enterprise-runtime/desktop-browser.txt) and [Next.js acceptance](evidence/dcp-enterprise-runtime/next-browser.txt) passed with isolated synthetic API stores: formula and forged expanded-size rejection, compressed 120-row XLSX import, paged preview, rule authoring, entity binding, review/approve/publish, published edit locks, server validation and read-only submitted answers. Both used development shells; production builds passed separately. These journeys preceded the small repeated-error navigation correction, covered by the final targeted tests. [Published form](evidence/dcp-enterprise-runtime/published.png), [submitted answer](evidence/dcp-enterprise-runtime/submitted.png), [Next.js submitted answer](evidence/dcp-enterprise-runtime/next-submitted.png).
- [Spreadsheet Studio browser regression](evidence/dcp-enterprise-runtime/spreadsheet-browser.txt) passed after the shared SheetJS upgrade, including mapping, policy rejection, round trip and audit-before-download. [Dependency installation output](evidence/dcp-enterprise-runtime/dependency-install.txt) is retained; an audit result is not a security certification.
- [Documentation contract tests](evidence/dcp-enterprise-runtime/documentation-tests.txt) passed 3 cases. Documentation links, impact receipts and translation revisions passed normal validation; native/domain review backlog remains open. New UI messages exist in four canonical languages; the enterprise runtime itself has not received a separate four-language browser journey.

No hosted CI, production endpoint, native executable, physical device or performance benchmark was run. No deployment occurred.

## Completion boundary

The user's full supplied scope remains open. Production endpoint/current wire contracts have been requested; backend implementation belongs to another session. Production authorization and role separation, business ownership/transactions, advanced component/domain/capture packs, repeating groups, multi-parent relations, large staged/server-paged datasets, exact-decimal/full rule AST behavior, tenant-authored label translations, shared local draft recovery, attachments/workflow/attestation/amendments, native devices and workload acceptance are not completed by this demo increment.

Demo limits are deliberate: 100 releases, 100 current owner answers and 1,000 answer revisions per tenant/application. Operation receipts are bounded; demo history is not durable production audit evidence. Clinical and financial business invariants are not implemented by the synthetic owner registry. No Oracle/Cerner parity claim or compliance certification is made.

Help snapshot `2026-09-11-dcp-enterprise-runtime` preserves earlier releases and includes four-language guidance. Native-speaker review remains pending.
