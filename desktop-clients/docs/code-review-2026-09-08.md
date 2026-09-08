# Code review — the 8 September working set

> Historical review. See the [verified follow-up and corrections](review-follow-up-2026-09-08.md) for current implementation and test wiring.

_8 September 2026._

A review of everything changed in the twenty-four hours to 01:53 UTC on
8 September that was **not** committed: 78 modified files and 63 new paths,
roughly 1,600 changed lines plus 5,000 new ones, none of it on a branch.

Committed in the same window were four changes of my own (the shared form
controls, the check that guards them, and the remaining-work document); those
are described in their own commit messages and are not the subject here.

## How this was checked

Every claim below was produced by running the code or reading the diff, not by
reading the summaries. Where a finding depends on behaviour it was executed:
the HTTP status codes come from live requests against the running API, and the
export interaction in finding 6 comes from calling `reviewExport` with imported
column names.

## Verdict first

**The working set is healthy and, as far as the automated checks can see, ready
to commit.**

| | |
|---|---|
| `npm run typecheck` | every package |
| `npm test` | 1337 passing across 75 files |
| `npm run verify` | 12 checks, 552 assertions, no failures |
| `npm run test:deployment` | 14 passing |
| API suites (records, workflows, panels, imports) | 9 + 4 + 3 + 4 passing |
| `npm run build` | both shells |

Nothing in the findings below is dangerous, and nothing weakens a guarantee this
repository already holds. They are wiring, consistency and one interaction
between two features built a day apart.

## What landed

Seven subsystems, each with tests and a document:

| Area | Shape |
|---|---|
| Deployment | `scripts/deploy.mjs`, `scripts/deployment/`, `serve-release.mjs`, release directories, `docs/deployment.md` |
| Product profiles | `products/`, `erp-config/product.ts`, `erp-shell/product-context.tsx`, `scripts/products/` |
| Records | `erp-data/records.ts`, `erp-screens/records/`, `dummy-api/record-store.mjs` |
| CSV import | `erp-data/csv-import.ts`, `erp-config/imports.ts`, `erp-screens/imports/` |
| Record panels and personal views | across config, screens and the API |
| Localization | `ops-ui/localization.tsx`, threaded through Button, Card, Tabs, Dropdown, Badge, Modal |
| Workspace and session hardening | document-scoped AI sources, cross-window sign-out, a dialog stack for focus return |

## What is good, and worth saying plainly

**The invariants survived a large feature push.** Nineteen new screen files, six
new API routes and a localization layer threaded through six components, and
`verify:filter-safety`, `verify:ai-egress`, `verify:export-safety`,
`verify:contrast` and `verify:form-controls` all still pass. That is the checks
earning their keep: none of this had to be argued about, because the rules
answered.

**Tenant isolation was done the way this codebase does it.** Every tenant
reference in the four new stores is derived from the session
(`user.tenantId`) — never taken from a request body — and no new route or store
logs a value. That is the existing standard, followed without being asked.

**The deployment work integrates with the guard rather than around it.**
`deploy.mjs` sets `NEXT_PUBLIC_API_URL` and `VITE_API_URL` explicitly at build
time and then runs `verify-deployable.mjs` against the `BUILD_API` stamp, and
`release.test.mjs` asserts that a mismatched stamp is rejected. That is the
correct answer to the incident on 7 September, tested.

**Two changes to existing infrastructure are genuine improvements**, not churn:
AI sources are now scoped to the workspace document that published them, so a
selection in one open document cannot reach the assistant while another is
focused; and the session now invalidates across windows on a `storage` event,
with a request-generation counter so a late response cannot restore a user who
has signed out elsewhere.

---

## Findings

### 1. Eight test suites that no aggregate command runs

Four browser suites — `records.mjs`, `workflows.mjs`, `record-panels.mjs`,
`imports.mjs` — and four API suites — `test:records-api`, `test:workflows-api`,
`test:panels-api`, `test:imports-api`.

`e2e/run.mjs` selects `*.e2e.mjs`, so `npm run e2e` finds nine suites and skips
these four. `npm run ci` is `typecheck && test && test:deployment && build &&
verify`, which reaches none of the eight. Each has its own npm script and each
passes when invoked by hand, so this is not a quality problem — it is that
nothing will notice when they stop passing.

This is the failure mode this repository's own documents name: complete, tested,
and run by nothing.

**Suggested:** rename the four browser files to `*.e2e.mjs`, and add the four
API scripts to `ci`. About ten minutes, and it puts roughly twenty new
assertions under the same protection as the rest.

### 2. `e2e/product-starter.mjs` is referenced by nothing at all

Not by `run.mjs`, not by a script, not by CI. Unlike the four above it has no
way to be run except by typing its path.

**Suggested:** give it a script and a name the runner picks up, or delete it. A
file that can only be run by someone who already knows it exists will be run
once.

