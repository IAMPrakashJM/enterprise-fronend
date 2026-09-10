# Billing and clinical workspace update — 10 September 2026

Local implementation on base `45a4189`. Not committed, pushed or deployed for this task. Earlier deployment records remain historical evidence.

## Added and changed

Billing Clinic now has dedicated View bill and Edit bill screens, unpaid correction validation, required reasons and full previous invoice snapshots in the demo CSV ledger. Clinical Triage gains a focused pane and summary layout. Triage and Comprehensive Consultation reuse the master-record rail with opt-in active-only sections; existing patient records keep their stacked rail behavior. All three pages continue to use their typed demo API adapters. No routes were added; Library inventory remains 139.

See the [feature and integration guide](../../features/clinical-workspace-update.md). Canonical four-language copy, regenerated fallbacks, user guides, versioned help and page change alerts were updated.

## Verification

The final implementation passed the following checks under Node 24. The [manifest](evidence/clinical-workspaces/manifest.json) identifies the exact base commit, working-tree source hashes, implementation digest and retained artifact hashes.

| Check | Command and result |
| --- | --- |
| TypeScript | `npm run typecheck --prefix desktop-clients`: every package passed |
| Targeted components | `npm test --prefix desktop-clients -- --run` for clinic-billing/workspace, clinical-triage/editor, comprehensive-consultation/workspace and clinical-templates/clinical-templates test files: 15 tests in 4 files passed |
| Clinical API | `npm run test:clinical-api --prefix desktop-clients`: TypeScript backend check and 25 tests passed |
| Builds | `npm run build --prefix desktop-clients`: web and desktop production builds passed |
| Project gates | `npm run verify --prefix desktop-clients`: passed, including canonical catalogs, generated examples and 139 Library route contracts |
| Browser | `node desktop-clients/e2e/run.mjs features --suite=NAME --managed-api`, separately for `clinic-billing.mjs`, `clinical-triage.mjs` and `comprehensive-consultation.mjs`: all three passed |
| Documentation | `node docs/tools/check-docs.mjs`, `node --test docs/tools/check-docs.test.mjs` and `git diff --check`: passed |

The component tests include lost-response correction retries with retained values and identical payload, read-only view navigation, tenant-managed layouts, clinical draft preservation and original master-record regressions. API tests include durable correction snapshots, totals, idempotency, stale versions, invalid line membership/insurance, user permissions, tenant isolation and payment/refund edit protection.

Browser checks used Chromium with Vite on 3109 and the managed disposable API on 3210. Billing ran at 1800 × 1100 in English and exercised correction view/edit/history, payment/refund locks, CSV and Excel downloads, and printable invoice identity. Triage ran at 1600 × 900 and consultation at 1600 × 1000; both exercised real API save/reopen/finalize and four-language catalog/direction/width checks. These were desktop browser-rendered shells, not native executable or live-site tests. Retained [billing edit](evidence/clinical-workspaces/billing-edit.png), [billing view](evidence/clinical-workspaces/billing-view.png), [triage](evidence/clinical-workspaces/triage.png) and [consultation](evidence/clinical-workspaces/consultation.png) screenshots use fictional data.

Final browser checks followed the last source/copy edits. No runtime changes followed verification. Existing build bundle warnings and project-wide documentation workflow/native-review gaps remain reported by the gates; those unrelated gaps are not claimed complete.

## Boundaries

Unpaid correction updates existing line quantities, discount, insurance and notes. Adding/removing invoice lines, arbitrary tariff changes and paid-invoice credit notes are not implemented by this screen. Native-speaker/clinical review, other browsers, native executable acceptance, remote CI and deployment are not established by local checks. Production payer/payment integration and certified billing amendments remain separate work.
