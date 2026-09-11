import type { CareCommand, CareView } from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "./clinical-templates";
export interface CareAdapter {
  command(input: CareCommand): Promise<CareView>;
}
export function createCareAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  product: string,
): CareAdapter {
  return {
    async command(input) {
      const r = await request("/care-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Product-Id": product,
        },
        body: JSON.stringify(input),
      });
      const body = await r.json();
      if (!r.ok)
        throw new ClinicalRequestFailure(
          r.status,
          body.fieldErrors ?? { form: body.error },
        );
      return body;
    },
  };
}
