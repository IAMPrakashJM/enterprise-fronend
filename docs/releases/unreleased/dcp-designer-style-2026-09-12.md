# DCP designer style alignment — 12 September 2026

Status: local implementation and focused verification; not committed, pushed or deployed by this task.

## Changed

Adopts the supplied reference's palette/canvas/inspector composition using existing shared cards, buttons and controls. Compact icon tiles expose the existing add and drag actions. Field cards follow configured columns where space permits and expose selection through both border/tint and `aria-pressed`. Selected field/section properties now precede review/release settings. Desktop side columns scroll; smaller screens stack without designer horizontal overflow.

Semantic theme tokens, host radius, form scale and density remain authoritative. No extra shell, sidebar, preference store, property, tenant rule, persistence behavior or backend contract was added. Field sorting uses the grid transform strategy; ordering handlers and explicit up/down actions remain unchanged.

## Verification

Source: base `3244587aab98cacc3bd2b171fe95889dfd4f8b11` plus the three implementation files identified in [SHA-256 manifest](evidence/dcp-designer-style/source-sha256.txt). Existing uncommitted Jira handoff documents are separate work.

- `npm run typecheck`: all workspace packages passed.
- `npx vitest run packages/erp-screens/src/dcp-designer`: [17 tests in five files passed](evidence/dcp-designer-style/dcp-style-tests.log), including save recovery, dependencies, repeatable sections, catalog and runtime tests.
- `node e2e/run.mjs features --suite=dcp-dependent-dropdowns.mjs --managed-api`: [passed](evidence/dcp-designer-style/dcp-style-browser.log). Covers Country/State authoring, save, preview filtering, child clearing, server validation and four-language layouts. A subsequent CSS correction prevents inspector cards shrinking inside their scrolling column; the following layout run includes that correction.
- [Focused layout check](evidence/dcp-designer-style/layout-check.mjs): [passed](evidence/dcp-designer-style/dcp-style-layout.log) at 1600, 1280, 960, 768 and 390px, checking designer overflow, enabled control selection and radio preview. Uses an isolated synthetic API, Node 24 and Chromium against the local Vite browser shell on port 3109.
- [Shared-component and form-control gates](evidence/dcp-designer-style/dcp-style-gates.log): passed.

- Documentation validation: [96 documentation files and impact receipts passed](evidence/dcp-designer-style/documentation.log). Existing 1,116 authoring/native-review backlog items remain explicitly pending.

Visual review: [desktop](evidence/dcp-designer-style/layout-1600.png), [narrow screen](evidence/dcp-designer-style/layout-390.png). Shell mobile layout is existing host behavior; this change targets the designer.

Full CI, production builds, deployment, native Tauri execution and physical-device acceptance were not run for this local style update. Existing workflow help and translations remain applicable; impact receipts record the presentation-only boundary. No backend changes or Jira contract changes are required.
