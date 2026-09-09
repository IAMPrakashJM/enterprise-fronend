import type {
  TriageView,
  TriageSave,
  TriageAssessment,
} from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "./clinical-templates";
export interface ClinicalTriageAdapter {
  load(patientId: string): Promise<TriageView>;
  save(input: TriageSave): Promise<TriageAssessment>;
}
export function createClinicalTriageAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  productId: string,
): ClinicalTriageAdapter {
  async function call<T>(body: object): Promise<T> {
    const response = await request("/clinical-triage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Product-Id": productId,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data)
      throw new ClinicalRequestFailure(
        response.ok ? 502 : response.status,
        data?.fieldErrors ?? {},
        data?.reference,
      );
    return data;
  }
  return {
    load: (patientId) => call({ action: "load", patientId }),
    save: (input) => call({ action: "save", ...input }),
  };
}
