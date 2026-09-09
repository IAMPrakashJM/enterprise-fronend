# Library component and preference audit

**Implementation update:** The findings below describe the original audited revision. Corrections are implemented in the working tree; see [Library preference implementation and validation](library-preference-implementation.md) for the current behavior, evidence and remaining verification limits.

Date: 9 September 2026. Source revision: `82656eeedf809c8419bd6e2ae4674580cb3ff71a`.

## Conclusion

The Library is substantially componentized, but **does not yet meet the requirement that every applicable user preference and tenant lock applies on every page**. Shared components provide the foundation; several consumers still supply fixed settings or maintain independent local settings.

This is a source and static-check audit, not a certification of visual perfection, accessibility, security, or production readiness. All 129 unique Library destinations were inventoried and mapped through their common renderers. Shared-renderer findings apply to the relevant rendering branches, not necessarily every visible element on every page. No live browser preference matrix, native desktop test, native-speaker review, or external integration test was performed in this audit. No application code or persisted settings were changed.

## Coverage

The compiled Library navigation contains 129 unique destinations: 97 named templates across 12 engines, one template index, 12 component catalog destinations, three clinical templates, six legacy Library destinations, and ten other shared destinations. The Nexora dummy-API navigation contains exactly the same 129 Library destinations. Ledger's navigation has no Library module; this inventory is not a claim that Ledger exposes those pages.

The main paths inspected are `packages/erp-config/src/navigation.ts`, `packages/erp-config/src/page-templates.ts`, `packages/erp-screens/src/page-renderer.tsx`, the Library/catalog and template renderers, the clinical templates, the shared worklist, spreadsheet, dashboard, inbox, preferences, and AI administration renderers, the ERP preference context, and the shared UI/table and token implementations. Paths below are relative to `desktop-clients`.

## Findings

### F1 — High: local layout/view controls do not enforce tenant locks

Evidence: `packages/erp-screens/src/templates/template-library.tsx:25` exposes a layout selector without consulting the preference policy; line 27 passes that local layout to the demo. `templates/page-template.tsx:20` chooses `layout ?? preferences.formNavigation`. This control exists on 60 templates across master, order, finance, case, result, and entity engines.

`clinical-templates/patient-query.tsx:57` stores a local result view, line 361 changes it directly, and line 413 changes local page size. These controls do not consult the corresponding locks. `templates/template-engines.tsx:24` similarly initializes local list page size from a preference without subsequently resolving policy or synchronizing preference changes.

Impact: a locked preference can still be overridden in the displayed preview/page. This is a presentation-policy gap; it is not evidence that the persisted policy or server authorization can be overwritten. Some controls are intentional demo controls, but they need an explicit, approved sandbox contract if strict application-wide locks remain the requirement.

Recommended change: pass resolved preferences and lock information through the reusable page contract. Disable managed controls and reject prohibited local overrides. Keep demonstrative variants clearly separate from the application-default preview.

### F2 — High: table preferences are only partly connected

Evidence: `templates/template-engines.tsx:9` passes a limited subset of preferences. Line-item tables at line 14 force stripes and collapse spacious density into comfortable; report tables at line 59 force stripes and do not receive density, wrapping, or sticky-header preferences. Administration and specialized schedule/matrix/import tables have similar fixed presentation choices.

`clinical-templates/query-results.tsx:276` and `clinical-templates/patient-360.tsx:96` force stripes and support only compact versus comfortable in their density mapping. Query CSS also fixes cell padding and no-wrap behavior. `spreadsheet/index.tsx` uses shared table primitives and preference-aware formatting, but does not bind table presentation to the preference object.

The underlying `packages/ops-ui/src/table.tsx:8` accepts explicit presentation props; it does not automatically obtain ERP preferences and its density type has only compact and comfortable. Merely using `Table` is insufficient to guarantee preference compliance.

Recommended change: introduce a preference-aware table adapter that consistently supplies density, stripes, wrapping, sticky headers, and result font scaling. Define which settings apply to specialized matrices rather than silently ignoring them.

