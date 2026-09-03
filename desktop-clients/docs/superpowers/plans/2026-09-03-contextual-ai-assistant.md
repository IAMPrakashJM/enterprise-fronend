# Contextual AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One reusable AI assistant, surfaced only where eight gates all allow it, able to show the user the exact payload before dispatch, and unable to read anything the signed-in user could not open themselves.

**Architecture:** A resolver decides access; a context assembler builds one serialisable object; the transparency panel renders that object; the transport sends it; the audit stores it. Panel, inline action and terminal are three affordances over one engine. Provider keys, prompts and limits never reach the browser.

**Tech Stack:** TypeScript 5.7, React 19.2, Tailwind CSS 4, lucide-react. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-03-contextual-ai-assistant-design.md`

## Global Constraints

- **The assistant is never a privileged actor.** Every retrieval carries the signed-in user's token through the path the page already uses. No service account, no elevated read. A client-side resolver is for RENDERING only — it is never the enforcement point.
- **No provider credential, endpoint or prompt text in the browser.** The client holds prompt *ids*. Anything else is a defect.
- **Deny wins.** Eight gates, evaluated in order, first denial stops. `user` may only narrow the allowed set, never add to it — including when it is the only gate to name one. A `role` gate was specified and removed from scope: there is no authorization layer here, so it would have checked nothing while appearing to gate AI.
- **One object.** The context assembled is the object shown, the object sent, and the object logged. Three shapes would drift; one cannot.
- **No wildcards in `reads`.** A use case names its fields. `"*"` is rejected at the type level and at runtime.
- **The assistant proposes, it never commits.** No write reaches a record except through the existing forms and their validation.
- **Credentials are write-only.** A provider token can be set and replaced. It is never returned, logged, echoed in an error, or present in any client type. `GET` returns a status object: configured, last four characters, fingerprint, who and when.
- **Tasks 1–7 do not require a real backend.** Tasks 3 and 4 are explicitly labelled stand-ins. Do not let them accrete responsibilities that belong to a real service — see spec §12. Task 4 in particular REFUSES credential writes rather than storing them.

## File Structure

### New packages

```
packages/ai-config/src/
  gates.ts          Gate, AiAccess, resolveAi
  use-cases.ts      AiUseCase, USE_CASES catalogue
  index.ts
packages/ai-client/src/
  assemble.ts       AiContext construction from page sources
  policy.ts         fetch + cache the runtime gates
  transport.ts      dispatch, mock responder behind a flag
  index.ts
packages/ai-ui/src/
  assistant-panel.tsx
  transparency.tsx  Data / Flow / Policy tabs
  terminal.tsx
  inline-action.tsx
  index.ts
```

### Touched

```
packages/erp-config/src/types.ts        PageDefinition gains `ai?`
packages/erp-config/src/navigation.ts   `ai` blocks on the pilot pages
dummy-api/server.mjs                    GET /ai/policy (Task 3), /ai/config (Task 4)
packages/erp-shell/src/layers/index.tsx mount the panel
```

## Task 1: The resolver and its types

**Files:**
- Create: `packages/ai-config/{package.json,tsconfig.json}`, `src/gates.ts`, `src/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Gate`, `GateState`, `AiAccess`, `resolveAi`.

- [ ] **Step 1: Write `gates.ts`**

```ts
/** In evaluation order. The first gate that denies decides. */
export const GATES = ["build", "platform", "tenant", "application", "module", "page", "useCase", "user"] as const;
export type Gate = (typeof GATES)[number];

/** Gates that may only NARROW the surviving set, never establish or extend it. */
export const NARROWING_ONLY: ReadonlySet<Gate> = new Set<Gate>(["user"]);

export interface GateState {
  /** undefined means "this gate expresses no opinion" and passes. */
  allowed?: boolean;
  /** Use-case ids this gate permits. Absent = no restriction from this gate.
      Gates never ADD to the set -- see narrowing below. */
  useCases?: string[];
}

export interface AiAccess {
  allowed: boolean;
  /** The gate that decided. Rendered in the UI and written to the audit. */
  decidedBy: Gate;
  reason: string;
  /** Intersection across every gate that expressed an opinion. */
  useCases: string[];
}

/**
 * Deny-wins. Evaluated in GATES order, stopping at the first denial.
 *
 * `role` and `user` may only NARROW: they intersect the surviving set and can
 * deny outright, but a use case absent from an earlier gate can never be added
 * back. Without that asymmetry "enable at user level" is a way around a tenant
 * policy, which is not defensible for a capability touching clinical data.
 */
