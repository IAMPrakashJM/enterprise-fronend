import { cn } from '@/lib/format';
export function Toggle({ checked, onChange, disabled, labels = ['Yes', 'No'] }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; labels?: [string, string] }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className="h-[32px] flex items-center gap-2.5 text-form disabled:opacity-60">
      <span className={cn('w-9 h-5 rounded-full relative transition-colors shrink-0', checked ? 'bg-accent' : 'bg-border')}><span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} /></span>
      <span>{checked ? labels[0] : labels[1]}</span>
    </button>
  );
}
