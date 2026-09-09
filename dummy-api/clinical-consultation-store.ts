import { readFileSync } from "node:fs";
import { createClinicalDocumentStore } from "./clinical-document-store.ts";
import {
  CONSULTATION_FIELDS,
  blankConsultation,
  validateConsultation,
  type ConsultationValues,
  type ConsultationConfiguration,
} from "../desktop-clients/packages/erp-config/src/clinical-consultation.ts";
const config = JSON.parse(
  readFileSync(
    new URL("./config/clinical-consultation/form.json", import.meta.url),
    "utf8",
  ),
) as ConsultationConfiguration;
export function createClinicalConsultationStore(
  file: string,
  overview: Parameters<typeof createClinicalDocumentStore>[2],
) {
  return createClinicalDocumentStore(
    file,
    {
      prefix: "template.consultation.",
      idPrefix: "CON-",
      config,
      blank: blankConsultation,
      validate: validateConsultation,
      sanitize: (values) =>
        Object.fromEntries(
          CONSULTATION_FIELDS.map((k) => [k, values[k]]),
        ) as ConsultationValues,
    },
    overview,
  );
}
