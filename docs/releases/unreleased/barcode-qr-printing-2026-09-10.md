# Barcode and QR printing library — 10 September 2026

Status: deployed to both demo web sites on 10 September 2026 following the subsequent deployment request; source changes remain uncommitted and unpushed. Existing OP Registration deployment evidence remains historical. Testing guide: [1.0.0](../../testing/v1.0.0/PRE-COMMIT.md).

## Added

Seven Library routes share backend-generated barcode/QR artwork, physical label previews, batch sheets, wristbands, payment demos, print history and printer profiles. Tenant policies govern copies, reprints and locked paper profiles. TypeScript integration examples and localized help accompany each page. See the [feature and integration guide](../../features/barcode-qr-printing.md).

## Changed

The API now installs a pinned barcode encoder from its own package lock. Stack dependency checks include the API. The documentation release advances to `2026-09-10-label-printing` while preserving prior snapshots. Library inventory increases from 141 to 148 routes.

## Verification

Source base: `fead66a4b767ad5ba5561eb9e43b0dcab0297c91`; working-tree digest `c990b862c5225cf05c4eaa5f886346c6ac630548deac89c1e15137c1a66d972e` ([manifest](evidence/label-printing/source-manifest.json)). This includes the prior uncommitted OP Registration work; that history was not discarded or republished.

| Command / scope | Result | Evidence |
| --- | --- | --- |
| `npm test -- --maxWorkers=1` | 1,521 tests in 111 files passed | [Unit log](evidence/label-printing/unit.log) |
| `npm run test:api` | 69 MJS tests plus 33 clinical API tests passed | [API regression](evidence/label-printing/api-regression.log) |
| `node --test dummy-api/label-printing-store.test.mjs` | Six tests passed after final encoder-margin change | [Label API](evidence/label-printing/label-api.log) |
| `npm run test:deployment` | 14 packaging/process tests passed; no deployment performed | [Log](evidence/label-printing/deployment-tests.log) |
| `npm run typecheck` | Every package passed | [Log](evidence/label-printing/typecheck.log) |
| Final `npm run build` and `npm run verify` | Both frontend builds and repository gates passed; 148 Library destinations | [Build](evidence/label-printing/build.log), [gates](evidence/label-printing/verify.log) |
| Managed demo API + Chromium browser suite | Batch copies, print-media isolation, PDF, audit requests, payment simulation, wristbands and printer locks passed | [Browser](evidence/label-printing/browser.log) |
| Localization / document checks | Four UI languages and Arabic RTL passed; six documentation-tool tests passed | [Documentation tests](evidence/label-printing/documentation-tests.log), [lifecycle](evidence/label-printing/documentation-lifecycle.log) |

Full unit/typecheck runs preceded the final history-pagination refinement. The final builds and browser journey include pagination. API regression preceded the increased barcode quiet margin; the six label API tests and final browser run were repeated afterward. Final test-only decoder/PDF refinements do not change runtime behavior. No remote CI execution is claimed; its installation workflow was updated to install the pinned backend dependencies.

The independent ZXing decoder reads Code 128 and eight QR payloads from browser-rasterized API SVGs at their native viewBox dimensions using pure-barcode mode (aligned source artwork). Initial intrinsic-size rasterization and general camera-detection assumptions were unsuitable for this deterministic artwork check. Quiet margins were also increased. This confirms encoded contents of pristine artifacts, not camera, damaged-label or physical scanner performance. Native-speaker review is not implied by the automated language checks.

Retained synthetic examples: [specimen labels](evidence/label-printing/specimen.png), [patient wristband](evidence/label-printing/wristband.png), [payment QR](evidence/label-printing/payment.png), [printer policy](evidence/label-printing/profiles.png), [Arabic](evidence/label-printing/ar.png) and [A4 specimen PDF](evidence/label-printing/specimen-sheet.pdf). Chromium print-to-PDF produced an approximately A4 media box (594.96 × 841.92 points). A real printer was not connected.

## Pending

