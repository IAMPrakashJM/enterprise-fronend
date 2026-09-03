'use client';
import { create } from 'zustand';
export interface WorkTab { id: string; href: string; title: string; badge?: string }
interface WS { module: string; branch: string; role: string; tabs: WorkTab[]; active: string; setModule: (m: string) => void; setBranch: (b: string) => void; setRole: (r: string) => void; setWorkspace: (href: string, title: string) => void; openTab: (href: string, title: string, badge?: string) => string; closeTab: (id: string) => string; activate: (id: string) => void; setTitle: (id: string, title: string) => void }
let seq = 1;
export const useWorkspace = create<WS>((set, get) => ({
  module: 'sales', branch: 'Dubai HQ', role: 'Finance Controller', tabs: [{ id: 'ws', href: '/sales', title: 'Dashboard' }], active: 'ws',
  setModule: m => set({ module: m, tabs: get().tabs.map(t => t.id === 'ws' ? { ...t, href: '/' + m, title: 'Dashboard' } : t), active: 'ws' }),
  setBranch: branch => set({ branch }), setRole: role => set({ role }),
  setWorkspace: (href, title) => set({ tabs: get().tabs.map(t => t.id === 'ws' ? { ...t, href, title } : t), active: 'ws' }),
  openTab: (href, title, badge) => { const id = 't' + (++seq); set({ tabs: [...get().tabs, { id, href, title, badge }], active: id }); return id; },
  closeTab: id => { const tabs = get().tabs; const i = tabs.findIndex(t => t.id === id); const rest = tabs.filter(t => t.id !== id); const active = get().active === id ? (rest[Math.max(0, i - 1)] ?? rest[0]).id : get().active; set({ tabs: rest, active }); return rest.find(t => t.id === active)!.href; },
  activate: id => set({ active: id }), setTitle: (id, title) => set({ tabs: get().tabs.map(t => t.id === id ? { ...t, title } : t) })
}));
