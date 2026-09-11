# Healthcare reference page deployment — 10 September 2026

Status: deployed and verified on both public demo sites as `20260910173632033-48931d24`.

## Delivered scope and source

Emergency Registration, Inpatient Admission, Consultation Entry and Consultation Entry v2 are available under Page Library. This supersedes the not-deployed status of the [implementation record](care-page-templates-2026-09-10.md). Existing OP Registration remains available. The demo API was restarted with the new care-page endpoint and CSV-backed store.

This release uses the tested uncommitted source based on `dec09d82c2958138326c1531d120b3b8c33e55db`, identified by the implementation [source manifest](evidence/care-page-templates/source-manifest.json). No commit, push or remote CI execution is claimed for this deployment. Only this deployment record and index were added after packaging.

## Verification and evidence

Isolated production preparation rebuilt both frontend shells and passed packaged HTML/asset checks. Activation health checks passed. Public Chromium checks at 1600 × 1000 passed all four routes on both hosts, including release identity, authenticated API loads, patient choices, resolved labels, horizontal containment and absence of page JavaScript errors. No care records were created or changed during public verification. Write workflows and four-language rendering were tested against the isolated API as recorded in the implementation evidence.

- [Web Page Library](https://front-design.pepbits.com/library/list-of-pages)
- [Desktop-browser Page Library](https://desktop.front-design.pepbits.com/library/list-of-pages)
- [Release manifest](evidence/care-page-deployment/release.json), [preparation](evidence/care-page-deployment/prepare.log), [activation](evidence/care-page-deployment/activate.log), [live checks](evidence/care-page-deployment/live.log), [browser check source](evidence/care-page-deployment/live-check.mjs)
- [Web consultation screenshot](evidence/care-page-deployment/front-design.pepbits.com-consultation-entry-v2.png), [desktop consultation screenshot](evidence/care-page-deployment/desktop.front-design.pepbits.com-consultation-entry-v2.png)

## Limits and recovery

This is a demo API deployment, not a native executable test or production clinical integration. Native-speaker terminology review and real clinical connectors remain pending.

The previous frontend release `20260910145113629-2d10ee76` is retained. With Node 24, `npm run deploy --prefix desktop-clients -- --activate 20260910145113629-2d10ee76` rolls back both frontend shells. The additive API can remain available to older clients; a full API rollback requires restoring its prior code/configuration and restarting the API while retaining existing data files. No existing business records were migrated.