Physical printer/scanner acceptance, direct thermal/native printing, real payment providers, production audit/retention, native-speaker review and real application record mappings remain external integrations. Browser print/PDF is implemented; print-request history is not proof of paper output. Backend-native PDF generation and field-level label policy editing are not included. No remote CI execution or native executable acceptance is claimed.

## Deployment follow-up — 10 September 2026

User-authorized deployment activated release `20260910140451394-5f32a08a`. The source manifest matched every recorded implementation file before deployment. `npm ci --prefix dummy-api --omit=dev` installed the pinned backend runtime encoder, `bash run.sh restart api` loaded the new endpoint/configuration, and `npm run deploy` independently built and smoke-tested both packaged frontend shells before activation. Previous frontend release `20260910121442766-adf159c0` is retained for rollback; the workspace-backed API is a separate rollback responsibility.

Authenticated live Chromium checks passed on `front-design.pepbits.com` and `desktop.front-design.pepbits.com`: all seven Library routes, localized-key rendering, backend-generated specimen artwork, persisted synthetic print jobs and print-media shell isolation. One synthetic preview job was created per site; neither physical printing nor payment was requested. Browser checks are not native executable tests.

Evidence: [deployment log](evidence/label-printing/deployment/deployment.log), [API dependency install](evidence/label-printing/deployment/api-install.log), [release identity](evidence/label-printing/deployment/release.json), [live checks](evidence/label-printing/deployment/live.log), [smoke script](evidence/label-printing/deployment/live-smoke.mjs), [web screenshot](evidence/label-printing/deployment/web.png), [desktop screenshot](evidence/label-printing/deployment/desktop.png). No commit or push was performed.

## Stock-fit correction — 10 September 2026

A payment QR could inherit 110 × 40 mm wristband stock and fail with a generic validation notice. The shared physical-fit predicate now filters printer choices, selects compatible stock for the preview without writing the personal default, and preserves incompatible tenant locks with a localized field explanation and blocked generation. Label/paper dimensions are shown. Backend fit failures include `fieldErrors.profileId`; the adapter preserves them. Runtime help is a new patch snapshot, `2026-09-10-label-stock-fit`; earlier snapshots and evidence remain unchanged.

Correction checks: two focused workspace tests, seven label API tests, all package typechecks, both builds and the full repository verification command passed. Managed-API Chromium checks reproduced a saved wristband default followed by both invoice and static merchant QR previews, plus existing batch/print-media/PDF, independent symbol decoding, payment simulation, wristband, tenant-lock and four-language flows. These are browser tests, not physical printer, native app or native-speaker acceptance.

Evidence: [source manifest](evidence/label-printing/stock-fit/source-manifest.json), [UI tests](evidence/label-printing/stock-fit/label-fit-unit.log), [API tests](evidence/label-printing/stock-fit/label-fit-api.log), [typechecks](evidence/label-printing/stock-fit/label-fit-types.log), [builds](evidence/label-printing/stock-fit/label-fit-build.log), [gates](evidence/label-printing/stock-fit/label-fit-verify.log), [browser run](evidence/label-printing/stock-fit/label-fit-browser.log), [static merchant preview](evidence/label-printing/stock-fit/static-compatible.png). The full prior unit/API regression counts above are historical and were not repeated for this correction.

The correction deployed as `20260910142132423-f7ac6cf4` to both demo shells after restarting the demo API. Live authenticated Chromium checks created one static merchant QR preview per site using compatible A4 stock. Both API responses and rendered images passed; no saved preference, payment status or print attempt was changed. Previous release `20260910140451394-5f32a08a` remains available for frontend rollback. No commit, push or remote CI execution was performed.

Correction deployment evidence: [release identity](evidence/label-printing/stock-fit/release.json), [deployment log](evidence/label-printing/stock-fit/label-fit-deploy.log), [API restart](evidence/label-printing/stock-fit/label-fit-api-restart.log), [live check log](evidence/label-printing/stock-fit/label-fit-live.log), [live script](evidence/label-printing/stock-fit/label-fit-live.mjs), [web](evidence/label-printing/stock-fit/label-fit-live-front-design.pepbits.com.png), [desktop web shell](evidence/label-printing/stock-fit/label-fit-live-desktop.front-design.pepbits.com.png).
