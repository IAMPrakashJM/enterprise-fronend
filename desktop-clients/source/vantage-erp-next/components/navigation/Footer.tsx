'use client';
import { useEffect, useState } from 'react';
import { ERP } from '@/lib/mock';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { Kbd } from '@/components/primitives/Kbd';
export function Footer({ onShortcuts }: { onShortcuts: () => void }) {
  const { branch, role } = useWorkspace(); const t = useT(); const [clock, setClock] = useState('');
  useEffect(() => { const tick = () => setClock(new Date().toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })); tick(); const i = setInterval(tick, 1000); return () => clearInterval(i); }, []);
  return (
    <footer className="h-7 shrink-0 flex items-center gap-4 px-3.5 bg-surface border-t border-border text-muted text-[11.5px] whitespace-nowrap overflow-hidden">
      <span>© 2026 {ERP.company} · {ERP.product} {ERP.version}</span><span className="max-[1000px]:hidden">Environment: <b className="text-success font-semibold">Production</b></span><span className="max-[1000px]:hidden">{branch} · {role}</span>
      <span className="flex-1" /><span className="max-[1000px]:hidden">{clock}</span>
      <button onClick={onShortcuts} className="hover:text-text">{t('shortcuts')} <Kbd>?</Kbd></button>
    </footer>
  );
}
