# DCP designer style deployment — 12 September 2026

Status: preparation in progress. This follow-up preserves the earlier [local style evidence](dcp-designer-style-2026-09-12.md). Activation and public verification are not yet claimed.

## Scope and validation

Presentation-only designer changes: compact palette, aligned canvas cards, responsive columns and selected-field settings before lifecycle settings. Field contracts, API behavior and permissions remain unchanged. No API restart or database migration is required.

`npm run ci` passed with Node 24: 1,570 frontend tests in 129 files; 137 API tests (104 general and 33 clinical); two browser-registry tests; 14 deployment-helper tests; typechecks, both builds and repository gates. See [full local CI log](evidence/dcp-style-deployment/ci.log). These are local checks, not a claim about hosted CI or native execution. The earlier focused browser runs remain linked in the style record.

Source changes are the three implementation hashes recorded in the [style manifest](evidence/dcp-designer-style/source-sha256.txt), based on commit `3244587aab98cacc3bd2b171fe95889dfd4f8b11`. Previously uncommitted Jira handoff documents are excluded from this deployment commit.

Previous frontend release `20260911145802227-397d1cf5` remains the rollback target. Preparation builds and tests isolated packages before activation. The existing demo API remains running.
