/** Public integration examples and guide keys, shared by the Page Library catalog. */
export interface PageLibraryResource {
  source: string;
  demo: string;
}
export const PAGE_LIBRARY_RESOURCES: Record<string, PageLibraryResource> = {
  "op-registration": {
    source: "import React from 'react';\nimport { RegistrationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createRegistrationAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\nexport function RegistrationPage({ request, productId, scopeKey, ...host }: PreferenceHost & { request: (path:string, init?:RequestInit)=>Promise<Response>; productId:string; scopeKey:string }) {\n const adapter=React.useMemo(()=>createRegistrationAdapter(request,productId),[request,productId]);\n const patients=React.useMemo(()=>createClinicalTemplateAdapter(request,productId),[request,productId]);\n return <RegistrationWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host}/>;\n}",
    demo: "registration.demo",
  },
  "billing-clinic": {
    source:
      "import React from 'react';\nimport { BillingClinicWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicBillingAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function BillingPage({ request, productId, scopeKey, patientId, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n patientId: string; // selected patient ID from the navigation target\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicBillingAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n return <BillingClinicWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} patientId={patientId} patientSelection=\"external\" {...host} />;\n}",
    demo: "template.clinic.demo",
  },
  "clinical-triage": {
    source:
      "import React from 'react';\nimport { ClinicalTriageWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTriageAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function TriagePage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n return <ClinicalTriageWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    demo: "template.triage.demo",
  },
  "clinical-consultation": {
    source:
      "import React from 'react';\nimport { ClinicalConsultationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalConsultationAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function ConsultationPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicalConsultationAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n return <ClinicalConsultationWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    demo: "template.consultation.demo",
  },
  "op-consultation": {
    source:
      "import React from 'react';\nimport { OPConsultationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalConsultationAdapter, createClinicalTemplateAdapter, createClinicalTriageAdapter } from '@pepbits/erp-data';\n\nexport function ConsultationPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createClinicalConsultationAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n const triage = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);\n return <OPConsultationWorkspace triage={triage} adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    demo: "template.consultation.demo",
  },
  "comprehensive-consultation": {
    source:
      "import React from 'react';\nimport { ComprehensiveConsultationWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createComprehensiveConsultationAdapter, createClinicalTemplateAdapter, createClinicalTriageAdapter } from '@pepbits/erp-data';\n\nexport function ConsultationPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n request: (path: string, init?: RequestInit) => Promise<Response>;\n productId: string;\n scopeKey: string; // authenticated tenant + application + user\n}) {\n const adapter = React.useMemo(() => createComprehensiveConsultationAdapter(request, productId), [request, productId]);\n const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n const triage = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);\n return <ComprehensiveConsultationWorkspace triage={triage} adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;\n}",
    demo: "template.comprehensive.demo",
  },
  "allyvora-patient-query": {
    source:
      "import React from 'react';\nimport { ClinicalPatientWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // authenticated tenant + application + user + record\n}) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: 'query' }} {...host} />;\n}\n",
    demo: "template.clinical.demoQuery",
  },
  "allyvora-patient-record": {
    source:
      "import React from 'react';\nimport { ClinicalPatientWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // authenticated tenant + application + user + record\n}) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: 'record' }} {...host} />;\n}\n",
    demo: "template.clinical.demoRecord",
  },
  "allyvora-patient-360": {
    source:
      "import React from 'react';\nimport { ClinicalPatientWorkspace, type PreferenceHost } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: PreferenceHost & {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // authenticated tenant + application + user + record\n}) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: 'overview' }} {...host} />;\n}\n",
    demo: "template.clinical.demoNotice",
  },
};
