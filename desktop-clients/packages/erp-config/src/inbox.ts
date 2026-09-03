/**
 * Header inbox content: the notification bell and the messages menu.
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
}

export interface MessageItem {
  id: string;
  from: string;
  initials: string;
  body: string;
  time: string;
  unread?: boolean;
}

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", kind: "warning", title: "Invoice INV-26-005184 overdue", body: "Northgate Retail • AED 184,200 due 4 days ago", time: "8m" },
  { id: "n2", kind: "info",    title: "Payroll Aug 2026 ready for approval", body: "1,284 employees • gross AED 9.7M", time: "22m" },
  { id: "n3", kind: "success", title: "Bank feed completed", body: "2,486 transactions imported and matched", time: "38m" },
  { id: "n4", kind: "danger",  title: "Payroll exception", body: "12 blocking records need attention before posting", time: "1h" },
  { id: "n5", kind: "success", title: "PO-1108 confirmed by vendor", body: "Delta Freight • expected 09 Sep", time: "3h" },
];

export const MESSAGES: MessageItem[] = [
  { id: "m1", from: "Maya Thomas",   initials: "MT", body: "Can you review the billing batch before the close?", time: "2m",  unread: true },
  { id: "m2", from: "Omar Khan",     initials: "OK", body: "Supplier exception is resolved — GRN posted.",       time: "18m", unread: true },
  { id: "m3", from: "HR Operations", initials: "HR", body: "September roster is ready for your sign-off.",        time: "1h",  unread: true },
  { id: "m4", from: "Aisha Rahman",  initials: "AR", body: "Sent the revised credit note for CUS-1042.",          time: "4h" },
];
