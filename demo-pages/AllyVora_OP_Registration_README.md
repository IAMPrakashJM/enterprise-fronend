# AllyVora — Ambulatory / OP Registration

**Deliverable:** an interactive, self-contained front-end prototype, not a production clinical system.

Open `ambulatory-registration.html` in a modern desktop browser. No installation, build, account, internet connection, external font, CDN or JavaScript dependency is needed to use the page. The test and CSP scripts are optional developer utilities.

**Use synthetic information only.** All supplied people, identifiers, providers, payer plans, prices, medicine items and clinical records are fictional demonstration data. The fixed clinic day is **10 September 2026**. Activity timestamps use the browser clock, displayed in Asia/Dubai.

## The page structure

The registration journey uses four short stages, then a separate care workspace. The page does not turn 30 workflow activities into 30 registration screens.

| Stage | What the user does |
|---|---|
| 1. Patient | Search, select an appointment/patient, detect a possible duplicate, create/update demographics, and explicitly verify two identifiers. |
| 2. Visit details | Review the arrival pathway, visit template, purpose, complaint, specialty, provider, clinic, episode/case, referral and assistance requirements. |
| 3. Coverage & consent | Review payer/member details, simulate eligibility, record authorization/visit limits or an exception, review the estimate and consent/privacy decisions. Successful simple eligibility checks collapse the reviewed coverage panel automatically. |
| 4. Review & check-in | Review required fields, choose nursing-first or direct-to-provider routing, create one encounter and update the linked appointment/worklist. |
| 5. Care & checkout | Use Overview, Nursing, Consultation, Orders & services, Billing, and Checkout tabs. Each activity belongs to the same encounter. |

A fixed action bar keeps Back, Save draft, Continue and Check-in accessible. The left rail expands on hover/focus and can be pinned. Less frequently used information is disclosed on demand. Small-screen patient results become selectable rows rather than a page-wide scrolling table.

## Try the appointment journey

1. Search for **Maya** or **DEMO-1001**. Searching Maya also demonstrates a similar-name/date-of-birth record. Select the correct patient after reviewing the identifiers.
2. Confirm the patient's full name and date of birth. These checks are never automatically selected.
3. Continue to Visit details. The booking retains its own appointment number; provider and visit information are prefilled. Link an episode only when it is appropriate.
4. Continue to Coverage & consent. Choose **Check eligibility**. Maya's matching synthetic payer/member combination returns an illustrative eligible response.
5. Review consent applicability, then continue to the final review and **Register & check in**.
6. Use the **Demo role** selector to preview Nurse, Clinician, Billing or Supervisor. The Supervisor preview exposes all workspaces; it is deliberately not real authentication.
7. In Nursing, record assessment information and review allergies and current medications. In Consultation, document the clinical note and explicitly confirm identity before the simulated signature.
8. In Orders, search the catalogue, add a clinically indicated demonstration request, and record its service lifecycle. In Billing, inspect posted charges and simulate a payment. In Checkout, book follow-up or document an exception, prepare patient instructions and complete the encounter.

## Other test scenarios

| Synthetic patient | Scenario |
|---|---|
| Omar Kareem — DEMO-1002 | Dental appointment and dental episode linkage. |
| Leena Nair — DEMO-1003 | Antenatal appointment and a simulated pending payer response. Document a financial follow-up reason instead of assuming eligibility. |
| Daniel Reed — DEMO-1004 | Physiotherapy episode, managed case, authorization status and approved/used sessions. |
| Sara Noor — DEMO-1005 | Walk-in, incomplete consent records and an ineligible synthetic insurance profile. |
| Evan Brooks — DEMO-1006 | Minor requiring explicit representative verification and representative details. |
| Maya T. Thomas — DEMO-1007 | Similar-record warning; no automatic merge. |
| New patient | Duplicate review, automatic demo MRN generation, contact/demographic fields and a self-pay walk-in pathway. |

Templates cover General OP, Dental, Antenatal, Mental health, Physiotherapy, Post-operative, Second opinion, Chronic disease review, Screening and Vaccination. Specialty-specific sections change without creating separate registration applications. For an appointment, change to a walk-in pathway before replacing the booked template/provider. Referrals are a separate arrival/source choice, not a new patient identity.

## What is functional

Patient search supports normalized, case-insensitive name fragments, MRN, mobile, document identifiers, insurance member IDs and date of birth. Exact matching identifiers sort ahead of partial matches. Typing in the initial appointment search automatically expands the search to all patients. Arrow keys and Enter select a result. This small in-memory matcher is **not** a production enterprise master patient index.

Appointment, clinical worklist, order catalogue and audit views have working filters/searches. The appointment desk supports synthetic bookings, local slot-conflict checks, check-in selection and linked-encounter access. Branch worklists are filtered to the selected branch; this is a UI demonstration, not tenant security.

