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

`axe-core` IS a dependency, unlike Playwright: it is a couple of megabytes
rather than a browser, so `npm ci` already has it and the accessibility check
runs without anyone installing anything.

### Without sudo

`--with-deps` needs root, and Chromium will not start without those shared
libraries: it exits 127 with `libatk-1.0.so.0: cannot open shared object file`,
which Playwright reports as "Target page, context or browser has been closed" —
a long way from the cause. The same trick as the Tauri sysroot works here.
`apt-get download` and `dpkg -x` both run unprivileged:

```bash
SYSROOT=~/.local/chromium-sysroot
apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts \
  --no-breaks --no-replaces --no-enhances \
  libatk-bridge2.0-0t64 libatspi2.0-0t64 libcups2t64 libgbm1 libnss3 \
  libpangocairo-1.0-0 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 \
  libxrandr2 libasound2t64 | grep -E '^\w' | sed 's/:.*//' | sort -u \
  | xargs apt-get download
for d in *.deb; do dpkg -x "$d" "$SYSROOT/root"; done
export LD_LIBRARY_PATH="$SYSROOT/root/usr/lib/x86_64-linux-gnu:$SYSROOT/root/lib/x86_64-linux-gnu"
```

Check it with `ldd .../headless_shell | grep 'not found'` before blaming a
suite. Put the sysroot somewhere durable: the first one was built under `/tmp`
and had to be built again.

## Why these are separate from `npm test`

The 779 unit tests run in jsdom in about two seconds and are the ones to run
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
| Whether a column is actually removed from a printed page | jsdom has no stylesheets, no computed styles and no print media |
| Text at 2.5:1 on the sidebar, and one label at 1.29:1 — dark on dark | Contrast is a computed colour against a computed background; jsdom has neither |
| A saved view applying no filters at all | The redirect wrote them to sessionStorage and nothing read them — two routes, neither wrong on its own |
| A patient name left in sessionStorage for the life of the tab | Same handoff; a unit test of either route sees only its own half |

That last pair is the reason this directory is committed rather than living in a
scratch folder: the PHI guarantee is the one this repository most needs to keep,
and it was being proved by a script that would not have survived the session.

## In CI

The  job builds both shells, starts them with the API, and runs these —
after the fast checks pass, so a browser download is not spent on a build that
does not typecheck.

It serves the BUILT shells rather than dev servers. A check against `next dev`
proves something nobody deploys, and HMR is fragile against anything else on the
machine: on the box this was written on, a speech-gateway websocket handler was
answering `/_next/hmr` and the shell never hydrated at all.

## The suites

**`phi-safety.e2e.mjs`** — a patient name typed into a worklist reaches neither
the URL nor localStorage; the bar marks which fields stay out of a link; a
sensitive filter withdraws copy-link and offers a saved view; the view comes back
as an opaque `VW_` id carrying no filter values.

**`ai-dispatch.e2e.mjs`** — what the transparency panel shows is what the
request carries, compared field by field against the intercepted body; the body
holds a prompt id and nothing shaped like a prompt or a credential; `:fields`
inspects without sending; a page the tenant denied offers no assistant at all;
and a clinical use case cannot be sent until its acknowledgement is given.

**`export.e2e.mjs`** — an ordinary list exports without a question; a list
holding an MRN says what the file will contain first; declining writes no file
and records nothing; accepting writes it and records it by column and class, with
no cell value anywhere in the record.

**`inline-conflict.e2e.mjs`** — one cell and two writers: an edit from the
current value is accepted, a second writer changes it behind the page, and the
next write is refused rather than merged, naming both values and the record;
Reload adopts theirs. Also that the reports screen draws the shared filter bar.
The suite restores the cell at the end, because the server holds edits in memory
for the life of the process and a suite that cannot be run twice is a suite
somebody will run twice.

