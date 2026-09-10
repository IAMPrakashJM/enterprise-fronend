/** Public integration examples and guide keys, shared by the Page Library catalog. */
export interface PageLibraryResource {
  source: string;
  guides: string[];
  demo: string;
}
export const PAGE_LIBRARY_RESOURCES: Record<string, PageLibraryResource> = {
  "billing-clinic": {
    source:
      "import React from 'react';\nimport { BillingClinicWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicBillingAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function BillingPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicBillingAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n return <BillingClinicWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    guides: [
      "template.clinic.guideFlow",
      "template.clinic.guideIntegration",
      "template.clinic.guidePreferences",
      "template.clinic.guidePrecision",
      "template.clinic.guideRecovery",
      "template.clinic.guideLimits",
    ],
    demo: "template.clinic.demo",
  },
  "clinical-triage": {
    source:
      "import React from 'react';\nimport { ClinicalTriageWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTriageAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function TriagePage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n return <ClinicalTriageWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    guides: [
      "template.triage.guideFlow",
      "template.triage.guideIntegration",
      "template.triage.guidePreferences",
      "template.triage.guideRecovery",
      "template.triage.guideLimits",
    ],
    demo: "template.triage.demo",
  },
  "clinical-consultation": {
    source:
      "import React from 'react';\nimport { ClinicalConsultationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalConsultationAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function ConsultationPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicalConsultationAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n return <ClinicalConsultationWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    guides: [
      "template.consultation.guideFlow",
      "template.consultation.guideExpanded",
      "template.consultation.guideIntegration",
      "template.consultation.guidePreferences",
      "template.consultation.guideRecovery",
      "template.consultation.guideLimits",
    ],
    demo: "template.consultation.demo",
  },
  "op-consultation": {
    source:
      "import React from 'react';\nimport { OPConsultationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalConsultationAdapter, createClinicalTemplateAdapter, createClinicalTriageAdapter } from '@pepbits/erp-data';\n\nexport function ConsultationPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicalConsultationAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n const triage = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);\n return <OPConsultationWorkspace triage={triage} adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    guides: [
      "template.consultation.guideFlow",
      "template.consultation.guideExpanded",
      "template.consultation.guideOP",
      "template.consultation.guideIntegration",
      "template.consultation.guidePreferences",
      "template.consultation.guideRecovery",
      "template.consultation.guideLimits",
    ],
    demo: "template.consultation.demo",
  },
  "comprehensive-consultation": {
    source:
      "import React from 'react';\nimport { ComprehensiveConsultationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createComprehensiveConsultationAdapter, createClinicalTemplateAdapter, createClinicalTriageAdapter } from '@pepbits/erp-data';\n\nexport function ConsultationPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createComprehensiveConsultationAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n const triage = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);\n return <ComprehensiveConsultationWorkspace triage={triage} adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    guides: [
      "template.comprehensive.guideFlow",
      "template.comprehensive.guideExpanded",
      "template.comprehensive.guideOP",
      "template.comprehensive.guideIntegration",
      "template.comprehensive.guidePreferences",
      "template.comprehensive.guideRecovery",
      "template.comprehensive.guideLimits",
    ],
    demo: "template.comprehensive.demo",
  },
  "allyvora-patient-query": {
    source:
      "import React from 'react';\nimport { ClinicalPatientWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // authenticated tenant + application + user + record\n}) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: 'query' }} {...host} />;\n}\n",
    guides: [
      "template.clinical.guideFlow",
      "template.clinical.guideComponents",
      "template.clinical.guideApi",
      "template.clinical.guideSave",
      "template.clinical.guidePreferences",
      "template.clinical.guideLimits",
    ],
    demo: "template.clinical.demoQuery",
  },
  "allyvora-patient-record": {
    source:
      "import React from 'react';\nimport { ClinicalPatientWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // authenticated tenant + application + user + record\n}) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: 'record' }} {...host} />;\n}\n",
    guides: [
      "template.clinical.guideFlow",
      "template.clinical.guideComponents",
      "template.clinical.guideApi",
      "template.clinical.guideSave",
      "template.clinical.guidePreferences",
      "template.clinical.guideLimits",
    ],
    demo: "template.clinical.demoRecord",
  },
  "allyvora-patient-360": {
    source:
      "import React from 'react';\nimport { ClinicalPatientWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // authenticated tenant + application + user + record\n}) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: 'overview' }} {...host} />;\n}\n",
    guides: [
      "template.clinical.guideFlow",
      "template.clinical.guideComponents",
      "template.clinical.guideApi",
      "template.clinical.guideSave",
      "template.clinical.guidePreferences",
      "template.clinical.guideLimits",
    ],
    demo: "template.clinical.demoNotice",
  },
};