Other working interactions include demographic editing; duplicate warnings and a documented supervisor-only UI override; planned episode/case creation and linking; in-memory draft save/resume; minor/guardian checks; consent exceptions; a simulated payer timeout/ineligibility path; clinician consent review; nursing observations and BMI calculation; signed-note locking and addenda; order cancellation; demonstration specimen/accession tracking; fictional medication administration records with identity/safety confirmations; sample financial allocation; payment amount validation and reversal; discounts with reasons; follow-up booking; demo claim draft/validation/submission; patient-document preview, explicit print/export; urgent handoff task recording; privacy curtain; inactivity lock; and a searchable in-memory audit view.

No other module is silently presented as implemented. The navigation either opens one of these workspaces or clearly explains the demonstration boundary.

## Coverage of the original 30 activities

| Original activity | Where it is covered |
|---|---|
| 1. Arrival/connection | Appointment, walk-in or referral choice; visit mode. |
| 2. Patient search | Stage 1 search and filters. |
| 3. New patient registration | New patient dialog; demographic MRN generation. |
| 4. Existing-patient verification | Two explicit identity checks, demographic editing and duplicate warning. |
| 5. Appointment review | Appointment desk, prefilled visit and retained appointment reference. |
| 6. Encounter class | Fixed ambulatory/AMB registration context. |
| 7. Encounter type | Configurable-style visit template selection. |
| 8. Visit purpose | Separate purpose field. |
| 9. Reason/chief complaint | Reason field, quick choices and optional terminology reference. |
| 10. Specialty | Specialty/service selection. |
| 11. Provider | Provider selection, including therapist and nurse-led services. |
| 12. Care location | Visible tenant/legal entity/facility/branch/clinic context. |
| 13. Episode/case | Optional separate links and planned continuity records. |
| 14. Referral | Source, referrer, reference, validity and document metadata. |
| 15. Insurance | Payer/member/network/expiry and explicitly synthetic eligibility. |
| 16. Authorization | Status, reference, dates, approved/used session counts and exceptions. |
| 17. Financial responsibility | Insurance, self-pay, sponsor and package context; illustrative estimate. |
| 18. Consent | Treatment decision, notice acknowledgment, exceptions, representative, form reference and optional communications. |
| 19. Alerts | Operational alert banner and role-sensitive clinical context. |
| 20. OP encounter creation | Final check-in action with duplicate guards. |
| 21. Arrival/status | Linked appointment update and separate queue/encounter states. |
| 22. Worklist routing | Nursing-first or provider routing and a searchable branch worklist. |
| 23. Nursing assessment | Vitals, pain score, BMI, reconciliation and observation fields. |
| 24. Consultation | History, examination, assessment, diagnosis, plan, education, scoring-reference field, simulated signature and addendum. |
| 25. Ordered services | Searchable catalogue, order lifecycle, completion/cancellation and tracking references. |
| 26. Billing | Posted charges, illustrative benefit split, discount/reversal and demo payment ledger. |
| 27. Follow-up | Booking, referral/certificate reference and continuity plan. |
| 28. Encounter completion | Clinical checks, disposition and pending-result handoff. |
| 29. Claims | Demo coding-reference check, claim draft, local validation and simulated submission. |
| 30. Patient handoff | Summary/order/invoice previews, print/export and explicitly unsent communication preparation. |

The application also contains an interactive **30-step workflow map** with links to the relevant stage/tab.

## Important workflow distinctions

The appointment is linked to an encounter, not replaced by one. Starting the consultation does not create a second encounter. A case and an episode are optional, independent continuity links; they are not mandatory layers for every OP visit.

Registration readiness, encounter status, queue status, documentation status, financial status and claim status are separate. Clinical completion does not require payer adjudication or payment. Pending laboratory/imaging work can retain an owner, due date and follow-up plan after the encounter is clinically completed. Unfinished medication/procedure work must be addressed in this demo before departure. Leaving before completion uses a documented exception pathway.

In this demonstration, consultation charges post when the note is signed; service charges post when the service is completed. These are explicit sample revenue rules, not universal billing rules. Later completed services may change the balance and invalidate an already prepared demo claim. Reversal preserves the original demo payment. Session reservation, charging events and claim adjustment rules must be designed for the actual clinical and payer environment.

## Boundaries: what is not implemented

There is **no backend or database**, genuine staff authentication, server-enforced authorization, secure tenant isolation, legally validated electronic signature, genuine eligibility/preauthorization, real messaging/notification delivery, real payment gateway, real laboratory/radiology/pharmacy integration, electronic prescription, or insurer claim transmission.

The case/episode and clinical tabs are lifecycle demonstrations, not complete specialist medical records. Comprehensive dental charting, obstetric charts, psychiatric documentation, validated E&M/scoring algorithms, licensed terminology sets, full CPT/ICD mappings, critical-result notification/escalation, real medication decision support, stock control and full clinical documentation are outside this page prototype. Medication items are deliberately fictional. Do not use its observations or prices as clinical or financial guidance.

Sponsor, package and secondary-cover fields capture context only. Their entitlement, coordination-of-benefits, tax, pricing and adjudication engines are not implemented. Document fields capture references, not secure file uploads. Certificate references are not issued medical certificates. Demo claim validation checks only the displayed local workflow prerequisites; `DEMO-*` codes cannot be used for an actual claim.

