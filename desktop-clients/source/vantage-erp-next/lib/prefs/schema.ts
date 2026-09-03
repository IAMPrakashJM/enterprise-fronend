import { z } from 'zod';
export const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'contrast', 'midnight', 'forest', 'sand', 'slate', 'solarized']),
  font: z.string(), fs: z.number().min(11).max(16), fsForm: z.number().min(11).max(17), fsResult: z.number().min(10).max(16),
  density: z.enum(['compact', 'comfortable']), corners: z.number().min(0).max(12),
  sidebar: z.enum(['left', 'right']), pinned: z.boolean(),
  formLayout: z.enum(['rail', 'tabs', 'wizard']), resultView: z.enum(['table', 'cards']),
  quickView: z.enum(['card', 'modal', 'panel-left', 'panel-right']),
  pageSize: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]),
  toastPos: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']),
  toastDur: z.number().min(1).max(12), toastStyle: z.enum(['solid', 'light']),
  lang: z.enum(['en', 'ar', 'hi', 'es', 'zh']), help: z.boolean(), docs: z.boolean(), docsPos: z.enum(['top', 'bottom']),
  animations: z.boolean(), columns: z.record(z.array(z.string()))
});
export type Preferences = z.infer<typeof PreferencesSchema>;
export const DEFAULT_PREFS: Preferences = { theme: 'light', font: 'IBM Plex Sans', fs: 13, fsForm: 13, fsResult: 12.5, density: 'compact', corners: 0, sidebar: 'left', pinned: false, formLayout: 'tabs', resultView: 'table', quickView: 'panel-right', pageSize: 20, toastPos: 'bottom-right', toastDur: 4, toastStyle: 'solid', lang: 'en', help: true, docs: true, docsPos: 'top', animations: true, columns: {} };
