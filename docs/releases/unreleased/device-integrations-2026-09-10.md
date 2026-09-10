# Device integration library — 10 September 2026

Status: deployed to both demo sites; physical device integration remains pending.

## Scope

[Feature and integration guide](../../features/device-integrations.md). Runtime documentation snapshot: `2026-09-10-device-integrations`. Adds three API-driven Library pages for devices, scanners and automation; shares typed contracts, presentation components and a native connector extension point. Includes existing uncommitted OP Registration and barcode work in the working-tree base; those features are not rewritten.

## Added and changed

Focused keyboard-wedge scanner input; context lookup from backend CSV; workstation defaults; tenant device/copy/automation policy; persisted jobs; manual browser print/PDF; simulated receipt/label/drawer dispatch; four business-event routes; exact-operation and event deduplication; cancellation before dispatch. Native transport fails explicitly and preserves the queued job. Four language catalogs and help guides describe the distinction.

## Verification

Testing guide: [1.0.0](../../testing/README.md). Source identity and command evidence follow below. No hosted CI, deployment, physical device acceptance or native executable test is claimed.

## Pending and operational limits

Hardware-specific drivers, signed connector pairing/tickets, production outbox/worker storage, actual scanner/printer/scale/drawer acceptance, camera/document scanning, real application adapters and native-speaker review remain integration work. No real sale/payment or hardware signal is sent by the demo. Browser print requests do not prove printed paper. Existing deployment remains unchanged until explicitly published.

## Verification evidence

Source: [base commit plus changed-source manifest](evidence/device-integrations/source-manifest.json). The capture includes preceding authorized uncommitted changes; no commit or push was made. Earlier barcode deployment evidence remains historical and is not evidence of this feature being live.

| Command / scope | Result | Evidence |
| --- | --- | --- |
| Focused Vitest workspace, scanner and native-port tests | 5 tests passed | [Unit log](evidence/device-integrations/devices-unit.log) |
| `node --test dummy-api/device-integration-store.test.mjs` | 8 tests passed | [Device API log](evidence/device-integrations/devices-api.log) |
| `npm run test:api` | 78 MJS + 33 clinical tests passed; includes the eight device tests | [API regression](evidence/device-integrations/devices-api-all.log) |
| `npm run typecheck` | All packages passed | [Typecheck](evidence/device-integrations/devices-types.log) |
| `npm run build` | Web and desktop web-shell builds passed | [Build log](evidence/device-integrations/devices-build.log) |
| `npm run verify` | Repository gates passed; 151 Library routes, 308 documentation registrations | [Gate log](evidence/device-integrations/devices-verify.log) |
| Managed API / Chromium device suite | Scan recovery, resolved source, browser print surface/request state, automatic demo event, tenant lock and four languages passed | [Browser log](evidence/device-integrations/devices-browser.log) |

The final typecheck preceded the additive native acknowledgement union and final shared-Card styling refinement; final builds, focused unit tests and browser run include those changes. API regression preceded those frontend-only refinements; the device backend was unchanged. Browser printing was stubbed to observe the print surface without contacting an OS printer. No paper output, camera scan or physical keyboard scanner was tested. The full pre-existing frontend unit suite was not repeated.

Screenshots: [scan and print job](evidence/device-integrations/scanner-job.png), [event routing](evidence/device-integrations/automation.png), [Arabic](evidence/device-integrations/ar.png), [Hindi](evidence/device-integrations/hi.png), [Malayalam](evidence/device-integrations/ml.png). Shared documentation headings gained translations; matching revision metadata was refreshed only in the new snapshot, with native review still pending. Earlier release snapshots were preserved.

## Rollout status before deployment

No deployment, API restart, commit, push or remote CI execution was performed for this addition. Deployment requires the changed demo API and both new frontend bundles together. The live barcode correction remains the last deployed release. Real device rollout additionally needs OS/model inventory, an authenticated connector and driver acceptance; these are not implied by passing web tests.


## Deployment follow-up — 10 September 2026

Release `20260910145113629-2d10ee76` was activated on both demo sites after the user requested deployment. Every file in the tested source manifest matched before deployment. The demo API restarted, and `npm run deploy` independently built, packaged and checked both frontend shells before activation. Prior release `20260910142132423-f7ac6cf4` remains available for frontend rollback; the workspace-backed API requires separate rollback handling.

Live authenticated Chromium checks passed on both `front-design.pepbits.com` and `desktop.front-design.pepbits.com`: all three integration pages, exact API scan lookup, selected source record and persisted queued job. One synthetic queued job was created per site. No dispatch, physical print, payment, saved preference or tenant policy was changed. These are browser web-shell checks, not native executable or physical-device acceptance. No commit, push or remote CI execution was performed.

Evidence: [release identity](evidence/device-integrations/deployment/release.json), [deployment](evidence/device-integrations/deployment/devices-deploy.log), [API restart](evidence/device-integrations/deployment/devices-deploy-api.log), [live checks](evidence/device-integrations/deployment/devices-live.log), [live script](evidence/device-integrations/deployment/devices-live.mjs), [web screenshot](evidence/device-integrations/deployment/devices-live-front-design.pepbits.com.png), [desktop web-shell screenshot](evidence/device-integrations/deployment/devices-live-desktop.front-design.pepbits.com.png).
