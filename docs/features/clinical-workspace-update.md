# Billing view/edit and shared clinical workspaces

These changes apply to Billing Clinic, Clinical Triage and Comprehensive Consultation in Library → Page Library. They are local implementation until a separate deployment is recorded.

## Billing flow

Open a patient and choose Invoices & payments. **View bill** opens a full document screen containing invoice identity, author/date, insurance and authorization, discount, notes, line quantities/prices/tax/shares, ordering doctors, receipts and prior correction summaries. Export and PDF/print retain the existing disclosure confirmation and server audit flow. **Back to billing** returns to the ledger.

**Edit bill** opens a separate correction screen with values loaded from the API invoice. Adjust quantities for its existing lines, discount, insurance/authorization and notes. Review the calculated preview, enter a reason, then select **Save bill changes** and confirm. The authoritative API response opens the updated view screen. The previous full invoice snapshot, actor, correction time and reason remain in the CSV revision history. Revision summaries show the previous total and notes; the API also retains all prior lines.

Only issued invoices without any payment history can be edited. Partial payments, fully paid bills, refunds and cancellation block corrections. Read-only users can view and return but cannot edit or export through the mutation API. Adding/removing bill lines, changing patient identity, arbitrary tariff editing and credit notes are not part of this correction screen; unpaid cancellation and rebilling remain available through the existing workflow.

Edits are staged in component state from API data, not persisted locally. Recoverable failures preserve input; Retry sends the identical operation ID and payload. A conflict requires **Load latest ledger** and review before a new save. If payment was recorded meanwhile, editing is disabled. Back and patient changes confirm before discarding unsaved corrections. Browser-close recovery is not supplied by this screen.

## Clinical flow

Both clinical pages reuse the same numbered rail and visual styles as Master Record – Main. The shared layout's opt-in `activeOnly` mode renders one selected section in an internal scroll area; the original master-record stacked sections remain the default. Keyboard arrows, Home/End, RTL navigation, reduced motion and effective rail/tabs/wizard preferences use the existing layout implementation.

Triage now follows the consultation pattern: selected intake, vitals or handoff pane on the left, and a triage snapshot on the right. The snapshot reflects the current document's complaint, allergy details, clinician-assigned priority, destination and remaining validation items. It does not derive clinical priority or recommend treatment. Save draft and Complete triage remain visible in the action bar. Navigation and tenant policy changes preserve entered values.

Comprehensive Consultation keeps its nine sections, contextual snapshot, full review, API orders/scores and draft/sign workflow. Only navigation/layout changes. API-loaded triage summaries remain references and are not copied into the consultation.

## Component and API integration

`BillingClinicWorkspace`, `ClinicalTriageWorkspace` and `ComprehensiveConsultationWorkspace` keep their existing public adapter and PreferenceHost contracts. Internal reusable components are `ClinicBillScreen`, `TriageBoard` and the shared `RecordSectionLayout`. `ClinicalDocumentDefinition.recordLayout` opts document engines into the shared record shell. No route or sidebar entry is added.

The typed `ClinicBillingCommand` adds:

```ts
{
  action: "editInvoice",
  invoiceId,
  quantities: [{ orderId, quantity }],
  discountBps,
  insuranceId,
  authorization,
  note,
  reason
}
```

The adapter adds authenticated product context and sends it to `POST /clinic-billing` with patientId, expectedVersion and operationId. The server independently checks role, tenant/application/patient scope, invoice status/payment history, exact line membership, positive integer quantities up to 100, discount bounds, text limits and valid insurance. It computes prices/totals from its current CSV tariff catalog; the screen explains that the current tariff is used. Client-submitted totals are never accepted. Stale requests fail with 409, invalid or payment-locked corrections with localized 400 errors, and unauthorized writes with 403. Existing operation receipts prevent duplicate correction history after a lost response.

Billing retains durable demo CSV snapshots; triage and consultation keep their existing API/CSV document stores. The frontend contains no new mock records or replacement in-memory data adapter. Empty form values and derived previews are transient edits of API-loaded documents. Other applications can replace the typed adapters while preserving the same UI and server enforcement contract.

## Preferences, help and completion boundary

Shared controls, cards, tables and formatters inherit theme, font, radius, density, formatting, table pagination and tenant locks. Monetary display retains the ledger currency and at least two decimals. Four canonical catalogs, generated fallbacks and versioned help/alerts cover the changes. Native-speaker wording review remains pending.

See the [implementation and verification record](../releases/unreleased/clinical-workspaces-2026-09-10.md). This remains a demo workflow: no payment gateway, payer/claim integration, certified invoice amendment or clinical decision support is introduced. Native executable and live deployment acceptance are separate from local browser checks.
