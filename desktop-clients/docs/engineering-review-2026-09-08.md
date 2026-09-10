# Engineering review — the 8 September working set

> Historical review. See the [verified follow-up and corrections](review-follow-up-2026-09-08.md) for current implementation and test wiring.

_8 September 2026, 11:00 UTC. Status pass added 10 September — see the last section._

A consolidated review of everything built in the twenty hours to 11:00 on
8 September, almost all of it by a second session working in this repository at
the same time. It supersedes `code-review-2026-09-08.md`, which was a snapshot
taken at 05:12 when the working set was about half this size; the findings there
are carried forward here and none of them has been addressed.

Three reviews were run across those hours. Two findings recurred in all three
and grew worse each time. They are the subject of most of the improvement
section, because a problem that survives three reviews is not a problem with the
code — it is a problem with what the code is checked by.

## How this was checked

By running it. Status codes come from live requests against the API, the export
interaction from calling `reviewExport` with imported column names, and the
bundle figures from `gzip` over the built chunk. Nothing here is inferred from a
commit message, and there are barely any commit messages to infer from.

---

## Part 1 — What was built

**200 files, essentially none of them committed.** 103 modified
(+2,466 / −1,800) and 97 new paths. The new paths carry about 81,600 lines, but
most of that is generated: a 1.3 MB locale table, a 1.4 MB PDF and nineteen
screenshots. Hand-written code is closer to 6–8,000 lines.

The session's only commits are three documentation ones. Every functional change
is sitting in the working tree on `main`, unbranched.

Ten subsystems:

| Area | What it is |
|---|---|
| Deployment | `deploy.mjs`, release directories, `serve-release.mjs`, 14 lifecycle tests |
| Records | store, screens, HTTP layer |
| Record panels | attachments, comments, activity, related records |
| CSV import | parser, column mapping, validation, store |
| Approvals | stages, submission, inbox, history |
| Product profiles | `products/`, config, shell context |
| Application config | server-driven navigation |
| Localization | four languages, message descriptors, a formatting layer, RTL |
| Shared display components | `DataValue`, `DescriptionList`, adopted across fourteen screens |
| Handbook | a 779-line guide, a PDF build, screenshot capture |

Plus hardening of existing code: AI sources scoped to the workspace document
that published them, cross-window sign-out with a request-generation counter,
and a dialog stack for focus return.

## Part 2 — What is good

This deserves saying first and plainly, because the findings that follow are
about wiring rather than about judgement.

**The conventions were followed without being asked.** Every tenant reference in
the four new stores is derived from the session, never taken from a request
body — the rule this codebase states as "a tenant a client can assert is not
isolation". No new store or route logs a value.

**The guard pattern was adopted, not just tolerated.** `verify:shared-components`
and `verify:localization` are the other session's own additions, in the same
shape as the existing checks, with the same habit of naming what to do instead.
The chain went from twelve checks to sixteen. A team that adds guards to its own
work is a team that has understood why the guards are there.

**The invariants held through a very large push.** Nineteen new screen files,
seven new API routes and a localization layer threaded through the entire UI,
and `verify:filter-safety`, `verify:ai-egress`, `verify:export-safety`,
`verify:contrast` and `verify:form-controls` all still pass. Nobody had to argue
about PHI, egress or accessibility: the rules answered on their own.

**The deployment work integrates with the guard rather than around it.** It sets
the API URL at build time, runs `verify-deployable` against the `BUILD_API`
stamp, and `release.test.mjs` asserts that a mismatched stamp is refused. That
is the correct answer to the 7 September incident, and it is tested.

**Current health.** `typecheck` clean, **1383 tests across 82 files**, sixteen
verify checks passing, both shells building.

---

## Part 3 — Findings

Ordered by what they cost if left.

### F1 · Fifteen of twenty-four browser suites are run by nothing

`e2e/run.mjs` selects `*.e2e.mjs`. Nine files match. The other fifteen end in
`.mjs` and are invoked only by typing their path. `npm run ci` is
`typecheck && test && test:deployment && build && verify`, which also reaches
none of the eight new API test scripts.

Across three reviews this went **6 → 10 → 11 → 15**. Every one of those suites
passes when run by hand, so this is not a quality problem: it is that nothing
will notice when they stop passing. It is also precisely the failure this
repository's own documents name — *"complete, tested, and imported by nothing
anyone still runs"*.

`e2e/product-starter.mjs` is worse still: no script, no runner, no reference
anywhere.

