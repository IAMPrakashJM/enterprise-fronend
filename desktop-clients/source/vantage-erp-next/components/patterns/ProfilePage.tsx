'use client';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { ERP } from '@/lib/mock';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/primitives/Button';
import { cn } from '@/lib/format';
export function ProfilePage() {
  const ws = useWorkspace(); const router = useRouter(); const t = useT(); const u = ERP.user;
  const rows = [['Employee ID', u.employeeId], ['Member since', u.since], ['Default branch', ws.branch], ['Active role', ws.role], ['Last sign-in', 'Today, 08:41 · Chrome on macOS'], ['Two-factor', 'Enabled (authenticator)']];
  return (
    <section className="grid gap-3.5 max-w-[1000px] items-start" style={{ gridTemplateColumns: '320px 1fr' }}>
      <div className="bg-surface border border-border rounded-ui px-5 py-6 flex flex-col items-center gap-2.5 text-center"><span className="w-[72px] h-[72px] rounded-full bg-accent text-accent-fg grid place-items-center text-2xl font-bold">{u.initials}</span><span className="text-[17px] font-semibold">{u.name}</span><span className="text-muted">{u.title}</span><span className="font-mono text-xs text-muted">{u.email}</span><Button variant="primary" className="mt-2" onClick={() => { ws.setWorkspace('/preferences', t('myPreferences')); router.push('/preferences'); }}>{t('myPreferences')}</Button></div>
      <div className="flex flex-col gap-3.5">
        <div className="bg-surface border border-border rounded-ui"><div className="px-4 py-2.5 border-b border-border font-semibold">Account</div><div className="px-4 py-2 grid gap-x-3 gap-y-2 text-result" style={{ gridTemplateColumns: '160px 1fr' }}>{rows.map(([k, v]) => <Fragment key={k}><span className="text-muted">{k}</span><span>{v}</span></Fragment>)}</div></div>
        <div className="bg-surface border border-border rounded-ui"><div className="px-4 py-2.5 border-b border-border font-semibold">Assigned roles</div><div className="px-4 py-3 flex gap-2 flex-wrap">{u.roles.map(r => <span key={r} className={cn('px-2.5 py-1 border border-border rounded-xl text-xs', r === ws.role && 'bg-accent-soft text-accent')}>{r}</span>)}</div></div>
        <div className="bg-surface border border-border rounded-ui"><div className="px-4 py-2.5 border-b border-border font-semibold">Branch access</div><div className="px-4 py-3 flex gap-2 flex-wrap">{u.branches.map(b => <span key={b} className="px-2.5 py-1 border border-border rounded-xl text-xs">{b}</span>)}</div></div>
      </div>
    </section>
  );
}
