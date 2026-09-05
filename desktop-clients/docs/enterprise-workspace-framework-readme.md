# Enterprise Workspace Framework for Web & Tauri

**Project context:** AllyVORA / Enterprise ERP  
**Document type:** Architecture and implementation README  
**Purpose:** Define a generic way to open, manage, compare, suspend, restore, and secure multiple business records across Web and Tauri desktop applications without making classic MDI the foundation.

---

## 1. Why this document exists

The current enterprise solution already has a strong shell, preferences, themes, record previews, search/select behavior, shortcuts, and other shared UI capabilities.

The UI gap analysis identified **MDI (Multiple Document Interface)** as an available idea in the older AllyVORA codebase, but the updated analysis also showed something important:

- the MDI package was implemented,
- it contained workspace/window/taskbar/store/dirty-state pieces,
- but it has **zero live call sites** in the current application,
- its only real use was in an archived Tauri shell,
- and the current live desktop application does not use it.

Therefore, the recommendation is **not to make classic MDI the core architecture**.

Instead, build a **generic Enterprise Workspace Framework** that supports multiple presentation modes depending on device, shell, module, page, and workflow.

---

# 2. Final Recommendation

Use one shared workspace engine with four presentation modes:

1. **SINGLE**
2. **TAB**
3. **SPLIT**
4. **WINDOW**

The important design principle is:

> A record/document is the unit of work.  
> A tab, split pane, full page, or floating window is only the presentation mode.

This means the same Patient, Encounter, Invoice, Claim, PO, Employee, Order, Result, or other ERP record can be handled consistently regardless of whether it is shown as a normal page, application tab, split view, or desktop window.

---

# 3. Recommended Shell Strategy

## 3.1 Web Application

Recommended default:

- Application tabs
- Browser-addressable routes
- Split view
- Drawer / quick preview
- No classic floating MDI by default

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│ Patient A | Patient B | Patient C                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     Active Patient B                         │
│                                                              │
│   Demographics                                               │
│   Encounter                                                  │
│   Orders                                                     │
│   Results                                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

When comparison is needed:

```text
┌──────────────────────────────┬───────────────────────────────┐
│ Patient A                    │ Patient B                     │
│                              │                               │
│ Encounter                    │ Encounter                     │
│ Allergies                    │ Allergies                     │
│ Medications                  │ Medications                   │
│ Results                      │ Results                       │
│                              │                               │
└──────────────────────────────┴───────────────────────────────┘
```

### Web recommendation

```text
TAB + SPLIT + DRAWER/PREVIEW
```

This gives most of the practical benefit of MDI without introducing draggable windows, overlap, z-index problems, taskbar behavior, or poor tablet usability.

---

## 3.2 Tauri Desktop Application

Recommended default:

- Tabs
- Split view
- Optional detachable windows
- Optional MDI-like behavior for selected pages only

Example:

```text
Main Tauri Window
│
├── Patient A
├── Patient B
└── Patient C
```

A user can choose:

```text
Patient A
   ↓
Open Side-by-Side
```

or:

```text
Patient A
   ↓
Detach as Window
```

This allows power users, dual-monitor users, billing desks, command-center users, and high-volume clinical users to work with multiple visible records without forcing MDI behavior on everyone.

### Tauri recommendation

```text
TAB + SPLIT + OPTIONAL WINDOW
```

---

# 4. Why Not Make Classic MDI the Foundation?

Classic MDI provides:

- movable child windows,
- resize,
- minimize,
- restore,
- taskbar,
- multiple visible records,
- per-window dirty state.

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────── Patient A ─────────────┐                       │
│  │                                    │                       │
│  │ Patient A information              │                       │
│  │                                    │                       │
│  └────────────────────────────────────┘                       │
│                       ┌──────── Patient B ────────────────┐    │
│                       │                                   │    │
│                       │ Patient B information             │    │
│                       │                                   │    │
│                       └───────────────────────────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Patient A | Patient B                                        │
└──────────────────────────────────────────────────────────────┘
```

But it also creates extra complexity:

- navigation becomes more complex,
- every document needs independent dirty-state handling,
- each window can hold heavy UI state,
- small laptops become cramped,
- tablets do not naturally support floating windows,
- background windows can continue polling unless explicitly suspended,
- wrong-patient context becomes more dangerous if state is shared,
- security/privacy exposure can increase if taskbars/window titles show PHI.

So MDI should be treated as an **optional desktop presentation capability**, not a mandatory core feature.

---

# 5. Enterprise Workspace Architecture

Recommended architecture:

```text
                     ENTERPRISE WORKSPACE
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
 Document Manager      State Manager       Security Context
        │                    │                    │
 Duplicate Guard       Dirty State          Tenant
 Limits                Suspend/Resume       Branch
 Lifecycle             Restore              User
 History               Cache                Role
                                             Patient
                                             Encounter
                             │
                     Presentation Layer
                             │
       ┌────────────┬────────────┬────────────┬────────────┐
       │            │            │            │
     SINGLE        TAB         SPLIT        WINDOW
                                               │
                                          Tauri mainly
