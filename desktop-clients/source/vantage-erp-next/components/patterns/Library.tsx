'use client';
import { useRouter } from 'next/navigation';
import { LIBRARY, LIBRARY_NAV } from '@/lib/library';
import { useWorkspace } from '@/lib/workspace/store';
import { cn } from '@/lib/format';
import { Button } from '@/components/primitives/Button';
import { Field, Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Toggle } from '@/components/primitives/Toggle';
import { StatusPill } from '@/components/primitives/StatusPill';
export function Library({ section }: { section: string }) {
  const sec = LIBRARY[section] ?? LIBRARY.overview; const ws = useWorkspace(); const router = useRouter();
  return (
    <section className="flex flex-col gap-3.5 max-w-[1100px]">
      <div className="flex gap-2 flex-wrap">{LIBRARY_NAV.map(([id, label]) => <button key={id} onClick={() => { ws.setWorkspace('/library/' + id, 'Library · ' + label); router.push('/library/' + id); }} className={cn('h-7 px-3 border rounded-full text-xs hover:border-accent', LIBRARY[id] === sec ? 'bg-accent text-accent-fg border-accent' : 'bg-surface border-border')}>{label}</button>)}</div>
      <div className="flex flex-col gap-1"><span className="text-[22px] font-semibold">{sec.title}</span><span className="text-muted text-[13.5px] leading-relaxed max-w-[760px]">{sec.intro}</span></div>
      {sec.blocks.map(b => <div key={b.title} className="bg-surface border border-border rounded-ui">
        <div className="px-4 py-2.5 border-b border-border flex gap-2.5 items-baseline"><span className="font-semibold">{b.title}</span><span className="text-muted text-xs">{b.sub}</span></div>
        {b.text && <div className="px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line">{b.text}</div>}
        {b.rows && <div className="py-1.5">{b.rows.map(r => <div key={r.k} className="grid gap-3 px-4 py-[7px] text-[12.5px] border-b border-border last:border-0" style={{ gridTemplateColumns: '200px 1fr' }}><span className="font-mono text-accent">{r.k}</span><span className="leading-relaxed">{r.v}</span></div>)}</div>}
        {b.code && <pre className="m-0 px-4 py-3.5 font-mono text-[11.5px] leading-[1.55] overflow-auto bg-surface2">{b.code}</pre>}
      </div>)}
      {sec.showControls && <div className="bg-surface border border-border rounded-ui"><div className="px-4 py-2.5 border-b border-border font-semibold">Live specimens · rendered with the current theme, font and radius</div>
        <div className="p-4 flex flex-col gap-[18px]">
          <div className="flex gap-2 flex-wrap items-center"><Button variant="primary">Primary</Button><Button>Secondary</Button><Button variant="outline" tone="success">Outline success</Button><Button variant="outline" tone="danger">Outline danger</Button><Button variant="ghost">Ghost</Button><Button disabled>Disabled</Button><StatusPill value="Active" /><StatusPill value="Pending" /><StatusPill value="Blocked" /></div>
          <div className="grid gap-x-4 gap-y-3 text-form" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}><Field label="Text input" required><Input placeholder="Customer name" /></Field><Field label="Number (mono)"><Input type="number" mono defaultValue="1250.00" className="text-right" /></Field><Field label="Date"><Input type="date" defaultValue="2026-09-02" /></Field><Field label="Select"><Select options={['Retail', 'Wholesale']} /></Field><Field label="Read-only"><Input readOnly mono defaultValue="CUS-1001" /></Field><Field label="Error state" error="Enter a valid email address"><Input defaultValue="not-an-email" error="x" /></Field></div>
          <div className="flex gap-4 flex-wrap items-center"><Toggle checked onChange={() => {}} labels={['Toggle on', 'Toggle off']} /><Toggle checked={false} onChange={() => {}} labels={['Toggle on', 'Toggle off']} /><label className="flex items-center gap-2"><input type="checkbox" defaultChecked />Checkbox</label><label className="flex items-center gap-2"><input type="radio" defaultChecked />Radio</label></div>
        </div></div>}
    </section>
  );
}
