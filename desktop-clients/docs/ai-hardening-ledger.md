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
| D10 | Every worklist column is classified; credentials and unclassified columns leave as neither file nor printed sheet; nothing sensitive leaves as a document unannounced | `erp-config/src/export-policy.ts`, `tokens.css` | `verify:export-safety` |

## Not discharged

Each carries what it actually is, not a euphemism.

| # | Gap | What exists now | What it would take |
|---|---|---|---|
| N1 | **No key vault.** The provider secret is plaintext JSON on disk. | `0600` file, one process | KMS or Vault; the process uses the key without being able to read it out of storage |
| N2 | **No encryption at rest.** | none | Envelope encryption, keys held elsewhere |
| N3 | **No key rotation policy.** `rotatedAt` is recorded, never enforced. | a timestamp field | Expiry, forced rotation, overlap window |
| N4 | **No audit store.** | one `console.log` line per dispatch, search, export and print | Durable, queryable, retained; who / what / which record / which provider / cost / refusals |
| N5 | **No SERVER-SIDE redaction before egress to a provider.** The client masks identifiers and refuses to send what it did not mask; the service re-checks nothing, and free text still goes as typed. | client-side masking by classification, guarded at dispatch; search logging redacts by key; the service strips nothing | Server-side identifier stripping before any provider call, per data class — a client-side rule protects the honest path, not a modified one |
| N6 | **No provider allowlist.** Any endpoint an admin configures is obeyed. | free-text endpoint | Approved providers per data class; clinical use cases refused to unapproved ones |
| N7 | **No PHI-approved provider.** No BAA, no jurisdiction guarantee. | DeepSeek / OpenAI | A provider under contract, and a region that satisfies the tenant's law |
| N8 | **Open CORS.** `Access-Control-Allow-Origin: *`. | any origin may call the API | Origin allowlist per deployment |
| N9 | **Role check is a demo.** `role === "enterprise-admin"`, from the session object. | one string comparison | The platform's own authorisation |
| N10 | **Rate limits are per tenant only.** One user can exhaust a tenant's budget. | per-tenant window | Per-user limits inside the tenant limit |

### N5, narrowed twice

**Search logging.** `POST /worklists/search` logs the operational filters by
value and the sensitive ones **by key only** — `status=Active +redacted[query]`.
That is §14's redaction table, applied where searches are logged.

**Client-side egress.** Redaction now reads the same classification registry as
the URL policy, so a field cannot be PHI to one and ordinary to the other. It
had been exactly that: the registry classified `patientName` as PHI and the
redaction rules matched only structured identifiers, so a patient name — and,
on the clinical use cases that actually read them, the treating clinician and
the admission date — reached the provider in full. Nine keys were affected.
`dispatchAi` now re-checks the classification of every field on the way out and
**refuses** rather than repairs: arriving unmasked means assembly was bypassed,
and masking it quietly would hide the defect while leaving the transparency
panel describing a request that no longer exists. `verify:ai-egress` fails if a
use case reads a key nobody classified, if a general use case reads a clinical
or identifying one, or if the guard stops catching a hand-built context.

**File export.** A worklist writes its visible columns to a file, and a file is
the one destination nothing here can take back. `credential` and `unclassified`
columns are refused outright; `phi`, `pii` and `clinical` are exported — a ward
list with the names removed is not a ward list, and the person exporting is
already reading it on screen — but only after being told what the file will hold,
and the export is recorded by column key. Thirty-five worklist columns were
unclassified when that policy was written, `patient` (an MRN) among them.

**Print.** Paper is the same policy over a destination nothing can recall, and
the one path script does not control: a browser-initiated print cannot be
cancelled, so `beforeprint` records it and nothing more. What governs Ctrl+P is
the document — a stylesheet that REMOVES a refused class rather than hiding it,
and a provenance banner that is already in the page. The deliberate "Print this
list" action asks the same question exporting does.

The record for both is a `console.log` line like the other two, which is N4
rather than a separate gap. A file or a sheet is beyond every control in this
list the moment it exists; the confirmation, the banner and the audit line are
the whole of what remains.

**What is still open, and it is the important half.** All of that runs in the
browser. A client-side rule protects the honest path; it does not protect
against a modified client, and the service accepts whatever arrives. Free text
the user types is still sent as typed — deliberately, because silently editing
someone's own words would make the panel a lie, and the alternative is a server
that can see what it was sent. Nothing on the server strips identifiers before
calling a provider, and a provider is a third party where a log line is our own.
The row stays open.

## What this means in one sentence

The **control plane** — which gates exist, how they resolve, what a use case may
read, what the client may ask for — is real and enforced. The **infrastructure
under it** is a prototype, and every row in the second table is a reason not to
put a real patient's record through it.
