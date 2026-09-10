"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  createClinicalTemplateAdapter,
  createClinicalConsultationAdapter,
  createClinicalTriageAdapter,
} from "@pepbits/erp-data";
import { useProductRequest } from "../product-services";
import { OPConsultationWorkspace } from "./workspace";
export function OPConsultationLibraryPage() {
  const { user } = useSession(),
    product = useProduct(),
    request = useProductRequest(),
    host = useERP(),
    adapter = useMemo(
      () => createClinicalConsultationAdapter(request, product.id),
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
    <OPConsultationWorkspace
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
