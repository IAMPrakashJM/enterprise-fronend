# Healthcare reference pages — 10 September 2026

Status: implemented; local verification evidence below. Not committed or deployed as part of this request.

## Scope

[Feature and integration guide](../../features/care-page-templates.md). Four new Page Library destinations reproduce the supplied emergency, inpatient and two consultation designs. Existing OP Registration, the application shell and the original consultation-entry route remain available. Source reference HTML files are unchanged.

## Added and changed

Shared page composition, backend field definitions, synthetic patient/bed CSV fixtures, authenticated commands, scoped saved records, idempotency, version conflict protection, bed reservations, order detail retention, demo signing/addenda and localized help. New runtime documentation snapshot: `2026-09-10-care-pages`.

## Verification

[Current testing guide](../../testing/README.md). Source identity is base commit `dec09d82c2958138326c1531d120b3b8c33e55db` plus the uncommitted file hashes in the [source manifest](evidence/care-page-templates/source-manifest.json).

- Local `npm run ci` with Node 24: all package typechecks, 1,536 frontend tests, 126 API tests, two browser-suite registry tests, 14 deployment-tool tests, both frontend builds and repository verification gates. See the [complete local check log](evidence/care-page-templates/ci.log).
- Chromium at 1600 × 1000 with an isolated demo API: all four new routes, record creation, multiple emergency pathways, inpatient source/type fields, bed reservation and admission, consultation order detail persistence, and English/Arabic/Hindi/Malayalam rendering. See the [browser log](evidence/care-page-templates/browser.log).
- Seven focused storage tests cover tenant/application/owner isolation, persistence, idempotency, conflicts, temporary identity, compatible beds, admission, retained order metadata and signed-record/addendum protection. See the [focused API log](evidence/care-page-templates/api-focused.log).
- Documentation links/structure and page-help lifecycle checks: [documentation log](evidence/care-page-templates/documentation.log).

Screenshots: [emergency](evidence/care-page-templates/screenshots/emergency-registration.png), [inpatient](evidence/care-page-templates/screenshots/inpatient-admission.png), [consultation v1](evidence/care-page-templates/screenshots/consultation-entry-design.png), [consultation v2](evidence/care-page-templates/screenshots/consultation-entry-v2.png), [Arabic](evidence/care-page-templates/screenshots/ar.png), [Hindi](evidence/care-page-templates/screenshots/hi.png), [Malayalam](evidence/care-page-templates/screenshots/ml.png).

These are local source and browser checks. No remote CI, native executable, production medical integration or deployed release is asserted. Layout checks are not a claim of pixel equality across every preference combination. The browser log includes an aborted background documentation request during navigation; the care-page assertions passed.

## Pending and rollout

Native-speaker terminology review and real clinical-system connectors remain pending. These are frontend templates backed by the demo API. Deployment requires both frontend bundles and the API, and is not part of this request.
