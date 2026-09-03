import { ERP } from '@/lib/mock';
import type { Preferences } from './schema';
const THEME_MAP: Record<string, string> = { bg: '--bg', surface: '--surface', surface2: '--surface2', border: '--border', text: '--text', muted: '--muted', accent: '--accent', accentFg: '--accent-fg', danger: '--danger', success: '--success', warn: '--warn', field: '--field', sidebar: '--sidebar', sidebarText: '--sidebar-text', shadow: '--shadow' };
export function applyPrefs(p: Preferences, sbHover = false) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement.style; const th = ERP.themes[p.theme] ?? ERP.themes.light;
  Object.entries(THEME_MAP).forEach(([k, v]) => r.setProperty(v, (th as unknown as Record<string, string>)[k]));
  r.setProperty('--font', "'" + p.font + "', system-ui, sans-serif");
  r.setProperty('--fs', p.fs + 'px'); r.setProperty('--fs-form', p.fsForm + 'px'); r.setProperty('--fs-result', p.fsResult + 'px');
  r.setProperty('--radius', p.corners + 'px'); r.setProperty('--row-py', p.density === 'compact' ? '6px' : '11px');
  r.setProperty('--side-dir', p.sidebar === 'right' ? 'row-reverse' : 'row');
  r.setProperty('--sb-l', p.sidebar === 'right' ? 'auto' : '0'); r.setProperty('--sb-r', p.sidebar === 'right' ? '0' : 'auto');
  r.setProperty('--sb-slot', p.pinned ? '260px' : '56px'); r.setProperty('--sb-w', p.pinned || sbHover ? '260px' : '56px');
  const [v, h] = p.toastPos.split('-');
  r.setProperty('--toast-top', v === 'top' ? '60px' : 'auto'); r.setProperty('--toast-bottom', v === 'bottom' ? '40px' : 'auto');
  r.setProperty('--toast-left', h === 'left' ? '16px' : h === 'center' ? '50%' : 'auto'); r.setProperty('--toast-right', h === 'right' ? '16px' : 'auto'); r.setProperty('--toast-tx', h === 'center' ? '-50%' : '0');
  document.documentElement.dir = ERP.i18n[p.lang]?._dir ?? 'ltr'; document.documentElement.lang = p.lang;
}
