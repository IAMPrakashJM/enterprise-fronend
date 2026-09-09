# What is left

_7 September 2026._

Written after the client-side work reached the point where the obvious things
are done. This is the ranked list of what remains, what each would cost, and —
for the ones that are not ours to do — who they are waiting on.

## Component Library — 9 September 2026

The Library now has dedicated component groups, interactive demos and generated
copyable React examples covering all 75 public shared UI components.
Deployed to both demo sites after all six remote CI jobs passed; public Library
and four-language catalog checks passed. See
[Component Library guide](component-library.md) for usage and integration.
Native translation review remains pending.

## Draft Recovery Center — 8 September 2026

The shared recovery center lists current-application drafts with search, type/status
filters, expiry, owner-only open/discard actions and mandatory policy information.
Deployed to both demo sites after all six CI jobs passed; live recovery-center and
four-language catalog checks passed.
See [Draft Recovery Center](draft-recovery-center.md) for workflows, API integration,
verification and the external production-storage/native-review dependencies.

## Shared durable drafts — 8 September 2026

Forms, import mappings and approval comments now use the shared durable draft engine,
with explicit restoration and mandatory tenant storage, retention and exclusion rules.
Deployed to both demo sites after all six CI jobs passed; live controls/API checks passed.
See [shared draft recovery](shared-draft-recovery.md) for user flows, API integration,
conflicts, storage limits and verification.

## User-facing error recovery — 8 September 2026

Localized recovery messages/actions, retained in-memory work through recoverable
failures and session renewal, and shared workflow regression coverage are implemented
and deployed on both demo sites. All six CI jobs and live recovery checks passed.
See [user error recovery and integration](user-error-recovery.md) for exact behavior,
tests, integration requirements and limits.

## Sentinel monitoring — 8 September 2026

The local demo collector, monitoring API and administrator incident screen are
implemented. See [Sentinel monitoring](sentinel-monitoring.md) for capture points,
privacy constraints, tests and native runtime limitations. Deployed on both demo sites;
see the [verified release](sentinel-deployment-2026-09-08.md).

## Documentation Center — 8 September 2026

A shared, versioned documentation viewer, release/patch archive and persistent
change notices are implemented. See the [integration guide](documentation-center-integration.md)
and [page coverage](documentation-coverage.md) for exact scope: 179 references,
four initial authored workflows, and the remaining content/review work.
Deployed as release `20260908162629872-aaba59f3` on both demo sites. Detailed
content and native/domain review remain pending as documented.

## Engineering review follow-up — 8 September 2026

Tenant/application preference defaults and administrator locks are implemented
and locally validated. See [tenant preference policies](tenant-preference-policies.md)
for the user workflow, API contracts, storage and production integration boundaries.
The preference-policy change passed remote CI and is deployed on both demo sites.

The review's CI coverage, catalog bundle/loading, API method handling and costing
import/export issues have passed remote CI and been deployed. See the
[verified corrections and implementation](review-follow-up-2026-09-08.md).
The earlier review documents are historical snapshots, not the current backlog.

## Record panels — 8 September 2026

Reusable attachment, comment, related-record and activity panels are implemented
with product adapters and persisted demo behavior. See [record-panels.md](record-panels.md)
for scope, validation and production integration boundaries.

## Product starter — 8 September 2026

Application-owned product composition, starter generation, page/action role rules,
login branding and record/worklist service injection are implemented. The second
product example exercises reuse without copied shell internals. See
[product-profiles.md](product-profiles.md) for current scope and remaining adapters.

## Latest development batch

The four requested areas now have implementations and regression coverage:
server-paged worklists with refresh and partial archive results, account-owned
personal views, conditional/dependent form rules with server field errors, and
targeted desktop keyboard/theme/split-pane validation. See
[worklist-workflows.md](worklist-workflows.md) for contracts and coverage limits.
Activated as `20260907172055053-faace50b`; authenticated checks passed on both public hosts.
The older estimates below describe broader coverage still to extend.

## Where the code stands

So the list below is readable without going and counting:

| | |
|---|---|
| Unit tests | 1329 tests across 73 files; no unhandled errors in the panel batch |
| Deployment tests | 14, plus real launcher activation/rollback checks on isolated ports |
| Structural checks | 12 `verify:*` scripts, 533 assertions |
| Browser suites | 9, 151 assertions, run against a real Chromium |
| Accessibility | WCAG 2.1 AA across seven screens, **no known failures** |
| Themes | fourteen, every one measured for text, fills and module marks |
| Egress paths under one classification registry | URL, device storage, AI provider, file export, print |

Every package that holds branching logic has tests. The two that do not are
`tokens` (a CSS file) and the mock-row generator's data tables.

---

## 1. Deployment isolation — complete

The release workflow is implemented in `scripts/deploy.mjs`. It snapshots source
into a temporary build directory, installs the lockfile, builds against explicit
API URLs, verifies the artifacts, and packages self-contained web/desktop releases.
Both packages are smoke-tested after the build directory has been deleted.

`npm run deploy:prepare` prepares a candidate without changing running services.
`npm run deploy` also activates it, restarts only web and desktop, and checks the
release identity, HTML and assets. A failed activation restores the previous
release. The production launcher refuses to serve workspace output.

See [deployment.md](deployment.md) for setup, rollback and isolated test ports.
Deployment lifecycle tests now run in CI.

**Activated on 7 September 2026:** release `20260907124618130-3b6cb502`.
Both public hosts now proxy to release-backed listeners on ports 3100 and 3101.
Release identity, HTML, referenced assets and `/api/health` were verified through
HTTPS on both `front-design.pepbits.com` and `desktop.front-design.pepbits.com`.
The API process was not restarted. The launchers bind to `0.0.0.0` by default
because the reverse proxy reaches the host through its Docker bridge address.