### F2 · Every user downloads every language

`packages/erp-config/src/locale-messages.ts` is **1.3 MB and 14,372 lines**,
holding en, ar, hi and ml. It is imported by `i18n.ts`, which the `erp-config`
barrel re-exports, so it reaches the browser: the largest built chunk is
**2.1 MB raw, 654 KB gzipped**, and it contains 9,541 Arabic characters. An
English-only user pays for all four languages on first load.

The file's own header calls it a *fallback* — the real source is
`dummy-api/config/localization/shared/*.json` — so the material is already
available over the wire. It grew 1.1 MB → 1.3 MB in a single hour of copy work.
The cost is linear in languages **and** in messages, and both are increasing.

### F3 · Seven API routes answer 404 where the other twenty-one answer 405

Measured live:

```
DELETE /records            404      DELETE /views   405
DELETE /imports            404
DELETE /approvals          404
DELETE /application-config 404
DELETE /personal-views     404
DELETE /record-panels      404
DELETE /worklists/archive  404
```

Twelve `not allowed on` guards exist across twenty-eight routes; the new ones
have none. Beyond the inconsistency, a 404 for a wrong *method* is a false
statement, and `classifyFailure` maps 404 to `not-found` — so a screen would say
"This record does not exist" about an endpoint that does exist and a verb that
does not.

### F4 · Imported columns are withheld from every export and printout

Not a defect in either feature. Export and print refuse anything classified
`unclassified`, which is the right default. CSV import accepts arbitrary
headers, which are by definition not in the registry. Executed:

```
reviewExport(["Invoice ref", "amount_due", "site"])
  carried:  (none)
  withheld: Invoice ref, amount_due, site
```

A user can import a spreadsheet, see it on screen, and get a file back with none
of their columns in it. They are told — the confirmation names what was held
back — but "import, then export" returning an empty shape is a poor first
experience of two features that each work. **This is the only finding that needs
a decision rather than an edit.**

### F5 · Four files are written far denser than the codebase

Lines carrying two or more statements:

| File | |
|---|---|
| `erp-data/csv-import.ts` | 12 of 53 |
| `erp-data/records.ts` | 18 of 211 |
| `erp-config/application-config.ts` | 14 of 85 |
| `ops-ui/localization.tsx` | most of it |
| `erp-config/filter-policy.ts` (existing, for contrast) | 0 of 131 |
| `ops-ui/form-controls.tsx` (existing) | 3 of 349 |

`e2e/records.mjs` is the same, and uses single quotes where the repository uses
double. `product.ts`, `form-rules.ts` and `messages.en.ts` are in house style, so
this is specific files rather than drift — which makes it cheap to correct
before it is read as the new normal.

### F6 · Reasoning comments were removed from three files that had earned them

Net comment lines lost: `sources.tsx` −2, `session.tsx` −2, `erp-context.tsx`
−2. What went included the note that `publish` and `retract` must not be rebuilt
in the same `useMemo` as the data — the loop that once made App Router
navigations never commit — and the note that an unreachable API is
indistinguishable from a bad token.

The behaviour is unchanged and the tests still hold it. What is lost is the
reason, which is the only thing that stops someone simplifying it back.

### F7 · The new browser suites bypass the harness

`records.mjs` and its siblings default to their own ports and none calls
`signIn`, so none gets the preflight that reads the API base out of the shell's
first request. That guard exists because nine suites ran against the deployed
API for a whole session before anyone noticed.

### F8 · A generated PDF is version-controlled

`frontend-platform-guide.pdf` is built from the markdown by `build_pdf.py` and
went 148 KB → 1.4 MB in one commit when screenshots were embedded. Every
regeneration stores a full new blob. `.git` is 14 MB today, so this is a habit
worth deciding about rather than an emergency.

---

## Part 4 — How to improve

The findings above are symptoms. Four of them share a cause: **a convention that
is real but implicit**. The suites are unwired because the runner's naming rule
lives only in a glob. The routes answer 404 because the 405 habit lives in
twelve copies rather than one helper. The bundle grew because nothing measures
it. In each case the codebase's own answer — make the rule executable — simply
has not been applied yet.

### Immediate: fix the symptoms

| | Effort |
|---|---|
| Rename the fifteen suites to `*.e2e.mjs`; add the eight API scripts to `ci` | 15 min |
| Give `product-starter.mjs` a script or delete it | 2 min |
| Add the `405` guard to the seven new routes | 20 min |
| Reformat the four dense files | 30 min |
| Restore the two removed paragraphs of reasoning | 5 min |
| Route the new suites through `E2E_BASE`/`E2E_API` and `requireApi` | 20 min |

