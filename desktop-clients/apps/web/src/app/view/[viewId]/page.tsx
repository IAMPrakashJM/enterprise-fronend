import { SavedViewRoute } from "./route-client";

/**
 * /view/VW_290B4AA4A3609A0F — and nothing else in the URL.
 *
 * No page id, no module, no tenant. A page name in the link would tell nginx,
 * APM and browser history which worklist someone opened, which is the same
 * class of leak the opaque id exists to close: it would remove the patient name
 * and leave the ward. Everything is resolved server-side, after authentication
 * and the tenant check.
 */
export default async function Page({ params }: { params: Promise<{ viewId: string }> }) {
  const { viewId } = await params;
  return <SavedViewRoute viewId={viewId} />;
}