**Done:** ordinary workspace builds cannot change the files these production
processes serve; future deployments use the release activation command.

## 2. Run the browser suites against the desktop shell

**Effort:** one to two days, most of it deciding what "the same" means.

Eight of the nine browser suites only ever load the web shell. The desktop shell
ships, and the two **deliberately** differ: tabs instead of browser navigation,
MDI, detached windows, and a different bundler with its own build-time env
inlining — the same trap that caused item 1, unexercised on that side.

Export, print, the filter bar, the reference-data notice, the conflict panel and
every accessibility check have never been rendered in the desktop shell.

Most suites already take `BASE`, so the runner change is small. The work is in
the divergences: a suite that passes against both shells is a claim that they
agree, and where they should not agree the suite has to say so out loud rather
than being quietly skipped.

**Done when:** each suite either runs against both shells or carries a written
reason why it belongs to one.

## 3. A keyboard-only pass

**Effort:** one day.

The dimension axe structurally misses. axe checks that a control **has** an
accessible name and a role; it never presses Tab. This application is unusually
full of the things that go wrong there: a command palette, three overlay layers,
a focus trap, split panes, MDI frames, and a conflict panel that appears above a
table in the middle of an edit.

**Done when:** a suite Tabs from the top of each screen and asserts that focus
never leaves an open modal, that Escape returns it where it came from, and that
every interactive element is reachable without a mouse.

## 4. axe against a dark theme and the high-contrast theme

**Effort:** an hour.

The accessibility suite audits whichever theme is active, which is `nexora`.
`verify:contrast` covers text tokens, accent fills and module marks for all
fourteen themes in arithmetic — but axe catches what arithmetic cannot: a colour
hard-coded in a component, a focus ring that disappears against a dark ground.

**Done when:** the suite runs its sweep under at least one dark theme and the
high-contrast theme as well as the default.

## 5. Right-to-left

**Effort:** unknown until something renders it; assume two days and expect more.

`dir="rtl"` is set for Arabic and nothing has ever displayed it. A pass in
Arabic would almost certainly find reversed paddings, icons on the wrong side,
and a sidebar that opens the wrong way. Ranked here rather than higher only
because nobody has asked for Arabic yet — that is a scheduling judgement, not a
statement that it works.

---

## Frontend correctness follow-up from code review

Completed in the frontend releases (see [desktop-reliability.md](desktop-reliability.md)):

- Document-scoped AI source publication and selection.
- Dirty-state ownership during background saves.
- Detached-window cleanup and session invalidation on logout. Linux native
  WebDriver lifecycle and native-port contracts pass. Windows/macOS and physical
  multi-monitor checks remain pending.
- Preference writes require successful initialization and explicit changes;
  the skeleton-hint write is reachable.

Also completed in the record-editing development batch:

- Service-backed recovery, versioned saves, retry and explicit conflict review.
- Billing and consultation adoption of the shared controller.
- New record identities and saved-record worklist discovery.
- Deferred export cleanup now finishes before URL mocks are restored.

See [record-editing.md](record-editing.md). The compatible API/frontend pair was activated publicly as release
`20260907163215381-b9dabe79`; public health and authenticated record-load checks passed.

## Waiting on someone else

**The three speech adapters** (`deepgram`, `azure`, and one more) are marked
unverified because verifying them needs real credentials. Nothing can be done
here until those exist.

**AI hardening:** server controls now cover credential encryption and expiry,
durable local audits, restricted provider context, provider/origin allowlists and
per-user limits. Managed key vaults, production identity, clinical provider
contracts and the documented production storage/retention boundaries remain.
See [the current ledger](ai-hardening-ledger.md).

## Deliberately not being done

From `ui-gap-analysis.md`, and unchanged: a slider (rarely the right control), a
component sandbox (the component tests cover what it would have caught and
cannot drift silently), and a section-wizard engine (there is one wizard;
revisit at three).

## Two decisions, still open

Neither is work so much as a question:

- **`moduleForPage`'s "shared" branch is unreachable.** It exists so that opening
  Preferences keeps the sidebar on the module you came from. Every such page is
  now declared under `library`, so opening Preferences moves the sidebar and
  `lastModule` never does anything. Which of the two was meant?
- **`dashboardPageId`'s library special case** produces the same string the
  general branch does. Remove the ternary, or keep it as a guard for a rename?

## Not code

- **Rotate both API keys.** A DeepSeek key and an OpenAI key were pasted into a
  session transcript and are in shell history. Every commit has been swept for
  key-shaped strings and none contains one, but the keys themselves should be
  considered exposed.
- **Add the four `front-design` names to `~/pv/scripts/renew-cert.sh`.** Needs
  sudo. The certificate lapses in roughly ninety days from early September.

## Desktop-first development

The active implementation sequence and first batch status are tracked in
[desktop-development-plan.md](desktop-development-plan.md). Mobile is optional.

Latest frontend release: `20260907152207170-63028a2b`, activated on both public
shells with product profiles and desktop reliability corrections. See the desktop
development plan for completed checks and remaining milestones.

Customer Master CSV upload, mapping, validation, confirmation, progress and failed-row
retry are implemented. See [csv-import.md](csv-import.md). Additional entity import
definitions and production bulk-processing adapters remain integration work.

The Customer Master approval workflow is implemented through a reusable adapter.
See [approvals.md](approvals.md). Additional entities, production workflow storage
and email/push delivery remain integration work.
