# Library renderer matrix — guide 1.0.0

| Family | Destinations | Main renderer | Required acceptance |
| --- | --- | --- | --- |
| Named templates | 102 | PageTemplateWorkspace and 12 engine families | Definitions render; supported tables/layout/page-size use managed preferences; adapter behavior retains validation/recovery |
| Template index | 1 | TemplateLibraryPage | Search/filter/navigation and current generated examples |
| Component catalogs | 12 | ComponentCatalog and demo functions | Shared components, real examples, current formatters and managed controls |
| Page Library workspaces | 9 | PatientQueryTemplate, PatientRecordTemplate, Patient360Template, BillingClinicWorkspace, ClinicalTriageWorkspace, ClinicalConsultationWorkspace, OPConsultationWorkspace, ComprehensiveConsultationWorkspace, RegistrationWorkspace | API data/metadata, fields/actions, locks, formatting, shortcuts, previews, errors and relevant scope |
| Page Library catalog | 1 | PageLibraryCatalog | API navigation membership/order, page opening, relocated examples/guides, access changes and localization |
| Dedicated reference pages | 6 | LibraryReferencePage | Dedicated theme/accessibility/catalog/contracts/shortcuts/integration content; translated labels and real preference controls |
| Other shared destinations | 10 | Dashboard, WorklistPage, SpreadsheetPage, PreferencesPage, InboxPage, AiAdministration | Canonical routes do not lose Library presentation; feature-specific permissions/data behavior remains covered by its own tests |
| Barcode / QR printing | 7 | LabelPrintingWorkspace | Backend artwork, print dimensions, profile policy, reprints, payment simulation and scope |
| Device integrations | 3 | DeviceIntegrationWorkspace, ScannerInput, DeviceJobList | API scan lookup, workstation scope, queued/printed-requested/simulated states, event deduplication and tenant device policy |
| Identity devices | 3 | IdentityDeviceWorkspace, IdentityResultPanel, IdentityHistory | Synthetic capture, no authentication claim, consent, tenant policy, challenge expiry, manual review and isolation |

Total: 154 unique destinations. The [inventory](inventory.json) names each page and engine; the [original audit inventory](../../../desktop-clients/docs/library-preference-audit.md) preserves the pre-correction findings.

The 102 named templates use master, list, order, booking, case, result, finance, reconcile, report, dashboard, entity and admin engines. A test of one shared renderer provides relevant coverage to its consumers, but does not prove every application's domain rules.

Shared implementation test sources are listed in the inventory. Static coverage is enforced by `desktop-clients/scripts/verify-library-preferences.mjs`. Browser registration is in `desktop-clients/e2e/suites.mjs`; it is distinct from proof that a particular hosted run passed.
