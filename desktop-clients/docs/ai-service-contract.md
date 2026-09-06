# The AI service contract

_6 September 2026._

What a real AI service must implement for this client to talk to it unchanged,
and what `dummy-api` does instead. Written so the backend is built against a
specification rather than against a mock — the plan's Task 8 says the client
contract should not be invented twice, and this is the half that stops that
happening.

Read alongside `ai-hardening-ledger.md`, which records what is not discharged
here and is checked by `npm run verify:ai-hardening`.

## The one rule the shape follows from

**The browser never holds a key, a prompt, or a policy it can widen.**

Everything below is a consequence. The client sends an intent — a use case, a
page, and the fields the use case is allowed to read — and the service decides
what that becomes. A client that could name a model, supply a system prompt or
assert a tenant would be a client that could route PHI to an unapproved provider
by editing a request in devtools.

## Endpoints

Six, all authenticated by bearer token. The tenant is derived from the session
on the server and **never read from the request body** — a tenant a client can
assert is not isolation.

### `GET /ai/policy`

The eight gates for this tenant, as data.

```jsonc
{
  "tenantId": "NEX-AE-001",          // from the session, echoed for clarity
  "global":   { "tenant": { "allowed": true } },
  "modules":  { "healthcare": { "allowed": true, "useCases": ["encounter.summarise"] } },
  "pages":    { "consultation-entry": { "allowed": true } },
  "useCases": { "record.explain": { "allowed": false } }   // off everywhere at once
}
```

`resolveAi()` in `@pepbits/ai-config` collapses this with the page's build-time
block and the user's preference. **Deny wins at every level**, and `role` and
`user` may narrow but never establish — see `NARROWING_ONLY` in `gates.ts`.

The service must not send a policy that grants more than the tenant's licence.
The client cannot check that.

### `PUT /ai/policy`

Administrative. Replaces the tenant's policy. Requires a role the platform
defines; `dummy-api` checks `role === "enterprise-admin"`, which a real
deployment must replace with its own authorisation.

### `GET|PUT|DELETE /ai/config`

Provider and model for the tenant.

```jsonc
{
  "provider": { "id": "azure-openai", "label": "Azure OpenAI", "endpoint": "https://…" },
  "model":    { "id": "gpt-4o", "label": "GPT-4o", "contextWindow": 128000 },
  "speech":   { "providers": [{ "id": "azure", "verified": true }] }
}
```

**The endpoint is a server concern.** It appears here so an administrator can
see where dispatch goes, not so a client can change where it goes — the service
must validate it against an allowlist of approved providers, because "which
provider" is the decision that determines whether PHI leaves a jurisdiction.

### `GET|PUT|DELETE /ai/config/credential`

Write-only at the API surface. `GET` returns a **status**, never a value:

```jsonc
{ "configured": true, "hint": "…f325", "fingerprint": "sha256:9c1e…", "setBy": "USR-00311",
  "setAt": "2026-09-03T…", "rotatedAt": null, "lastVerifiedAt": "2026-09-03T…" }
```

Four characters and a hash prefix are enough to answer "is this the key I
think it is" and not enough to use. A real service holds the secret in a KMS or
a vault and never in its own database.

### `POST /ai/config/credential/verify`

Reaches the provider with the stored key and reports whether it was accepted.
Spends from the same rate budget as dispatch — an administrative action that
bypassed the limit would be the obvious way round it.

### `POST /ai/dispatch`

The only endpoint that reaches a model.

```jsonc
{
  "promptId": "worklist.summarise.v1",   // an id, never prompt text
  "pageId":   "customer-master",
  "fields":   [{ "label": "Status", "value": "Active" }],
  "userInput": "why is this on hold?"    // optional, free text, always suspect
}
```

**`promptId`, not a prompt.** The client cannot read, replay or edit a system
prompt, and changing one is a server deploy rather than a client rebuild. This
is already true in `dummy-api` — `PROMPT_TEXT` lives on the server — and it is
the one part of Task 8 that is genuinely discharged.

**`fields`, not a record.** The use case declares which fields it may read
(`@pepbits/ai-config`'s `sources`), and the client sends only those. The service
must not trust that: a request naming twenty fields for a use case that declares
three is a client that has been edited, and it should be refused rather than
truncated.

Response:

```jsonc
{ "text": "…", "usage": { "promptTokens": 412, "completionTokens": 96 },
  "model": "gpt-4o", "finishReason": "stop" }
```

`finishReason` matters: a `length` finish with empty text is a real failure mode
that looks like a silent success. `dummy-api` learned this the hard way with a
reasoning model and `max_tokens: 700`.

### `GET /ai/usage`

What the tenant has spent, so the UI can show a limit before it is hit rather
than only when it is.

## What a real service must add

The client needs none of these to work, which is exactly why they are easy to
skip.

**Redaction before egress.** Strip identifiers from `fields` and `userInput`
before they reach a provider. The client sends what the use case allows; only
the service can enforce what leaves the network.

**A provider allowlist per data class.** Clinical use cases may reach only
providers under contract for PHI. A tenant configuring an arbitrary endpoint
through `PUT /ai/config` must be refused, not obeyed.

**Durable audit.** Who asked, which use case, which record, which provider,
what it cost, and whether it was refused — queryable and retained. Keys and
prompt text and model output belong in it only if the retention policy says so.
`dummy-api` writes one `console.log` line, which is not an audit store.

**A key vault.** Encryption at rest, rotation, and a secret the application
process can use without being able to read out of its own storage.

**Rate limits per tenant AND per user.** `dummy-api` limits per tenant only, so
one user can exhaust a tenant's budget.

## What `dummy-api` does instead

It implements every endpoint above with the right shapes and the wrong
guarantees, on purpose, so the client can be built and driven end to end. Its
own header says so. The gaps are enumerated in `ai-hardening-ledger.md` and
asserted by `npm run verify:ai-hardening`, so that "it works in the demo" can
never be mistaken for "it is discharged".
