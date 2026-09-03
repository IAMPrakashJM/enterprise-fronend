# Enterprise Contextual AI Assistant — one capability, gated everywhere

**Date:** 2026-09-03
**Status:** Draft, pending review
**Branch:** `feat/ai-assistant` (not yet cut)
**Baseline commit:** `368ac32`

## 1. Goal

Add one reusable AI assistant to the shell, available **only where it has been
explicitly enabled**, able to show the user exactly what it is about to send
before it sends it, and unable to see anything the signed-in user could not open
themselves.

The assistant is the small part. The requirement decomposes into five things,
and only the fourth is the kind of UI work this repository has done so far:

| | |
|---|---|
| Control plane | who may use AI, where, for what — eight gates |
| Context assembly | what page data becomes a prompt |
| Transparency | showing the payload and the pipeline before dispatch |
| Presentation | panel · action · terminal, plus themes |
| Governance | central providers, keys, prompts, limits, audit — §6 |

## 2. Hard constraints

Requirements, not preferences. A change that violates one is a defect.

1. **The assistant is never a privileged actor.** Every retrieval it performs
   goes through the same authorization path as the user's own requests, carrying
   the user's identity. If the user cannot open a record, the assistant cannot
   summarise it. No service account, no elevated read.
2. **No provider credential ever reaches the browser.** Keys, endpoints, model
   names and limits live server-side and are readable only by the AI service.
3. **The payload is inspectable before dispatch.** The user can see the exact
   assembled context, field by field, before anything leaves the client.
4. **Deny wins.** Any of the eight gates can disable AI. No lower gate can
   re-enable what a higher one disabled — see section 4.
5. **Nothing is silently widened.** A use case declares the data it may read.
   There is no general-purpose fetcher the assistant can reach for.
6. **Every dispatch is audited**, with the same object the user was shown.
7. **Tenant isolation is absolute.** No context, cache, prompt or audit record
   crosses a tenant boundary.
8. **Credentials are write-only.** A provider token can be SET and REPLACED
   through the administration API. It can never be read back — not by an
   administrator, not by the AI service's own callers, not in an error message
   or a log line. `GET` returns the credential's *status*, never its value.

## 3. Decisions taken

| # | Decision | Rationale |
|---|---|---|
| D1 | Precedence is **deny-wins** across all eight gates, and the `user` gate may only ever *narrow* | The alternative — nearest-wins — makes "enable at user level" a way around a tenant policy. For a capability touching clinical data the asymmetry has to be explicit, not implied. |
| D2 | The resolver returns **the deciding gate**, not a boolean | When the panel is absent someone will ask why. "Disabled at tenant level" is answerable; `false` is not. It is also what makes the admin UI diagnosable. |
| D3 | Context is assembled into a **serialisable object**, then presented, then confirmed, then dispatched | Building the prompt inside a provider adapter makes constraint 3 impossible — by then there is nothing left to show. This ordering is what makes transparency and audit the same artefact. |
| D4 | Use cases are declared **centrally** and bound to pages by id | A page says *which* use cases it offers; it does not define them. Otherwise the same "summarise" exists in six variants and none can be governed. |
| D5 | Each use case carries an explicit **retrieval allowlist** | Retrieval is the leak, not the prompt. "Summarise this invoice" that also fetches "related records" has widened its own scope without anyone deciding to. |
| D6 | All provider calls are **server-side**, through one AI service | Follows from constraint 2. Also the only place rate limits, redaction and audit can be enforced rather than requested. |
| D7 | The dev-time flag lives on `PageDefinition` in `@pepbits/erp-config` | 135 pages already resolve through one registry; a second list of "AI pages" would drift from it within a release. |
| D8 | Three presentation modes over **one engine** | Panel, inline action and terminal differ in affordance, not in capability. Separate engines would mean three places to enforce the same policy. |
| D9 | Themes reuse the existing chrome-palette mechanism | `chromePalette()` already derives a full panel palette from two seeds per theme, and 14 themes already declare them. |
| D10 | The audit record **is** the transparency payload, plus the outcome | Two shapes would drift, and the one shown to the user is the one that matters in a review. |
| D11 | The client half ships against a **stub policy service** with the real contract | Lets the registry, surfacing, transparency and terminal work proceed without pretending `dummy-api` is a security boundary. See section 12. |
| D12 | AI settings are **fetched and set through one administration API**, separate from the runtime policy read | Two audiences, two shapes: the shell asks "may I, and for what" on every page; an administrator asks "what is configured" once. Serving both from one endpoint would put provider and limit data on every page load. |
| D13 | `GET` on a credential returns a **status object**, never the value | The objective asks to fetch and set the token; constraint 8 forbids reading it back. Both hold if fetch answers "is one installed, which one, since when" — enough to administer a key, not enough to exfiltrate it. The last four characters and a fingerprint identify it without disclosing it. |
| D14 | Writing a credential is a **separate endpoint** from writing the rest of the config | So the common edit — change a model, raise a limit — never carries a secret in its body, and the endpoint that does can be rate-limited, re-authenticated and audited differently. |

