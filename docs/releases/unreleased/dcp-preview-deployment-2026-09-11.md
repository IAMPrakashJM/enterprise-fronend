# DCP form preview deployment — 11 September 2026

Status: deployed and verified on both public demo sites as `20260911105427634-cc931847`.

## Source and delivered behavior

Application source committed and pushed as `3ea49086971e9b8d4e9bddd2f431e9df048f966c`. Preparation captured the same tested source immediately before the commit. This record supersedes the not-deployed status of the [preview implementation](dcp-preview-2026-09-11.md). Only deployment evidence and the release index changed after packaging.

Live preview now opens the current unsaved form with its title and shared fields, hides authoring controls, validates temporary answers, preserves edits when returning to Design, and clears only test answers with Reset preview. The demo API restarted to load the new four-language help snapshot. Existing sessions may require sign-in again.

## Evidence and verification

Fresh production builds, packaged HTML/assets, stylesheet parity and activation health checks passed for both shells. Public Chromium verified release identity, authenticated API load, unsaved form preview, hidden authoring controls, validation, return-to-design preservation, answer reset, desktop containment and absence of page errors on both hosts. No API design saves or business-record writes occurred during public checks.

- [Web designer](https://front-design.pepbits.com/library/dcp-designer), [desktop-browser designer](https://desktop.front-design.pepbits.com/library/dcp-designer)
- [Manifest](evidence/dcp-preview-deployment/release.json), [prepare](evidence/dcp-preview-deployment/prepare.log), [activate](evidence/dcp-preview-deployment/activate.log), [live checks](evidence/dcp-preview-deployment/live.log), [browser source](evidence/dcp-preview-deployment/live-check.mjs)
- [Web preview screenshot](evidence/dcp-preview-deployment/front-design.pepbits.com-dcp-designer.png), [desktop preview screenshot](evidence/dcp-preview-deployment/desktop.front-design.pepbits.com-dcp-designer.png)

[Remote CI](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34591512101) stopped at documentation contracts because older release documents link to historical log files absent from Git. [Failure log](evidence/dcp-preview-deployment/remote-ci.log). This known repository issue remains unresolved; remote CI is not claimed green. Local focused checks are retained in the implementation record.

## Recovery and boundaries

Previous frontend release `20260911102240415-deec51cf` remains available. With Node 24, `npm run deploy --prefix desktop-clients -- --activate 20260911102240415-deec51cf` restores both previous shells. Previous API source and consistent data backup are retained locally under `.deploy/api-backups/20260911105427634-cc931847/`; no data migration occurred.

This is browser demo acceptance, not native Tauri execution, production DCP backend integration or native-speaker sign-off.