```

Suggested package:

```text
packages/
  workspace-core/
    document-manager.ts
    document-registry.ts
    document-store.ts
    document-lifecycle.ts
    workspace-policy.ts
    workspace-security.ts
    workspace-events.ts
    workspace-types.ts

apps/
  web/
    workspace/
      tab-workspace.tsx
      split-workspace.tsx
      workspace-shell.tsx

  desktop/
    workspace/
      tab-workspace.tsx
      split-workspace.tsx
      detachable-window.tsx
      desktop-workspace.tsx
```

---

# 6. Generic Document Model

Every open record should be represented as a document.

Example:

```ts
export type WorkspacePresentation =
  | "SINGLE"
  | "TAB"
  | "SPLIT"
  | "WINDOW";

export type WorkspaceDocumentState =
  | "ACTIVE"
  | "BACKGROUND"
  | "SUSPENDED"
  | "MINIMIZED"
  | "CLOSED";

export interface WorkspaceDocument {
  documentId: string;
  documentKey: string;

  tenantId: string;
  branchId?: string;

  module: string;
  documentType: string;
  entityId: string;

  patientId?: string;
  encounterId?: string;
  episodeId?: string;

  title: string;
  subtitle?: string;

  route?: string;

  presentation: WorkspacePresentation;
  state: WorkspaceDocumentState;

  dirty: boolean;

  permissions: string[];
  securityContextVersion?: number;

  openedAt: string;
  lastActivatedAt: string;
}
```

---

# 7. Document Identity and Duplicate Prevention

Do not identify a document only by patient ID.

A patient can legitimately have several different documents open:

```text
Patient 100
├── Patient 360
├── Encounter 5001
├── Encounter 5002
├── Medication Chart
├── Lab Result
└── Billing Account
```

Recommended document key:

```text
tenant
+
document type
+
entity id
```

Example:

```text
TENANT01:PATIENT:100
TENANT01:ENCOUNTER:5001
TENANT01:MEDICATION_CHART:5001
TENANT01:LAB_RESULT:9921
```

When a user opens something:

```text
openDocument(documentKey)
        ↓
Already open?
   ┌────┴────┐
   │         │
  YES        NO
   │         │
Focus       Create
existing    new document
```

This behavior is generic and works for:

- tabs,
- split panes,
- drawers,
- Tauri windows,
- optional MDI.

---

# 8. Generic Workspace API

Recommended API:

```ts
workspace.openDocument(...)
workspace.focusDocument(...)
workspace.closeDocument(...)
workspace.closeAll(...)
workspace.closeOthers(...)

workspace.openInSplit(...)
workspace.moveToSplit(...)
workspace.exitSplit(...)

workspace.detachDocument(...)
workspace.attachDocument(...)

workspace.suspendDocument(...)
workspace.resumeDocument(...)

workspace.markDirty(...)
workspace.markClean(...)

workspace.isAlreadyOpen(...)
workspace.getOpenDocuments(...)
workspace.getActiveDocument(...)
```

Example:

```ts
workspace.openDocument({
  tenantId: "TENANT01",
  branchId: "AD01",
  module: "CLINICAL",
  documentType: "ENCOUNTER",
  entityId: "5001",
  patientId: "100",
  encounterId: "5001",
  title: "Maya Thomas",
  route: "/encounters/5001"
});
```

---

# 9. Page-Level Workspace Capability

Every page should declare what presentation modes it supports.

Example: Consultation

```ts
{
  page: "consultation",

  workspace: {
    allowedModes: ["TAB", "SPLIT"],
    defaultMode: "TAB",
    allowDuplicate: false,
    allowDetach: false
  }
}
```

Example: Patient 360

```ts
{
  page: "patient-360",

  workspace: {
    allowedModes: ["TAB", "SPLIT", "WINDOW"],
    defaultMode: "TAB",
    allowDuplicate: false,
    allowDetach: true
  }
}
```

Example: Preferences

```ts
{
  page: "preferences",

  workspace: {
    allowedModes: ["SINGLE"],
    defaultMode: "SINGLE"
  }
}
```

This gives complete page-level control.

---

# 10. Multi-Level Workspace Policy

Workspace behavior should be controlled through multiple levels.

Recommended hierarchy:

```text
Platform Policy
       ↓