## 4. The access model

### 4.1 The eight gates

| # | Gate | Set by | Lives |
|---|---|---|---|
| 1 | Build | developer | `PageDefinition.ai` in the page registry |
| 2 | Platform | platform operator | policy service |
| 3 | Tenant | tenant administrator | policy service |
| 4 | Application | tenant administrator | policy service |
| 5 | Module | tenant administrator | policy service |
| 6 | Page | tenant administrator | policy service |
| 7 | Use case | tenant administrator | policy service |
| 8 | User | the user | user preferences |

Gate 1 is compiled in. Gates 2-7 are runtime configuration owned by
administrators. Gate 8 is a preference and can only turn AI **off**.

**A ninth gate, Role, was specified and then removed from scope on 2026-09-03.**
It was defined against an application authorization layer that does not exist
here — role is decorative, and its setter was deleted in `8d49e9e` for exactly
that reason. A gate that checks nothing while appearing to gate AI is worse than
no gate, because its absence is at least visible. `NARROWING_ONLY` in
`gates.ts` carries a note to re-add it there, not only to `GATES`, if
authorization is ever built.

### 4.2 Resolution

```
resolveAi(page, useCase, principal) -> { allowed: boolean; decidedBy: Gate; reason: string }
```

Evaluated in the order above, stopping at the first gate that denies. The result
carries the gate that decided so the UI, the logs and the admin console all give
the same answer to "why is this off".

Two rules that are not negotiable:

- **A gate can only deny.** There is no `force-enable`. A tenant that disables
  AI cannot be overridden by a module, a page or a user.
- **Gate 8 narrows only.** It may remove use cases from the set the earlier
  gates allowed. It may not add one back — including when it is the only gate to
  name a set at all, which would be establishing one rather than reducing one.

### 4.3 Worked examples

| Case | Outcome |
|---|---|
| Page has no `ai` block | denied at gate 1 — the assistant does not render at all |
| Tenant off, page on, user on | denied at gate 3 |
| Page allows `summarise` + `draft`; use-case gate allows `summarise` | `summarise` only |
| User names a use case no earlier gate allowed | denied — the user gate cannot establish a set |
| User turns AI off | denied at gate 8, all use cases |
| Everything allows | allowed, `decidedBy: "user"` |

## 5. Data contracts

```ts
/** Declared centrally, in @pepbits/ai-config. Pages reference these by id. */
interface AiUseCase {
  id: string;                      // "invoice.summarise"
  label: string;
  description: string;             // shown in the transparency panel
  /** The ONLY data this use case may read. No wildcards. */
  reads: Array<{ source: "page-record" | "worklist-selection" | "form-values";
                 fields: string[];        // explicit; "*" is not accepted
                 optional?: boolean }>;
  /** Server-side prompt id. The client never holds prompt text. */
  promptId: string;
  category: "general" | "clinical";
  /** Clinical use cases require a second confirmation and are audited
      with the elevated retention class. */
}

/** Built on the client, shown to the user, sent, and stored as the audit body. */
interface AiContext {
  useCaseId: string;
  pageId: string;
  capturedAt: string;              // ISO
  fields: Array<{ label: string; value: string; source: string;
                  redacted?: boolean }>;
  userInput?: string;
}

interface AiAuditRecord {
  id: string;
  tenantId: string;
  userId: string;
  context: AiContext;              // D10: the same object the user saw
  decidedBy: Gate;
  provider: string;                // resolved server-side
  model: string;
  outcome: "answered" | "refused" | "error" | "cancelled";
  latencyMs: number;
}
```

