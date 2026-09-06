# Browser checks

```bash
./run.sh start          # the shells must be up
npm run e2e             # every suite
npm run e2e:phi         # just one
```

Playwright is **not** a dependency of this package — it is a ~300MB browser
download that `npm test` does not need. Install it once:

```bash
npx playwright install --with-deps chromium
```

or point `PLAYWRIGHT_PATH` at an existing copy. The suites say so when it is
missing rather than failing obscurely.

## Why these are separate from `npm test`

The 460 unit tests run in jsdom in about two seconds and are the ones to run
constantly. These need a running stack, a real browser and about a minute.
Folding them into `npm test` would mean the fast suite stops being run, which
costs more than it buys.

They also answer different questions. jsdom has no layout, so it cannot tell you
whether an element is *visible*; it has no address bar; its localStorage is a
stub; and it cannot distinguish a component that re-rendered from one that was
rebuilt. Every bug below was green in the unit suite at the moment it was found.

## What a browser has actually caught here

| Found | Why jsdom could not |
|---|---|
| A focus trap wired to one overlay of three | The ref was null; `Escape` still worked, so every test passed |
| `setBounds` never called — MDI frames laid out against a guessed size | Nothing asserts a callback that is simply absent |
| An MDI canvas collapsing to zero height | jsdom has no layout; `flex-1` resolved to nothing |
| A detached window with no `NavigationProvider` — every window blank | It threw into a console nobody was reading |
| A patient name reaching `localStorage` via `filters.query` | The unit tests exercised the read path; the write path's gate had silently failed to apply |
| The search box not counting toward the share decision | It is separate state, outside the component under test |

That last pair is the reason this directory is committed rather than living in a
scratch folder: the PHI guarantee is the one this repository most needs to keep,
and it was being proved by a script that would not have survived the session.

## The suites

**`phi-safety.e2e.mjs`** — a patient name typed into a worklist reaches neither
the URL nor localStorage; the bar marks which fields stay out of a link; a
sensitive filter withdraws copy-link and offers a saved view; the view comes back
as an opaque `VW_` id carrying no filter values.

**`workspace.e2e.mjs`** — exactly one tab is fixed; opening dedupes; a filter and
a typed value survive leaving the tab and coming back; warm documents stay
mounted and inert; `Alt+\` splits, the divider answers arrow keys, each pane
draws its own document, `Alt+Shift+\` collapses.

## Writing another

Two rules, both learned the hard way.

**Set the state you assert on.** Preferences persist per account, so a suite that
assumes a default is testing whatever the last run left behind — the workspace
suite reported no tab strip, correctly, because an earlier session had switched
floating windows on. Use `setPreference`.

**Assert invariants, not starting conditions.** "One tab open" tests the route
the suite took to get there. "Exactly one tab is fixed" is the rule.
