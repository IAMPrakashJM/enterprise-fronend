import { notFound } from 'next/navigation';
import { modules } from '@/lib/mock';
import { Dashboard } from '@/components/patterns/Dashboard';
export default async function ModuleDashboard({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params; const m = modules.find(x => x.id === module); if (!m) notFound();
  return <Dashboard module={m} />;
}
