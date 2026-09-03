import { Field, Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="bg-surface border border-border rounded-ui"><div className="px-4 py-2.5 border-b border-border font-semibold">{title}</div>{children}</div>;
export function SettingsPage() {
  const series = [['Tax invoice', 'INV-', '1058'], ['Sales order', 'SO-', '1091'], ['Purchase order', 'PO-', '1109'], ['Journal', 'JV-', '2204'], ['Payroll run', 'PR-', '0017']];
  const branches = [['Dubai HQ', 'UAE', 'AED'], ['Chennai', 'India', 'INR'], ['Singapore', 'Singapore', 'SGD'], ['Riyadh', 'Saudi Arabia', 'SAR']];
  const roles = [['Finance Controller', 'All modules · post & approve', '4'], ['Billing Supervisor', 'Sales · create, edit, print', '12'], ['HR Viewer', 'HR · read only', '31'], ['Procurement Approver', 'SCM · approve PO/PR', '7']];
  return (
    <section className="grid grid-cols-2 gap-3.5 max-w-[1100px]">
      <Card title="Organization"><div className="px-4 py-3.5 grid grid-cols-2 gap-x-4 gap-y-3 text-form"><Field label="Legal name"><Input defaultValue="Halcyon Group Holdings LLC" /></Field><Field label="Tax registration"><Input mono defaultValue="100-2846-1937-003" /></Field><Field label="Reporting currency"><Select options={['AED', 'USD', 'INR']} /></Field><Field label="Fiscal year start"><Select options={['January', 'April', 'July']} /></Field></div></Card>
      <Card title="Numbering series"><div className="py-1.5">{series.map(s => <div key={s[0]} className="grid gap-2.5 px-4 py-[7px] text-result items-center" style={{ gridTemplateColumns: '1fr 100px 100px' }}><span>{s[0]}</span><span className="font-mono text-muted">{s[1]}</span><span className="font-mono">{s[2]}</span></div>)}</div></Card>
      <Card title="Branches">{branches.map(b => <div key={b[0]} className="grid gap-2.5 px-4 py-2 border-b border-border text-result items-center" style={{ gridTemplateColumns: '1fr 110px 90px 80px' }}><span className="font-medium">{b[0]}</span><span className="text-muted">{b[1]}</span><span className="font-mono">{b[2]}</span><span className="text-success text-[11.5px]">Active</span></div>)}</Card>
      <Card title="Roles & permissions">{roles.map(r => <div key={r[0]} className="grid gap-2.5 px-4 py-2 border-b border-border text-result items-center" style={{ gridTemplateColumns: '1fr 1fr 60px' }}><span className="font-medium">{r[0]}</span><span className="text-muted">{r[1]}</span><span className="font-mono text-right">{r[2]}</span></div>)}</Card>
    </section>
  );
}
