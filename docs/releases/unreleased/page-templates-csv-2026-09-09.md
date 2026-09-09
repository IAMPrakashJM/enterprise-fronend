# Page templates CSV persistence — 9 September 2026

Local implementation; not committed, pushed or deployed as part of this task.

Worklist Query, Master Record - Main and 360 Data already used the typed demo API adapter. The API now loads records and related data from CSV, persists creates/updates and operation receipts to an atomic CSV snapshot, and reads that snapshot for every operation. Runtime-generated 360 rows were removed. New records begin with empty related history.

Existing JSON state is migrated only when CSV is absent; the old file is retained. Tenant/application isolation, user-scoped presets, write authorization, validation, duplicates, version conflicts and retry identity remain in the existing store.

See [the user and integration guide](../../features/page-templates-csv.md) for paths, columns, migration, write flow and limits. Single-process demo storage is not a production database. Form metadata remains API-served JSON configuration. Runtime patient data no longer comes from the old JSON test fixture.

## Verification

- `npm run test:clinical-api --prefix desktop-clients`: backend TypeScript checking and 13 CSV/store tests passed.
- `node --test dummy-api/records-http.test.mjs`: existing HTTP regression passed.
- Real Chromium integration on an isolated demo API: UI create → CSV write → Worklist Query → 360 Data, without intercepted requests or page errors.
- Restarted that API process and verified HTTP load, search and overview for the browser-created record; no synthetic related history appeared.
- Localization and documentation checks passed. No frontend runtime behavior changed; no production build or native executable acceptance is claimed for this backend-only change.

Malformed quoting, duplicate identities, invalid row widths and corrupt CSV fail closed. CSV tests cover multiline/quoted text, Unicode, booleans, restart persistence, legacy migration and related-entry receipt reuse.

## Source identity

Base commit: `c24a1976613b702f7d90a032d9e3ea0bc3e7f320` plus the local working tree. Principal implementation SHA-256 values:

```text
cbc64cf89b07eb173165264297a9920f383af7ead3c18f6031da82415c699585  dummy-api/clinical-template-csv.ts
144bc2db0242e9cd5d8c7eccf1da1703c49bce58f89059b13c92a028c44212f6  dummy-api/clinical-template-store.ts
dc993e367906fba39563fa07d794d92263441633d2d00b54a2d1d843ba66335a  dummy-api/config/clinical-templates/seed.csv
05a666a621841d5c686bef5f564a3a64fad64aa930bc1ebed41f2c7ed75381f6  dummy-api/server.mjs
```
