'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ERP, modules } from '@/lib/mock';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { toast } from '@/lib/toast/store';
import { cn } from '@/lib/format';
import { ConfirmDialog } from '@/components/surfaces/Surface';
type Menu = 'module' | 'notif' | 'branch' | 'role' | 'profile' | null;
const Pop = ({ children, end, w }: { children: React.ReactNode; end?: boolean; w?: string }) => <div className={cn('absolute top-[calc(100%+6px)] bg-surface border border-border shadow-ui rounded-ui p-1 z-50 animate-[fadeIn_.12s]', end ? 'end-0' : 'start-0', w ?? 'min-w-[220px]')}>{children}</div>;
const Item = ({ onClick, children, cls }: { onClick: () => void; children: React.ReactNode; cls?: string }) => <button onClick={onClick} className={cn('w-full flex justify-between items-center gap-2 px-2.5 py-2 text-left rounded-ui hover:bg-surface2', cls)}>{children}</button>;
const KIND: Record<string, string> = { warn: 'bg-warn', danger: 'bg-danger', ok: 'bg-success', info: 'bg-accent' };
export function Header({ title, crumb }: { title: string; crumb: string }) {
  const ws = useWorkspace(); const router = useRouter(); const t = useT(); const [menu, setMenu] = useState<Menu>(null); const [signOut, setSignOut] = useState(false); const ref = useRef<HTMLElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(null); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const tog = (m: Menu) => setMenu(menu === m ? null : m); const m = modules.find(x => x.id === ws.module)!;
  const nav = (href: string, ttl: string) => { ws.setWorkspace(href, ttl); router.push(href); setMenu(null); };
  const btn = 'h-[30px] px-2.5 flex items-center gap-1.5 border border-border bg-surface rounded-ui hover:border-accent';
  return (
    <header ref={ref} className="h-12 shrink-0 flex items-center gap-2.5 px-3 bg-surface border-b border-border relative z-40">
      <div className="flex items-center gap-2 shrink-0"><div className="w-[26px] h-[26px] bg-accent text-accent-fg grid place-items-center font-bold text-sm rounded-ui">V</div><span className="font-semibold max-[1000px]:hidden">{ERP.product}</span></div>
      <div data-tour="module" className="relative shrink-0">
        <button onClick={() => tog('module')} className={cn(btn, 'bg-surface2 gap-2')}><span className="text-[10px] font-bold text-accent tracking-wide">{m.short}</span><span className="font-medium">{m.name}</span><span className="text-muted text-[10px]">▼</span></button>
        {menu === 'module' && <Pop w="min-w-[260px]">{modules.map(x => <Item key={x.id} onClick={() => { ws.setModule(x.id); router.push('/' + x.id); setMenu(null); }}><span className="flex items-center gap-2.5"><span className="w-[30px] h-[30px] grid place-items-center bg-surface2 border border-border text-[10px] font-bold text-accent">{x.short}</span><span className="flex flex-col text-left"><span className="font-semibold">{x.name}</span><span className="text-muted text-[11px]">{x.tagline}</span></span></span>{x.id === ws.module && <span className="w-2 h-2 rounded-full bg-accent" />}</Item>)}</Pop>}
      </div>
      <div className="w-px h-[22px] bg-border shrink-0" />
      <div className="flex-1 min-w-0 flex items-baseline gap-2 overflow-hidden"><span className="font-semibold text-[15px] truncate">{title}</span><span className="text-muted text-[11px] whitespace-nowrap max-[1000px]:hidden">{crumb}</span></div>
      <div className="relative shrink-0">
        <button onClick={() => tog('notif')} title={t('notifications')} className="w-[30px] h-[30px] grid place-items-center border border-border bg-surface rounded-ui relative hover:border-accent"><span className="text-sm">🔔︎</span><span className="absolute -top-1.5 -end-1.5 min-w-4 h-4 px-1 bg-danger text-white text-[10px] font-bold grid place-items-center rounded-full">{ERP.notifications.length}</span></button>
        {menu === 'notif' && <Pop end w="w-[340px] p-0"><div className="px-3 py-2.5 border-b border-border flex justify-between items-center"><span className="font-semibold">{t('notifications')}</span><button onClick={() => { setMenu(null); toast('All notifications marked as read', 'info'); }} className="text-accent text-[11px]">Mark all read</button></div>
          {ERP.notifications.map((n, i) => <div key={i} className="flex gap-2.5 px-3 py-2.5 border-b border-border hover:bg-surface2 cursor-pointer"><span className={cn('w-2 h-2 mt-1.5 rounded-full shrink-0', KIND[n.kind])} /><span className="flex flex-col gap-0.5 min-w-0"><span className="font-medium">{n.title}</span><span className="text-muted text-[11.5px]">{n.body}</span></span><span className="ms-auto text-muted text-[11px] shrink-0">{n.time}</span></div>)}</Pop>}
      </div>
      <div className="relative shrink-0"><button onClick={() => tog('branch')} className={btn}><span className="text-muted text-[11px]">{t('branch')}</span><span className="font-medium">{ws.branch}</span><span className="text-muted text-[10px]">▼</span></button>
        {menu === 'branch' && <Pop end w="min-w-[200px]">{ERP.branches.map(b => <Item key={b} onClick={() => { ws.setBranch(b); setMenu(null); toast('Context switched to ' + b, 'info', 'Branch'); }}><span>{b}</span>{b === ws.branch && <span className="text-accent">✓</span>}</Item>)}</Pop>}</div>
      <div className="relative shrink-0 max-[1000px]:hidden"><button onClick={() => tog('role')} className={btn}><span className="text-muted text-[11px]">{t('role')}</span><span className="font-medium">{ws.role}</span><span className="text-muted text-[10px]">▼</span></button>
        {menu === 'role' && <Pop end>{ERP.user.roles.map(r => <Item key={r} onClick={() => { ws.setRole(r); setMenu(null); toast('Now acting as ' + r, 'info', 'Role'); }}><span>{r}</span>{r === ws.role && <span className="text-accent">✓</span>}</Item>)}</Pop>}</div>
      <div className="flex flex-col items-end leading-tight shrink-0 ps-1 max-[1000px]:hidden"><span className="font-semibold text-[13px]">{ERP.user.name}</span><span className="text-muted text-[10.5px] uppercase tracking-[.6px]">{ERP.user.title}</span></div>
      <div data-tour="profile" className="relative shrink-0">
        <button onClick={() => tog('profile')} className="w-8 h-8 rounded-full border-2 border-accent bg-accent-soft text-accent font-bold text-xs grid place-items-center">{ERP.user.initials}</button>
        {menu === 'profile' && <Pop end w="min-w-[240px] p-0"><div className="p-3 border-b border-border flex gap-2.5 items-center"><span className="w-9 h-9 rounded-full bg-accent text-accent-fg grid place-items-center font-bold">{ERP.user.initials}</span><span className="flex flex-col"><span className="font-semibold">{ERP.user.name}</span><span className="text-muted text-[11px]">{ERP.user.email}</span></span></div>
          <div className="p-1 flex flex-col"><Item onClick={() => nav('/settings', t('settings'))}><span>{t('settings')}</span><span className="text-muted text-[11px]">System</span></Item><Item onClick={() => nav('/profile', t('myProfile'))}><span>{t('myProfile')}</span></Item><Item onClick={() => nav('/preferences', t('myPreferences'))}><span>{t('myPreferences')}</span><span className="text-muted text-[11px]">Theme, layout, language</span></Item><div className="h-px bg-border my-1" /><Item cls="text-danger" onClick={() => { setMenu(null); setSignOut(true); }}><span>{t('signOut')}</span></Item></div></Pop>}
      </div>
      {signOut && <ConfirmDialog title={t('signOut') + '?'} body="Unsaved changes in open tabs will be lost. Your preferences stay saved on this device." confirmLabel={t('signOut')} onCancel={() => setSignOut(false)} onConfirm={() => { setSignOut(false); toast('Session ended. Redirecting to sign-in…', 'info', 'Signed out'); }} />}
    </header>
  );
}