`AiContext.fields` is a flat, labelled list on purpose: it is what the
transparency panel renders, so it cannot contain anything the user was not
shown.

## 6. Administration API

Two separate surfaces, because they have two audiences and two lifetimes.

| Surface | Read by | When | Carries |
|---|---|---|---|
| **Policy** | the shell, for every user | on session start, cached | the eight gates only |
| **Configuration** | administrators | when someone opens the admin screen | providers, models, limits, prompts, credential *status* |

The shell never sees the configuration surface. Serving both from one endpoint
would put provider names and rate limits into every page load for every user.

### 6.1 Endpoints

```
GET    /ai/policy                 -> { tenantId, gates }        any signed-in user
GET    /ai/config                 -> AiConfig                    admin only
PUT    /ai/config                 <- Partial<AiConfig>           admin only
PUT    /ai/config/credential      <- { secret: string }          admin only, write-only
DELETE /ai/config/credential                                     admin only
PUT    /ai/policy                 <- { gates }                   admin only
```

`tenantId` is derived server-side from the session on every one of these. A
tenant id in a request body is ignored, never trusted.

### 6.2 Shapes

```ts
interface AiConfig {
  tenantId: string;
  provider: { id: string; label: string; endpoint: string };
  model: { id: string; label: string; contextWindow: number };
  limits: { requestsPerMinute: number; tokensPerDay: number; maxContextFields: number };
  /** Prompt IDS and metadata. Prompt TEXT is never returned -- it is resolved
      server-side at dispatch, so a client cannot read or replay it. */
  prompts: Array<{ id: string; useCaseId: string; version: number; updatedAt: string }>;
  retention: { class: "standard" | "elevated"; days: number };
  dataSharing: { providerTrainsOnContent: boolean; region: string };
  credential: AiCredentialStatus;
}

/**
 * What GET returns in place of the token. Enough to administer a key --
 * whether one is installed, which one, how old, who put it there -- and not
 * enough to use it anywhere.
 */
interface AiCredentialStatus {
  configured: boolean;
  /** Last four characters only. Lets an admin tell two keys apart. */
  hint: string | null;              // "…a91f"
  /** SHA-256 prefix, for matching against a vault record without disclosure. */
  fingerprint: string | null;
  setBy: string | null;             // user id
  setAt: string | null;             // ISO
  rotatedAt: string | null;
  /** Set by the service after a failed provider call, so a bad key is
      diagnosable without anyone reading it back. */
  lastVerifiedAt: string | null;
  lastError: string | null;
}
```

### 6.3 Rules for the credential path

1. `PUT /ai/config/credential` accepts the secret, stores it in the vault, and
   returns **204 with no body**. It does not echo the value, not even truncated
   beyond the four-character hint on the next `GET`.
2. The secret never appears in a log line, an error message, a stack trace or an
   audit record. The audit records *that* a credential was set, by whom, and the
   new fingerprint — never the value.
3. Rotation is `PUT` again. There is no read-modify-write cycle, because there is
   no read.
4. `DELETE` removes it and sets `configured: false`. AI then resolves as denied
   at the platform gate with a reason naming the missing credential, rather than
   failing at dispatch with a provider error the user cannot act on.
5. Only the AI service reads the vault. No other service, and no request path
   that can be reached from a browser.

### 6.4 Who counts as an administrator

