# Page Library: List of pages

Open **Library → Page Library → List of pages**, the first item in this sidebar group. The catalog lists every other page in that group that is available to the signed-in user. The current group contains 13 working pages: Worklist Query, Master Record – Main, 360 Data, Billing Clinic, Clinical Triage, Clinical Consultation, OP Consultation, Comprehensive Consultation, OP Registration, Emergency Registration, Inpatient Admission, Consultation Entry and Consultation Entry v2. The two last pages use `consultation-entry-design` and `consultation-entry-v2`; the existing application route `consultation-entry` is preserved.

## User flow

1. Search by page name or route ID. Clear the search to show the complete accessible list.
2. For **Billing Clinic**, use the card’s API-backed Search and Select patient controls. Selecting a patient opens a new browser tab (web) or workspace tab (desktop) with that patient’s billing data. A billing page opened without a patient provides a link back to List of pages.
3. Select **Open page** to open the working workspace. The workspace keeps its forms, API data and save behavior. Patient selection remains inside workspaces except Billing Clinic, which uses the catalog launcher described above.
4. Select **TypeScript example** on a card to open that page's public integration code. Copy uses the clipboard and reports success/failure.
5. Select **User and integration guide** to read the page's workflow, adapter contract, preference behavior, recovery and limitations. Switch between code and guide inside the resource dialog.
6. Demo descriptions, including **Demo patient search**, are shown on the catalog cards/resources. They are descriptions; no patient fixture is rendered by the catalog.

The working pages no longer display the Preview/TypeScript/guide tab strip or the former clinical library demo header. Patient search and selection remain on the working pages except the hosted Billing Clinic launcher. Existing domain safety notices within a clinical/billing workspace remain part of that workflow. The separate Page Template Library TEMP and its templates are unchanged.

Page-level release notice cards (title, **Read explanation** and **Dismiss**) appear only on **List of pages**, subject to the existing documentation preference and read/dismiss state. Other working pages, including Billing Clinic, show no shell release notice card. Release history and explicit documentation access remain in the Documentation Center; hiding a card does not mark its change as read or dismissed.

## API, components and integration

The authenticated application provider loads `/navigation`. `PageLibraryCatalog` reads its effective `product.modules.library.navigation` group with the stable `template.clinical.library` key and resolves its page IDs against `product.pages`. It preserves backend order, walks nested groups, excludes itself and deduplicates entries. It does not invent a second module/page list or add a mock API. A newly added accessible backend menu page appears automatically. Register its TypeScript example separately in `PAGE_LIBRARY_RESOURCES`, and author its guide through the shared documentation lifecycle. Missing code shows an explicit unavailable message; the Guide tab resolves page help independently through `DocumentationArticle`.

`pageLibraryEntries` contains the typed membership/access projection. `PAGE_LIBRARY_RESOURCES` centralizes the 13 public-import examples and canonical demo-description keys; dedicated help comes from the shared documentation resolver. Code is bundled integration documentation, not patient data; text translations are supplied by the canonical API catalogs. The working wrappers now only compose their existing adapters, authenticated scope, navigation targets and PreferenceHost into reusable workspaces. The catalog itself does not replace clinical or billing adapters or their save contracts.

The new `list-of-pages` destination is registered in the frontend page registry, the demo navigation API and the testing inventory. The former route IDs remain stable. Other products can expose this catalog and their Page Library menu entries through the same product configuration and register suitable resources.

## Preferences, access and recovery

Cards, buttons, search, modal, tabs and code textarea use shared UI controls and semantic theme tokens. The host controls fonts, density, radius, language and direction. Counts use effective formatters. The catalog does not introduce a second preference store or page-specific settings override.

Only accessible navigation entries are shown. If access changes while a resource dialog is mounted, its selection is rechecked and removed when no longer allowed. The catalog does not grant access to an otherwise hidden page. Existing API/shell authentication and navigation failures retain their established recovery flow. Search and an open guide are transient UI state; there are no saveable patient values on this page.

## Completion boundary

The navigation list, resource relocation, registered examples/guides and direct workspace opening are implemented. Canonical English, Arabic, Hindi and Malayalam labels, versioned help, change alerts and testing inventory are updated. Native-speaker review, other browser/native executable acceptance and live deployment are separate checks. See the [verification record](../releases/unreleased/page-library-catalog-2026-09-10.md).

## Billing patient navigation

The Billing Clinic launcher searches through `ClinicalTemplateAdapter` and sends the selected ID as `NavigationTarget.recordId`. The billing host passes it to `BillingClinicWorkspace` with `patientSelection="external"`. This preserves reload/deep-link identity without copying patient payloads into browser storage. The server validates access and loads ledger data; invalid or unavailable IDs use the existing retry/error display. Tenant/application/user and patient identity remount the editor. The standalone workspace retains its optional inline selector for existing integrations.

The hosted billing page removes the search/select/demo card, four summary statistics and workflow/currency/cashier banner. Orders, review, payments, history, financial formatting and server write permissions remain. Canonical four-language guide text and the public TypeScript example describe the new entry flow.

## Billing rail alignment

Billing uses the shared record layout with a top-aligned rail and one active section. Select a rail item to switch between patient context, orders, review, payments and history. Labels wrap within the rail; content and footer occupy the remaining aligned workspace. The selected section opens at the top instead of leaving earlier sections above it. Effective tabs/wizard preferences still apply. The shared layout’s new `railAlignment="start"` option is opt-in; existing record layouts retain their default spacing.