**`a11y.e2e.mjs`** — axe-core over sign-in, a worklist, a record, preferences,
a consultation, the assistant panel and the command palette, held to WCAG 2.1 A
and AA. Every screen proves it loaded before it is audited: the first version
navigated by palette and double-click, checked neither, and quietly audited the
previous page twice.

**`print.e2e.mjs`** — the banner is in the document before anyone asks and
appears only under print media, naming who printed the sheet, for which tenant,
how many records and what kind of data; the chrome does not print; a credential
or unclassified column is REMOVED from the page rather than hidden; an
unannounced print is still recorded, as a print rather than as a file; and
choosing to print asks the same question exporting does.

**`saved-view.e2e.mjs`** — the round trip: a view created through the UI, the
link carrying only an opaque id, the filters restored into the field they were
typed into, the handoff taken out of sessionStorage rather than left there, and
one refusal for an id that is unknown, expired or someone else's.

**`search-post.e2e.mjs`** — Apply sends a POST, the URL gains no filter at all,
the typed name travels in the body rather than the query string, the body is
split by classification, and the request carries the config the table actually
rendered with.

**`workspace.e2e.mjs`** — exactly one tab is fixed; opening dedupes; a filter and
a typed value survive leaving the tab and coming back; warm documents stay
mounted and inert; `Alt+\` splits, the divider answers arrow keys, each pane
draws its own document, `Alt+Shift+\` collapses.

## Writing another

Three rules, all learned the hard way.

**Set the state you assert on.** Preferences persist per account, so a suite that
assumes a default is testing whatever the last run left behind — the workspace
suite reported no tab strip, correctly, because an earlier session had switched
floating windows on. Use `setPreference`.

**The harness checks this for you now.** `signIn` reads the API base out of the
first request the shell actually makes and fails the suite — exit 2, before any
assertion — when it is not the one the suites are asserting against. It is
checked there rather than by each suite, because a guard every caller has to
remember is a guard the tenth caller forgets.

**Check which API the shell was BUILT against.** `NEXT_PUBLIC_*` is inlined by
`next build`, not read at runtime, and `apps/web/.env.local` points at the
deployed API. Passing `NEXT_PUBLIC_API_URL` to `next start` therefore does
nothing, and every local browser run in this session was talking to
`front-design.pepbits.com` rather than to the dummy API on :3200. No suite gave
a false pass — the deployed API implements the same contract, and the newer
assertions read the request the browser sent rather than the answer — but the
first endpoint that existed only locally failed with no explanation. Build with
the variable set:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:3200 VITE_API_URL=http://127.0.0.1:3200 npm run build
```

CI is unaffected: `.env.local` is gitignored and the workflow sets the variable
on the build step.

**A method the preflight does not name never leaves the browser.** `PATCH` was
missing from the API's `Access-Control-Allow-Methods`, so the request was
dropped, nothing was logged anywhere, and the only symptom was a cell that would
not save.

**Check what is actually serving.** A `next start` from an earlier session holds
port 3100 and answers every route with a 500 against moved source; the suites
then fail on a locator that has nothing wrong with it. `npm run stop` uses
`lsof`, which is not installed everywhere — confirm with `ss -ltnp` before
concluding a suite is broken. Two of the three failures in this session's first
browser run were that; the third was real, and only a browser found it: moving
the classification registry left `dummy-api/server.mjs` importing a deleted
file, so the API would not start at all. Nothing in `npm test`, `typecheck` or
`build` reads that file.

**Assert invariants, not starting conditions.** "One tab open" tests the route
the suite took to get there. "Exactly one tab is fixed" is the rule.

**Beware an expectation that is already true.** The saved-view suite first
asserted "the list is filtered" by counting table rows — which are capped by the
page size, so the count was the same filtered or not. The same trap in reverse
sank a unit test in the same session: a hook that starts on its defaults makes
"it falls back to the defaults" true before the load has been attempted. Capture
the before value and assert the change, not the state.
