# DCP designer style deployment — 12 September 2026

Status: committed, pushed, deployed and verified on both public demo sites. Release **20260912002147213-851cb66e**, application commit **6ec329f22e589dece2894ef5b12ad4961e5ff8b0**. This follow-up supersedes the local-only publication status in the earlier [style evidence](dcp-designer-style-2026-09-12.md) without changing that historical record.

## Scope and validation

Presentation-only designer changes: compact palette, aligned canvas cards, responsive columns and selected-field settings before lifecycle settings. Field contracts, API behavior and permissions remain unchanged. No API restart or database migration is required.

`npm run ci` passed with Node 24: 1,570 frontend tests in 129 files; 137 API tests (104 general and 33 clinical); two browser-registry tests; 14 deployment-helper tests; typechecks, both builds and repository gates. See [full local CI log](evidence/dcp-style-deployment/ci.log). These are local checks, not a claim about hosted CI or native execution. The earlier focused browser runs remain linked in the style record.

Source changes are the three implementation hashes recorded in the [style manifest](evidence/dcp-designer-style/source-sha256.txt), based on commit `3244587aab98cacc3bd2b171fe95889dfd4f8b11`. Previously uncommitted Jira handoff documents are excluded from this deployment commit.

Previous frontend release `20260911145802227-397d1cf5` remains the rollback target. Preparation builds and tests isolated packages before activation. The existing demo API remains running.

## Deployment and public verification

Preparation and activation completed successfully. Both shells passed isolated and active packaged HTML/asset checks. Public Chromium checks confirmed the expected release identity, healthy API, three-column designer, field settings before lifecycle settings, enabled control selection, radio preview and narrow-screen containment. No browser errors occurred, and no designs, answers or preferences were saved. The API was not restarted.

- [Web designer](https://front-design.pepbits.com/library/dcp-designer)
- [Desktop-browser designer](https://desktop.front-design.pepbits.com/library/dcp-designer)
- [Preparation log](evidence/dcp-style-deployment/dcp-style-prepare.log), [activation log](evidence/dcp-style-deployment/dcp-style-activate.log), [release metadata](evidence/dcp-style-deployment/release.json)
- [Live checks](evidence/dcp-style-deployment/dcp-style-live.log), [check source](evidence/dcp-style-deployment/live-check.mjs)
- [Web screenshot](evidence/dcp-style-deployment/front-design.pepbits.com-designer.png), [desktop-browser screenshot](evidence/dcp-style-deployment/desktop.front-design.pepbits.com-designer.png)
- [Narrow web layout](evidence/dcp-style-deployment/front-design.pepbits.com-narrow.png), [narrow desktop-browser layout](evidence/dcp-style-deployment/desktop.front-design.pepbits.com-narrow.png)

[Hosted CI](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34661401340) was still running in the retained [status snapshot](evidence/dcp-style-deployment/dcp-style-remote-ci.json); full hosted success is not claimed. Browser acceptance does not establish native Tauri, physical-device, native-speaker or production backend acceptance.

Rollback: with Node 24, run `npm run deploy --prefix desktop-clients -- --activate 20260911145802227-397d1cf5`. The prior release remains retained.

## Hosted CI follow-up — 13 September 2026

The documentation commit's [completed hosted run](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34661518865) failed in `feature-browser (features)`. Reported failures were `dcp-designer.mjs`, `page-library.mjs`, `library-preferences.ts`, `clinical-templates.ts` and `page-templates.ts`. The `check`, `native-linux`, `browser`, navigation and product jobs passed. This updates the earlier in-progress observation without changing the retained snapshot or the successful focused public deployment checks. Root-cause fixes and a passing full hosted rerun are not claimed by this documentation follow-up.