### 3. The six new API routes answer 404 where every other route answers 405

Measured against the running API:

```
DELETE /records         404        DELETE /views    405
DELETE /imports         404
DELETE /approvals       404
DELETE /personal-views  404
DELETE /record-panels   404
```

Two costs. It is inconsistent with every route written before them, which all
end with `405 {method} not allowed on {path}`. And a 404 for a wrong *method*
is a false statement: `classifyFailure` maps 404 to `not-found`, so the screen
would say "This record does not exist" about an endpoint that does exist and a
verb that does not. That is a debugging trap rather than a user-facing one, but
it is the kind that costs an afternoon.

**Suggested:** close each new route with the same `405` guard the others use.

### 4. Two files, and the new localization module, are written far denser than the codebase

Lines carrying two or more statements:

| File | |
|---|---|
| `erp-data/csv-import.ts` | 12 of 53 |
| `erp-data/records.ts` | 18 of 211 |
| `ops-ui/localization.tsx` | most of it — `export const useLocalization=()=>useContext(Context);` |
| `erp-config/filter-policy.ts` (existing) | 0 of 131 |
| `ops-ui/form-controls.tsx` (existing) | 3 of 349 |

`e2e/records.mjs` is the same: single quotes where the repository uses double,
`const browser=await chromium.launch({chromiumSandbox:false});`.

`product.ts` and `form-rules.ts` are in the house style, so this is specific
files rather than a general drift — which makes it cheap to fix and worth doing
before it is read as the new normal.

**Suggested:** reformat those four files. Nothing about them is wrong; they are
simply harder to read than everything around them, and this codebase's main
asset is that it can be read.

### 5. Reasoning comments were removed from three files that had earned them

Net comment lines lost: `sources.tsx` −2, `session.tsx` −2, `erp-context.tsx`
−2. The replacements describe the new behaviour, which is right, but some of
what went explained bugs that had already happened once:

- In `sources.tsx`, the note that `publish` and `retract` must not be rebuilt in
  the same `useMemo` as the data — the loop that made App Router navigations
  never commit.
- In `session.tsx`, the note that an unreachable API is indistinguishable from a
  bad token, and that guessing permissively strands the user in a shell that
  cannot do anything.

The behaviour is unchanged and the tests still hold it. What is lost is the
reason, which is what stops someone "simplifying" it back.

**Suggested:** restore those two paragraphs. They cost nothing and they are the
only record of why the code is shaped that way.

### 6. Imported columns are withheld from every export and every printout

Not a defect in either feature — an interaction between two built a day apart.

The export and print policies refuse anything whose classification is
`unclassified`, which is the correct default: a column nobody classified is the
one least likely to have been thought about. CSV import accepts arbitrary
headers, which are by definition not in the registry. Executed:

```
reviewExport(["Invoice ref", "amount_due", "site"])
  carried:  (none)
  withheld: Invoice ref, amount_due, site
```

So a user can import a spreadsheet, see it on screen, and get a file back with
none of their columns in it. They are told — the confirmation names what was
held back — but "import, then export" returning an empty shape is a surprising
first experience of two features that each work.

**Suggested:** decide deliberately, and write the decision down. Either the
import step classifies what it accepts (mapping each incoming column to a
registry key, refusing or flagging the ones it cannot place), or imported
columns carry a classification chosen at import time. Both are defensible; the
current position is defensible too, but it was not chosen.

### 7. The new browser suites bypass the harness

`records.mjs` and its siblings default to `E2E_DESKTOP ?? 127.0.0.1:3109` and
`E2E_API ?? localhost:3330` rather than the harness constants, and none calls
`signIn`. That means they do not get the preflight added on 7 September, which
reads the API base out of the shell's own first request and fails when it is not
the API the suite is asserting against.

That guard exists because nine suites ran against the deployed API for an entire
session without anyone noticing. These four are outside it.

**Suggested:** if the isolated ports are deliberate — and they look it, since
these suites run their own stack — pass them through `E2E_BASE`/`E2E_API` and
call `requireApi` so the check still applies.

---

## What this review could not check

- **Whether the seven subsystems do what their documents say.** Everything was
  read for correctness against this codebase's standards and executed for
  health; none of it was used as a person would use it. The four browser suites
  in finding 1 are what would answer that, once something runs them.
- **The desktop shell.** Eight of the nine wired browser suites only load the
  web shell, which was already true before this work and is item 2 on the
  remaining-work list.
- **Anything under `products/`**, which is empty on disk at the time of writing.

## Suggested order

1. Findings 1 and 2 — wiring, ten minutes, and everything after benefits.
2. Finding 3 — six one-line guards.
3. Finding 6 — the only one that needs a decision rather than an edit.
4. Findings 4, 5 and 7 — consistency, worth doing before the style is read as
   settled.

None of it blocks committing the working set. All of it is cheaper now than
after the next feature lands on top.
