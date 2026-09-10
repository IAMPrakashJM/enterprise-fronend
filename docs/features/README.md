# Feature catalog

- [Own Settings and default module](own-settings.md): API-backed personal startup module with tenant controls.

- [Comprehensive Consultation](comprehensive-consultation.md): specialty documentation, linked orders, scoring, coding and demo signing.

This frontend is a reusable design and application framework. “Implemented” below means a frontend capability and its documented demo contract exist; it does not establish production ERP, clinical or school-service acceptance.

| Feature family | Guidance | Current boundary |
| --- | --- | --- |
| OP Consultation | [User and integration guide](op-consultation.md) | Focused OP workspace, shared consultation records and read-only triage context |
| Clinical Consultation | [User and integration guide](clinical-consultation.md) | Compact API-backed notes; production clinical integration remains separate |
| Clinical Triage | [User and integration guide](clinical-triage.md) | API drafts, manual triage and handoff; clinical acceptance remains separate |
| Billing Clinic | [User and integration guide](billing-clinic.md) | CSV-backed demo billing; real payer, gateway and accounting integration remain separate |
| Library preferences and component compliance | [Current detailed guide](library-preferences.md) | Local corrections implemented; publication and platform limits in the release record |
| Component examples and copyable code | [Component Library](../../desktop-clients/docs/component-library.md) | Shared demos; new preference behavior is described in the current guide |
| 97 configurable page templates | [Page Template Library](../../desktop-clients/docs/page-template-library.md) | Reusable engines and sample adapters; real domain services belong to applications |
| Patient Query, Record and 360 | [Clinical templates](../../desktop-clients/docs/clinical-page-templates.md) | Fictional demo data; not clinical validation or insurer integration |
| Tenant defaults and locks | [Preference policies](../../desktop-clients/docs/tenant-preference-policies.md) | Existing scoped API contract; real identity/authorization must be integrated |
| Localization and backend messages | [Localization](../../desktop-clients/docs/localization.md), [backend messages](../../desktop-clients/docs/backend-message-localization.md) | Catalog checks are distinct from native-speaker approval |
| Record editing | [Record editing](../../desktop-clients/docs/record-editing.md) | Adapter, validation, conflict and retry responsibilities are documented |
| Shared drafts | [Draft service](../../desktop-clients/docs/shared-draft-recovery.md), [recovery center](../../desktop-clients/docs/draft-recovery-center.md) | Tenant storage, retention and sensitive-field rules apply |
| Sentinel and user-facing errors | [Sentinel](../../desktop-clients/docs/sentinel-monitoring.md) | Demo collection contract; production monitoring integration remains explicit |
| Imports, approvals and related record panels | [Illustrated platform guide](../../desktop-clients/docs/handbook/frontend-platform-guide.md) | See the guide's feature-specific scope and API boundaries |
| Page help, releases and documentation alerts | [Documentation center plan](../../desktop-clients/docs/documentation-release-center-plan.md) | Plan and runtime authoring coverage must be checked separately; repository Markdown is not automatically an in-app article |

## For future features

Create a feature document using the [feature template](../releases/templates/feature.md). Include the trigger, user flow, settings and permissions, failure behavior, API/data ownership, integration example, accessibility/localization, test IDs, completed work and pending work. Link it from this catalog and the appropriate release record.

Never substitute a screenshot, an empty route or a passing build for functional acceptance. Keep planned, implemented, tested, deployed and accepted states distinct.

- [Registry design family](registry-design-family.md): worklist, small master, billing, claim and consultation templates.

- [Page templates CSV storage](page-templates-csv.md): API-backed query, main record and 360 data with CSV persistence.