Application / Shell Policy
       ↓
Module Policy
       ↓
Page Capability
       ↓
Role Policy
       ↓
User Preference
```

Example:

```text
Platform
WINDOW capability = enabled

        ↓

Web
WINDOW = disabled
TAB = enabled
SPLIT = enabled

        ↓

Tauri
WINDOW = enabled
TAB = enabled
SPLIT = enabled

        ↓

Consultation
WINDOW = disabled

        ↓

Patient 360
WINDOW = enabled
```

A user preference can only choose between modes already permitted by platform/application/page/security policy.

---

# 11. Split View – Generic Behavior

Split view is not limited to patients.

It should support any two compatible documents.

Examples:

### Healthcare

```text
Current Encounter | Previous Encounter
Patient A         | Patient B
Order             | Result
Medication Chart  | Current Consultation
```

### Finance

```text
Invoice           | Purchase Order
Invoice           | Payment
Claim             | Remittance
Budget            | Actual
```

### HR

```text
Employee          | Payroll
Employee          | Leave History
Candidate         | Job Requisition
```

### Supply Chain

```text
Purchase Order    | Goods Receipt
Purchase Order    | Supplier Invoice
Stock Item        | Warehouse Movement
```

### Pharmacy

```text
Prescription      | Dispensing Order
Medication Order  | Stock Availability
```

---

# 12. Split View UX

Recommended layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Tab 1 | Tab 2 | Tab 3                                         │
├──────────────────────────────┬───────────────────────────────┤
│ LEFT DOCUMENT                │ RIGHT DOCUMENT                │
│                              │                               │
│ Patient / Invoice / PO       │ Patient / Result / Payment    │
│                              │                               │
│                              │                               │
├──────────────────────────────┴───────────────────────────────┤
│ Status / Actions / Context                                    │
└──────────────────────────────────────────────────────────────┘
```

Recommended actions:

```text
Open
Open in new tab
Open in split right
Open in split left
Swap split
Close left
Close right
Make full screen
Detach window   [Tauri only]
```

---

# 13. Limits – Do Not Hard-Code "5 Patients"

The system should **not** enforce a fixed hard-coded rule such as:

> Only five patients can be open.

Instead, define configurable workspace limits.

Example:

```ts
{
  workspaceLimits: {
    maxOpenDocuments: 12,
    maxActiveDocuments: 2,
    maxSplitPanes: 2,
    maxDetachedWindows: 4
  }
}
```

Possible scopes:

```text
Platform
Tenant
Module
Role
Device
User preference
```

Examples:

```text
Doctor desktop:
maxOpenDocuments = 10

Billing workstation:
maxOpenDocuments = 20

Tablet:
maxOpenDocuments = 4

Mobile:
maxOpenDocuments = 1
```

---

# 14. Active vs Background vs Suspended

Performance should be controlled through lifecycle states.

Example:

```text
Patient A     ACTIVE
Patient B     BACKGROUND
Patient C     BACKGROUND
Patient D     SUSPENDED
Patient E     SUSPENDED
```

Only active documents should run expensive behavior unless explicitly required.

### ACTIVE

May contain:

- live WebSocket subscriptions,
- polling,
- timers,
- heavy charts,
- autosave,
- live worklist updates.

### BACKGROUND

Should normally:

- retain UI state,
- retain unsaved form state,
- reduce refresh frequency,
- pause unnecessary animations,
- pause non-essential polling.

### SUSPENDED

Should normally:

- stop polling,
- stop subscriptions where safe,
- release heavy component resources,
- keep minimal restore metadata,
- revalidate data and authorization when resumed.

---

# 15. Performance Strategy

Recommended techniques:

- lazy-load document modules,
- do not mount every heavy page permanently,
- pause inactive polling,
- use keyed caches,
- suspend WebSocket subscriptions when not needed,
- virtualize large tables,
- memoize heavy page sections,
- free chart/map/editor resources when suspended,
- limit simultaneously active split panes,
- restore state only when needed.

Do not allow 15 open documents to behave as 15 fully active live applications.

---

# 16. Patient / Record Context Isolation

For healthcare, never use one global mutable patient variable.

Bad:

```ts
globalCurrentPatientId = "200";
```

If Patient A and Patient B are both open, this can create wrong-patient actions.

Correct design:

```text
Document A
tenantId   = TENANT01
patientId  = 100
encounterId = 5001

Document B
tenantId   = TENANT01
patientId  = 200
encounterId = 6004
```

Each document must own its own context.

Recommended context:

