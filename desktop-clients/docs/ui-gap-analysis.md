# UI gap analysis — AllyVORA provider-web vs. this repo

_5 September 2026._

What the other codebase has at the **design and app-feel** level that this one does not,
what each thing would cost, and — for several of them — why not to build it.

## How this was checked

Both trees were read, not remembered. Every "we don't have this" below was confirmed by
searching this repo for the component or behaviour before it was listed, and three
candidates were **removed** during that pass because we already have them:

| Looked like a gap | Actually here |
|---|---|
| Toast notifications | `erp-shell/src/layers/toast-viewport.tsx`, with position, duration and style in preferences |
| A record surface that can be panel / modal / drawer | `erp-screens/src/worklist/record-preview.tsx`, chosen by the `previewMode` preference |
| Search-select, match highlighting, skeletons, shortcuts, sidebar focus mode | added here between August and September 2026 |

A second pass traced usage rather than existence on their side too, which changed item 1:
a package can be complete, tested and imported by nothing anyone still runs. "They have a
component for it" and "they use it" are different claims, and only the second is a reason
to copy anything.

Counting real call sites — excluding their own tests, the design-system catalogue and the
archived `apps/old` — item 1 is the only one that fails that test:

| Item | Real call sites in their live app |
|---|---|
| Inline editing (`InlineField`) | 9 |
| Error state (`ErrorState`) | 8 |
| Avatar | 5 |
| Segmented, stat card | 3 each |
| Slider, filter bar, reference-data notice | 2 each |
| Section wizard | 2 (`section-layout.tsx`, `patient-management.tsx`) |
| Filters in the URL | 15 files read `useSearchParams` |
| **MDI windows** | **0** |
| `AccessDenied` specifically | 1, and it is design-system tooling |

So every item except MDI is something they actually run. `ErrorState` is well proven at
eight sites; `AccessDenied`, shipped beside it, is not — take the pair as one good idea and
one untested one.

Reference: `/home/pepadmin/ap/allyvora-platform/frontend/provider-web`.

## Summary

| # | Feature | Effort | Verdict |
|---|---|---|---|
| 1 | MDI windows | ~1 week | **Ask why they stopped using it first** |
| 2 | Inline editing | 1–2 days | **Best value on the list** |
| 3 | Filters in the URL | 1 day | Needs a PHI decision first |
| 4 | Error and denied states | half day | Do now |
| 5 | Segmented control | half day | Do now |
| 6 | Slider | half day | Skip |
| 7 | Avatar | half day | Do now |
| 8 | Stat card | half day | Do now |
| 9 | Shared filter bar | 1–2 days | Worth it, budget carefully |
| 10 | Reference-data notice | 1 day | Backend change first |
| 11 | Sandbox app | 1 day | Skip for now |
| 12 | Section wizard | 2–3 days | **Don't** — see below |

---

## 1. MDI windows

Records open as real windows you can move, minimise and restore, with a taskbar of open
documents along the bottom.

**Example.** Three patients open at once. Minimise two, click a chip in the taskbar to
bring one back. Closing one with unsaved edits asks first.

**Use case.** Comparing two records side by side without losing your place in either.

### They are not using it

This entry is kept for the idea, not as something to copy. `@pepbits/mdi` is a real,
complete package — `MdiWorkspace`, `MdiWindow`, `MdiTaskbar`, a store and a dirty-state
guard — but tracing its imports gives:

```
apps/old/desktop-tauri/src/App.tsx                    the only real use — and it is ARCHIVED
apps/shell-web/.../design-system/_catalog/composition.tsx   a tile in the component catalogue
apps/allyvora-desktop                                 no reference to mdi at all
```

Their current desktop app does not import it. In the web shell it appears only inside the
design-system catalogue, which is a showcase page rather than anywhere work happens. So
the feature was built, shipped in a Tauri shell, and left behind when that shell was
retired.

That is not proof the idea is wrong — a shell gets archived for many reasons unrelated to
any one feature in it — but building this would mean reviving something its own authors set
down, and that is worth knowing before spending a week. If it is ever taken seriously, ask
them why `allyvora-desktop` does not carry it forward. The answer is worth more than the
code.

