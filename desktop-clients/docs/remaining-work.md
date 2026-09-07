# What is left

_7 September 2026._

Written after the client-side work reached the point where the obvious things
are done. This is the ranked list of what remains, what each would cost, and —
for the ones that are not ours to do — who they are waiting on.

## Where the code stands

So the list below is readable without going and counting:

| | |
|---|---|
| Unit tests | 1249 across 63 files |
| Structural checks | 12 `verify:*` scripts, 533 assertions |
| Browser suites | 9, 151 assertions, run against a real Chromium |
| Accessibility | WCAG 2.1 AA across seven screens, **no known failures** |
| Themes | fourteen, every one measured for text, fills and module marks |
| Egress paths under one classification registry | URL, device storage, AI provider, file export, print |

Every package that holds branching logic has tests. The two that do not are
`tokens` (a CSS file) and the mock-row generator's data tables.

---

## 1. A deploy step, so the working tree stops being the deployment

**Effort:** half a day. **Value:** removes a class of failure rather than
detecting it.

`apps/web/.next` is both the build output of this repository and the artefact
nginx serves. There is nothing between the two. Building the shells against the
local dummy API — which running the browser suites requires — therefore puts
that build live, and the site then tells every visitor's browser to call
`127.0.0.1:3200` on their own machine. It loads, it looks entirely normal, and
nobody can sign in.

That happened on 7 September. It was caught by a user reporting the error, not
by anything here.

`verify:deployable` now compares a `BUILD_API` stamp written by each build
against the app's env file, and it runs inside `npm run verify`. That is a smoke
alarm. The fix is a deploy that makes the mistake impossible:

    npm run deploy   →   build
                         verify:deployable
                         copy the verified artefact to a serving directory
                         restart the server

Two things fall out of it for free. Nothing currently restarts the server after
a rebuild — it has been done by hand every time — and the served directory
stops changing under a running process.

**Done when:** a local build cannot reach the public host, and a deploy is one
command that ends with the site answering.

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

## Waiting on someone else

**The three speech adapters** (`deepgram`, `azure`, and one more) are marked
unverified because verifying them needs real credentials. Nothing can be done
here until those exist.

**The ten gaps in the AI hardening ledger** are a server project. The contract is
written (`docs/ai-service-contract.md`) and `verify:ai-hardening` fails in both
directions so the ledger cannot go stale, but none of it is buildable in this
repository. The half of N5 that matters — server-side identifier stripping
before any provider call — is the most important single item on this page and
the only one that cannot be started here.

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
