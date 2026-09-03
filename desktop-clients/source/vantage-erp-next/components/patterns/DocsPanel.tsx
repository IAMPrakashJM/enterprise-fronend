'use client';
import { ERP } from '@/lib/mock';
import { usePrefsStore } from '@/lib/prefs/store';
import { toast } from '@/lib/toast/store';
export function DocsPanel({ pageType, position }: { pageType: string; position: 'top' | 'bottom' }) {
  const { prefs, set } = usePrefsStore(); const doc = ERP.docs[pageType] ?? ERP.docs.dashboard;
  if (!prefs.docs || prefs.docsPos !== position || pageType === 'library') return null;
  return (
    <div className="flex gap-3 items-start px-3.5 py-2.5 bg-surface border border-border border-s-[3px] border-s-accent rounded-ui">
      <span className="w-[22px] h-[22px] shrink-0 grid place-items-center bg-accent-soft text-accent font-bold text-xs rounded-full">i</span>
      <div className="flex-1 min-w-0"><div className="font-semibold mb-0.5">{doc.title}</div><div className="text-muted text-[12.5px] leading-relaxed">{doc.body}</div></div>
      {position === 'top' && <button onClick={() => { set({ docs: false }); toast('Documentation panels hidden. Re-enable in My preferences.', 'info'); }} title="Hide documentation" className="text-muted text-base leading-none">×</button>}
    </div>
  );
}