**Advantage.** The largest available change in how the application *feels* — software you
installed rather than a site you visited. We have `openRecordsInTabs`, which is the same
idea flattened into one row of tabs.

**Drawback.** Beyond the point above: it touches navigation, preferences and every screen.
Windows are cramped on a 13-inch laptop and have no story at all on a tablet. Each window
needs its own dirty-state guard, so unsaved-changes tracking moves from "the page" to "each
open document" — a real change to how screens hold state.

And it only makes sense in one of our two shells. `apps/web` opens records in browser tabs,
which is correct for a URL-addressable application; MDI would land in `apps/desktop` alone.
The two shells deliberately differ on tab behaviour today, but they differ in one contained
place. This would make them diverge in how a record is opened at all.

**Effort.** About a week — after the question above has an answer. Not a week of building
followed by finding out.

## 2. Inline editing

Click a value, type, commit. No form and no modal for a one-field change.

**Example.** Click a customer's credit limit in the table, change 50,000 to 75,000, press
Enter.

**Use case.** Fixing one field across twenty rows without opening twenty forms.

**Advantage.** The fastest correction path there is, and the best value-to-effort ratio on
this list. It is one component in `ops-ui`, not a change to how the shell works.

**Drawback.** A validation error has nowhere to sit inside a table cell. It is easy to
edit the row above the one you meant. Two people editing the same cell needs a conflict
answer — last-write-wins, a lock, or a merge prompt — and that decision has to be made
before the component is written, not after.

**Effort.** One to two days.

## 3. Filters in the URL

Search text and filter values are debounced and written to the address bar.

**Example.** `/customers?q=dubai&status=active` survives a reload and can be pasted to a
colleague.

**Use case.** "Send me the list you're looking at" becomes a link instead of a screenshot.

**Advantage.** Shareable, survives reload, and the browser back button starts meaning
something.

**Drawback.** It writes filter values into browser history and into every server access
log. `status=active` is harmless; a patient name in a query string is a PHI leak into
places nobody is auditing. It also needs an explicit rule for keeping URL and component
state in sync, or the two update each other in a loop.

This is why the item moved down the list. It is not hard to build — it needs a decision
about which filters are URL-safe, and that decision is not the frontend's to make alone.

**Effort.** One day, after that decision.

## 4. Error and denied states

Shared components for *this failed* and *you are not allowed*, alongside the empty state
we already have.

**Example.** A report that fails to load shows the same panel wherever it happens, with
the same retry.

**Use case.** Today a failed page looks different depending on which page failed, because
each screen handles its own failure.

**Advantage.** One failure pattern the user learns once. Retry logic lives in one place.
The error half is well proven on their side — eight call sites. The access-denied half has
one, in design-system tooling, so treat it as an idea rather than a validated component.

**Drawback.** Very little. The only real risk is over-generalising — a shared component
that swallows the specific message that would have told someone what actually went wrong.
Keep a slot for the detail.

**Effort.** Half a day.

## 5. Segmented control

A row of pills where exactly one option is selected.

**Example.** `Day · Week · Month` above a schedule.

**Use case.** Two to four choices where a dropdown is too heavy and radio buttons take too
much vertical space.

**Advantage.** Every option is visible without opening anything, and the choice is one
click.

**Drawback.** It falls apart past about four options, or with long labels. It needs real
care in RTL and on narrow screens, where the pills either wrap badly or truncate.

**Effort.** Half a day.

## 6. Slider

A drag control with the value shown beside it.

**Example.** A discount from 0 to 100%, or a confidence threshold.

**Use case.** Picking a rough amount where the feel matters more than the exact digit.

**Advantage.** Good for approximate values.

**Drawback.** Bad for precision, awkward on touch, and weak for keyboard and screen-reader
users unless it is paired with a number input — at which point the number input is doing
the work. It is rarely the right control.

**Effort.** Half a day. **Recommendation: skip** until something genuinely needs it.

## 7. Avatar

Initials or a photo in a consistent circle.

**Example.** `AR` in the header; a row of assignees on a task.

**Use case.** Anywhere a person is shown. We draw initials by hand each time, so they
differ from screen to screen.

