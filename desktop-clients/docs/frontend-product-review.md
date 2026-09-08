# Frontend foundation review

7 September 2026. Scope: a reusable frontend for multiple SaaS applications, with
mock services during design and replaceable integrations in consuming products.
This is a feature and design review, not a request to build production backend
services. Recommendations below are proposals; the application was not modified
as part of this review.

**Assessment**

Keep the shared UI, semantic themes, navigation ports, workspace core and reusable
page patterns. The application already has substantial enterprise UI coverage.
The next investment should make that coverage complete and reusable across
products. Adding another set of industry screens would not resolve the current
coupling between the shared framework and the Nexora demo.

**What I inspected**

- Configuration/types, navigation, schemas, preferences, localization, shell,
  worklist/search, record forms, spreadsheet import/export, notifications,
  component library, overlays, authentication, and page composition.
- Existing roadmap, gap analysis, remaining-work document and prior code-review
  findings. Earlier review findings are identified separately below; they were
  not all rerun during this review.
- Public web worklist at 1500px, 768px and 390px; new-record form, preferences,
  billing, consultation, and Arabic with a dark theme at 1500px.
- Public desktop worklist at 1500px and navigation through its command palette.
- A keyboard check of the web command palette: entry, 30 Tab presses, and Escape.

Review sessions used browser-only preference overrides, intercepted preference
writes, and were logged out afterwards. No account settings, business records,
AI-provider requests or application source were changed. These were selected
screen checks, not a complete accessibility certification or native Tauri audit.

**Existing capabilities worth keeping**

| Area | Already present |
|---|---|
| Shell | Shared header/sidebar/footer, module navigation, command palette, help and documentation overlays |
| Personalization | Fourteen themes, density and font controls, table/form preferences, independent header/sidebar settings |
| Worklists | Table/cards, filtering, column selection, sort, pagination, record preview, inline edits and conflict presentation |
| Forms | Schemas, required-field checks, sections, rail/tab/wizard presentations |
| Documents | Desktop tabs, warm lifecycle, split panes, optional MDI and native detach integration |
| Feedback | Empty, loading, error, denied, conflict and reference-data states; toast service |
| Data handling | Classified filters, opaque saved-view links, worklist export and print review |
| Utilities | Inbox, spreadsheet import/export, billing and consultation examples, component-library page |
| Integration seams | Navigation/window ports and a separated AI configuration/client/UI layer |
| Deployment | Isolated releases, verification, activation and rollback |

Presence does not mean every workflow is complete. Some controls still operate on
fixtures, and some only display a toast.

**Modify first: observed design and interaction problems**

1. **Desktop workspace sizing.** Desktop browsers and Tauri are the primary
   targets. Preserve dense tables, persistent navigation and document tabs.
   Validate laptop and large-monitor layouts, resized application windows and
   split panes. Prioritize usable toolbars, readable headings and intentional
   table scrolling. The earlier 390px/768px observations are optional mobile
   follow-up, not release blockers; mobile does not drive the design.

2. **RTL and localization (when required by a product).** Arabic flips flex direction, but the sidebar still
   uses physical left/right positioning. The observed layout overlays content on
   the left and leaves a sidebar-width gap on the right. Many labels remain in
   English. Define whether sidebar placement is a physical side or a logical
   start/end preference; use it consistently. Translate navigation, field labels,
   validation, status labels and notifications, with product-owned dictionaries.
   `i18n.ts` currently holds a small action-word dictionary, not full-screen
   localization.

