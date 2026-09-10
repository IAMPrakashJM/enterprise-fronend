"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  createClinicalTemplateAdapter,
  createComprehensiveConsultationAdapter,
  createClinicalTriageAdapter,
} from "@pepbits/erp-data";
import { useProductRequest } from "../product-services";
import { ComprehensiveConsultationWorkspace } from "./workspace";
export function ComprehensiveConsultationLibraryPage() {
  const { user } = useSession(),
    product = useProduct(),
    request = useProductRequest(),
    host = useERP(),
    adapter = useMemo(
      () => createComprehensiveConsultationAdapter(request, product.id),
      [request, product.id],
    ),
    triage = useMemo(
      () => createClinicalTriageAdapter(request, product.id),
      [request, product.id],
    ),
    patients = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <ComprehensiveConsultationWorkspace
      triage={triage}
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
