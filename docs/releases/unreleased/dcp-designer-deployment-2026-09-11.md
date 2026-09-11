# DCP visual designer deployment — 11 September 2026

Status: deployed and verified on both public demo sites as `20260911102240415-deec51cf`.

## Source and scope

Implementation committed and pushed as `0dd4199c78535904e69f73b22e544b9689ffa8fa`. The candidate was snapshotted immediately before that commit from the same tested application source. This deployment supersedes the not-deployed status in the [implementation record](dcp-designer-2026-09-11.md). Only this deployment evidence and index were changed after packaging.

The shared DCP visual designer, eight field types, live preview and authenticated demo API design drafts are available. Production DCP conversion, publishing, datasets and entity integration remain pending.

## Verification

Isolated preparation rebuilt both shells and passed packaged HTML/assets and stylesheet parity checks. Activation passed both shell health checks. Read-only Chromium checks on both public hosts verified release identity, administrator login, successful designer API loading, component palette, resolved labels, viewport containment and absence of page JavaScript errors. No designs or business records were created or changed during public verification; save/retry/conflict workflows were tested against the isolated API in the implementation evidence.

- [Web designer](https://front-design.pepbits.com/library/dcp-designer)
- [Desktop-browser designer](https://desktop.front-design.pepbits.com/library/dcp-designer)
- [Release manifest](evidence/dcp-deployment/release.json), [preparation](evidence/dcp-deployment/prepare.log), [activation](evidence/dcp-deployment/activate.log), [live checks](evidence/dcp-deployment/live.log), [browser check](evidence/dcp-deployment/live-check.mjs)
- [Web screenshot](evidence/dcp-deployment/front-design.pepbits.com-dcp-designer.png), [desktop screenshot](evidence/dcp-deployment/desktop.front-design.pepbits.com-dcp-designer.png)

[Remote CI run](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34588937562) failed at documentation contracts because older release guides link to ignored log artifacts absent from Git. Subsequent runtime jobs were skipped. [Failure evidence](evidence/dcp-deployment/remote-ci-failure.log). The full local suite passed as recorded in the implementation evidence; remote CI is not claimed green. Historical artifacts were not silently replaced or relabeled.

## Recovery and boundaries

The demo API restarted after a consistent data backup; existing sessions may need to sign in again. Prior API source and data are retained locally under `.deploy/api-backups/20260911102240415-deec51cf/`. No existing records were migrated.

Previous frontend release `20260910173632033-48931d24` remains available. With Node 24, `npm run deploy --prefix desktop-clients -- --activate 20260910173632033-48931d24` restores both previous frontend shells. The additive API remains compatible with those clients. Full API rollback requires restoring prior source/configuration and restarting while preserving the data backup.

This verifies browser demo deployment, not a native Tauri executable or production DCP backend. Native-speaker review remains pending.
