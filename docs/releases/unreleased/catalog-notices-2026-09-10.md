# Catalog-only release notices — 10 September 2026

Local change on base `636055dcf8facafbbba30378f2369ee6d544f96d`; not committed, pushed or deployed.

## Changed behavior

The shared shell mounts its page release notice only on `list-of-pages`. Every other page loses the complete notice card, including the title, Read explanation and Dismiss actions. This removes the Billing corrections and shared clinical rail card from Billing Clinic. List of pages retains its existing localized notice and actions. See the [feature guide](../../features/page-library-catalog.md).

`PageDocumentationNotice` checks the stable navigation page ID before mounting the existing notice implementation. Both shells share this behavior. Hidden cards do not initiate notice-index subscriptions and do not update read/dismiss state. Documentation Center history, explicit help access, business workflows and operational recovery alerts are unchanged. No backend migration, new translation, preference override or permission change is required. Effective documentation preferences still control the catalog notice; existing API failure handling remains.

## Validation and boundary

Passed under Node 24: `npm run typecheck --prefix desktop-clients` (all packages); `npm test --prefix desktop-clients -- packages/erp-shell/src/chrome.test.tsx packages/erp-screens/src/page-library/catalog.test.tsx` (26 tests in two files); `node docs/tools/check-docs.mjs`; and `git diff --check`.

Source and retained output hashes are in the [manifest](evidence/catalog-notices/manifest.json). Existing shell and catalog tests provide regression coverage; they do not establish browser acceptance of every page. The route gate was reviewed at the shared rendering boundary. Acceptance case PL-03 is updated. No live deployment, new remote CI run, native execution or browser run was performed for this local edit. The previous deployment's four CI failures remain separately recorded and unresolved.

Rollback: revert the notice gate in `desktop-clients/packages/erp-shell/src/documentation.tsx`. There is no data rollback or reading-state reset.