Gate 8's problem in miniature: this repository has no authorization layer, so
"admin only" has nothing to check. Until one exists, the stand-in must **fail
closed** — refuse every write and say why — rather than accept writes from any
signed-in session and appear to work. See section 12.

## 7. Package layout

```
packages/
  ai-config/     @pepbits/ai-config    use-case catalogue, gate types, resolver
  ai-client/     @pepbits/ai-client    context assembly, policy fetch, transport
  ai-ui/         @pepbits/ai-ui        panel, inline action, terminal, transparency
```

Dependency direction, consistent with the existing rule that packages never
import from applications:

```
ai-config   -> erp-config
ai-client   -> ai-config, auth
ai-ui       -> ai-client, ai-config, ops-ui, erp-shell
apps/*      -> all three
```

`ai-ui` depends on `erp-shell` for the ERP context, exactly as `erp-screens`
does. Nothing in `erp-shell` or `ops-ui` learns that AI exists.

## 8. The transparency surface

Three tabs on one panel, opened before dispatch and reachable afterwards from
any answer:

- **Data** — the `AiContext.fields` list: label, value, which page element it
  came from, and whether it was redacted. This is the screen constraint 3 asks
  for, and it is rendered from the object that is actually sent.
- **Flow** — where the request goes: client → AI service → provider, what is
  retained at each hop and for how long, and which provider is resolved for this
  tenant. Static per tenant, fetched with the policy.
- **Policy** — retention window, data-sharing terms, whether the provider trains
  on submitted content, and the gate that allowed this use case.

Dispatch requires an explicit action. Clinical use cases require a second
confirmation naming the record.

## 9. Presentation modes

| Mode | Affordance | Where |
|---|---|---|
| Panel | conversational, docked | any allowed page |
| Inline action | one use case, one click, result in place | worklists, forms |
| Terminal | keyboard-first console, `:` commands, transcript | any allowed page |

All three call the same engine and receive the same `AiContext`. Terminal mode
is an affordance, not a privilege: it cannot invoke a use case the panel could
not, and its command surface is generated from the resolved use-case set.

Themes come from the user's preferences and reuse `chromePalette()`, so the
assistant inherits all 14 palettes and the light/deep tones already in place.

## 10. Security and safety

**Authorization.** The assistant holds no credentials of its own. Retrieval
happens through the same authenticated calls the page already makes, with the
user's token. The AI service re-checks the resolver server-side; the client
resolver is for rendering only and is never the enforcement point.

**Tenant isolation.** Tenant id is derived server-side from the session, never
accepted from the client. Prompts, policies, caches and audit records are
partitioned by it.

**Redaction** runs during assembly, before the transparency panel renders, so
what the user sees is what leaves the browser — not a cleaner version of it.

**Clinical safety.** Clinical use cases never assert; they summarise, cite the
record fields used, and carry a fixed non-diagnostic disclaimer. No use case may
write to a record — the assistant proposes, the user commits through the normal
form and its normal validation.

**Workflow rules.** The assistant cannot advance a workflow. Anything it drafts
enters the existing screens as unsaved input.

## 11. Audit

One record per dispatch, written server-side, containing the object in section
5. Refusals and cancellations are recorded too — an assistant that refuses is a
governance event, and a gap in the log is indistinguishable from a gap in the
capability.

Retention follows the tenant's class; clinical records take the elevated class.
Records are queryable by user, page, use case and outcome.

## 12. What this repository can host today

Stated plainly, because two of the eight gates have nothing to attach to here.

