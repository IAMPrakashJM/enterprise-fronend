import type { IdentityCommand, IdentityLibrary } from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "./clinical-templates";
export interface IdentityAdapter {
  library(stationId: string): Promise<IdentityLibrary>;
  command<T>(input: IdentityCommand): Promise<T>;
}
export function createIdentityAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  product: string,
): IdentityAdapter {
  async function command<T>(input: IdentityCommand): Promise<T> {
    const r = await request("/identity-devices", {
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