export function resolveAi(states: Partial<Record<Gate, GateState>>, requested?: string): AiAccess {
  let useCases: string[] | null = null;
  for (const gate of GATES) {
    const state = states[gate];
    if (!state) continue;
    if (state.allowed === false) {
      return { allowed: false, decidedBy: gate, reason: `Disabled at ${gate} level.`, useCases: [] };
    }
    if (state.useCases) {
      if (useCases === null) {
        /* The first gate to name a set ESTABLISHES it, and a narrowing-only
           gate must never be that gate. Without this branch, `role` alone
           naming ["a"] resolves to allowed[a] even though no earlier gate
           permitted anything -- role defining a set rather than reducing one,
           which is the escalation this design forbids by another route.
           Found by verify-ai-gates.mjs; the original eight-row table did not
           cover it. */
        useCases = NARROWING_ONLY.has(gate) ? [] : [...state.useCases];
      } else {
        useCases = useCases.filter((id) => state.useCases!.includes(id));
      }
    }
  }
  const resolved = useCases ?? [];
  if (resolved.length === 0) {
    return { allowed: false, decidedBy: "useCase", reason: "No use case is enabled for this page.", useCases: [] };
  }
  if (requested && !resolved.includes(requested)) {
    return { allowed: false, decidedBy: "useCase", reason: `"${requested}" is not enabled here.`, useCases: resolved };
  }
  return { allowed: true, decidedBy: "user", reason: "Allowed.", useCases: resolved };
}
```

- [ ] **Step 2: Verify against spec §4.3**

Every row of the worked-examples table, plus the narrowing asymmetry:

| Input | Expect |
|---|---|
| `{}` (no gate speaks) | denied, `useCase`, "No use case is enabled" |
| `build: { allowed: false }` | denied, `decidedBy: "build"` |
| tenant off, page on, user on | denied, `decidedBy: "tenant"` |
| page `[a,b]`, useCase `[a]` | allowed, `useCases: ["a"]` |
| page `[a]`, **user `[a,b]`** | allowed, `useCases: ["a"]` — user did NOT widen |
| **user `[a]` and nothing else** | **denied** — user may not establish a set |
| page `[a,b]`, useCase `[a]`, user `[a,b]` | allowed, `["a"]` — user cannot re-add |
| a stray `role` key | ignored — no longer a gate |
| page `[]` | denied — an emptied set is a denial |
| `user: { allowed: false }` | denied, `decidedBy: "user"` |
| all allow, page `[a]` | allowed, `decidedBy: "user"` |
| requested `"z"` not in set | denied, reason names `"z"` |

**Verification:** `npm run verify:ai-gates` — a zero-dependency script beside
`verify-parity.mjs` that imports the real module (Node 24 strips types on
import, so there is no second copy to drift). Thirteen cases; the three marked
ESCALATION are the ones that matter. If any fails, a narrowing gate can widen
the allowed set and "enable at user level" becomes a route around a tenant
policy — stop and fix before continuing.

## Task 2: The use-case catalogue and the page flag

**Files:**
- Create: `packages/ai-config/src/use-cases.ts`
- Modify: `packages/erp-config/src/types.ts`, `packages/erp-config/src/navigation.ts`

**Interfaces:**
- Consumes: `Gate` from Task 1.
- Produces: `AiUseCase`, `USE_CASES`, `PageDefinition.ai`.

- [ ] **Step 1: `AiUseCase` and the catalogue**

Fields per spec §5. `reads[].fields` is `string[]` with no wildcard; add a
runtime guard that throws on `"*"` at module load, so a bad entry fails the
build rather than widening scope in production.

Seed three, one per shape:

| id | reads | category |
|---|---|---|
| `worklist.summarise-selection` | `worklist-selection` → the visible column keys | general |
| `record.explain` | `page-record` → the entity's schema fields | general |
| `form.draft-note` | `form-values` → named fields only | general |

- [ ] **Step 2: `PageDefinition.ai`**

```ts
ai?: {
  /** Gate 1. Absent means the assistant never renders on this page. */
  enabled: true;
  /** Ids from USE_CASES. The page offers these; it does not define them. */
  useCases: string[];
};
```

- [ ] **Step 3: Enable it on three pilot pages only**

`customer-master` (worklist), `billing-entry` (form), `finance-dashboard`
(neither — to prove a page without an `ai` block renders nothing).

**Verification:** `PAGE_REGISTRY` still builds; `tsc --noEmit` clean; the guard
throws when a `"*"` is introduced deliberately, then remove it.

Note for whoever does this: `PAGE_REGISTRY` is built field by field in
`navigation.ts`, so adding `ai` to `explicitPages` is not enough — the builder
drops any key it does not name. It needs
`...(explicit.ai ? { ai: explicit.ai } : {})` as well, spread conditionally so a
page without a block has no `ai` key at all rather than `ai: undefined`.

## Task 3: Stand-in policy service

**Files:**
- Modify: `dummy-api/server.mjs`
- Create: `dummy-api/data/ai-policy.example.json`

**Interfaces:**
- Produces: `GET /ai/policy` → `{ gates: Partial<Record<Gate, GateState>> }`.

- [ ] **Step 1: Serve gates 2–8 from a JSON file**

Serves gates 2-7. Same bearer check as `/preferences`. Header comment must state, in the file,
that this is a stand-in for a real policy service and enforces nothing —
`dummy-api` already says it is not a security boundary, and this endpoint is the
one most likely to be mistaken for governance.

- [ ] **Step 2: A tenant field, derived server-side**

Return `tenantId` from the session, never from the request. It is unused in
Task 3 and exists so the client contract is right from the start.

**Verification:** `GET` unauthenticated → 401. Editing the JSON and re-fetching
changes the resolved gates. A `tenantId` in the request body is ignored.

## Task 4: Administration API — fetch and set the AI settings

**Files:**
- Modify: `dummy-api/server.mjs`
- Create: `dummy-api/data/ai-config.example.json`, `packages/ai-client/src/admin.ts`

**Interfaces:**
- Produces: `GET/PUT /ai/config`, `PUT/DELETE /ai/config/credential`, `PUT /ai/policy`; client `fetchAiConfig`, `saveAiConfig`, `setAiCredential`.

- [ ] **Step 1: `GET /ai/config`**

Returns `AiConfig` per spec §6.2. The `credential` field is an
`AiCredentialStatus`, never the secret:

```js
/* Write-only, per spec constraint 8. There is deliberately no branch in this
   file that returns credential.secret -- not truncated, not behind a flag, not
   for an admin. The hint is the last four characters, which is enough to tell
   two keys apart and not enough to use either. */
