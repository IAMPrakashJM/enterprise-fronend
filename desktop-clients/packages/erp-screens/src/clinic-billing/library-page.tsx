"use client";
import React, { useMemo } from "react";
import { useNavigation } from "@pepbits/platform-ports";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  createClinicalTemplateAdapter,
  createClinicBillingAdapter,
} from "@pepbits/erp-data";
import { useProductRequest } from "../product-services";
import { BillingClinicWorkspace } from "./workspace";
export function BillingClinicLibraryPage() {
  const navigation = useNavigation(), { user } = useSession(),
    product = useProduct(),
    request = useProductRequest(),
    host = useERP(),
    adapter = useMemo(
      () => createClinicBillingAdapter(request, product.id),
      [request, product.id],
    ),
    patients = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <BillingClinicWorkspace
      patientId={navigation.current.recordId}
      patientSelection="external"
      onChoosePatient={() => navigation.open({ pageId: "list-of-pages" })}
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
