# Repository documentation audit — 13 September 2026

Status: repository documentation reconciled against current source and retained evidence; this is not a claim that every domain guide or native review is complete. Base source: `d8c05a0af170b5fa62b5ce464e1ab624775e9690` plus the documentation changes in this audit. No application implementation, deployment, API restart or database migration is performed.

## Audit scope

All 166 tracked Markdown files were included in the repository-wide local-link/heading scan, covering the root, frontend workspace, packages, API, architecture/feature/development/testing guides, handbook and dated release records. The retained [inventory](evidence/documentation-audit-2026-09-13/inventory.json) identifies every scanned file and its content hash. Link coverage is not line-by-line technical acceptance of every historical document or execution of every example.

Current-state prose was reconciled against the active `.deploy/current/release.json`, deployment records, package scripts/dependencies, API routes, preference storage and origin checks, DCP config/renderers/adapters, and generated documentation backlog. Historical reports, release snapshots and test logs were preserved. Older handbook/implementation records remain valid as dated evidence; current feature/delivery indexes take precedence for changed behavior.

## Updates made

| Documents | Correction |
| --- | --- |
| Root README and frontend workspace README | Added DCP feature coverage, current delivery links, Node 24 lockfile guidance and hosted-test boundaries |
| Documentation root and release index | Replaced contradictory current-release statements with `20260912002147213-851cb66e`; linked deployed runtime increments instead of calling them local-only |
| Deployment guide | Added the current style activation, unchanged API state and rollback release above historical entries |
| Feature/architecture indexes | Linked designer/runtime, backend handoff and demo API ownership |
| DCP feature guide | Removed outdated claims that field translations, multi-parent conditions, repeated occurrences and shared recovery were all future work; retained production and advanced-contract gaps |
| Demo API README | Replaced auth-only/zero-dependency overview; documented route families, Node 24, dependencies, SQLite preferences, legacy fallback and restricted origins |
| Testing index | Linked latest local/public evidence and unsuccessful full hosted feature-browser acceptance |
| Documentation lifecycle | Reconciled current registration, authoring and translation-review totals with the generated backlog |
| Changelog | Added this dated reconciliation without rewriting historical acceptance claims |

## Current coverage and unresolved work

The Library registry contains 159 destinations. In-app documentation covers 316 registrations: 148 authored guides and 168 inherited reference-only guides. The regenerated backlog has 1,116 entries: 168 authoring issues, 504 incomplete reference-guide translations and 444 authored-guide translations awaiting native review. These are individual issues, not 1,116 missing pages.

The [reference-guide audit](../../documentation/reference-guide-audit-2026-09-11.md) maps all 168 reference pages to their shared implementations: worklists, reports, dashboards and other platform screens. Its historical counts remain dated. Those screens do not prove specialized operations such as payroll, reconciliation or patient merge exist. Authoring missing domain instructions requires verified behavior and must not invent business operations. The [live backlog](../../documentation/backlog.json) remains the list of outstanding page/language work.

Native/domain review, actual devices, production backend integration and performance acceptance remain explicitly separate. Repository instructions and passing static checks do not certify these. Existing in-app guide snapshots were not rewritten by this Markdown audit; no new help deployment is claimed.

Full hosted feature-browser CI is not green. The [style deployment follow-up](dcp-style-deployment-2026-09-12.md#hosted-ci-follow-up--13-september-2026) lists the failed suites; the subsequent [documentation commit run](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34731843902) also completed with failure. This audit does not fix application/browser tests or relabel passing local checks as full hosted acceptance.

## Validation

Retained [validation log](evidence/documentation-audit-2026-09-13/validation.log) records the documentation/link/impact checks and documentation tooling tests. The [inventory](evidence/documentation-audit-2026-09-13/inventory.json) records the broader Markdown scan, including files outside the usual `docs` checker set. Generated fallback and public-example consistency are checked without changing application source.

Strict documentation acceptance is expected to fail while the 1,116 authoring/native-review entries remain. Normal checks can pass with this explicit backlog. No runtime suite was rerun for these documentation-only edits; previous evidence retains its original scope and source identity.