### F3 — Medium: component demos use fixed formatting and defaults

Evidence in `packages/erp-screens/src/library/demos.tsx`: ValuesDemo at line 145 and BillingDemo at line 279 use INR explicitly; ValuesDemo uses locale date formatting rather than the complete preference formatter. WorklistDemo at line 297 constructs formatters from `DEFAULT_PREFERENCES` and line 309 forces comfortable density and stripes. TableDemo at line 133 and PaginationDemo maintain their own demonstration settings.

Impact: selected currency/date/table preferences are not demonstrated consistently, and copied examples can carry these fixed choices into new applications.

Recommended change: use the resolved formatter and preferences by default. Label intentional component variants and show the integration code for application preferences alongside the standalone example.

### F4 — Medium: clinical typography and corner radius are not fully token-driven

Evidence: `clinical-templates/query-layout.module.css:9` fixes a 16px radius; line 40 fixes a 17px heading, with numerous other fixed text sizes. `clinical-templates/record-layout.module.css:163` forces a 12px radius with `!important`. The clinical directory has no form/result `--fs-scale` rebinding; its scale-aware declarations inherit the shell scale. `packages/tokens/src/tokens.css:19` defaults that scale to `--fs-shell`.

Impact: independent form/result font preferences and corner radius cannot consistently affect these clinical surfaces. Theme-color variables are widely used, so this is not a claim that theme switching is entirely broken.

Recommended change: bind form and result regions to their respective font tokens, scale typography intentionally, and replace preference-controlled corner dimensions with the radius token. Preserve structural layout dimensions where they are not user preferences.

### F5 — Medium: Patient Query ignores additional applicable preferences

Evidence: `clinical-templates/patient-query.tsx:127` registers its keyboard listener without checking `preferences.keyboardShortcuts`. The result-view shortcut changes local state. The export call at line 207 chooses CSV explicitly instead of `preferences.exportFormat`. Detail presentation uses a local default rather than the resolved preview-mode setting.

Impact: disabling shortcuts does not disable this page's custom shortcuts, and export/preview behavior can differ from the user's settings.

Recommended change: gate page-specific listeners with the preference, initialize and synchronize preview choices through the shared preference contract, and honor the supported export preference or explain any deliberately unsupported format.

### F6 — Medium: six named destinations have no dedicated implementation

Evidence: `packages/erp-screens/src/library/index.tsx:21` dispatches clinical templates, page templates and catalog groups, then falls back to `LegacyLibraryPage`. Theme Studio, Accessibility, Page Catalog, Component Contracts, Keyboard Shortcuts and Integration Guide all reach this same generic registry/demo page. Their titles differ, but their promised dedicated content is absent. The generic policy-controlled toggle is a demonstration, not the tenant policy editor.

Recommended change: implement dedicated content and functional examples for each destination, or accurately label/consolidate the generic demonstration. These routes should not be marked complete simply because they render without errors.

### F7 — Medium: checks do not enforce the complete preference/component contract

Evidence: `scripts/verify-shared-components.mjs` detects selected JSX patterns, including raw tables and literal card/grid class patterns. It does not prove preference propagation or inspect every CSS-module composition. For example, `clinical-templates/query-results.tsx:230` uses a CSS-module grid around shared cards instead of the shared CardGrid. Specialized layouts may justify exceptions, but those exceptions need to be explicit.

Impact: the current checks can pass while the confirmed gaps above remain. This is a test-coverage gap, not a failure of the checks at their stated static scope.

Recommended change: maintain a route-to-renderer manifest and add representative integration tests per renderer plus navigation smoke coverage for every route. Test unlocked and locked settings, external preference changes, compact/comfortable/spacious density, separate font sizes, corner radius, currency/date/time formatting, RTL, reduced motion, keyboard shortcuts, table preferences, and recovery. Add explicit exceptions for intentional demo variants and specialized layouts.

## What is already working in the inspected code