### Structural: make each one impossible to repeat

**A runner that refuses to be silent.** `run.mjs` should fail when it finds a
`.mjs` in `e2e/` that is neither a suite it will run nor a declared helper
(`run`, `harness`, `a11y`). A new file then either joins the run or is
deliberately named as support — and the third option, being quietly ignored,
disappears. This is the single highest-value change on the page: it turns F1
from a recurring finding into an impossible state.

**A bundle budget, in the shape of the other checks.** `verify:bundle` asserting
the largest client chunk stays under a stated gzipped size, with the number
written down and a sentence saying why. F2 would have failed the moment it was
introduced rather than three reviews later. The existing `verify:parity` already
reads the build output, so the machinery is there.

**One route helper.** A small wrapper taking a path and its allowed methods,
answering `405` for anything else. Twenty-eight routes currently reimplement
this twelve times and skip it seven times; with the helper, skipping it stops
being possible.

**A classification decision at the import boundary.** F4 is the one place the
registry has a hole: every column that reaches a worklist should have a
classification, and imported columns are the only ones that arrive without a
declaration. Either the import step maps incoming columns to registry keys —
refusing or flagging what it cannot place — or it assigns a classification at
import time. Then extend `verify:export-safety` to cover the import path, and
the hole closes for good.

### Practice: three habits worth adopting

**Commit in units, on branches.** Two hundred files of good work is currently
one `git checkout` away from being lost, cannot be reviewed in pieces, cannot be
bisected, and cannot be reverted selectively. It also made this review harder
than it needed to be: separating two sessions' edits in one tree took real care,
and one shared file had to be staged surgically to avoid committing someone
else's work. Ten commits of twenty files each would have cost nothing and been
worth a great deal.

**Two sessions, two worktrees.** `git worktree add` gives each session its own
directory and its own branch against the same repository. The cost of not doing
it, this week: one session moved the other onto its feature branch mid-edit, and
a build made for local testing was served to the public site because both were
building into the same directory.

**When deleting a comment, ask what it was buying.** This codebase's main asset
is that it explains itself, and its comments disproportionately record bugs that
already happened once. A comment describing *what* the code does is fair game; a
comment describing *why it is not the obvious thing* is load-bearing.

### Suggested order

1. The runner change and the e2e wiring — F1 and F2's detection, together about
   half an hour, and everything after is protected by it.
2. The bundle budget, then decide F2 on the number it reports.
3. The route helper, which fixes F3 and prevents the next one.
4. F4, which needs a decision from whoever owns the import feature.
5. F5, F6, F7, F8 — consistency and habit, worth doing before the current shape
   is read as settled.

None of this blocks committing the working set, and the working set should be
committed today. All of it is cheaper now than after the next ten subsystems
land on top.


---

# Status pass — 10 September 2026, 02:00 UTC

Two days on. The working set described above is **committed**: 61 commits, a
clean tree, in sync with origin. Most of the findings were acted on, one of them
better than the recommendation, and the repository has grown in a way that was
not visible before.

## Health

| | 8 Sept | 10 Sept |
|---|---|---|
| Unit tests | 1383 / 82 files | **1510 / 108 files** |
| Verify checks | 16 | **22** |
| Uncommitted files | 200 | **0** |
| Web bundle (gzip) | 654 KB | **192 KB** |

`typecheck` clean, every verify check passing, both shells building.

## What was fixed

**F2 — bundle. Fixed, as recommended.** `locale-messages.ts` went from 1.3 MB to
a 4 KB loader: *"English is immediate; other offline fallbacks load on demand."*
A `verify:bundle` check now holds a written budget and is in the chain:

```
web      196,812 gzip bytes    budget 550,000
desktop  537,182 gzip bytes    budget 550,000
```

The web bundle is down about 70%. The desktop shell is at 98% of its budget,
which is worth watching rather than acting on.

**F1 — unwired suites. Fixed, and better than the recommendation.** The proposal
here was to rename the files so the runner's glob would find them. What was
built instead is a registry: `e2e/suites.mjs` declares every suite by runtime
group, and `validateSuites()` throws on anything unregistered, missing or
duplicated — *"A new root .mjs must be a suite or helper."* `run.mjs` takes a
group argument, each group has a script, `verify:e2e-registry` is in the verify
chain, and CI runs it.

