import { notFound } from 'next/navigation';
import { getSchema } from '@/lib/mock';
import { LIBRARY } from '@/lib/library';
import { Worklist } from '@/components/patterns/Worklist';
import { Library } from '@/components/patterns/Library';
export default async function EntityPage({ params }: { params: Promise<{ module: string; entity: string }> }) {
  const { module, entity } = await params;
  if (module === 'library') { if (!LIBRARY[entity]) notFound(); return <Library section={entity} />; }
  const schema = getSchema(entity); if (!schema) notFound();
  return <Worklist schema={schema} />;
}
