# OP Consultation

Open **Library → Page Library → OP Consultation**, after Clinical Consultation. This dedicated outpatient workspace uses the same 44-field consultation records and demo API as Clinical Consultation, with a focused form, section navigation and live documentation summary. It does not create a second set of patient notes.

## Workflow

1. Search and select the patient. Check the identity banner, linked encounter and latest completed triage context.
2. Choose a clinical section from the navigator. Entered sections show a check indicator. Under managed tabs/wizard preferences, use the corresponding outer navigation instead of the side navigator.
3. Use the documentation summary's field buttons to jump to the relevant section. Its count measures populated required documentation fields, not clinical status or a validated clinical score. Server validation remains authoritative.
4. Choose **Review full note** to read all entered sections, including unsaved values. Empty sections say Not recorded. This read-only preview does not save, sign, export or dispatch anything.
5. Save or complete from the encounter toolbar. The existing draft, retry, conflict, completion and history rules apply. Completed notes remain locked; New consultation starts a separate record.

The triage banner reads the latest completed triage for the patient, including its save time, priority, allergy-review context and observed readings. Open its details for the full measurement list, measurement time and allergy text. **Refresh triage** updates that reference independently of the consultation editor. It does not copy readings, findings or allergies into the current note. This patient-level triage may belong to a different encounter; it is reference context, not proof of a current-encounter observation. No completed triage produces an explicit empty state, and API failures expose recovery rather than synthetic readings.

## Components and integration

`OPConsultationWorkspace` composes the shared `ClinicalDocumentWorkspace`, `ClinicalDocumentEditor`, `ConsultationSection`, `OPPatientContext` and `OPConsultationBoard`. Shared cards, tabs, buttons, badges, controls and dialogs provide the UI. The shared editor has an opt-in inline action toolbar and navigation callback; existing Consultation and Triage retain their normal layouts.

Use the public TypeScript example under **Page Library → List of pages**. Provide the authenticated consultation adapter, patient adapter and triage adapter, memoized around request/product identity. The workspace accepts the existing preference host and authenticated tenant/application/user scope key. Effective policy, font/theme/radius, form navigation, history settings, date/number formatting and shortcut enablement remain managed. Summary navigation scopes focus to its own workspace.

The demo reads `/clinical-consultation`, `/clinical-triage` and the existing clinical patient endpoints. It saves through `/clinical-consultation` into the same CSV as the existing consultation page. Product configuration must authorize the underlying consultation and triage reads; the new sidebar item alone does not grant API permission. Triage refresh uses read operations. The current demo still permits consultation writes through the enterprise-admin role; the integrating application must supply production clinical authorization.

UI labels use `template.op.*` and the existing consultation catalogs in English, Arabic, Hindi and Malayalam. Versioned help/feature alert is `2026-09-09-op-consultation`. Input remains authored text; no automatic translation or clinical recommendation is introduced.

## Boundaries and acceptance

Prescription/order dispatch, structured diagnosis coding, signatures, amendment relationships, booking and billing integration remain outside this frontend note template. The full-note modal is a preview, not a clinical signed document or export. Saved drafts are durable in the single-process demo CSV; unsaved browser-close recovery is not added. Native-language clinical wording and native executable acceptance remain separate.

See [Consultation's data and workflow contract](clinical-consultation.md) and the [OP implementation evidence](../releases/unreleased/op-consultation-2026-09-09.md).

## Catalog location — 10 September 2026

Examples, demo descriptions and user/integration guides are in **Page Library → List of pages**. Working pages open directly to their forms/workspaces. See the [catalog guide](page-library-catalog.md).