function credentialStatus(record) {
  if (!record) return { configured: false, hint: null, fingerprint: null, setBy: null,
                        setAt: null, rotatedAt: null, lastVerifiedAt: null, lastError: null };
  return {
    configured: true,
    hint: `…${record.secret.slice(-4)}`,
    fingerprint: createHash("sha256").update(record.secret).digest("hex").slice(0, 12),
    setBy: record.setBy, setAt: record.setAt, rotatedAt: record.rotatedAt ?? null,
    lastVerifiedAt: record.lastVerifiedAt ?? null, lastError: record.lastError ?? null,
  };
}
```

- [ ] **Step 2: `PUT /ai/config`**

Merges provider, model, limits, retention and dataSharing. **Rejects a
`credential` key in the body with 400** — the common edit must never carry a
secret, which is why D14 gives the credential its own endpoint.

- [ ] **Step 3: `PUT /ai/config/credential` — refused by the stand-in**

```js
/* Spec §12: this stand-in has no vault, no encryption at rest and open CORS.
   A provider token written here is a token in a world-readable file. Refusing
   is the only honest answer; accepting it would make the admin screen look
   finished while creating the exact disclosure the design forbids. */
return send(res, 501, {
  error: "Credential storage is not implemented in the demo API.",
  detail: "Provider secrets need a vault. See spec §6.3 and §12.",
});
```

`DELETE` returns 204 and leaves `configured: false`, so the empty state is
reachable and the UI can be built against it.

- [ ] **Step 4: `PUT /ai/policy`, and fail closed on "admin only"**

Per spec §6.4, there is no authorization layer here. Every write endpoint
refuses with 403 and a reason naming the missing layer, rather than accepting
writes from any signed-in session. `GET` stays open to signed-in users.

- [ ] **Step 5: Client helpers in `packages/ai-client/src/admin.ts`**

`fetchAiConfig()`, `saveAiConfig(patch)`, `setAiCredential(secret)`,
`clearAiCredential()`. The type of `fetchAiConfig` returns `AiConfig` whose
`credential` is `AiCredentialStatus` — so there is no TypeScript shape in which
a secret can arrive at the client.

**Verification:**

| Check | Expect |
|---|---|
| `GET /ai/config` unauthenticated | 401 |
| `GET /ai/config` signed in | 200, `credential.configured: false` |
| grep the response for the secret in `ai-config.example.json` | no match, ever |
| `PUT /ai/config` with a `credential` key | 400 |
| `PUT /ai/config/credential` | 501, message names the vault |
| any write endpoint | 403 until authorization exists |
| a `tenantId` in a request body | ignored; response carries the session's |

The grep is the one to keep in CI: it is the check that catches someone adding
a convenience field years from now.

## Task 5: Context assembly and the transparency panel

**Files:**
- Create: `packages/ai-client/src/{assemble.ts,policy.ts}`, `packages/ai-ui/src/transparency.tsx`

**Interfaces:**
- Consumes: `AiUseCase`, `resolveAi`, `authedFetch`.
- Produces: `assembleContext`, `useAiPolicy`, `<TransparencyPanel>`.

- [ ] **Step 1: `assembleContext(useCase, sources)`**

Returns `AiContext` per spec §5. Reads only the fields the use case names.
Redaction runs HERE, before the panel renders, so what the user sees is what
leaves the browser rather than a cleaner version of it.

- [ ] **Step 2: The three tabs — Data, Flow, Policy**

Data renders `context.fields` and nothing else, so the panel cannot show a field
the payload lacks or hide one it has.

- [ ] **Step 3: Dispatch requires an explicit action**

Clinical-category use cases require a second confirmation naming the record.

**Verification:** open the panel on `customer-master`, confirm every listed
field appears in the JSON that `assembleContext` returned, and that a field
removed from the use case disappears from both.

## Task 6: Panel mode over a mock responder

**Files:**
- Create: `packages/ai-client/src/transport.ts`, `packages/ai-ui/src/assistant-panel.tsx`
- Modify: `packages/erp-shell/src/layers/index.tsx`

- [ ] **Step 1: Transport with a mock responder behind a flag**

No provider. The mock echoes the assembled context so the whole path is
exercisable without a key existing anywhere.

- [ ] **Step 2: Mount in `GlobalLayers`, render only when `resolveAi` allows**

Themes come from `chromePalette()`, so the panel inherits all 14 palettes and
the light/deep tones already shipped.

**Verification:** the panel is absent on `finance-dashboard`; present on
`customer-master`; disabling the tenant gate in the JSON removes it everywhere
and the reason string names the tenant gate.

## Task 7: Terminal mode and inline actions

**Files:**
- Create: `packages/ai-ui/src/{terminal.tsx,inline-action.tsx}`

- [ ] **Step 1: Terminal**

Keyboard-first, transcript, `:` commands generated FROM the resolved use-case
set — so it cannot name a use case the panel could not invoke.

- [ ] **Step 2: Inline action**

One use case, one click, result in place. Worklist row and form section.

**Verification:** with a use case removed by the role gate, it disappears from
the panel, the terminal's command list AND the inline affordance. If it survives
in any of the three, the engine is not shared.

## Task 8: Real AI service — OUT OF SCOPE HERE

Providers, key vault, prompt registry, rate limits, redaction policy and the
audit store need a backend this repository does not have. Specified in the spec
so the client contract is not invented twice. Do not implement against
`dummy-api`.

## Verification

```bash
npx tsc --noEmit -p apps/desktop/tsconfig.json
(cd apps/web && npx tsc --noEmit)
npx turbo run build
```

Plus, per task, the checks listed above. The two that matter most:

- **Role cannot widen** (Task 1, row 5).
- **One removal, three disappearances** (Task 6) — proof the modes share an engine.

## Open questions — answer before Task 1

Carried from spec §13. Task 1 can proceed without them; Task 3 cannot.

1. ~~Is gate 8 (`role`) in scope?~~ **Answered 2026-09-03: no.** Removed from
   `GATES`; eight gates remain. `NARROWING_ONLY` in `gates.ts` records where to
   re-add it if authorization is ever built.
2. Does "application level" mean the two shells, or a tenant's licensed product
   set?
3. Retention classes — who defines them, per tenant or per region?
