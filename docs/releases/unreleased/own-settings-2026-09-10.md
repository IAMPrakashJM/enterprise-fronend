# Own Settings default module — 10 September 2026

Local implementation on base `037bcc6`. Not committed, pushed or deployed.

## Added and changed

Own Settings adds an API-backed Default module preference. The accessible module list comes from authenticated navigation. Account/application-specific persistence, tenant defaults/locks, inaccessible-module fallback and startup navigation reuse the existing preference and shell boundaries. Web direct URLs remain unchanged. No Library route was added; inventory remains 139.

See the [feature and integration guide](../../features/own-settings.md). Canonical four-language labels, versioned preferences help and a change alert were added.

## Verification

All checks below passed against the local implementation on the base commit above. The [manifest](evidence/own-settings/manifest.json) records the full base commit, implementation digest, individual source hashes and artifact hashes.

| Check | Command / scope | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck --prefix desktop-clients` | Every package passed |
| Targeted frontend | `npm test --prefix desktop-clients -- --run packages/erp-screens/src/preferences/preferences.test.tsx packages/erp-config/src/preference-defaults.test.ts packages/erp-shell/src/erp-context.test.tsx packages/erp-shell/src/workspace/use-workspace-navigation.test.tsx` | 59 tests, 4 files passed |
| API persistence and HTTP | `node --test dummy-api/preference-store.test.mjs dummy-api/preference-http.test.mjs` | 7 passed |
| Browser | `node desktop-clients/e2e/run.mjs features --suite=own-settings.mjs --managed-api` | Desktop shell and web each passed; English Chromium, isolated API |
| Production builds | `npm run build --prefix desktop-clients` | Web and desktop builds passed |
| Project gates | `npm run verify --prefix desktop-clients` | Passed, including 139 Library route contracts |
| Documentation | `node docs/tools/check-docs.mjs` and `node --test docs/tools/check-docs.test.mjs` | Checker and 3 tests passed |
| Whitespace | `git diff --check` | Passed |

Browser evidence covers API-derived options, saving/reloading the choice, home/startup selection, direct web URL preservation, tenant policy selection and live lock enforcement. Backend tests cover user/product isolation, durable reopen, inaccessible-module rejection and access revocation. See [desktop screenshot](evidence/own-settings/desktop.png) and [web screenshot](evidence/own-settings/web.png). Logs are retained beside the manifest.

Node 24 was used. Local browser servers used desktop port 3109, web port 3110 and isolated API port 3210; live services were unchanged. Canonical catalogs and generated fallbacks were checked for four languages. Native executable testing, other browsers, four-language browser acceptance, native-speaker review, remote CI and live deployment remain outside this completed local scope. Existing project verification also reports documentation workflows awaiting authoring; this change does not claim to complete those unrelated workflows.