```ts
interface WorkspaceSecurityContext {
  tenantId: string;
  branchId?: string;

  userId: string;
  roleId?: string;

  patientId?: string;
  encounterId?: string;
  episodeId?: string;

  documentId: string;
  documentKey: string;
}
```

---

# 17. Security and HIPAA Considerations

MDI itself is **not required for HIPAA compliance**.

However, a multi-document workspace introduces additional security surfaces.

The following controls should be implemented regardless of presentation mode.

## 17.1 Authorization

Authorization must be enforced server-side on every operation.

Do not assume:

```text
Record was already open
=
user still has permission
```

Permissions can change while a record is open.

---

## 17.2 Tenant Isolation

Never reuse a document from another tenant context.

Example:

```text
Tenant A document
```

must never remain visible after:

```text
Switch to Tenant B
```

All documents must close or be revalidated.

---

## 17.3 Session Timeout

When the session locks:

```text
ALL open documents
ALL split panes
ALL detached windows
ALL previews
```

must become inaccessible or visually masked.

---

## 17.4 Logout

On logout:

- close documents,
- clear workspace state,
- clear sensitive caches,
- clear temporary drafts according to policy,
- terminate subscriptions,
- clear authentication tokens,
- prevent restoration under another user.

---

## 17.5 Workspace Restore

Do not blindly restore clinical records from a previous session.

Restore must be bound to:

```text
user
+
tenant
+
role/security context
+
authenticated session
```

Authorization must be rechecked before reloading each document.

---

## 17.6 Window / Tab Titles

Avoid unnecessary PHI in:

- browser tab titles,
- desktop taskbar,
- Tauri window titles,
- recent-document lists,
- operating system preview thumbnails.

Prefer minimal identifiers.

---

## 17.7 Local Storage

Do not store unencrypted patient data or clinical drafts in:

```text
localStorage
sessionStorage
plain desktop files
plain cache files
```

Persist only the minimum restore metadata needed.

---

## 17.8 Audit

Important record access and actions should generate centralized audit events.

Example:

```text
USER        Dr X
TENANT      TENANT01
BRANCH      AD01
PATIENT     P100
ENCOUNTER   E5001
DOCUMENT    CONSULTATION
DOCUMENT_ID W04
ACTION      VIEW / UPDATE / SIGN
RESULT      SUCCESS
TIMESTAMP   ...
SESSION     ...
DEVICE      ...
```

Do not generate useless audit noise for every mouse move or focus switch.

---

# 18. Dirty-State Management

Dirty state belongs to the document.

Example:

```text
Patient A
dirty = true

Patient B
dirty = false
```

Closing Patient A:

```text
Unsaved changes exist.
Save / Discard / Cancel
```

Switching to Patient B must never remove Patient A's dirty state.

---

# 19. Unsaved Change Handling

Recommended workflow:

```text
Close document
      ↓
dirty?
 ┌────┴────┐
 │         │
NO        YES
 │         │
Close    Prompt
          │
   ┌──────┼──────┐
   │      │      │
 Save   Discard Cancel
```

For critical clinical workflows, save behavior may need server-side draft handling rather than only client memory.

---

# 20. Inline Editing

The gap analysis identifies inline editing as one of the highest-value missing capabilities.

Example:

```text
Credit limit: 50,000
       ↓ click
Credit limit: [75,000]
       ↓ Enter
Saved
```

Use it for small safe changes, not complex forms.

Important decisions:

- validation behavior,
- optimistic concurrency,
- permission checks,
- audit,
- conflict handling.

Recommended conflict model:

```text
User A reads version 14
User B reads version 14

User A updates
→ version 15

User B updates using version 14
→ 409 CONFLICT
```

Do not silently overwrite important ERP or clinical values.

---

# 21. Shared Filter Bar

Create one generic filter framework instead of rebuilding filters per screen.

Example declaration:

```ts
{
  key: "status",
  type: "select",
  urlSafe: true
}
```

PHI-sensitive fields:

```ts
{
  key: "patientName",
  type: "search",
  urlSafe: false,
  classification: "PHI"
}
```

Do not put PHI into URLs.

Safe:

```text
/worklist?status=waiting&branch=AD01
```

Avoid:

```text
/worklist?patient=MayaThomas&mrn=AV204581
```

---

# 22. Reference Data Failure Handling

A dropdown being empty can mean:

1. no data exists,
2. the API failed.

Those are different conditions.

Recommended API:

```json
{
  "data": {
    "branches": [],
    "insuranceNetworks": []
  },
  "partial": true,
  "failures": [
    {
      "reference": "insuranceNetworks",
      "code": "REFERENCE_SERVICE_UNAVAILABLE"
    }
  ]
}
```

