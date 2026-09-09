# Patient Query preference consolidation — 9 September 2026

Removes duplicated result-view and preview-placement selectors from Patient Query. Removes the V shortcut that changed result layout. Search, filters, columns, export, recent criteria, saved presets and pagination remain page actions.

Adds Inline to the existing shared previewMode preference and validation; no new storage key or schema migration is needed. Shared template/worklist previews render an inline card, while Patient Query retains details beneath its selected result. All controls remain in My Preferences → Behaviour → Layout and use the existing tenant policy and persistence path.

See the [user flow](../../features/library-preferences.md#patient-query-display-preferences). Existing stored values and defaults are unchanged. The demo API must restart to load the expanded shared validator. Browser suites now select display options through Preferences.

Validation: full suite passed 1,488 tests and exposed one shared-card title prop error. After correction, all 13 targeted tests across four files passed. Final typechecking, four API preference-store tests, localization, shared-component, Library preference, browser-registry and documentation gates passed. Both isolated production packages passed HTML/asset checks. Release prepared: `20260909152041761-ecda5200`; activation is recorded separately after live verification. Native-speaker review is not part of this change; the Inline label reuses existing translations.
