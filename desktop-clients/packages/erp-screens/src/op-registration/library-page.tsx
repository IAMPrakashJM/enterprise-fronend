"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  createRegistrationAdapter,
  createClinicalTemplateAdapter,
} from "@pepbits/erp-data";
import { useProductRequest } from "../product-services";
import { RegistrationWorkspace } from "./workspace";
export function OPRegistrationLibraryPage() {
  const request = useProductRequest(),
    product = useProduct(),
    host = useERP(),
    { user } = useSession();
  const adapter = useMemo(
      () => createRegistrationAdapter(request, product.id),
      [request, product.id],
    ),
    patients = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <RegistrationWorkspace
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
