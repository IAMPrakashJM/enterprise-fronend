# @pepbits/workspace-core

Phase 1 of the Enterprise Workspace Framework: **who is open, which one is live,
and who is allowed to see it**. No React, no DOM, no styling — so it runs in
plain Node and is tested as logic rather than as a screen.

See `docs/enterprise-workspace-framework-readme.md` for the design this
implements, and `docs/ui-gap-analysis.md` for why MDI is not the foundation.

## What it owns

```
document-key.ts      identity — tenant : documentType : entityId
policy.ts            the six-level resolver, narrowing only
document-manager.ts  the registry: open, focus, close, dirty, lifecycle, restore
types.ts             the vocabulary both shells share
```

## The four rules worth knowing

**A record is keyed by what it is, not by whose it is.** `T1:ENCOUNTER:5001`,
never the patient. One patient has a 360 view, two encounters and a medication
chart open at once; keying on the person would collapse them and the second
click would focus the wrong screen with the duplicate guard reporting nothing
wrong.

**Policy narrows, never widens.** Platform → shell → module → page → role →
user. The first level entitled to speak establishes the set; every level after
it may only remove. A user preference naming `WINDOW` where the shell removed it
is a request, not a grant — and a preference that is the *only* level to speak
establishes nothing, because that is the same escalation reached by leaving the
other five silent.

**Every document carries its own security context.** There is no
`currentPatientId` anywhere in this package, and adding one would be the bug it
exists to prevent: with two patients open, a shared mutable variable is a
wrong-patient action waiting for a race between a click and a fetch.

**Restore carries keys, not people.** `restoreMetadata()` emits ids and modes
and nothing else — a title is a patient's name, and a persisted title reaches
localStorage, desktop files, window titles and OS thumbnails. Restoring rebinds
to the live session rather than trusting the tenant and user written in the
file, asks `authorise` per document, and brings everything back **suspended**.

## Using it

```ts
const workspace = createWorkspace({
  session: { tenantId: "T1", userId: "dr-x", roleId: "clinician", branchId: "AD01" },
  policy: {
    platform: { modes: ["SINGLE", "TAB", "SPLIT", "WINDOW"] },
    shell:    { modes: ["SINGLE", "TAB", "SPLIT"] },   // web: no floating windows
    page:     { modes: ["TAB", "SPLIT"] },
    user:     { modes: ["TAB"] },                      // narrows, never widens
  },
});

workspace.openDocument({
  module: "CLINICAL", documentType: "ENCOUNTER", entityId: "5001",
  title: "Maya Thomas", patientId: "100", route: "/encounters/5001",
});
```

Every refusal names its cause: `"WINDOW is not available — removed at the shell
level."`, `"The workspace limit of 12 open documents has been reached."`,
`"This document has unsaved changes."`

## Tests

```bash
npm test -- workspace-core     # 55 tests
```

Written before the implementation, and each confirmed to fail before it was
trusted. Ten deliberate breakages — keying on the patient, allowing a colon
through, letting a preference widen, removing the duplicate guard, checking the
limit before it, closing dirty documents silently, persisting titles, trusting
the tenant in a restore file, keeping documents across a tenant switch, and
emitting an event for a no-op focus — each turned the suite red.

Two of them changed the code rather than confirming it. The limit resolver
treated `DEFAULT_LIMITS` as a ceiling, so a platform asking for twenty open
documents got twelve with nothing saying why; defaults are now a fallback that
the first entitled level replaces outright. And `maxActiveDocuments` is
deliberately **not** enforced here: in a tab workspace exactly one document is
visible, so the ceiling has nothing to bind until split panes arrive in Phase 3,
and enforcing it now would be enforcing a limit nothing can reach.

## Not in this package

Tab bars, split panes, detachable windows, routing and React bindings are
Phases 2–5 and belong to the shells. This layer is what they all share.
