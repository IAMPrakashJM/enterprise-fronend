import type { LabelCommand, LabelLibrary, LabelJob } from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "./clinical-templates";
export interface LabelAdapter {
  library(): Promise<LabelLibrary>;
  command<T = LabelJob>(input: LabelCommand): Promise<T>;
}
export function createLabelAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  product: string,
): LabelAdapter {
  async function command<T>(input: LabelCommand): Promise<T> {
    const r = await request("/label-printing", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Product-Id": product },
      body: JSON.stringify(input),
    });
    const body = await r.json();
    if (!r.ok)
      throw new ClinicalRequestFailure(
        r.status,
        body.fieldErrors ?? { form: body.error },
        body.reference,
      );
    return body;
  }
  return { library: () => command({ action: "library" }), command };
}
