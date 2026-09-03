import { notFound } from 'next/navigation';
import { getSchema } from '@/lib/mock';
import { RecordForm, type FormMode } from '@/components/forms/RecordForm';
export default async function RecordPage({ params, searchParams }: { params: Promise<{ module: string; entity: string; id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const { entity, id } = await params; const { mode } = await searchParams; const schema = getSchema(entity); if (!schema) notFound();
  const m: FormMode = id === 'new' ? 'new' : mode === 'edit' ? 'edit' : 'view';
  return <RecordForm key={id + m} schema={schema} id={id} mode={m} />;
}
