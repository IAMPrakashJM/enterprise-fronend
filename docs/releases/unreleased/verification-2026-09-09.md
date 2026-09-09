# Library verification — 9 September 2026

Record: `library-preferences-2026-09-09`. Test-guide applicability: [1.0.0](../../testing/v1.0.0/PRE-COMMIT.md), established in this documentation follow-up. The application runs occurred before this versioned guide was written; their scope is mapped to its stable cases rather than claimed to have used a then-existing guide.

## Source and environment

Base commit: `82656eeedf809c8419bd6e2ae4674580cb3ff71a`. The final delivered working tree is described by the [file manifest](manifest-library-preferences-2026-09-09.json), including its digest algorithm and exclusions. No new commit/tag was created. Do not assign this final digest to every intermediate run: corrections and targeted follow-ups occurred during implementation.

The recorded work used Node 24.20.0, local Vitest and Playwright installations, an isolated demo API on port 3209, the desktop development shell on 3109, and a web development shell on localhost:3110. Node 24.20.0 and npm 11.19.0 were read again during documentation preparation; npm/browser-engine versions were not uniformly captured in the original result logs. Do not invent exact browser version acceptance from their engine names.

Executor: coding assistant/local environment. Human/domain/native-speaker sign-off: not recorded. New hosted CI run: not executed. Browser preference requests were intercepted per context, and API storage was isolated in a temporary directory. No actual tenant-policy changes or real patient data were used.

## Results

| Check | Recorded result | Scope/cases | Evidence |
| --- | --- | --- | --- |
| Full Vitest suite | Passed | 1,485 tests, 101 files | [Unit summary](evidence/unit-suite.txt) |
| Follow-up Library/query tests | Passed | 16 tests, 3 files; overlaps full suite | [Focused summary](evidence/focused-followup.txt) |
| Follow-up shared component test | Passed | 11 tests, 1 file; overlaps full suite | [Shared summary](evidence/shared-followup.txt) |
| Package TypeScript | Passed | Every package in the existing checker | [Typecheck](evidence/typecheck.txt) |
| Full property verification | Passed | Existing checks plus Library gate | [Gate summary](evidence/property-gates.txt) |
| Production web and desktop build | Passed | Two application build tasks | [Build summary](evidence/build.txt) |
| Chromium, desktop development shell | Passed | All 129 routes; managed table CSS and lock/preview flow | [Desktop browser](evidence/desktop-chromium.txt) |
| Chromium, web development shell | Passed | All 129 routes; managed table CSS and lock/preview flow | [Web browser](evidence/web-chromium.txt) |
| Firefox, desktop development shell | Passed | All 129 routes; managed table CSS and lock/preview flow | [Firefox](evidence/desktop-firefox.txt) |
| Final compact browser follow-up | Passed | Three selected routes; scales, radius and badge assertion included | [Compact follow-up](evidence/compact-followup.txt) |
| WebKit launch | Blocked | No route cases ran; missing system libraries | [Blocked result](evidence/webkit-launch.txt) |
| Native Tauri executable | Not run | Browser desktop shell is not native execution | Separate acceptance required |
| Native-speaker wording review | Pending | Four-language catalog registration is not wording approval | Separate acceptance required |
| New remote CI / deployment | Not run | Local configuration/build only | No run/deployment link exists |

The [machine evidence](evidence/results.json) records commands, original-log hashes, retained-artifact hashes and log modification times. Numeric exit codes were not uniformly retained; null exit-code fields are intentional. Selected result lines are retained, not complete raw logs. The [CSV](evidence/browser-routes.csv) records 390 route observations: three complete 129-route runs and one three-route follow-up. These are not 390 unique business-flow tests.

## Failures and follow-ups

The implementation audit found seven gaps despite passing original static checks. Corrections introduced meaningful policy and rendering tests.

During validation, the full suite initially exposed access-check rendering that depended on ERP context too early; access checks were kept before the presentation wrapper. The web browser run needed the correct allowed local origin. A later web assertion observed an outgoing page during navigation; the wrapper received a stable page ID and the browser suite waits for the requested route. Test-only type errors were corrected and TypeScript rerun.

After the passing full suite, final formatting and presentation changes received focused Library/query and shared-component runs, browser follow-ups and production builds. Visual review found wrapped short status labels; the shared badge keeps them on one line. Final compact browser assertions checked computed scales, zero radius and badge whitespace. Earlier 129-route runs did not include all of those later focused assertions.

The documentation follow-up adds rules, records, inventories and a validation tool; it does not change application behavior. Its own validation is recorded in the [documentation follow-up](documentation-2026-09-09.md). Original runtime logs are not relabeled as a fresh documentation-task execution.

## Coverage limits and release conditions

A passing navigation run does not validate every combination of 53 preferences or every business workflow. Engine-level tests apply to shared rendering branches, not arbitrary clinical/accounting rules. Release acceptance should run the supported built artifacts and required native/browser/platform combinations against the intended integration.

WebKit was blocked by host dependencies including libwoff, libevent, GStreamer and libavif. Production identity/services, application-owned domain rules, native execution and native wording acceptance remain outside the demonstrated result. No database migration, new production monitoring integration, public npm distribution or completed in-app documentation backlog is established here.

Before publication, bind evidence to the actual final commit/candidate, run required hosted checks, capture artifact checksums and complete the intended supported-environment acceptance. Keep this development record as history instead of rewriting it to imply those future actions already occurred.
