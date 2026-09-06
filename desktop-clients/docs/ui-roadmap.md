# Enterprise frontend UI roadmap

_6 September 2026._

The agreed roadmap, and where this repository actually stands against it. Status
is checked, not remembered — every ✅ below is a file that exists with tests, and
every ✗ is something nobody has written yet.

Companion documents: `ui-gap-analysis.md` (why each item is worth doing),
`ai-hardening-ledger.md` (what is not discharged), `ai-service-contract.md`
(what a real backend must implement).

## Priority, and where we are

| Priority | Feature | Recommendation | Status |
|---|---|---|---|
| P0 | Error / Denied / Empty / Loading states | Build now | ✅ all seven, plus the error mapper and retry policy |
| P0 | Segmented control | Build now | ✅ |
| P0 | Avatar | Build now | ✅ |
| P0 | Stat card | Build now | ✅ |
| P1 | Inline editing | With concurrency + audit | ✅ generic + Number, Select, Date, Status; 409 path still untested against a real API |
| P1 | Shared filter bar | Reusable framework | ✅ registry, classification, URL rules, saved views |
| P1 | Reference data notice | With backend support | ✗ — needs the partial-failure contract first |
| P2 | URL filters | URL-safe only | ✅ allowlist, both directions, storage gated too |
| P2 | Workspace tabs + split | Strongly recommended | ✅ |
| P3 | Tauri detachable / MDI | Optional | ✅ both, MDI off by default |
| Skip | Slider | Real use case only | Not built, agreed |
| Skip | Sandbox app | Revisit later | Not built, agreed |
| Skip | Generic wizard engine | After several wizards | Not built, agreed — one wizard exists |

## The parts already settled, and why

**Segmented is a radiogroup, not a tablist.** A tab switches which panel you are
looking at; this picks a value. Announcing a value picker as a tablist tells a
screen-reader user to expect panels that are not there.

**Avatar derives colour from the name, from a five-wash palette mixed from theme
tokens.** The roadmap says not to generate name-based colours unless contrast is
guaranteed — a hue computed from a name lands wherever it lands, and much of
"wherever" fails on a light surface. Five washes chosen for contrast is the
compromise: colours repeat, and every one of them is legible in all fourteen
themes.

**StatCard makes `comparedTo` required.** An arrow cannot be rendered without
saying what it is an arrow against.

**Inline editing keeps the editor open on a rejected value and puts the message
above the cell.** A row that grows to fit a message shifts every row below it.
`onCommit` may reject, which is where a 409 arrives, and the typed value stays
on screen — an edit that vanishes because someone else was faster is the failure
to avoid.

**Filters are classified in one registry**, an allowlist rather than a denylist,
guarded on read as well as write, and the same allowlist governs localStorage —
which is not a safer place than a URL: unencrypted, survives logout, outlives
the session that was authorised to see the value.

**Saved views carry an opaque `VW_` id** from `randomBytes`, tenant-scoped, 30-day
expiry, auditing the filter KEYS and never the values. Another tenant's id
answers 404 rather than 403, because 403 confirms the id is real.

## What is genuinely still missing

Ordered by the roadmap's own phases.

### Phase 1 — done

Seven states, one mapper, one retry policy. `classifyFailure` turns a status
into a state, `isRetryable` decides whether a retry button appears at all, and
`referenceFor` gives the user something to quote when the detail is withheld.

The three decisions worth keeping:

**A denial drops its detail entirely** rather than filtering it. §4 — "you
cannot access this patient's HIV record" is a disclosure made by the refusal
itself, so 403 renders a fixed sentence and nothing from the server.

**Detail is dropped when it looks like it was written by a program.** Stack
frames, SQL, connection strings and absolute paths are matched and withheld; a
sentence written for a human survives. Refusing all detail would turn every
failure into "something went wrong", which §3 names as the thing to avoid.

**Retry appears only where it can work.** 408, 5xx and network failures get a
button; 403, 404, 409, 422 and 401 do not. ConflictState offers *reload* —
retrying sends the same stale version and gets the same refusal.

### Phase 3 — done

Four typed editors over one state machine. The control is a render prop rather
than a `type` discriminator with a dozen companion props — a number needs
min/max/step, a select needs options, a date needs a window, and folding all of
that into one signature is the prop-heavy component §11 says to avoid.

`Status` takes an optional transition map: a status with nowhere to go is not
editable at all, rather than editable into itself.

### Phase 5 — reference data health

Needs the backend contract first: a response that distinguishes "no data" from
"this list failed", per key. Neither half exists.

### Elsewhere

```
/view/:id route       ✗   POST /views works; the link it returns opens nothing
POST search API       ✗   sensitive filters are filtered client-side, because
                          the rows are generated client-side
```

## Rules this repository already follows

From §22 of the roadmap, with where each is enforced:

| Principle | Enforced by |
|---|---|
| No sensitive data in URLs or logs | `filter-policy.ts`, `verify:filter-safety` |
| Errors useful without leaking internals | `ErrorState`'s detail slot; no stack traces reach it |
| Inline editing only for controlled fields | `editable` is opt-in per column; one column opts in |
| Optimistic concurrency | `onCommit` may reject; the typed value survives |
| Empty ≠ failed reference data | **not yet** — Phase 5 |
| Composition over prop-heavy components | `FilterBar` takes definitions, not a dozen booleans |
| No frameworks before several use cases | one wizard, so no wizard engine |
| Tabs + split as the default | web opens browser tabs; desktop has tabs and split |
| MDI optional | a preference, default off |
