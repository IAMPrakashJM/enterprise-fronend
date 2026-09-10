"use client";
import React, { useMemo, useState } from "react";
import { useSession } from "@pepbits/auth";
import { createClinicalTemplateAdapter, type ClinicalTemplateAdapter } from "@pepbits/erp-data";
import { useProduct } from "@pepbits/erp-shell";
import { useNavigation } from "@pepbits/platform-ports";
import { Input, Select } from "@pepbits/ops-ui";
import { useProductRequest } from "../product-services";
import { ClinicalLoading, useClinicalLoad } from "../clinical-templates/shared";

export function BillingPatientPicker({ adapter, onSelect }: {
  adapter: ClinicalTemplateAdapter;
  onSelect: (patientId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const patients = useClinicalLoad(() => adapter.search({ q: query, page: 1, pageSize: 50 }), [adapter, query]);
  return <div className="space-y-2" data-billing-patient-picker>
    <Input label="template.clinical.search" value={query} onChange={e => setQuery(e.target.value)} />
    <Select label="template.clinical.selectPatient" value="" disabled={!patients.value} options={[
      { value: "", label: "template.clinical.selectPatient" },
      ...(patients.value?.rows ?? []).map(p => ({ value: p.id, label: `${p.mrn} • ${p.name}` })),
    ]} onChange={e => {
      const id = e.target.value;
      if (patients.value?.rows.some(p => p.id === id)) onSelect(id);
    }} />
    {patients.error ? <ClinicalLoading error={patients.error} retry={patients.retry} /> : null}
  </div>;
}
export function BillingPatientLauncher() {
  const { user } = useSession(), product = useProduct(), request = useProductRequest(), navigation = useNavigation();
  const adapter = useMemo(() => createClinicalTemplateAdapter(request, product.id), [request, product.id]);
  return <BillingPatientPicker key={JSON.stringify([user?.tenantId, product.id, user?.id])} adapter={adapter}
    onSelect={recordId => navigation.openInNewContext({ pageId: "billing-clinic", recordId })} />;
}
