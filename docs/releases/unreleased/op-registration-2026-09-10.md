# OP Registration delivery — 10 September 2026

Status: deployed to both demo web sites on 10 September 2026 after the user requested deployment; source changes remain uncommitted and unpushed. Source base: `fead66a`; changed files and test evidence are recorded below. Testing guide: [1.0.0](../../testing/v1.0.0/PRE-COMMIT.md).

## Added

- One-page OP Registration under Page Library, with the supplied five-step structure and internal care tabs, shared controls and existing application shell.
- Typed registration contracts, injected adapters, CSV configuration and atomic demo encounter persistence, server authorization/validation and idempotent commands.
- Canonical four-language interface messages, Page Library example, authored in-app guide and [feature documentation](../../features/op-registration.md).

## Changed

- Navigation gains the new route; existing page implementations remain available.
- Draft policy changes scrub registration drafts as well as existing shared record drafts.
- Documentation release pointer advances to `2026-09-10-op-registration`; historical snapshots remain unchanged.

## Fixed during verification

- Keep progress, patient context and actions visible around an independently scrolling content area.
- Reuse shared checkboxes for identity and consent, matching the supplied interaction pattern.
- Keep generated language fallbacks in separate build chunks while retaining on-demand non-English loading and the existing bundle budget.

## Verification and source evidence

Source base: `fead66a4b767ad5ba5561eb9e43b0dcab0297c91`; working-tree source digest: `cee2933bfd91dc2862ba1f1a0e5a724b9cc93a96db3ac4371d9439a92619b4cb`. The [source manifest](evidence/op-registration/source-manifest.json) records changed implementation, tests, runtime configuration and documentation-tool hashes; prose/evidence are excluded to avoid self-reference.

| Local command / scope | Result | Evidence |
| --- | --- | --- |
| `npm test -- --maxWorkers=1` | 1,521 tests passed in 111 files | [Full unit log](evidence/op-registration/unit-final.log) |
| `npm run test:clinical-api` | 33 tests passed, including eight registration store tests | [API log](evidence/op-registration/op-clinical-tests.log) |
| Managed demo API + Chromium registration suite | Five steps, recovery, persistence, services, payment, checkout, CSV download, print-media isolation, four languages and Arabic RTL passed | [Browser log](evidence/op-registration/op-browser.log) |
| Targeted component catalog + registration UI after final gate fixes | Eight tests passed | [Targeted log](evidence/op-registration/post-gate-tests.log) |
| `npm run typecheck` | Every package passed | [Typecheck log](evidence/op-registration/typecheck-final.log) |
| `npm run build` | Web and desktop web-shell builds passed | [Build log](evidence/op-registration/build-final.log) |
| `npm run verify` | Repository gates passed, including bundle budget, localization, documentation and 141 Library routes | [Verification log](evidence/op-registration/verify-final.log) |

The first full unit run exposed an unindexed PrintDocument example plus three resource-contention timeouts. The example was added, targeted tests passed, and the full single-worker suite passed. Its [initial log](evidence/op-registration/initial-unit-run.log) is retained. Subsequent gate fixes add an explicit `.ts` export, render the example identifier through DataValue, and split generated fallback catalogs into per-language build chunks. Targeted tests, typechecking and rebuilt repository gates cover these final changes; the full unit and browser runs preceded these limited corrections.

Tests used Node 24.20.0. Local Chromium execution used the desktop web shell at 1700×1050 and 1366×900 with an isolated synthetic demo API. Print verification used print-media CSS, not a physical printer. CSV download was exercised; the shared XLSX path was not separately exercised in this new page browser journey. No native executable, other browser engine, remote CI or deployed acceptance is claimed.

## Known boundaries

The demo API is a single-process CSV store. Existing standalone consultation/triage/billing journals are not automatically synchronized with these new encounter records. Payer, payment, messaging, urgent response and signature operations are simulations. Native-speaker and clinical review, native desktop execution and remote CI are pending. The generic record navigation preference does not replace this explicitly requested five-step flow.

## Deployment follow-up — 10 September 2026

The user subsequently authorized deployment. `npm run deploy` built an isolated source snapshot, checked both packaged shells, activated release `20260910120617832-2972abbe`, and verified local service health. The demo API was restarted using `bash run.sh restart api` to load the registration store and configuration. The tested source manifest still matched every recorded source file before publication. No commit or push was performed.

Live Chromium checks passed at both `https://front-design.pepbits.com/library/op-registration` and `https://desktop.front-design.pepbits.com/library/op-registration`: authenticated navigation, five-step rendering, successful API configuration and patient loading, identity-to-visit transition, visible bottom actions and no page errors. These read/interaction smoke checks did not save records or repeat the full local clinical transaction journey. The desktop site remains a browser shell, not a native executable test.

Evidence: [deployment log](evidence/op-registration/deployment.log), [release identity](evidence/op-registration/deployed-release.json), [live smoke log](evidence/op-registration/live-smoke.log), [smoke script](evidence/op-registration/live-smoke.mjs), [web screenshot](evidence/op-registration/live-web.png), [desktop screenshot](evidence/op-registration/live-desktop.png). Previous frontend release `20260910102230415-e7419c6c` remains available for rollback. API source/configuration runs from this workspace and is not part of the packaged frontend rollback.

## Reference-style follow-up — 10 September 2026

After live review, the user requested closer fidelity to the supplied HTML. Shared registration components now implement soft icon choice cards, completed-step checks, larger panel headings/descriptions, search-before-filter ordering, patient initials, expanded narrative fields, quieter contextual panels and a straight full-width footer. The main heading and panel descriptions match the reference and are localized through canonical catalogs. These are presentation changes; API contracts and transaction rules remain unchanged. Effective theme and shape preferences still apply.

Style source digest: `e03181b78fa8835fba37f8c0be8d2d725724900758ee6a6ad768689696a9430c` ([manifest](evidence/op-registration/style/source-manifest.json)). Three registration UI tests passed ([unit log](evidence/op-registration/style/unit.log)); all packages typechecked ([log](evidence/op-registration/style/typecheck.log)); both frontend builds and repository gates passed ([build](evidence/op-registration/style/build.log), [verification](evidence/op-registration/style/verify.log)). The final managed-API Chromium journey passed after the last CSS/catalog changes, including four languages, RTL and desktop layouts ([browser log](evidence/op-registration/style/browser.log), [visit screenshot](evidence/op-registration/style/02-visit.png)). Typechecking and targeted unit tests preceded the final copy/CSS-only adjustments; final builds and browser checks include them. No backend behavior changed, so the prior API suite was not repeated. Earlier implementation/deployment evidence is preserved.

Style update deployed as `20260910121442766-adf159c0` to both demo web sites; the API restarted to serve updated canonical messages. [Deployment log](evidence/op-registration/style/deployment.log), [release](evidence/op-registration/style/release.json), [live smoke](evidence/op-registration/style/live.log), [web screenshot](evidence/op-registration/style/live-web.png) and [desktop screenshot](evidence/op-registration/style/live-desktop.png) are retained. Both live checks passed without saving records. The smoke script’s untranslated-key check was narrowed to key-shaped `registration.<letter>` strings because the valid heading “Ambulatory registration.” otherwise produced a false positive. See the [updated smoke script](evidence/op-registration/style/live-smoke.mjs). No commit/push or native executable testing was performed.
