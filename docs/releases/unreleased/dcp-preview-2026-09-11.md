# DCP form preview improvement — 11 September 2026

Status: implemented locally; this preview improvement is not deployed.

## Behavior

The prominent Live preview action opens the current unsaved design as a clean form with its actual title, shared fields and validation. Authoring controls are hidden while previewing. Reset preview clears temporary answers and validation messages. Design returns to the editor while preserving the form and test answers. No business record is created by previewing. The existing theme, density, localization and tenant preference context still applies.

[Feature guide](../../features/dcp-designer.md). Runtime help uses a new `2026-09-11-dcp-preview` snapshot; earlier snapshots remain unchanged. Four-language help is updated; native-speaker review remains pending.

## Verification

Source: base `614bd2e` plus the [working-tree source manifest](evidence/dcp-preview/source-manifest.json).

Three focused component tests passed, including unsaved preview, focus, hidden authoring controls, required validation, return-to-design preservation, reset and absence of API writes. [UI log](evidence/dcp-preview/ui.log).

The isolated demo API / Chromium designer journey passed on rerun, including pointer/keyboard reorder, preview validation, API draft persistence and four-language layouts. Its first attempt failed at the keyboard reorder assertion; the unchanged browser journey passed on rerun. [First browser attempt](evidence/dcp-preview/browser-first.log), [rerun](evidence/dcp-preview/browser.log).

All package type checks and repository verification gates passed. [Typecheck log](evidence/dcp-preview/typecheck.log). [Verification log](evidence/dcp-preview/verify.log). Emitted-asset checks inspect the existing prior build; no fresh production build, deployment, complete runtime suite or native executable run is claimed for this focused presentation change.

## Delivery

The earlier designer deployment remains live. This follow-up is local and does not change the API contract or stored design schema.
