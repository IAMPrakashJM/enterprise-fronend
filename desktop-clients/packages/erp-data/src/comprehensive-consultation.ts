import type {
  ComprehensiveValues,
  ComprehensiveConfiguration,
} from "@pepbits/erp-config";
import { createClinicalDocumentAdapter } from "./clinical-document";
export function createComprehensiveConsultationAdapter(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  productId: string,
) {
  return createClinicalDocumentAdapter<
    ComprehensiveValues,
    ComprehensiveConfiguration
  >(request, productId, "/comprehensive-consultation");
}