- Shared form controls, cards, table primitives, overlays and localization infrastructure are widely adopted.
- `packages/erp-shell/src/erp-context.tsx:151` resolves API preferences against policy; line 265 filters locked preference updates. Root language, direction, theme, fonts, radius and density tokens are applied centrally.
- `preferences/policy-controls.tsx` disables managed controls. Clinical record preference controls also consult policy. These are useful patterns to reuse.
- The shared worklist supplies table density, sticky headers, wrapping, stripes and formatting from preferences, and uses the central update path for page size and result view. Its controls can still appear interactive when a central lock rejects the change; this needs a managed-state UX review, not a claim of persisted-policy bypass.
- Clinical 360 uses the shared date, time and money formatter for its care rows. Named page templates also build formatters from the supplied preferences.
- Catalog examples are generated from the compiled demo functions, reducing example drift.

## Verification results

Run against the audited checkout:

| Check | Result |
| --- | --- |
| `npm run verify:shared-components` | Pass: 63 page/AI source files, 281 shared-component uses |
| `npm run verify:form-controls` | Pass: 102 components checked |
| `npm run verify:localization` | Pass: 15,305 catalog keys in four languages; 161 static API errors registered |
| `npm run verify:library` | Pass: 26 examples match compiled demos |
| `npm run verify:templates` | Pass: generated TypeScript template example matches its adapter |

The template check emitted a Node module-type warning but completed successfully. Localization registration does not establish native-language quality. A complete build, browser matrix and live deployment verification were not part of these checks.

## Recommended implementation order

1. Resolve F1 and F5: lock-aware local controls and Patient Query preference behavior.
2. Resolve F2 and F4 through reusable adapters/tokens, then apply them across affected renderers.
3. Resolve F3 and F6: preference-correct examples and dedicated Library content.
4. Add F7 regression gates and run the desktop preference/browser matrix before declaring compliance.

## Per-destination inventory

Every destination below was mapped through the source renderer. “Baseline” means no additional specific finding is assigned here; it does **not** mean a full browser or every-preference pass. F7 applies across the module. Engine findings apply where that template renders the affected table/layout branch.