That is the better answer. A rename would have forced forty-one suites into one
runtime; the registry keeps `features`, `navigation`, `product` and `native`
isolated, which they need because each brings up its own stack. The property the
finding actually cared about — that a suite cannot be silently ignored — is now
enforced rather than conventional.

**F5 — dense files. Fixed.** Every file named was reformatted, and grew while
getting sparser:

| | 8 Sept | 10 Sept |
|---|---|---|
| `csv-import.ts` | 12 of 53 lines | 4 of 123 |
| `records.ts` | 18 of 211 | 6 of 324 |
| `application-config.ts` | 14 of 85 | 1 of 145 |
| `ops-ui/localization.tsx` | most of it | 0 of 22 |

**F7 — harness bypass. Answered differently, and acceptably.** Nine of
thirty-nine suites use `signIn`/`requireApi`. The rest now bring up an isolated
API through a new `managed-api.mjs` helper, so they control both ends and the
preflight has nothing to catch. That is a legitimate answer; the finding is
closed rather than fixed.

## What is still open

**F3 — method guards. Moved backwards.** Thirty-two routes now carry eleven
`405` guards, against twenty-eight and twelve before. The new routes still
answer `404` for a wrong method, and `classifyFailure` turns that into "This
record does not exist" about an endpoint that does exist. The suggested route
helper was not taken up, and it is still the only change that makes omitting the
guard impossible rather than merely discouraged.

**F4 — imported columns. Unchanged.** Re-executed:

```
reviewExport(["Invoice ref", "amount_due", "site"])
  carried:  (none)
  withheld: Invoice ref, amount_due, site
```

Neither `csv-import.ts` nor `imports.ts` consults the classification registry. A
user can still import a spreadsheet and export a file with none of their columns
in it. This remains the one finding that needs a decision rather than an edit,
and it has now survived two reviews.

**F6 — removed reasoning. Unchanged.** The note in `sources.tsx` explaining why
`publish` and `retract` must not share a `useMemo`, and the note in
`session.tsx` explaining that an unreachable API is indistinguishable from a bad
token, are both still absent.

## What is new: the repository is growing fast

`.git` went from **14 MB to 63 MB in two days**. The dominant cause is one file:

```
dummy-api/config/documentation/releases.json
  current size        8.7 MB
  revisions            13
  total blob history  ~42 MB
  growth              ~1.2 MB per deployment record
```

Twenty of the sixty-one commits are deployment records — "Record verified X
deployment", most marked `[skip ci]` — and each rewrites this file in full. Git
stores a new complete blob every time, because JSON of this size does not delta
well against a reordered predecessor.

The rest of the growth: 79 PNG screenshots, five PDFs (one of them the 1.4 MB
generated handbook, which was F8), five tracked `.log` files, and ~6.3 MB of
server-side localization JSON. The localization files are correct where they are
— moving them server-side is what fixed F2 — but they are generated, large, and
tracked.

At the current rate the repository doubles about every two days. Nothing is
broken; a clone is simply becoming expensive, and history that large is
difficult to walk back.

**Suggested, in order of return:**

1. **Stop committing `releases.json` in full.** Either append records to a file
   git can delta (one line per release, newest last), or move deployment records
   out of the repository entirely — they describe events, not code, and nothing
   in the build reads them. This single change removes ~90% of the growth.
2. **Decide whether the generated artefacts belong in git.** The handbook PDF is
   built from its markdown by `build_pdf.py`; the screenshots are captured by
   `capture_screenshots.mjs`. Both are reproducible. Release artefacts, not
   sources.
3. **Untrack the five `.log` files.**

## Revised improvement list

The structural recommendations from 8 September stand, with two settled:

| | Status |
|---|---|
| A runner that refuses to be silent | **done** — as a registry, better than proposed |
| A bundle budget in the shape of the other checks | **done** |
| One route helper instead of twelve copies | open — F3 got worse |
| A classification decision at the import boundary | open — F4, needs an owner |
| Commit in units, on branches | **done in effect** — 61 commits, clean tree |
| Two sessions, two worktrees | untested since; no collisions this window |
| Ask what a comment was buying before deleting it | open — F6 |

And one added by this pass: **treat the repository's own weight as something
with a budget**, the same way the client bundle now has one. A check that fails
when a tracked file crosses a size threshold, or when `.git` grows by more than
a stated amount in a release, would have caught `releases.json` on its second
revision rather than its thirteenth.
