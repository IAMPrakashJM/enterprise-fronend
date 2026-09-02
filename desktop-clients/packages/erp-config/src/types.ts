import type { LucideIcon } from "lucide-react";

export type ModuleKey = "hr" | "finance" | "payroll" | "sales" | "supply" | "library";
export type ThemeKey = "nexora" | "midnight" | "emerald" | "sand" | "rose" | "slate" | "contrast";
export type FormNavigation = "rail" | "tabs" | "wizard";
export type ResultView = "table" | "cards";
export type PreviewMode = "center-card" | "center-modal" | "left-drawer" | "right-drawer";
export type SidebarPlacement = "left" | "right";
export type Density = "compact" | "comfortable" | "spacious";
export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
export type BillingLayout = "workspace" | "vertical" | "split";
export type LanguageKey = "en" | "ar" | "hi" | "ml";
export type PageKind = "dashboard" | "worklist" | "form" | "billing" | "reports" | "preferences" | "spreadsheet" | "library";
export type FieldType = "text" | "email" | "phone" | "number" | "date" | "select" | "multiselect" | "textarea" | "toggle";

export interface UserPreferences {
  theme: ThemeKey;
  formNavigation: FormNavigation;
  resultView: ResultView;
  previewMode: PreviewMode;
  sidebarPlacement: SidebarPlacement;
  sidebarPinned: boolean;
  density: Density;
  pageSize: 20 | 50 | 100;
  fontFamily: "inter" | "manrope" | "system" | "mono";
  fontSize: "sm" | "md" | "lg";
  toastPosition: ToastPosition;
  toastDuration: 2000 | 3500 | 5000 | 8000;
  toastTone: "adaptive" | "brand" | "neutral";
  helperEnabled: boolean;
  documentationEnabled: boolean;
  reducedMotion: boolean;
  language: LanguageKey;
  billingLayout: BillingLayout;
  globalSearchMode: "contains" | "starts-with" | "smart";
  rememberFilters: boolean;
  openRecordsInTabs: boolean;
  showKeyboardHints: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  pageId?: string;
  badge?: string;
  children?: MenuItem[];
}

export interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
}

export interface ModuleDefinition {
  id: ModuleKey;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  icon: LucideIcon;
  navigation: MenuSection[];
}

export interface PageDefinition {
  id: string;
  title: string;
  subtitle: string;
  kind: PageKind;
  module: ModuleKey | "shared";
  entity?: string;
  icon?: LucideIcon;
}

export interface FormOption {
  label: string;
  value: string;
}

export interface FormFieldSchema {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: FormOption[];
  colSpan?: 1 | 2;
  help?: string;
  prefix?: string;
  suffix?: string;
  defaultValue?: string | number | boolean | string[];
}

export interface FormSectionSchema {
  id: string;
  title: string;
  description: string;
  fields: FormFieldSchema[];
}

export interface EntitySchema {
  id: string;
  singular: string;
  plural: string;
  description: string;
  sections: FormSectionSchema[];
}

export interface DataColumn {
  key: string;
  label: string;
  type?: "text" | "money" | "date" | "status" | "number" | "percent";
  width?: number;
  sortable?: boolean;
  defaultVisible?: boolean;
}

export interface WorklistConfig {
  id: string;
  entity: string;
  title: string;
  description: string;
  basicFilters: Array<{ key: string; label: string; type: "text" | "select" | "date"; options?: string[] }>;
  advancedFilters: Array<{ key: string; label: string; type: "text" | "select" | "date"; options?: string[] }>;
  columns: DataColumn[];
  rows: Array<Record<string, string | number | boolean>>;
  primaryKey: string;
  displayKey: string;
}

export interface WorkspaceTab {
  id: string;
  title: string;
  pageId: string;
  mode?: "view" | "edit" | "new";
  recordId?: string;
  closable?: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "warning" | "info";
}