| # | Destination | Renderer / engine | Source audit notes |
| --- | --- | --- | --- |
| 1 | `library-dashboard` | ModuleDashboard | Baseline; full preference matrix pending |
| 2 | `component-library` | Component catalog | F3 demo defaults |
| 3 | `form-controls` | Component catalog | Baseline; full preference matrix pending |
| 4 | `feedback-components` | Component catalog | Baseline; full preference matrix pending |
| 5 | `date-components` | Component catalog | Baseline; full preference matrix pending |
| 6 | `card-components` | Component catalog | F3 demo defaults |
| 7 | `table-components` | Component catalog | F3 demo defaults |
| 8 | `navigation-components` | Component catalog | F3 demo defaults |
| 9 | `inline-components` | Component catalog | Baseline; full preference matrix pending |
| 10 | `form-patterns` | Component catalog | Baseline; full preference matrix pending |
| 11 | `data-patterns` | Component catalog | F3 demo defaults |
| 12 | `billing-patterns` | Component catalog | F3 demo defaults |
| 13 | `page-templates` | TemplateLibraryPage index | Baseline; full preference matrix pending |
| 14 | `template-simple-master` | PageTemplateWorkspace / master | F1 layout override |
| 15 | `template-detailed-master` | PageTemplateWorkspace / master | F1 layout override |
| 16 | `template-person-registration` | PageTemplateWorkspace / master | F1 layout override |
| 17 | `template-person-profile` | PageTemplateWorkspace / master | F1 layout override |
| 18 | `template-organization-profile` | PageTemplateWorkspace / master | F1 layout override |
| 19 | `template-item-service-master` | PageTemplateWorkspace / master | F1 layout override |
| 20 | `template-hierarchical-master` | PageTemplateWorkspace / master | F1 layout override |
| 21 | `template-relationship-master` | PageTemplateWorkspace / master | F1 layout override |
| 22 | `template-configuration-master` | PageTemplateWorkspace / master | F1 layout override |
| 23 | `template-patient-master` | PageTemplateWorkspace / master | F1 layout override |
| 24 | `template-employee-master` | PageTemplateWorkspace / master | F1 layout override |
| 25 | `template-customer-master` | PageTemplateWorkspace / master | F1 layout override |
| 26 | `template-supplier-master` | PageTemplateWorkspace / master | F1 layout override |
| 27 | `template-student-master` | PageTemplateWorkspace / master | F1 layout override |
| 28 | `template-master-list` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 29 | `template-transaction-register` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 30 | `template-operational-worklist` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 31 | `template-assignment-queue` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 32 | `template-approval-inbox` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 33 | `template-exception-queue` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 34 | `template-board-workspace` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 35 | `template-split-list-detail` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 36 | `template-batch-processing` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 37 | `template-header-lines-order` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 38 | `template-service-test-order` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 39 | `template-quotation-estimate` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 40 | `template-order-fulfillment` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 41 | `template-return-cancellation` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 42 | `template-order-comparison` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 43 | `template-recurring-order` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 44 | `template-purchase-order` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 45 | `template-sales-order` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 46 | `template-lab-order` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 47 | `template-appointment` | PageTemplateWorkspace / booking | F2 table branches |
| 48 | `template-calendar-workspace` | PageTemplateWorkspace / booking | F2 table branches |
| 49 | `template-resource-timeline` | PageTemplateWorkspace / booking | F2 table branches |
| 50 | `template-occupancy-board` | PageTemplateWorkspace / booking | F2 table branches |
| 51 | `template-allocation-workspace` | PageTemplateWorkspace / booking | F2 table branches |
| 52 | `template-roster-timetable` | PageTemplateWorkspace / booking | F2 table branches |
| 53 | `template-waitlist-check-in` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 54 | `template-patient-encounter` | PageTemplateWorkspace / case | F1 layout override |
| 55 | `template-service-case` | PageTemplateWorkspace / case | F1 layout override |
| 56 | `template-long-running-episode` | PageTemplateWorkspace / case | F1 layout override |
| 57 | `template-procedure-planning` | PageTemplateWorkspace / case | F1 layout override |
| 58 | `template-surgery-workspace` | PageTemplateWorkspace / case | F1 layout override |
| 59 | `template-procedure-execution` | PageTemplateWorkspace / case | F1 layout override |
| 60 | `template-checklist-workspace` | PageTemplateWorkspace / case | F1 layout override |
| 61 | `template-discharge-closure` | PageTemplateWorkspace / case | F1 layout override |
| 62 | `template-structured-result` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 63 | `template-lab-result` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 64 | `template-narrative-result` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 65 | `template-observation-chart` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 66 | `template-assessment-scoring` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 67 | `template-result-verification` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 68 | `template-result-comparison` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 69 | `template-certificate-output` | PageTemplateWorkspace / result | F1 layout override; F2 table branches |
| 70 | `template-goods-receipt` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 71 | `template-issue-dispatch` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 72 | `template-stock-transfer` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 73 | `template-stock-count` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 74 | `template-batch-serial-tracking` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 75 | `template-pick-pack` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 76 | `template-transport-plan` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 77 | `template-dispatch-board` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 78 | `template-journal-voucher` | PageTemplateWorkspace / finance | F1 layout override; F2 table branches |
| 79 | `template-payment-voucher` | PageTemplateWorkspace / finance | F1 layout override; F2 table branches |
| 80 | `template-receipt-voucher` | PageTemplateWorkspace / finance | F1 layout override; F2 table branches |
| 81 | `template-invoice-billing` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 82 | `template-patient-billing` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 83 | `template-school-fees` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 84 | `template-credit-debit-note` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 85 | `template-allocation-settlement` | PageTemplateWorkspace / reconcile | Baseline; full preference matrix pending |
| 86 | `template-bank-reconciliation` | PageTemplateWorkspace / reconcile | Baseline; full preference matrix pending |
| 87 | `template-budget-workspace` | PageTemplateWorkspace / order | F1 layout override; F2 table branches |
| 88 | `template-period-processing` | PageTemplateWorkspace / finance | F1 layout override; F2 table branches |
| 89 | `template-statement-account` | PageTemplateWorkspace / report | F2 table branches |
| 90 | `template-report-parameters` | PageTemplateWorkspace / report | F2 table branches |
| 91 | `template-tabular-report` | PageTemplateWorkspace / report | F2 table branches |
| 92 | `template-grouped-report` | PageTemplateWorkspace / report | F2 table branches |
| 93 | `template-pivot-report` | PageTemplateWorkspace / report | F2 table branches |
| 94 | `template-printable-report` | PageTemplateWorkspace / report | F2 table branches |
| 95 | `template-operational-dashboard` | PageTemplateWorkspace / dashboard | F2 table branches |
| 96 | `template-management-dashboard` | PageTemplateWorkspace / dashboard | F2 table branches |
| 97 | `template-analytical-workspace` | PageTemplateWorkspace / dashboard | F2 table branches |
| 98 | `template-entity-360` | PageTemplateWorkspace / entity | F1 layout override |
| 99 | `template-history-timeline` | PageTemplateWorkspace / entity | F1 layout override |
| 100 | `template-document-workspace` | PageTemplateWorkspace / entity | F1 layout override |
| 101 | `template-task-workspace` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 102 | `template-communication-workspace` | PageTemplateWorkspace / entity | F1 layout override |
| 103 | `template-policy-editor` | PageTemplateWorkspace / admin | F2 table branches |
| 104 | `template-permissions-matrix` | PageTemplateWorkspace / admin | F2 table branches |
| 105 | `template-workflow-configuration` | PageTemplateWorkspace / admin | F2 table branches |
| 106 | `template-import-wizard` | PageTemplateWorkspace / admin | F2 table branches |
| 107 | `template-background-jobs` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 108 | `template-schedule-configuration` | PageTemplateWorkspace / admin | F2 table branches |
| 109 | `template-audit-explorer` | PageTemplateWorkspace / list | F2 table branches; F1 local page size |
| 110 | `template-integration-configuration` | PageTemplateWorkspace / admin | F2 table branches |
| 111 | `allyvora-patient-query` | PatientQueryTemplate | F1, F2, F4, F5, F7 |
| 112 | `allyvora-patient-record` | PatientRecordTemplate | F4; record preference controls consult policy |
| 113 | `allyvora-patient-360` | Patient360Template | F2, F4; care-row formatting uses preferences |
| 114 | `spreadsheet-studio` | SpreadsheetStudio | F2 table presentation |
| 115 | `import-export` | WorklistPage | Central preference path; locked-control UX review |
| 116 | `bulk-operations` | WorklistPage | Central preference path; locked-control UX review |
| 117 | `theme-studio` | LegacyLibraryPage | F6 generic fallback |
| 118 | `localization` | Component catalog | Baseline; full preference matrix pending |
| 119 | `accessibility` | LegacyLibraryPage | F6 generic fallback |
| 120 | `page-catalog` | LegacyLibraryPage | F6 generic fallback |
| 121 | `component-contracts` | LegacyLibraryPage | F6 generic fallback |
| 122 | `keyboard-shortcuts` | LegacyLibraryPage | F6 generic fallback |
| 123 | `integration-guide` | LegacyLibraryPage | F6 generic fallback |
| 124 | `preferences` | PreferencesPage | Managed controls implemented; full matrix pending |
| 125 | `saved-views` | WorklistPage | Central preference path; locked-control UX review |
| 126 | `shortcut-manager` | WorklistPage | Central preference path; locked-control UX review |
| 127 | `notifications` | InboxPage | Session-only fixture inbox; production integration not certified |
| 128 | `messages` | InboxPage | Session-only fixture inbox; production integration not certified |
| 129 | `ai-administration` | AiAdministration | Baseline; full preference matrix pending |

Template-engine counts: admin: 6, booking: 6, case: 8, dashboard: 3, entity: 4, finance: 4, list: 14, master: 14, order: 22, reconcile: 2, report: 6, result: 8.