| Requirement | Status |
|---|---|
| Build-time page gate | **Fits.** `PageDefinition` gains an optional `ai` block |
| Module / page / use-case gates | **Concepts exist** — six modules, one page registry |
| User gate | **Exists.** 49 server-persisted preferences |
| Themes | **Done.** 14 themes, chrome tones, `chromePalette()` |
| Panel / terminal UI | Buildable — `HelpAssistant` proves the docked-panel pattern |
| Transparency panel | Buildable, and the most valuable part to prototype |
| ~~Role gate~~ | **Removed from scope**, because of exactly this: role is decorative, its setter was deleted in `8d49e9e`, and `record-preview.tsx:29` still claims visibility is "filtered by your current role, branch and field-level permissions" when nothing does that. |
| **Tenant gate** | **Does not exist.** One string in the footer: `Mock tenant • NEX-AE-001` |
| **Providers, keys, prompts, audit** | **Nowhere to live.** `dummy-api/server.mjs` states in its own header that it is not a security boundary: plaintext passwords, no token expiry, open CORS. |
| **Administration API** (§6) | **Shape is buildable, storage is not.** The endpoints and their contracts can be stood up against a JSON file so the admin screen has something real to talk to. A provider secret must NOT be among them: `dummy-api` has no vault, no encryption at rest and open CORS, so a token written there is a token in a world-readable file. The stand-in stores everything EXCEPT the credential, and returns `configured: false` with a reason. |

So the client half is buildable now against a **stub policy service that speaks
the real contract**; the control plane, key vault, prompt registry and audit log
need a backend this repository does not have. Building the client against
`dummy-api` as though it were the real thing would produce something that demos
correctly and cannot be hardened.

## 13. Order of work

1. **The resolver and its types**, in `@pepbits/ai-config`, with the precedence
   table from 4.3 as tests. Everything else depends on this and it is the piece
   the brief leaves open.
2. **`PageDefinition.ai`** plus the use-case catalogue; no UI yet.
3. **Stub policy service** in `dummy-api`, serving gates 2-7 from a JSON file
   and clearly labelled as a stand-in.
4. **Administration API** (§6) — config read/write and the credential status
   shape, with credential WRITES refused by the stand-in. Gives the admin screen
   a real contract to build against without a vault existing.
5. **Context assembly + the transparency panel.** Deliverable on its own: it can
   show what *would* be sent without a provider behind it.
6. **Panel mode**, over a mock responder.
7. **Terminal mode** and inline actions.
8. **Real AI service** — providers, keys, prompts, limits, audit. Out of scope
   for this repository; specified here so the client contract is not invented
   twice.

Steps 1-7 each end in a working, committable state.

## 14. Risks and open items

| Risk | Mitigation |
|---|---|
| The assistant becomes a read-around for authorization | Constraint 1, enforced server-side. The client resolver is never the enforcement point. |
| A use case widens its own scope through retrieval | D5: explicit field allowlists, no wildcards. Reviewed per use case. |
| The transparency panel drifts from what is sent | D3 + D10: one object, assembled once, shown, sent and logged. |
| Nine gates become unauditable in combination | D2: the resolver names the deciding gate everywhere it is used. |
| ~~"Role level" is specified against an authorization layer that does not exist~~ | **Resolved 2026-09-03: out of scope, removed from `GATES`.** Eight gates remain. |
| Prompt text on the client | D6: prompts are ids client-side, resolved server-side. |
| A credential is read back through the config API | D13 + constraint 8: `GET` returns a status object. There is no code path that returns the value, so this cannot regress by omission — only by someone adding a field. |
| The stand-in accepts a real provider token | §12: the stand-in refuses credential writes outright. A key in `dummy-api/data/` is a key in a world-readable file on a box with open CORS. |
| "Admin only" enforced by nothing | §6.4: fail closed until an authorization layer exists. Accepting admin writes from any signed-in session is worse than refusing them, because it looks like it works. |
| Terminal mode as a bypass | Section 8: same engine, same resolved set. |

**Open, needs a decision before step 1:**

- Does "application level" mean the web/desktop shells, or a tenant's licensed
  product set? The brief lists it between tenant and module, which suggests the
  latter, but it is worth confirming.
- Retention classes: who defines them, and are they per tenant or per region?

## 15. Non-goals

- No provider is chosen or integrated in this repository.
- No agentic behaviour: the assistant does not act, it proposes.
- No writes. Nothing the assistant produces reaches a record except through the
  existing forms and their validation.
- No offline or on-device inference.
- No cross-tenant learning, tuning or caching of any kind.
- No replacement for the existing help assistant or guided tour; they remain
  separate, non-AI features.