3. **Keyboard focus restoration.** The command palette retained focus through
   30 Tab presses, but Escape returned focus to BODY rather than the Search
   button that opened it. `useDialogBehaviour` captures focus in an effect after
   the child's autofocus can already have run. Preserve the actual trigger before
   opening. Test modal stacking, hidden controls, dropdowns, drawers and split
   panes as well. The [W3C modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
   describes both focus containment and the expected return after closing.

4. **Header hierarchy and readability.** At 1500px, the Customer Master heading
   was allocated 71px although its text needed 126px. Its subtitle and branch
   selector consumed space while the page identity was truncated. Give the title
   priority; shorten or hide secondary information first. Review the many tiny
   captions and icon-only actions in comfortable desktop layouts, including
   independent header/sidebar theme combinations.

5. **Honest record state.** The untouched new-record screen already shows
   “Saved” and “Last saved Just now.” Model `new`, `dirty`, `saving`, `saved`,
   `failed` and `conflict` separately. A new record should say “Not saved”; use
   adapter results to show a save time. A mock adapter can demonstrate the full
   interaction before a real backend exists.

6. **Finish the controls already advertised.** The worklist's personal Saved
   views menu contains fixtures, “Save current view” only shows a toast, and
   Refresh does not refetch. This is distinct from the implemented opaque
   shareable-view API. Consolidate personal/shared views into one workflow with
   save, rename, delete, default and restore behavior. Make refresh call the data
   adapter. Do the same inventory for archive, record duplication, approval,
   audit and PDF actions: either complete their mock-backed frontend behavior
   or clearly identify them as demonstrations in the developer catalogue.

7. **One notification state.** Header unread counts and inbox read IDs are held
   in separate component state. Move them behind one notification store/adapter
   so reading an item or marking all read updates the header and page together.
   Add actionable links, failure/retry and loading/empty states to that shared
   contract.

The earlier confirmed frontend findings also remain prerequisites: document-scoped
AI sources, dirty-state ownership during background saves, detached-window logout
cleanup, preference-load/save safety, and deferred export-test cleanup. See
[remaining-work.md](remaining-work.md). They should be fixed before other products
inherit these components.

**Add next: the reusable product foundation**

| Priority | Addition | What completion would look like |
|---|---|---|
| P1 | Product configuration | A product supplies its name/logo, navigation, registered pages/modules, enabled capabilities, theme defaults, locale/currency/timezone defaults, help links and document branding without editing shared shell files. |
| P1 | Replaceable service adapters | Screens receive contracts for session, records, reference lists, preferences, files, notifications and AI. Mock implementations exercise success, pending, empty, denied, validation, conflict and network failure. A consuming product supplies real implementations. |
| P1 | Capability-aware UI | One capability resolver controls menus, routes, record/field actions and command-palette entries. It distinguishes hidden, disabled-with-reason, denied and plan-unavailable states. Actual authorization remains the consuming backend's responsibility. |
| P1 | Shared record layout | Configurable summary/status header, editable details, related records, attachments, comments and activity panels. Products choose panels; billing/clinical specifics stay in optional modules. |
| P1 | Richer form contracts | Conditional visibility, dependent/async lookups, field and cross-field validation, repeatable rows, date-time and currency handling, server field-error mapping, and configurable draft behavior. Custom-field renderers cover exceptions without extending a giant switch for each product. |
| P1 | Server-data worklist mode | Explicit paging/cursor, sort, filter, total-count, loading and selection contracts. Cancel/ignore obsolete requests. Define selected-page versus all-matching selection and partial bulk-operation results. Existing local fixture mode remains useful for demos. |
| P1 | Reusable import workflow | Upload → sheet/column mapping → preview/validation → confirmation → progress/results, including duplicate handling and a downloadable error report. The current spreadsheet tool has costing-specific columns and is not a general entity import flow. |
| P2 | Attachment component | File selection/drop, type/size feedback, progress, cancel/retry, preview, download and removal through an adapter. Reuse inside records and messages. |
| P2 | Session and organization UX | Expired-session recovery, return to the intended page, organization switching when supported, visible current context, and cross-tab/window invalidation. Namespace browser state by product and appropriate account/context identifiers. |
| P2 | Activity and job feedback | A common event timeline and a background-task panel for imports/exports or long reports, with progress, retry/cancel where supported, and accessible announcements. |

These are frontend contracts and interaction patterns. Their mock implementations
can be completed here; they do not require implementing a SaaS backend first.

Evidence for product coupling: `ModuleKey` is a fixed union in
[types.ts](../packages/erp-config/src/types.ts), shared chrome reads the global
`MODULES`/`PAGE_REGISTRY`, `sidebar.tsx` hard-codes Nexora branding, invoice output
embeds company/AED/UAE fixtures, and screens directly import `getWorklistConfig`.
The navigation port demonstrates the same dependency-injection pattern that can
be extended to these other services.

The worklist currently starts from complete local rows, optionally receives a
search result, then slices rows for pagination. The search request does not carry
a paging/cursor or sorting contract. A large-data mode needs that distinction
before virtualization is considered. The [TanStack pagination documentation](https://tanstack.com/table/v8/docs/api/features/pagination)
illustrates explicit manual pagination and total-count contracts; this is a design
reference, not a recommendation to replace the current table library.

**Improve product development and distribution**

- Extend the existing Library page into a working component/state catalogue.
  Include long labels, empty/error/disabled/loading states, permissions, dark
  themes, RTL and narrow layouts. Reuse those examples for interaction and visual
  checks. I would revisit the earlier “skip sandbox” decision because multiple
  products and designers now need a place to inspect the shared contract. This
  does not require a separate application: [Storybook's story-based testing model](https://storybook.js.org/docs/writing-tests)
  is a useful reference for reusable states, whether implemented there or in the
  current Library.
- Prove reuse with a second thin application profile in a different domain. It
  should register its own modules, records, branding and adapters while importing
  the shared framework unchanged. This will reveal missing extension points much
  faster than adding more options to the Nexora demo alone.
- Provide a starter/scaffolding command, supported configuration schema,
  versioned package releases and migration notes. If consumers must physically
  copy code, provide an upstream version and upgrade process; ordinary repository
  duplication makes shared fixes expensive to propagate.
- Lazy-load optional page modules. The deployed desktop has one approximately
  1.15 MB minified JS asset (344 KB when recompressed with gzip for this review),
  and `PageRenderer` statically imports spreadsheet, billing, clinical, AI-admin
  and the other page implementations. Measure startup first, then split optional
  modules so a simple product does not load every demo domain.
- Complete the existing desktop/browser, keyboard, dark-theme and RTL test
  backlog. Add product-profile and permission-state coverage. Do not describe an
  axe pass over selected screens as proof of all accessibility behavior.

**Features to keep optional**

Calendar/scheduling, Kanban, rich-text editing, workflow builders, customer-facing
billing/subscription management and advanced report builders belong in optional
modules when a consuming product needs them. Do not make each product load or
configure them. Keep MDI and detachable windows optional. More themes and a
low-code page builder have lower value than the current correctness and reuse
work. A generic wizard engine still needs several concrete flows before its API
can be designed well; the import flow above provides one such concrete case.

**Suggested implementation sequence**

1. Fix document/session correctness, desktop workspace sizing, focus restoration
   and misleading save/action states. RTL is required only for products that enable it.
2. Introduce product configuration, capability-aware UI and mock/real service
   contracts. Validate them with a second product profile.
3. Complete form rules, saved views, server-data worklists and notifications;
   build reusable record panels, attachments and the import flow.
4. Expand the Library and browser/state matrix, add module lazy loading, then
   package the starter and versioned release process.

The acceptance test for the foundation is practical: creating another product
should require product configuration, domain screens and adapters, while fixes to
shared components and behavior flow to both products without duplicate edits.

Implementation is tracked in [desktop-development-plan.md](desktop-development-plan.md).
