# Page Library: List of pages

Open **Library → Page Library → List of pages**, the first item in this sidebar group. The catalog lists every other page in that group that is available to the signed-in user. The initial application includes Worklist Query, Master Record – Main, 360 Data, Billing Clinic, Clinical Triage, Clinical Consultation, OP Consultation and Comprehensive Consultation.

## User flow

1. Search by page name or route ID. Clear the search to show the complete accessible list.
2. Select **Open page** to open the working workspace. The workspace keeps its patient search, selection, forms, API data and save behavior.
3. Select **TypeScript example** on a card to open that page's public integration code. Copy uses the clipboard and reports success/failure.
4. Select **User and integration guide** to read the page's workflow, adapter contract, preference behavior, recovery and limitations. Switch between code and guide inside the resource dialog.
5. Demo descriptions, including **Demo patient search**, are shown on the catalog cards/resources. They are descriptions; no patient fixture is rendered by the catalog.

The working pages no longer display the Preview/TypeScript/guide tab strip or the former clinical library demo header. Actual patient search and selection remain on the working pages. Existing domain safety notices within a clinical/billing workspace remain part of that workflow. The separate Page Template Library TEMP and its templates are unchanged.

Page-level release notice cards (title, **Read explanation** and **Dismiss**) appear only on **List of pages**, subject to the existing documentation preference and read/dismiss state. Other working pages, including Billing Clinic, show no shell release notice card. Release history and explicit documentation access remain in the Documentation Center; hiding a card does not mark its change as read or dismissed.

## API, components and integration

The authenticated application provider loads `/navigation`. `PageLibraryCatalog` reads its effective `product.modules.library.navigation` group with the stable `template.clinical.library` key and resolves its page IDs against `product.pages`. It preserves backend order, walks nested groups, excludes itself and deduplicates entries. It does not invent a second module/page list or add a mock API. A newly added accessible backend menu page appears automatically. Its dedicated resource must be registered separately; an absent resource shows an explicit message instead of fabricated documentation.

`pageLibraryEntries` contains the typed membership/access projection. `PAGE_LIBRARY_RESOURCES` centralizes the eight preserved public-import examples, canonical guide keys and demo-description keys. Code is bundled integration documentation, not patient data; text translations are supplied by the canonical API catalogs. The working wrappers now only compose their existing adapters, authenticated scope, navigation targets and PreferenceHost into reusable workspaces. No clinical or billing data adapter or save contract changed.

The new `list-of-pages` destination is registered in the frontend page registry, the demo navigation API and the testing inventory. The former route IDs remain stable. Other products can expose this catalog and their Page Library menu entries through the same product configuration and register suitable resources.

## Preferences, access and recovery

Cards, buttons, search, modal, tabs and code textarea use shared UI controls and semantic theme tokens. The host controls fonts, density, radius, language and direction. Counts use effective formatters. The catalog does not introduce a second preference store or page-specific settings override.

Only accessible navigation entries are shown. If access changes while a resource dialog is mounted, its selection is rechecked and removed when no longer allowed. The catalog does not grant access to an otherwise hidden page. Existing API/shell authentication and navigation failures retain their established recovery flow. Search and an open guide are transient UI state; there are no saveable patient values on this page.

## Completion boundary

The navigation list, resource relocation, eight examples/guides and direct workspace opening are implemented. Canonical English, Arabic, Hindi and Malayalam labels, versioned help, change alerts and testing inventory are updated. Native-speaker review, other browser/native executable acceptance and live deployment are separate checks. See the [verification record](../releases/unreleased/page-library-catalog-2026-09-10.md).
