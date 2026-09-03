/**
 * Inbox content: the header bell and messages menu, and the two full pages
 * behind them.
 *
 * Data lives here rather than inline in the header for the same reason the page
 * registry does -- the header should render a list, not own one. `kind` maps to
 * a semantic token, so a notification is coloured by what it MEANS rather than
 * by a palette value picked at the call site.
 */
export type NotificationKind = "warning" | "danger" | "success" | "info";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Already-humanised age. Mock data has no clock behind it. */
  time: string;
  /** Unread until the user says otherwise. The header shows a count, the page
      shows which ones -- both read this, so they cannot disagree. */
  unread?: boolean;
  /** Which module raised it, for filtering on the page. The header ignores it. */
  module?: string;
  /** The record this is ABOUT. A notification you cannot act on is a nag, so
      every item that has a destination names it and both surfaces link there. */
  target?: { pageId: string; recordId?: string };
  /** Longer text, shown only on the page. The dropdown has no room for it. */
  detail?: string;
}

export interface MessageItem {
  id: string;
  from: string;
  initials: string;
  body: string;
  time: string;
  unread?: boolean;
  /** Sender's role, so a name without context still means something. */
  role?: string;
  target?: { pageId: string; recordId?: string };
  /** The full message. `body` stays the one-line preview the dropdown shows. */
  detail?: string;
}

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", kind: "warning", title: "Invoice INV-26-005184 overdue", body: "Northgate Retail • AED 184,200 due 4 days ago", time: "8m", unread: true, module: "finance",
    target: { pageId: "billing-worklist" },
    detail: "Payment terms were Net 30 from 02 Aug 2026. Two reminders have been sent and the account is 4 days past due. Credit exposure is now AED 184,200 against a limit of AED 500,000." },
  { id: "n2", kind: "info", title: "Payroll Aug 2026 ready for approval", body: "1,284 employees • gross AED 9.7M", time: "22m", unread: true, module: "payroll",
    target: { pageId: "payroll-run" },
    detail: "The August run has completed validation with no blocking exceptions. Approval is required before the 25th to meet the bank submission window." },
  { id: "n3", kind: "success", title: "Bank feed completed", body: "2,486 transactions imported and matched", time: "38m", unread: true, module: "finance",
    target: { pageId: "bank-reconciliation" },
    detail: "2,486 of 2,491 lines matched automatically. Five require manual attention and have been queued for reconciliation." },
  { id: "n4", kind: "danger", title: "Payroll exception", body: "12 blocking records need attention before posting", time: "1h", unread: true, module: "payroll",
    target: { pageId: "payroll-exceptions" },
    detail: "Twelve employees have incomplete bank details or expired work permits. Posting is blocked until each is resolved or explicitly excluded from the run." },
  { id: "n5", kind: "success", title: "PO-1108 confirmed by vendor", body: "Delta Freight • expected 09 Sep", time: "3h", unread: true, module: "supply",
    target: { pageId: "purchase-order" },
    detail: "Delta Freight acknowledged PO-1108 in full. Expected delivery 09 Sep 2026 to the Jebel Ali warehouse." },
  { id: "n6", kind: "warning", title: "Credit limit reached", body: "Bluecrest Retail • AED 612,400 outstanding", time: "5h", module: "finance",
    target: { pageId: "customer-master" },
    detail: "Outstanding has passed the approved limit. New orders will be held for credit review until the balance is brought down or the limit is raised." },
  { id: "n7", kind: "info", title: "Quarter-end close opens Monday", body: "Finance • Q3 2026", time: "1d", module: "finance",
    detail: "The close calendar has been published. Sub-ledger cut-off is 18:00 on the last working day; journals after that fall into Q4." },
  { id: "n8", kind: "success", title: "Stock count variance cleared", body: "Jebel Ali • 3 SKUs adjusted", time: "1d", module: "supply",
    target: { pageId: "stock-count" },
    detail: "Three SKUs were adjusted against the cycle count. Net inventory impact AED 1,840, posted to the variance account." },
  { id: "n9", kind: "info", title: "New starter onboarding due", body: "4 employees start Monday", time: "2d", module: "hr",
    target: { pageId: "employee-master" },
    detail: "Four employees begin on 07 Sep. Equipment, access and induction bookings are outstanding for two of them." },
  { id: "n10", kind: "danger", title: "Supplier certificate expired", body: "Falcon Industrial • ISO 9001 lapsed", time: "3d", module: "supply",
    target: { pageId: "supplier-master" },
    detail: "The certificate on file expired on 31 Aug 2026. Purchasing from this supplier is restricted until a current certificate is uploaded." },
];

export const MESSAGES: MessageItem[] = [
  { id: "m1", from: "Maya Thomas", initials: "MT", role: "Credit Controller", body: "Can you review the billing batch before the close?", time: "2m", unread: true,
    target: { pageId: "billing-worklist" },
    detail: "The August batch is ready but three invoices are held on credit review. If you can clear those this morning I can release the whole batch before the cut-off." },
  { id: "m2", from: "Omar Khan", initials: "OK", role: "Operations Analyst", body: "Supplier exception is resolved — GRN posted.", time: "18m", unread: true,
    target: { pageId: "goods-receipt" },
    detail: "The quantity mismatch on PO-1094 was a packing error, not a short delivery. Delta sent the corrected note and I have posted the GRN in full." },
  { id: "m3", from: "HR Operations", initials: "HR", role: "Shared service", body: "September roster is ready for your sign-off.", time: "1h", unread: true,
    target: { pageId: "shift-roster" },
    detail: "Coverage is complete for all sites except Sharjah nights, which is one short on the 14th and 15th. Approving as-is is fine; we will fill from the bank." },
  { id: "m4", from: "Aisha Rahman", initials: "AR", role: "Finance Operations", body: "Sent the revised credit note for CUS-1042.", time: "4h",
    target: { pageId: "credit-note" },
    detail: "Reissued against the correct tax code. The original has been cancelled, so only the revised note should reach the customer." },
  { id: "m5", from: "Leena George", initials: "LG", role: "Account Manager", body: "Atlas Horizon want to discuss their limit.", time: "6h",
    target: { pageId: "customer-master" },
    detail: "They are asking for an increase to AED 750,000 ahead of a large Q4 order. Their payment history is clean; happy to put together the case if you want it." },
  { id: "m6", from: "Ibrahim Noor", initials: "IN", role: "Warehouse Lead", body: "Cycle count finished at Jebel Ali.", time: "1d",
    target: { pageId: "stock-count" },
    detail: "Three variances, all small and all explained. Sheets are signed and attached to the count record." },
  { id: "m7", from: "Payroll Desk", initials: "PD", role: "Shared service", body: "August payslips published to the portal.", time: "2d",
    detail: "All 1,284 payslips are live. Two employees have bounced email addresses; HR has been asked to correct them." },
];
