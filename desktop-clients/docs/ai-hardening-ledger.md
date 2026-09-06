# AI hardening ledger

_6 September 2026._

What is discharged, what is not, and what the not-discharged half would take.
Checked by `npm run verify:ai-hardening`, which fails if this file and the code
disagree **in either direction** — a gap that has quietly been closed is as much
a lie as one that has quietly been opened.

The reason this exists rather than a TODO comment: `dummy-api` implements the
whole AI contract with the right shapes and the wrong guarantees. It demos
correctly. Nothing in the running system says which half you are looking at, and
"it works" is the exact sentence that turns a prototype into a deployment.

## Discharged

These are real properties, enforced and checked.

| # | Property | Where | Checked by |
|---|---|---|---|
| D1 | Eight gates, deny-wins, role/user may narrow but never establish | `ai-config/src/gates.ts` | `verify:ai-gates` |
| D2 | Clinical modules and PHI entities are gated separately from the rest | `erp-config/src/navigation.ts` | `verify:ai-gates` |
| D3 | A use case reads only the fields it declares | `ai-config/src/context.ts` | `verify:ai-context` |
| D4 | Panel, terminal and inline share one engine — one removal, three disappearances | `ai-ui/` | `verify:ai-modes` |
| D5 | Prompts live on the server; the client holds ids | `dummy-api` `PROMPT_TEXT` | `verify:ai-hardening` |
| D6 | The credential is never returned by any endpoint | `dummy-api` `/ai/config/credential` | `verify:ai-credential` |
| D7 | The credential file is `0600` and gitignored | `dummy-api/data/` | `verify:ai-hardening` |
| D8 | Rate limits are enforced, and admin verification spends from the same budget | `dummy-api` | `verify:ai-limits` |
| D9 | The tenant comes from the session, never from a request body | `dummy-api` | `verify:ai-hardening` |

## Not discharged

Each carries what it actually is, not a euphemism.

| # | Gap | What exists now | What it would take |
|---|---|---|---|
| N1 | **No key vault.** The provider secret is plaintext JSON on disk. | `0600` file, one process | KMS or Vault; the process uses the key without being able to read it out of storage |
| N2 | **No encryption at rest.** | none | Envelope encryption, keys held elsewhere |
| N3 | **No key rotation policy.** `rotatedAt` is recorded, never enforced. | a timestamp field | Expiry, forced rotation, overlap window |
| N4 | **No audit store.** | one `console.log` line per dispatch | Durable, queryable, retained; who / what / which record / which provider / cost / refusals |
| N5 | **No redaction before egress.** Fields and free text reach the provider as typed. | none | Server-side identifier stripping, per data class |
| N6 | **No provider allowlist.** Any endpoint an admin configures is obeyed. | free-text endpoint | Approved providers per data class; clinical use cases refused to unapproved ones |
| N7 | **No PHI-approved provider.** No BAA, no jurisdiction guarantee. | DeepSeek / OpenAI | A provider under contract, and a region that satisfies the tenant's law |
| N8 | **Open CORS.** `Access-Control-Allow-Origin: *`. | any origin may call the API | Origin allowlist per deployment |
| N9 | **Role check is a demo.** `role === "enterprise-admin"`, from the session object. | one string comparison | The platform's own authorisation |
| N10 | **Rate limits are per tenant only.** One user can exhaust a tenant's budget. | per-tenant window | Per-user limits inside the tenant limit |

## What this means in one sentence

The **control plane** — which gates exist, how they resolve, what a use case may
read, what the client may ask for — is real and enforced. The **infrastructure
under it** is a prototype, and every row in the second table is a reason not to
put a real patient's record through it.
