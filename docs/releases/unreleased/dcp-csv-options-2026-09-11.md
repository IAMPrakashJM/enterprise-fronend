# DCP CSV option staging — 11 September 2026

Status: implemented and locally verified. Not committed, pushed or deployed.

## Delivered

Manage value sets now accepts UTF-8 CSV with explicit ID/label mapping, row preview and validation. Leading-zero identifiers remain text. Duplicate/blank IDs, blank labels, oversized values, malformed CSV and unsupported editor delimiters block applying the entire dataset. Selecting a file prevents saving old options accidentally until staging is applied or canceled.

Applying reviewed rows replaces the unsaved option editor only. Saving uses the existing authenticated catalog command and complete-revision atomic write; no partial catalog is visible. Existing form references remain pinned. The UI retains unsaved host form values, uses shared controls and effective preferences, and follows existing catalog permissions, discard prompts and retry/conflict handling.

[User and integration guide](../../features/dcp-designer.md), [scope assessment](../../development/README-DCP-ENTERPRISE-FORM-SCOPE.md), DCP-04 in [test cases](../../testing/v1.0.0/USE-CASES.md).

## Verification

Source base `2f66cb5` plus the [working-tree manifest](evidence/dcp-csv-options/source-manifest.json); prior uncommitted dependency/catalog work is included. No deployment, remote CI, actual Tauri executable or production database acceptance is claimed.

- [Full local CI](evidence/dcp-csv-options/ci.txt): 122 frontend test files / 1,549 tests, 132 API tests, 2 suite-registry tests, 14 deployment-tool tests, all package type checks, Next.js/Vite builds and repository gates passed. The final browser script gained multilingual assertions while this run was in progress; no application code changed afterward.
- [Focused tests](evidence/dcp-csv-options/focused-tests.txt): 12 parser, mapping and catalog-manager tests passed. They overlap the CI count. [Focused API tests](evidence/dcp-csv-options/api.txt): 6 existing catalog/designer cases passed; no server implementation changes were needed. [Documentation contract tests](evidence/dcp-csv-options/documentation-tests.txt): 3 passed.
- [Chromium acceptance](evidence/dcp-csv-options/browser.txt): duplicate blocking, mapping, leading-zero preservation, quoted labels, explicit complete-revision save, preserved host edits and English/Arabic/Hindi/Malayalam catalog layouts passed against isolated synthetic API storage and the Vite development shell. [Review screenshot](evidence/dcp-csv-options/review.png), [Arabic](evidence/dcp-csv-options/ar.png), [Hindi](evidence/dcp-csv-options/hi.png), [Malayalam](evidence/dcp-csv-options/ml.png).

Initial checks caught a test selector ambiguity, an incorrectly typed test mock and misplaced new catalog entries; these were corrected before the final passing runs. The first browser launch found no local shell listening; a dedicated local shell was started before the passing run. These results do not certify native-speaker wording or a native desktop binary.

## Boundaries

Maximum 2 MB file, 1–50 options, ID length 80 and label length 160. Pipe characters and embedded line breaks cannot be represented by the existing line editor and are rejected. Extra unmapped columns are ignored. CSV staging stays in memory. There is no incremental upsert, relationship CSV import, XLSX parsing, background job, durable import resumption or large-dataset paging in this increment. The product backend DCP adapter remains separate work; this feature uses demo API persistence.

Help snapshot `2026-09-11-dcp-csv-options` preserves previous snapshots and adds translated instructions. Native-speaker review remains pending.
