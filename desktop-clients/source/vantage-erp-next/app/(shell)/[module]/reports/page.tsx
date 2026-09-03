import { getModule } from '@/lib/mock';
import { ReportCenter } from '@/components/patterns/ReportCenter';
export default async function ReportsPage({ params }: { params: Promise<{ module: string }> }) { const { module } = await params; return <ReportCenter module={getModule(module)} />; }
