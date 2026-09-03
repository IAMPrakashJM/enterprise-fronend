export type FieldType = 'text' | 'code' | 'email' | 'phone' | 'number' | 'currency' | 'percent' | 'date' | 'select' | 'multiselect' | 'toggle' | 'textarea';
export interface FieldSchema { key: string; label: string; type: FieldType; options?: string[]; req?: boolean; col?: boolean; basic?: boolean; adv?: boolean; prefix?: string; min?: number; max?: number; gen?: string }
export interface SectionSchema { title: string; fields: FieldSchema[] }
export interface QuickAction { label: string; act: 'view' | 'edit' | 'nav' | 'toast'; page?: string; msg?: string }
export type Row = { _id: string } & Record<string, unknown>;
export interface EntitySchema { id: string; label: string; plural: string; module: string; sections: SectionSchema[]; fields: FieldSchema[]; rows: Row[]; titleKey: string; quickActions: QuickAction[] }
export interface Route { page: 'dashboard' | 'worklist' | 'billing' | 'reports' | 'excel' | 'prefs' | 'settings' | 'profile' | 'library'; entity?: string; section?: string }
export interface MenuLeaf { label: string; route: Route }
export interface MenuGroup { id: string; label: string; icon: string; children: MenuLeaf[] }
export interface MenuSection { title: string; items: MenuGroup[] }
export interface ModuleDef { id: string; name: string; short: string; tagline: string; sections: MenuSection[] }
export interface ThemeTokens { name: string; bg: string; surface: string; surface2: string; border: string; text: string; muted: string; accent: string; accentFg: string; danger: string; success: string; warn: string; field: string; sidebar: string; sidebarText: string; shadow: string }
export interface Kpi { label: string; value: string; delta: string; up: boolean }
export interface DashDef { kpis: Kpi[]; chart: { title: string; series: number[]; labels: string[] }; breakdown: { title: string; rows: [string, number][] }; recent: { title: string; entity: string } | null; tasks: string[] }
export interface ReportDef { id: string; name: string; cols: string[] }
export interface Notification { title: string; body: string; time: string; kind: 'warn' | 'info' | 'ok' | 'danger' }
export interface UserInfo { name: string; title: string; email: string; initials: string; branches: string[]; roles: string[]; employeeId: string; since: string }
export interface TourStep { target: string; title: string; text: string }
export interface ErpData {
  entities: Record<string, EntitySchema>; modules: ModuleDef[]; dash: Record<string, DashDef>; reports: Record<string, ReportDef[]>;
  notifications: Notification[]; user: UserInfo; themes: Record<string, ThemeTokens>; fonts: { id: string; label: string }[];
  i18n: Record<string, Record<string, string>>; docs: Record<string, { title: string; body: string }>; tours: Record<string, TourStep[]>;
  shortcuts: [string, string][]; sheet: (string | number)[][]; branches: string[]; company: string; product: string; version: string;
}