A remote mode is available for context and consent-review demonstration, but video consultation and jurisdiction-specific remote-care workflows are not implemented.

## Data handling and security posture

The page uses only memory in its current browser tab. It does not write patient data to localStorage, sessionStorage, IndexedDB or cookies. Refreshing/closing discards patients added during the session, drafts, visits, bookings and audit entries. A browser prompt warns before leaving an active session. Explicit document/audit export or printing is a separate user action that can create an external copy.

There are no network integrations, analytics, external fonts or external scripts. The CSP blocks network connections and permits only the SHA-256-hashed embedded script. The three official-reference links open external sites only when clicked. Inline CSS is allowed for this portable prototype; production CSP and response headers need independent hardening.

The ten-minute inactivity lock and privacy curtain are screen-privacy demonstrations. They do not authenticate anyone, encrypt data, revoke a server session or prevent a person with browser/developer access from reading the synthetic data. The Demo role selector is not RBAC. The audit list is mutable, incomplete and non-durable; it is not a compliance audit system. Signed-note locking is also a UI behavior, not a tamper-resistant signature.

## HIPAA / JCI: deployment prerequisites

This HTML is **not “100% HIPAA compliant,” HIPAA certified, JCI accredited, or a complete standards crosswalk**. No accreditation or regulatory-compliance conclusion can be established from a registration-page prototype.

HHS describes administrative, physical and technical safeguards, including risk analysis, access management, audit, authentication, transmission protection, workforce practices and organizational arrangements. JCI describes patient-safety goals for accredited organizations and states that goals vary by setting/accreditation program. Implementing corresponding UI checks is useful, but does not establish compliance with the full applicable requirements.

Before handling real information, assess at least: identity provider/SSO and appropriate MFA; server-side authorization and scope checks; secure sessions and governed emergency access; TLS and protected storage/backups; key management; durable access/change auditing; monitoring and incident/breach response; recovery tests; privacy notices, patient rights, retention and disclosure workflows; vendor/business-associate arrangements where applicable; staff training; validated clinical terminology, identity matching, consent and signature evidence; and the applicable current accreditation program and local health/privacy requirements. Obtain qualified security, clinical, legal and accreditation review.

Primary references reviewed for the design on 10 September 2026:

- HHS, Summary of the HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS, Summary of the HIPAA Privacy Rule: https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html
- JCI, International Patient Safety Goals: https://www.jointcommission.org/en/standards/international-patient-safety-goals

The source summaries are not a substitute for the applicable rules or licensed accreditation standards.

## Integration handoff for the production application

Replace the in-memory operations with authenticated APIs for patient identity/search, scheduling, encounter registration, consent/evidence, eligibility/authorization, worklists, documentation/signatures, orders/results/administration, charge capture, payments, claims, follow-up and auditing. Resolve scope on the server from authenticated identity; do not trust client-supplied tenant, branch, role or patient IDs.

Use durable transaction boundaries and idempotency keys for check-in, payments and charge posting; enforce concurrency controls and unique identifiers on the server. Record timestamps, source systems, versions, authorship, record corrections and state transitions. Use outbox/event delivery with retry and deduplication for downstream integrations where appropriate to the chosen architecture. These are proposed design directions, not connected endpoints in this deliverable.

The prototype's internal status labels are product-level demonstration states. Map them explicitly to the interoperability version and receiver contract selected for production rather than assuming a direct FHIR or HL7 mapping.

## Keyboard and accessibility support

- **Alt + K:** patient search; opens the worklist after check-in.
- **Alt + P:** privacy curtain.
- **Alt + Enter:** next registration stage or final check-in.
- **Up / Down, Enter:** navigate and select patient search results.
- **Esc:** close a native dialog.

The page has labeled fields, visible focus indicators, semantic buttons, a skip link, native modal focus containment, status/error announcements, reduced-motion support and responsive layouts. This is not an accessibility certification; conduct assistive-technology and usability testing with actual staff before deployment.

## Testing and editing

`test-results.json` records the included Chromium end-to-end tests. They exercise the appointment and walk-in paths, duplicate safeguards, signatures/addenda, service completion, payment bounds/reversal, claim validation, pending results, branch/role views, privacy/lock behavior, search and mobile overflow. Passing these prototype tests is not a clinical, security or compliance validation.

To modify the self-contained source, edit `ambulatory-registration.html`. After changing embedded JavaScript, run:

```bash
python build-csp.py
```

This recomputes the CSP hash. Otherwise the browser will correctly refuse to run a script whose content no longer matches its allowed hash.

The optional Python test harness uses Playwright. Set `CHROMIUM_EXECUTABLE` to an installed Chromium/Chrome executable, or use the browser supplied through the locally installed Playwright tooling. Then run:

```bash
python test-ui.py
```

The harness loads the page content directly for testing and writes screenshots/test results beside the HTML. It is a developer utility, not required to open the page.
