import type {
  IntegrationCommand,
  IntegrationLibrary,
} from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "./clinical-templates";
export interface IntegrationAdapter {
  library(stationId: string): Promise<IntegrationLibrary>;
  command<T>(input: IntegrationCommand): Promise<T>;
}
export function createIntegrationAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  product: string,
): IntegrationAdapter {
  async function command<T>(input: IntegrationCommand): Promise<T> {
    const r = await request("/device-integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Product-Id": product },
      body: JSON.stringify(input),
    });
    const body = await r.json();
    if (!r.ok) throw new ClinicalRequestFailure(r.status, { form: body.error });
    return body;
  }
  return {
    library: (stationId) => command({ action: "library", stationId }),
    command,
  };
}