**Advantage.** Consistent identity everywhere, and cheap.

**Drawback.** Initials collide — two people are both "AR". Colour-derived-from-name schemes
regularly land on combinations that fail contrast. Photos need both a fallback and a
loading state, or rows jump as they load.

**Effort.** Half a day.

## 8. Stat card

The KPI tile: label, large value, optional trend and hint.

**Example.** "Cash position · AED 42.16M · +4.3%".

**Use case.** Every module dashboard. Ours rebuild this per screen rather than sharing one.

**Advantage.** Dashboards stop drifting apart.

**Drawback.** A shared tile tends to grow to fifteen props as each dashboard asks for one
more thing. And a trend arrow implies "compared to what?" — the comparison period has to
be defined, and getting it wrong is now wrong everywhere at once instead of on one screen.

**Effort.** Half a day.

## 9. Shared filter bar

The search-and-filter strip as a reusable component rather than part of one screen.

**Example.** The same bar over reports, the inbox and the pharmacy list.

**Use case.** Ours lives inside the worklist screen
(`erp-screens/src/worklist/filter-panel.tsx`), so nothing else can use it.

**Advantage.** Real reuse, and one place to fix filtering behaviour.

**Drawback.** Extracting it means surgery on the worklist, which is the most-used screen
in the application. Generic filter bars also accumulate configuration sprawl — every new
caller adds a prop, and after a year the component is a small framework.

**Effort.** One to two days. Worth it; budget for touching the worklist carefully.

## 10. Reference-data notice

A banner that tells you a dropdown is **broken**, not **empty**.

**Example.** "Branch list unavailable — 3 of 53 reference lists failed to load."

**Use case.** An empty dropdown means either "this tenant configured nothing" or "the API
broke". They look identical on screen and mean opposite things.

**Advantage.** Turns a silent failure into a visible one. This is a genuinely good idea.

**Drawback.** It needs the API to report *which* lists failed. Ours does not — a failing
list either 500s the whole response or returns empty. So this is a backend change wearing
a UI costume, and the UI half is the small half.

**Effort.** One day across API and UI, once the API contract carries the failure list.

## 11. Sandbox app

One page showing every component in every state.

**Example.** Buttons loading, disabled and danger; tables empty, full and errored; all on
one screen.

**Use case.** Catching "this dropdown ignores its width" without hunting for a screen that
happens to use it.

**Advantage.** A place to review design, and the fastest way to onboard someone new to the
component library.

**Drawback.** It is another application to build and keep current, and a sandbox that
drifts is worse than none — it actively misleads. It also adds build time to every CI run.

**Effort.** One day. **Recommendation: skip for now** — the 116 component tests added in
September cover most of what a sandbox would have caught, and they cannot drift silently.

## 12. Section wizard

An engine for multi-step flows: progress rail, per-step validation, resumable state.

**Example.** Onboarding as Identity → Contract → Payroll → Review.

**Use case.** Any guided flow.

**Advantage.** Progress and validation handled once rather than per wizard.

**Drawback.** **We have one wizard** — `erp-screens/src/consultation/consultation-page.tsx`.
An engine built for a single instance is pure overhead, and config-driven flows are harder
to debug than the plain code they replace: a broken step is a data problem in a profile
file rather than a stack trace.

**Effort.** Two to three days. **Recommendation: don't.** Revisit at three wizards.

---

## Suggested order

1. **4, 5, 7, 8** — half a day each, no drawback worth the word, and all four are testable
   in the vitest setup added in September.
2. **2 — inline editing.** Decide the conflict rule first.
3. **9 — shared filter bar.**
4. **1 — MDI windows**, only after finding out why AllyVORA's current desktop app
   dropped it. Desktop shell only.
5. **3 — filters in the URL**, once someone has decided which filters may appear in a URL.
6. **6, 11, 12** — leave.

## Where we are ahead

Worth recording, so this document is not read as a list of everything we lack:

- **Theming** — fourteen palettes against their fixed one.
- **Preferences** — substantially deeper, and all of it persisted per user.
- **The AI layer** — eight access gates, deny-wins resolution, clinical-module separation
  and PHI entity rules. They have no equivalent.