Recommended UI:

```text
Reference data partially unavailable.
Insurance Network failed to load.
Other lists are still available.
```

---

# 23. Error and Access-Denied States

Use centralized shared components:

```text
ErrorState
AccessDeniedState
EmptyState
LoadingState
ReferenceDataWarning
```

Every module should use the same visual and behavioral language.

---

# 24. Other Shared Components to Add

Recommended from the gap analysis:

- Inline Editing
- Error State
- Access Denied State
- Segmented Control
- Avatar
- Stat Card
- Shared Filter Bar
- Reference Data Notice

Do not prioritize without a real requirement:

- Slider
- Separate sandbox application
- Generic section wizard engine
- Classic MDI everywhere

---

# 25. Module Examples

## Healthcare

```text
Patient 360
Encounter
Consultation
Medication Chart
Lab Result
Radiology Result
Billing
Claim
```

## Finance

```text
Invoice
Purchase Order
Payment
Journal
Budget
Bank Reconciliation
```

## HR

```text
Employee
Payroll
Leave
Recruitment
Performance
```

## Supply Chain

```text
Purchase Order
Goods Receipt
Warehouse Transfer
Supplier Invoice
Stock Item
```

All use the same workspace engine.

---

# 26. User Interaction Example

User opens:

```text
Patient A
```

Workspace:

```text
TAB 1 = Patient A
```

User opens Patient B:

```text
TAB 1 = Patient A
TAB 2 = Patient B
```

User opens Patient A again:

```text
Workspace detects documentKey already open
        ↓
Focus TAB 1
```

No duplicate.

User selects:

```text
Patient B → Open in Split
```

Result:

```text
Patient A | Patient B
```

User is on Tauri and selects:

```text
Patient B → Detach
```

Result:

```text
Main window = Patient A
Detached window = Patient B
```

Same record logic, different presentation.

---

# 27. Recommended Development Phases

## Phase 1 – Workspace Core

Build:

- document model,
- document key,
- registry,
- duplicate guard,
- open/focus/close,
- dirty state,
- lifecycle state,
- security context.

---

## Phase 2 – Web Tabs

Build:

- application tab bar,
- route integration,
- tab switching,
- close,
- close others,
- restore safe metadata,
- unsaved guard.

---

## Phase 3 – Split View

Build:

- left/right panes,
- split-open,
- swap,
- resize divider,
- close pane,
- active pane indication,
- keyboard shortcuts.

---

## Phase 4 – Performance Lifecycle

Build:

- ACTIVE/BACKGROUND/SUSPENDED,
- subscription pause,
- polling pause,
- lazy mounting,
- restore/revalidation.

---

## Phase 5 – Tauri Detachable Window

Build:

- detach,
- reattach,
- multi-monitor support,
- secure window title,
- window lifecycle,
- desktop-specific persistence.

---

## Phase 6 – Optional MDI

Only if user research proves real value.

Build:

- movable child windows,
- minimize/restore,
- taskbar,
- bounds persistence,
- z-order,
- per-window dirty guard.

MDI should consume the same workspace core rather than introducing a second record-management system.

---

# 28. Recommended Defaults

## Web

```text
SINGLE = supported
TAB    = default for records
SPLIT  = supported for selected pages
WINDOW = disabled
```

## Tauri

```text
SINGLE = supported
TAB    = default
SPLIT  = supported
WINDOW = supported for selected pages
```

## Tablet

```text
SINGLE = supported
TAB    = limited
SPLIT  = optional depending on size
WINDOW = disabled
```

## Mobile

```text
SINGLE = default
TAB    = generally disabled or highly limited
SPLIT  = disabled
WINDOW = disabled
```

---

# 29. Final Architecture Decision

The recommended design is:

```text
                     ONE WORKSPACE CORE
                            │
            ┌───────────────┴───────────────┐
            │                               │
           WEB                            TAURI
            │                               │
     TAB + SPLIT                     TAB + SPLIT
     + PREVIEW                       + DETACH/WINDOW
```

The workspace core should be responsible for:

- record identity,
- duplicate prevention,
- limits,
- state isolation,
- dirty state,
- lifecycle,
- security context,
- audit integration,
- resume/revalidation,
- cross-module consistency.

Presentation should be handled by the shell.

---

# 30. Final Recommendation in One Sentence

> Build a generic **Enterprise Workspace Manager**, use **Tabs + Split View** as the default experience, allow **detachable/MDI-style windows only in Tauri and only for selected workflows**, and keep document state, security, performance, duplicate prevention, and lifecycle management centralized and independent of the presentation mode.

