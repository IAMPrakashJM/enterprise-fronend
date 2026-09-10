"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  createClinicalTemplateAdapter,
  createClinicalTriageAdapter,
} from "@pepbits/erp-data";
import { useProductRequest } from "../product-services";
import { ClinicalTriageWorkspace } from "./workspace";
export function ClinicalTriageLibraryPage() {
  const { user } = useSession(),
    product = useProduct(),
    request = useProductRequest(),
    host = useERP(),
    adapter = useMemo(
      () => createClinicalTriageAdapter(request, product.id),
      [request, product.id],
    ),
    patients = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <ClinicalTriageWorkspace
      adapter={adapter}
      patients={patients}
      scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
      preferences={host.preferences}
      preferencePolicy={host.preferencePolicy}
      preferencesAvailable={host.preferencesAvailable}
      onPreferenceChange={host.updatePreference}
    />
  );
}
