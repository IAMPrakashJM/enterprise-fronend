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

## Server controls added — 8 September 2026

| Original finding | Current implementation | Remaining boundary |
| --- | --- | --- |
| N2 — encryption at rest | AES-256-GCM credential file; separate 32-byte master key; plaintext migration; corruption and wrong keys stop startup | Master key is a host file, not KMS. Historical plaintext backups must be handled separately. Audit/report databases are not encrypted by this credential control. |
| N3 — rotation | Provider credentials expire after 90 days; dispatch and verification refuse expired credentials | Immediate replacement; no managed rotation or overlap window. Previously exposed provider keys still require revocation at the provider. |
| N4 — audit | SQLite WAL with FULL synchronization, tenant query scope, metadata allowlist and 90-day retention; admission, response, export/print, provider-attempt and report events | Single host; no external immutable archive, disaster recovery service or provider cost pricing. Events record attempts, not proof that a browser saved or printed a file. |
| N5 — server egress | Stable field keys, registered use-case/prompt pairing, server gates, canonical labels, numeric operational values, canonical demo report branch names, or fully masked values only; unrestricted free text and clinical dispatch refused | This deliberately narrows usable AI functionality. It is not clinical de-identification. A numeric value supplied under a misleading operational key cannot be semantically validated by this demo service. |
| N6 — provider allowlist | Exact HTTPS OpenAI/DeepSeek base URLs; redirects refused before credentials can follow them | These providers are allowed for restricted demo context only; allowlisting is not a clinical contract. |
| N8 — CORS | Explicit origins for the two public shells, documented local development origins and Tauri; rejected origins also blocked at WebSocket upgrade | CORS is a browser restriction, not authentication. Requests without an Origin still require endpoint authentication. |
| N10 — per-user limits | Ten admitted requests/minute per tenant/user, inside the existing tenant request/token limits; verification shares both | Per-user minute windows are process-local; no distributed or per-user daily token budget. |

Clinical speech is refused before any external transcription call. The built-in
mock remains available. No environment flag claims that a contract exists.
`security-storage.test.mjs` and `security-http.test.mjs` exercise the new controls.

## Not discharged

- **N1 — managed key vault:** the encryption master key remains readable by the
  service account. A production KMS/Vault integration needs the selected service,
  its identity, access policy and recovery procedure.
- **N7 — approved clinical provider:** no BAA, jurisdiction or region approval
  has been supplied. Clinical provider egress remains disabled.
- **N9 — production authorization:** demo usernames/passwords and session roles
  remain. They must be replaced by the application's trusted identity service;
  renaming the current role comparison would not resolve this finding.
- The production boundaries in the table remain open, including semantic
  validation of provider data, managed rotation, off-host audit retention and
  distributed limits. The new controls do not certify this demo backend for
  real patient data.

## Operations

The default credential key is `~/.config/nexora/provider-master.key`. Set
`NEXORA_KEY_FILE` to use an operator-managed 32-byte file. New keys are created
with mode 0600, directories with mode 0700. Keep the key outside source control
and separate from data backups. The service must stop if a key cannot decrypt
an existing store; it must never silently replace it with empty credentials.

Audit events are stored in `NEXORA_DATA_DIR/audit.sqlite`. The default retention
is 90 days, configurable with positive integer `NEXORA_AUDIT_RETENTION_DAYS`.
`GET /audit?before=<id>&limit=50` requires an enterprise-admin session and returns
only that tenant's events, newest first. Audit records omit field values, prompt
text, responses and secrets. This is durable single-host storage, with the demo
identity caveat above; it is not an external production audit platform.

Set `NEXORA_ALLOWED_ORIGINS` to an exact comma-separated deployment list. The
default list includes the two public demo hosts and explicit localhost/Tauri
origins needed by the test environments. Production deployments should provide
only their actual application origins.
