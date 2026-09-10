import type {
  RegistrationCommand,
  RegistrationConfig,
  RegistrationView,
  RegistrationRecord,
  RegistrationAppointment,
} from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "./clinical-templates";
export interface RegistrationAdapter {
  config(): Promise<RegistrationConfig>;
  load(patientId: string, id?: string): Promise<RegistrationView>;
  command(input: RegistrationCommand): Promise<RegistrationView>;
  worklist(): Promise<{
    records: RegistrationRecord[];
    appointments: RegistrationAppointment[];
  }>;
}
export function createRegistrationAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  product: string,
): RegistrationAdapter {
  async function call<T>(input: RegistrationCommand): Promise<T> {
    const response = await request("/op-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Product-Id": product },
      body: JSON.stringify(input),
    });
    const body = await response.json();
    if (!response.ok)
      throw new ClinicalRequestFailure(
        response.status,
        body.fieldErrors ?? { form: body.error },
        body.reference,
      );
    return body;
  }
  return {
    config: () => call({ action: "config" }),
    load: (patientId, id) =>
      call({ action: "load", patientId, ...(id ? { id } : {}) }),
    command: (input) => call(input),
    worklist: () => call({ action: "worklist" }),
  };
}
