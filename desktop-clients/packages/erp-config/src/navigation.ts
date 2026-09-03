import {
  Activity,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  ContactRound,
  CreditCard,
  FileChartColumn,
  FileCog,
  FileSpreadsheet,
  FileText,
  Gauge,
  Gavel,
  HandCoins,
  IdCard,
  Landmark,
  Languages,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  MapPinned,
  NotebookTabs,
  PackageCheck,
  PackageOpen,
  PanelTop,
  Percent,
  ReceiptText,
  RefreshCw,
  Scale,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  TableProperties,
  Tags,
  Truck,
  Undo2,
  UserCog,
  UserRoundCheck,
  UsersRound,
  UserSquare2,
  WalletCards,
  Warehouse,
} from "lucide-react";
import type { ModuleDefinition, ModuleKey, PageAiConfig, PageDefinition, PageKind } from "./types";

export const MODULES: Record<ModuleKey, ModuleDefinition> = {
  hr: {
    id: "hr",
    label: "Human Resources",
    shortLabel: "HR",
    description: "People, organization, attendance, leave and talent operations",
    accent: "#6d5ce7",
    icon: UsersRound,
    navigation: [
      { id: "hr-overview", label: "Overview", items: [{ id: "hr-dashboard", label: "HR Dashboard", icon: LayoutDashboard, pageId: "hr-dashboard" }] },
      {
        id: "hr-masters", label: "Masters", items: [
          { id: "identity", label: "Identity & Access", icon: ShieldCheck, children: [
            { id: "user-master", label: "User Master", icon: UserCog, pageId: "user-master" },
            { id: "role-master", label: "Role & Permission", icon: IdCard, pageId: "role-master" },
            { id: "delegation-master", label: "Delegation Rules", icon: UserRoundCheck, pageId: "delegation-master" },
          ] },
          { id: "people", label: "People", icon: ContactRound, children: [
            { id: "employee-master", label: "Employee Master", pageId: "employee-master" },
            { id: "contractor-master", label: "Contractor Master", pageId: "contractor-master" },
            { id: "position-master", label: "Position Master", pageId: "position-master" },
          ] },
          { id: "organization", label: "Organization", icon: Building2, children: [
            { id: "department-master", label: "Department Master", pageId: "department-master" },
            { id: "grade-master", label: "Grade & Band", pageId: "grade-master" },
            { id: "location-master", label: "Location Master", pageId: "location-master" },
          ] },
        ]
      },
      {
        id: "hr-transactions", label: "Transactions", items: [
          { id: "workforce", label: "Workforce Events", icon: BriefcaseBusiness, children: [
            { id: "onboarding", label: "Employee Onboarding", pageId: "employee-onboarding" },
            { id: "transfer", label: "Transfer & Promotion", pageId: "employee-transfer" },
            { id: "separation", label: "Separation", pageId: "employee-separation" },
          ] },
          { id: "time", label: "Time & Leave", icon: CalendarClock, children: [
            { id: "leave-request", label: "Leave Request", pageId: "leave-request" },
            { id: "attendance-adjustment", label: "Attendance Adjustment", pageId: "attendance-adjustment" },
            { id: "shift-roster", label: "Shift Roster", pageId: "shift-roster" },
          ] },
        ]
      },
      {
        id: "hr-worklists", label: "Worklists", items: [
          { id: "hr-ops", label: "Operations", icon: ClipboardList, children: [
            { id: "employee-worklist", label: "Employee Worklist", pageId: "employee-worklist" },
            { id: "approval-worklist", label: "Approval Worklist", pageId: "approval-worklist" },
            { id: "attendance-anomalies", label: "Attendance Anomalies", pageId: "attendance-anomalies" },
          ] },
        ]
      },
      {
        id: "hr-reports", label: "Reports", items: [
          { id: "hr-analytics", label: "Analytics", icon: BarChart3, children: [
            { id: "workforce-report", label: "Workforce Analytics", pageId: "workforce-report" },
            { id: "attendance-report", label: "Attendance Report", pageId: "attendance-report" },
            { id: "compliance-report", label: "Compliance Register", pageId: "compliance-report" },
          ] },
        ]
      },
      {
        id: "hr-config", label: "Configuration", items: [
          { id: "hr-settings", label: "HR Setup", icon: Settings2, children: [
            { id: "hr-policy", label: "Policy Designer", pageId: "hr-policy" },
            { id: "hr-numbering", label: "Numbering Rules", pageId: "hr-numbering" },
            { id: "hr-workflow", label: "Approval Workflow", pageId: "hr-workflow" },
          ] },
        ]
      },
    ],
  },
  finance: {
    id: "finance",
    label: "Finance & Accounting",
    shortLabel: "Finance",
    description: "Billing, ledger, receivables, payables, taxation and financial control",
    accent: "#0f8b6d",
    icon: Landmark,
    navigation: [
      { id: "fin-overview", label: "Overview", items: [{ id: "finance-dashboard", label: "Finance Dashboard", icon: LayoutDashboard, pageId: "finance-dashboard" }] },
      { id: "fin-masters", label: "Masters", items: [
        { id: "fin-parties", label: "Parties", icon: ContactRound, children: [
          { id: "customer-master", label: "Customer Master", pageId: "customer-master" },
          { id: "supplier-fin-master", label: "Supplier Master", pageId: "supplier-fin-master" },
          { id: "credit-profile", label: "Credit Profile", pageId: "credit-profile" },
        ] },
        { id: "fin-accounting", label: "Accounting", icon: Scale, children: [
          { id: "chart-account", label: "Chart of Accounts", pageId: "chart-account" },
          { id: "cost-center", label: "Cost Center", pageId: "cost-center" },
          { id: "bank-master", label: "Bank & Cash", pageId: "bank-master" },
        ] },
        { id: "fin-tax", label: "Tax & Jurisdiction", icon: Gavel, children: [
          { id: "tax-master", label: "Taxation Master", pageId: "tax-master" },
          { id: "jurisdiction-master", label: "Jurisdiction Master", pageId: "jurisdiction-master" },
          { id: "fiscal-period", label: "Fiscal Period", pageId: "fiscal-period" },
        ] },
      ] },
      { id: "fin-transactions", label: "Transactions", items: [
        { id: "billing", label: "Billing & Receipts", icon: ReceiptText, children: [
          { id: "billing-entry", label: "Billing Entry", pageId: "billing-entry" },
          { id: "credit-note", label: "Credit Note", pageId: "credit-note" },
          { id: "receipt-entry", label: "Receipt Entry", pageId: "receipt-entry" },
        ] },
        { id: "ledger", label: "General Ledger", icon: NotebookTabs, children: [
          { id: "journal-entry", label: "Journal Entry", pageId: "journal-entry" },
          { id: "expense-entry", label: "Expense Entry", pageId: "expense-entry" },
          { id: "bank-reconciliation", label: "Bank Reconciliation", pageId: "bank-reconciliation" },
        ] },
      ] },
      { id: "fin-worklists", label: "Worklists", items: [
        { id: "fin-queues", label: "Finance Queues", icon: ClipboardCheck, children: [
          { id: "billing-worklist", label: "Billing Worklist", pageId: "billing-worklist" },
          { id: "receivables-worklist", label: "Receivables Worklist", pageId: "receivables-worklist" },
          { id: "journal-review", label: "Journal Review", pageId: "journal-review" },
        ] },
      ] },
      { id: "fin-reports", label: "Reports", items: [
        { id: "fin-statements", label: "Financial Statements", icon: FileChartColumn, children: [
          { id: "profit-loss", label: "Profit & Loss", pageId: "profit-loss-report" },
          { id: "balance-sheet", label: "Balance Sheet", pageId: "balance-sheet-report" },
          { id: "ar-aging", label: "AR Aging", pageId: "ar-aging-report" },
          { id: "tax-return", label: "Tax Return", pageId: "tax-return-report" },
        ] },
      ] },
      { id: "fin-config", label: "Configuration", items: [
        { id: "fin-setup", label: "Finance Setup", icon: Settings2, children: [
          { id: "currency-config", label: "Currencies & Rates", pageId: "currency-config" },
          { id: "posting-rules", label: "Posting Rules", pageId: "posting-rules" },
          { id: "fin-approvals", label: "Approval Matrix", pageId: "fin-approvals" },
        ] },
      ] },
    ],
  },
  payroll: {
    id: "payroll",
    label: "Payroll",
    shortLabel: "Payroll",
    description: "Earnings, deductions, payroll processing, settlements and statutory outputs",
    accent: "#db6a2b",
    icon: Banknote,
    navigation: [
      { id: "pay-overview", label: "Overview", items: [{ id: "payroll-dashboard", label: "Payroll Dashboard", icon: LayoutDashboard, pageId: "payroll-dashboard" }] },
      { id: "pay-masters", label: "Masters", items: [
        { id: "pay-structure", label: "Pay Structure", icon: WalletCards, children: [
          { id: "earning-master", label: "Earning Master", pageId: "earning-master" },
          { id: "deduction-master", label: "Deduction Master", pageId: "deduction-master" },
          { id: "pay-group", label: "Pay Group", pageId: "pay-group" },
        ] },
        { id: "pay-compliance", label: "Statutory", icon: ShieldCheck, children: [
          { id: "statutory-master", label: "Statutory Rule", pageId: "statutory-master" },
          { id: "bank-format", label: "Bank File Format", pageId: "bank-format" },
          { id: "benefit-plan", label: "Benefit Plan", pageId: "benefit-plan" },
        ] },
      ] },
      { id: "pay-transactions", label: "Transactions", items: [
        { id: "pay-processing", label: "Processing", icon: Calculator, children: [
          { id: "payroll-run", label: "Payroll Run", pageId: "payroll-run" },
          { id: "payroll-adjustment", label: "Payroll Adjustment", pageId: "payroll-adjustment" },
          { id: "final-settlement", label: "Final Settlement", pageId: "final-settlement" },
        ] },
      ] },
      { id: "pay-worklists", label: "Worklists", items: [
        { id: "pay-queues", label: "Payroll Queues", icon: ListChecks, children: [
          { id: "payroll-worklist", label: "Payroll Worklist", pageId: "payroll-worklist" },
          { id: "exception-worklist", label: "Exception Worklist", pageId: "exception-worklist" },
          { id: "settlement-review", label: "Settlement Review", pageId: "settlement-review" },
        ] },
      ] },
      { id: "pay-reports", label: "Reports", items: [
        { id: "pay-outputs", label: "Payroll Outputs", icon: FileText, children: [
          { id: "pay-register", label: "Payroll Register", pageId: "pay-register-report" },
          { id: "payslip-report", label: "Payslip Distribution", pageId: "payslip-report" },
          { id: "statutory-report", label: "Statutory Report", pageId: "statutory-report" },
        ] },
      ] },
      { id: "pay-config", label: "Configuration", items: [
        { id: "pay-settings", label: "Payroll Setup", icon: Settings2, children: [
          { id: "pay-calendar", label: "Payroll Calendar", pageId: "pay-calendar" },
          { id: "pay-formula", label: "Formula Designer", pageId: "pay-formula" },
          { id: "pay-approval", label: "Approval Workflow", pageId: "pay-approval" },
        ] },
      ] },
    ],
  },
  sales: {
    id: "sales",
    label: "Sales & CRM",
    shortLabel: "Sales",
    description: "Leads, customers, quotations, orders, invoices and revenue operations",
    accent: "#2563eb",
    icon: ShoppingBag,
    navigation: [
      { id: "sales-overview", label: "Overview", items: [{ id: "sales-dashboard", label: "Sales Dashboard", icon: LayoutDashboard, pageId: "sales-dashboard" }] },
      { id: "sales-masters", label: "Masters", items: [
        { id: "sales-market", label: "Market", icon: MapPinned, children: [
          { id: "sales-customer", label: "Customer Master", pageId: "sales-customer" },
          { id: "territory-master", label: "Territory Master", pageId: "territory-master" },
          { id: "sales-channel", label: "Sales Channel", pageId: "sales-channel" },
        ] },
        { id: "sales-catalog", label: "Catalog", icon: Tags, children: [
          { id: "product-master", label: "Product Master", pageId: "product-master" },
          { id: "price-list", label: "Price List", pageId: "price-list" },
          { id: "discount-rule", label: "Discount Rule", pageId: "discount-rule" },
        ] },
      ] },
      { id: "sales-transactions", label: "Transactions", items: [
        { id: "sales-cycle", label: "Sales Cycle", icon: ShoppingCart, children: [
          { id: "quotation", label: "Quotation", pageId: "quotation" },
          { id: "sales-order", label: "Sales Order", pageId: "sales-order" },
          { id: "sales-invoice", label: "Sales Invoice", pageId: "sales-invoice" },
          { id: "sales-return", label: "Sales Return", pageId: "sales-return" },
        ] },
      ] },
      { id: "sales-worklists", label: "Worklists", items: [
        { id: "sales-queues", label: "Sales Queues", icon: ClipboardList, children: [
          { id: "customer-worklist", label: "Customer Worklist", pageId: "customer-worklist" },
          { id: "order-worklist", label: "Order Worklist", pageId: "order-worklist" },
          { id: "fulfillment-worklist", label: "Fulfillment Worklist", pageId: "fulfillment-worklist" },
        ] },
      ] },
      { id: "sales-reports", label: "Reports", items: [
        { id: "sales-insights", label: "Sales Insights", icon: ChartNoAxesCombined, children: [
          { id: "pipeline-report", label: "Pipeline Report", pageId: "pipeline-report" },
          { id: "revenue-report", label: "Revenue Report", pageId: "revenue-report" },
          { id: "margin-report", label: "Margin Analysis", pageId: "margin-report" },
        ] },
      ] },
      { id: "sales-config", label: "Configuration", items: [
        { id: "sales-settings", label: "Sales Setup", icon: Settings2, children: [
          { id: "sales-numbering", label: "Document Numbering", pageId: "sales-numbering" },
          { id: "sales-approval", label: "Approval Rules", pageId: "sales-approval" },
          { id: "sales-targets", label: "Target Setup", pageId: "sales-targets" },
        ] },
      ] },
    ],
  },
  supply: {
    id: "supply",
    label: "Supply Chain",
    shortLabel: "Supply",
    description: "Procurement, inventory, warehouses, logistics and supplier collaboration",
    accent: "#b7791f",
    icon: Truck,
    navigation: [
      { id: "supply-overview", label: "Overview", items: [{ id: "supply-dashboard", label: "Supply Chain Dashboard", icon: LayoutDashboard, pageId: "supply-dashboard" }] },
      { id: "supply-masters", label: "Masters", items: [
        { id: "supply-partners", label: "Partners", icon: Store, children: [
          { id: "supplier-master", label: "Supplier Master", pageId: "supplier-master" },
          { id: "carrier-master", label: "Carrier Master", pageId: "carrier-master" },
          { id: "supplier-contract", label: "Supplier Contract", pageId: "supplier-contract" },
        ] },
        { id: "inventory", label: "Inventory", icon: Boxes, children: [
          { id: "item-master", label: "Item Master", pageId: "item-master" },
          { id: "warehouse-master", label: "Warehouse Master", pageId: "warehouse-master" },
          { id: "uom-master", label: "Unit of Measure", pageId: "uom-master" },
        ] },
      ] },
      { id: "supply-transactions", label: "Transactions", items: [
        { id: "procurement", label: "Procurement", icon: PackageOpen, children: [
          { id: "purchase-requisition", label: "Purchase Requisition", pageId: "purchase-requisition" },
          { id: "purchase-order", label: "Purchase Order", pageId: "purchase-order" },
          { id: "goods-receipt", label: "Goods Receipt", pageId: "goods-receipt" },
        ] },
        { id: "stock", label: "Stock Operations", icon: RefreshCw, children: [
          { id: "stock-transfer", label: "Stock Transfer", pageId: "stock-transfer" },
          { id: "inventory-count", label: "Inventory Count", pageId: "inventory-count" },
          { id: "stock-adjustment", label: "Stock Adjustment", pageId: "stock-adjustment" },
        ] },
      ] },
      { id: "supply-worklists", label: "Worklists", items: [
        { id: "supply-queues", label: "Supply Queues", icon: PackageCheck, children: [
          { id: "procurement-worklist", label: "Procurement Worklist", pageId: "procurement-worklist" },
          { id: "receiving-worklist", label: "Receiving Worklist", pageId: "receiving-worklist" },
          { id: "reorder-worklist", label: "Reorder Worklist", pageId: "reorder-worklist" },
        ] },
      ] },
      { id: "supply-reports", label: "Reports", items: [
        { id: "supply-insights", label: "Supply Insights", icon: BarChart3, children: [
          { id: "inventory-valuation", label: "Inventory Valuation", pageId: "inventory-valuation-report" },
          { id: "supplier-performance", label: "Supplier Performance", pageId: "supplier-performance-report" },
          { id: "stock-aging", label: "Stock Aging", pageId: "stock-aging-report" },
        ] },
      ] },
      { id: "supply-config", label: "Configuration", items: [
        { id: "supply-settings", label: "Supply Setup", icon: Settings2, children: [
          { id: "reorder-rules", label: "Reorder Rules", pageId: "reorder-rules" },
          { id: "procurement-approval", label: "Approval Matrix", pageId: "procurement-approval" },
          { id: "valuation-method", label: "Valuation Method", pageId: "valuation-method" },
        ] },
      ] },
    ],
  },
  library: {
    id: "library",
    label: "Developer Library",
    shortLabel: "Library",
    description: "Components, patterns, schemas, tokens, contracts and implementation guidance",
    accent: "#7c3aed",
    icon: LibraryBig,
    navigation: [
      { id: "lib-overview", label: "Overview", items: [{ id: "library-dashboard", label: "Library Dashboard", icon: Gauge, pageId: "library-dashboard" }] },
      { id: "lib-components", label: "Components", items: [
        { id: "ui-primitives", label: "UI Primitives", icon: Sparkles, children: [
          { id: "component-library", label: "Component Gallery", pageId: "component-library" },
          { id: "form-controls", label: "Form Controls", pageId: "form-controls" },
          { id: "feedback-components", label: "Feedback & Overlays", pageId: "feedback-components" },
        ] },
        { id: "composition", label: "Compositions", icon: PanelTop, children: [
          { id: "form-patterns", label: "Form Patterns", pageId: "form-patterns" },
          { id: "data-patterns", label: "Data Worklists", pageId: "data-patterns" },
          { id: "billing-patterns", label: "Billing Workspace", pageId: "billing-patterns" },
        ] },
      ] },
      { id: "lib-tools", label: "Utilities", items: [
        { id: "workspace-tools", label: "Workspace Tools", icon: FileSpreadsheet, children: [
          { id: "spreadsheet-studio", label: "Spreadsheet Studio", pageId: "spreadsheet-studio" },
          { id: "import-export", label: "Import & Export", pageId: "import-export" },
          { id: "bulk-operations", label: "Bulk Operations", pageId: "bulk-operations" },
        ] },
      ] },
      { id: "lib-design", label: "Design System", items: [
        { id: "design-tokens", label: "Design Tokens", icon: SlidersHorizontal, children: [
          { id: "theme-studio", label: "Theme Studio", pageId: "theme-studio" },
          { id: "localization", label: "Localization", icon: Languages, pageId: "localization" },
          { id: "accessibility", label: "Accessibility", pageId: "accessibility" },
        ] },
      ] },
      { id: "lib-docs", label: "Documentation", items: [
        { id: "engineering", label: "Engineering", icon: BookOpen, children: [
          { id: "page-catalog", label: "Page Catalog", pageId: "page-catalog" },
          { id: "component-contracts", label: "Component Contracts", pageId: "component-contracts" },
          { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", pageId: "keyboard-shortcuts" },
          { id: "integration-guide", label: "Integration Guide", pageId: "integration-guide" },
        ] },
      ] },
      { id: "lib-settings", label: "Configuration", items: [
        { id: "personalization", label: "Personalization", icon: FileCog, children: [
          { id: "preferences", label: "My Preferences", pageId: "preferences" },
          { id: "saved-views", label: "Saved Views", pageId: "saved-views" },
          { id: "shortcut-manager", label: "Shortcut Manager", pageId: "shortcut-manager" },
        ] },
        { id: "ai-assistant", label: "AI Assistant", icon: Sparkles, children: [
          { id: "ai-administration", label: "AI Administration", pageId: "ai-administration" },
        ] },
      ] },
    ],
  },
};

const explicitPages: Record<string, Partial<PageDefinition>> = {
  "hr-dashboard": { kind: "dashboard", title: "HR Command Center" },
  "finance-dashboard": { kind: "dashboard", title: "Finance Command Center" },
  "payroll-dashboard": { kind: "dashboard", title: "Payroll Command Center" },
  "sales-dashboard": { kind: "dashboard", title: "Sales Command Center" },
  "supply-dashboard": { kind: "dashboard", title: "Supply Chain Command Center" },
  "library-dashboard": { kind: "dashboard", title: "Developer Library" },
  "user-master": { kind: "form", entity: "user", title: "User Master" },
  /* These two name their own use cases; every other page now falls back to
     defaultAiFor(kind). They are kept explicit because their sets were chosen
     for the page rather than derived from its kind. */
  "customer-master": { kind: "worklist", entity: "customer", title: "Customer Master",
    ai: { enabled: true, useCases: ["worklist.summarise-selection", "record.explain"] } },
  "sales-customer": { kind: "worklist", entity: "customer", title: "Customer Master" },
  "billing-entry": { kind: "billing", entity: "invoice", title: "Billing Entry",
    ai: { enabled: true, useCases: ["form.draft-note"] } },
  "sales-invoice": { kind: "billing", entity: "invoice", title: "Sales Invoice" },
  "billing-worklist": { kind: "worklist", entity: "invoice", title: "Billing Worklist" },
  "profit-loss-report": { kind: "reports", title: "Profit & Loss" },
  "balance-sheet-report": { kind: "reports", title: "Balance Sheet" },
  "ar-aging-report": { kind: "reports", title: "Accounts Receivable Aging" },
  "tax-return-report": { kind: "reports", title: "Tax Return" },
  "workforce-report": { kind: "reports", title: "Workforce Analytics" },
  "attendance-report": { kind: "reports", title: "Attendance Report" },
  "compliance-report": { kind: "reports", title: "Compliance Register" },
  "pay-register-report": { kind: "reports", title: "Payroll Register" },
  "payslip-report": { kind: "reports", title: "Payslip Distribution" },
  "statutory-report": { kind: "reports", title: "Statutory Report" },
  "pipeline-report": { kind: "reports", title: "Sales Pipeline" },
  "revenue-report": { kind: "reports", title: "Revenue Analysis" },
  "margin-report": { kind: "reports", title: "Margin Analysis" },
  "inventory-valuation-report": { kind: "reports", title: "Inventory Valuation" },
  "supplier-performance-report": { kind: "reports", title: "Supplier Performance" },
  "stock-aging-report": { kind: "reports", title: "Stock Aging" },
  "preferences": { kind: "preferences", title: "My Preferences" },
  /* The assistant is explicitly OFF on the screen that configures it. Not
     because the config carries a secret -- it does not -- but because an
     assistant offering to explain the page where you revoke it reads as a
     joke in a demo and as a finding in an audit. It is also the live proof
     that an explicit block still beats defaultAiFor. */
  "ai-administration": { kind: "ai-admin", entity: "ai", title: "AI Administration", subtitle: "Provider, credential, limits and prompts for this tenant's assistant.", ai: { enabled: false, useCases: [] } },
  "spreadsheet-studio": { kind: "spreadsheet", title: "Spreadsheet Studio" },
  "component-library": { kind: "library", title: "Component Gallery" },
  "form-controls": { kind: "library", title: "Form Controls" },
  "feedback-components": { kind: "library", title: "Feedback & Overlays" },
  "form-patterns": { kind: "library", title: "Form Patterns" },
  "data-patterns": { kind: "library", title: "Data Worklists" },
  "billing-patterns": { kind: "library", title: "Billing Workspace" },
  "theme-studio": { kind: "library", title: "Theme Studio" },
  "localization": { kind: "library", title: "Localization" },
  "accessibility": { kind: "library", title: "Accessibility" },
  "page-catalog": { kind: "library", title: "Page Catalog" },
  "component-contracts": { kind: "library", title: "Component Contracts" },
  "keyboard-shortcuts": { kind: "library", title: "Keyboard Shortcuts" },
  "integration-guide": { kind: "library", title: "Integration Guide" },
};

function flattenPages() {
  const pages: Array<{ pageId: string; label: string; module: ModuleKey }> = [];
  Object.values(MODULES).forEach((module) => {
    module.navigation.forEach((section) => section.items.forEach((item) => {
      if (item.pageId) pages.push({ pageId: item.pageId, label: item.label, module: module.id });
      item.children?.forEach((child) => {
        if (child.pageId) pages.push({ pageId: child.pageId, label: child.label, module: module.id });
      });
    }));
  });
  return pages;
}

/**
 * The use cases a page offers when it does not name its own.
 *
 * Keyed by kind rather than given to every page, because the use case is the
 * allowlist: offering `form.draft-note` on a dashboard would put a control on
 * screen that can only ever assemble an empty context. What a kind cannot feed
 * it does not advertise.
 */
function defaultAiFor(kind: PageKind): PageAiConfig {
  switch (kind) {
    case "form":
    case "billing":
      return { enabled: true, useCases: ["form.draft-note", "record.explain"] };
    case "dashboard":
    case "library":
    case "preferences":
      return { enabled: true, useCases: ["record.explain"] };
    case "reports":
    case "spreadsheet":
      return { enabled: true, useCases: ["worklist.summarise-selection"] };
    /* Nothing here offers the assistant, and the explicit block on the page
       means this arm is unreachable today. It is written anyway so a second
       ai-admin page cannot inherit the worklist default by omission. */
    case "ai-admin":
      return { enabled: false, useCases: [] };
    case "worklist":
    default:
      return { enabled: true, useCases: ["worklist.summarise-selection", "record.explain"] };
  }
}

export const PAGE_REGISTRY: Record<string, PageDefinition> = Object.fromEntries(
  flattenPages().map(({ pageId, label, module }) => {
    const explicit = explicitPages[pageId] ?? {};
    const inferredKind = pageId.includes("report") ? "reports" : pageId.includes("dashboard") ? "dashboard" : "worklist";
    const title = explicit.title ?? label;
    return [pageId, {
      id: pageId,
      title,
      /* An explicit subtitle wins. The generic line below is written for pages
         that hold RECORDS, and reads as nonsense on anything else -- "manage ai
         administration records with saved views" described a screen that has
         neither records nor saved views. */
      subtitle: explicit.subtitle ?? (explicit.kind === "dashboard"
        ? MODULES[module].description
        : `Search, review and manage ${title.toLowerCase()} records with saved views and configurable actions.`),
      kind: explicit.kind ?? inferredKind,
      module,
      entity: explicit.entity ?? pageId.replace(/-(master|worklist|report|entry|config|review|setup)$/g, ""),
      /* Gate 1, now on for every page by default.
         This USED to carry `ai` through only when explicitPages declared it,
         so a page with no block was off at gate 1. That default was reversed
         deliberately (requested: the assistant should be reachable everywhere
         the help button is), and the honest consequence is that gate 1 no
         longer stops anything -- it hands the decision to the module/page
         policy the server owns, which is the layer that can be changed without
         a client release. An explicit block still wins, INCLUDING an explicit
         `{ enabled: false }`, so a page can still opt out at build time. */
      ai: explicit.ai ?? defaultAiFor(explicit.kind ?? inferredKind),
    } satisfies PageDefinition];
  })
);

export const BRANCHES = [
  { value: "hq", label: "Abu Dhabi • Head Office" },
  { value: "dubai", label: "Dubai • Business Center" },
  { value: "sharjah", label: "Sharjah • Operations Hub" },
  { value: "india", label: "Kochi • Delivery Center" },
];

export const ROLES = [
  { value: "enterprise-admin", label: "Enterprise Administrator" },
  { value: "finance-manager", label: "Finance Manager" },
  { value: "hr-business-partner", label: "HR Business Partner" },
  { value: "operations-analyst", label: "Operations Analyst" },
  { value: "auditor", label: "Internal Auditor" },
];

export const HEADER_QUICK_PAGES = [
  { id: "journal-entry", label: "New journal", icon: CircleDollarSign },
  { id: "billing-entry", label: "New invoice", icon: BadgeDollarSign },
  { id: "employee-master", label: "New employee", icon: UserSquare2 },
  { id: "spreadsheet-studio", label: "Open spreadsheet", icon: TableProperties },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "customer-master", label: "Undo navigation", icon: Undo2 },
  { id: "billing-worklist", label: "Payment queue", icon: CreditCard },
  { id: "payroll-run", label: "Payroll run", icon: HandCoins },
  { id: "activity", label: "Activity", icon: Activity },
];
