# Identity device library — 10 September 2026

Status: implemented and locally tested; not deployed.

## Scope

[Feature and integration guide](../../features/identity-devices.md). Runtime snapshot: `2026-09-10-identity-devices`. Three Library destinations extend the existing device group with card/EID readers, passport scanning and one-to-one patient biometric verification demos. Existing working-tree OP Registration, barcode and device-integration work is retained.

## Added and changed

Synthetic API capture requests, selected-patient binding, per-workstation expiry, permission acknowledgement, tenant biometric opt-in/reader lock, personal reader preference, mismatch/expired-document scenarios, cancellation and manual fallback. Results always declare `authenticated: false`; no patient record is modified. Native choices explicitly report connector unavailable. Shared TypeScript contracts, UI components, four-language catalogs and help are included.

## Verification

[Testing guide 1.0.0](../../testing/README.md). Commands and retained source/test evidence follow below. No physical device, real authentication, native runtime, deployment or remote CI execution is claimed.

## Pending and rollout

Country/provider/model clarification and real SDK/connector/enrolment/verification remain integration work. “Red card” is unresolved; smart-card/RFID is generic, not a claim about a specific device. No real biometric data is collected. Deployment must include the API and frontend bundles together. Existing deployment is unchanged during development; no commit or push has been requested.

## Verification evidence

Source identity: [base commit and changed-source manifest](evidence/identity-devices/source-manifest.json). This is a working-tree delivery with earlier authorized changes retained, not a new commit. Source files were unchanged between the final builds/browser checks and this capture.

| Command / scope | Result | Evidence |
| --- | --- | --- |
| Focused workspace/native envelope Vitest tests | 5 passed: manual fallback, reader lock, cross-page active device, expired/mismatched ticket and opaque envelope | [Unit log](evidence/identity-devices/identity-unit.log) |
| `node --test dummy-api/identity-device-store.test.mjs` | 8 passed: scope, patient binding, no authentication, persistence, policy, expiry, retries, raw-input rejection and fallback | [Identity API](evidence/identity-devices/identity-api.log) |
| `npm run test:api` | 86 MJS + 33 clinical tests passed, including the eight identity tests | [API regression](evidence/identity-devices/identity-api-all.log) |
| `npm run typecheck` | Every package passed | [Types](evidence/identity-devices/identity-types.log) |
| `npm run build` | Both frontend bundles passed | [Build](evidence/identity-devices/identity-build.log) |
| `npm run verify` | Repository gates passed; 154 Library routes and 311 documentation registrations | [Verification](evidence/identity-devices/identity-verify.log) |
| Managed API / Chromium identity suite | Three pages, EID demo details, expired passport, biometric opt-in, manual fallback, `authenticated:false` and four languages passed | [Browser](evidence/identity-devices/identity-browser.log) |

Screenshots: [EID demo](evidence/identity-devices/eid.png), [passport demo](evidence/identity-devices/passport.png), [biometric demo](evidence/identity-devices/biometric.png), [Arabic](evidence/identity-devices/ar.png), [Hindi](evidence/identity-devices/hi.png), [Malayalam](evidence/identity-devices/ml.png). Screenshots show synthetic records only. The final focused tests, typecheck, builds and browser run include the cross-page active-reader correction and identity connector wrapper. The full pre-existing frontend unit suite was not repeated.

These are local/browser and demo-API results. They do not prove EID authority connectivity, passport chip authenticity, biometric matching/liveness, enrolment quality, physical-device support or native executable acceptance. Native-language review remains pending. No deployment, API service restart, commit, push or hosted CI run was performed for this addition.

## Source-control follow-up — 10 September 2026

The user subsequently requested pull, commit and push for the accumulated OP Registration, barcode/QR, device-integration and identity-device changes. `git pull --ff-only origin main` found no incoming changes at base `fead66a4b767ad5ba5561eb9e43b0dcab0297c91`. Earlier statements above describe the original delivery before this request.

The first full local CI run found one component-catalog omission: `ScannerInput` was not indexed. The existing form-controls text example now demonstrates focused Enter scanning and includes generated integration code. CSV line endings and a whitespace-only E2E line were normalized without changing data. See the [final tested source manifest](evidence/identity-devices/source-control/source-manifest.json). Historical deployment and browser evidence is preserved; these pre-commit checks do not represent a new deployment, physical-device test or native executable test.

Final `npm run ci` passed locally: all package typechecks, 1,533 frontend tests, 119 API tests, two E2E registry tests, 14 deployment-script tests, both builds and repository verification gates. The deployment-script tests validate tooling; they do not deploy the application. Documentation validation and six documentation-tool tests also passed.

Evidence: [initial failure](evidence/identity-devices/source-control/initial-ci.log), [passing full CI](evidence/identity-devices/source-control/final-ci.log), [documentation checks](evidence/identity-devices/source-control/documentation.log), and [documentation lifecycle](evidence/identity-devices/source-control/documentation-lifecycle.log). The lifecycle still reports 1,101 explicit authoring/native-review backlog items. Physical integrations and identity-device deployment remain pending as described above. Git publication is tracked by the containing commit and remote branch; no remote CI result is asserted in this local evidence.
