"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { createDesignerAdapter } from "@pepbits/erp-data";

import { useProductRequest } from "../product-services";
import { DcpDesignerWorkspace } from "./workspace";
export function DcpDesignerLibraryPage() {
  const request = useProductRequest(),
    product = useProduct(),
    host = useERP(),
    { user } = useSession(),
    adapter = useMemo(
      () => createDesignerAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <DcpDesignerWorkspace
      adapter={adapter}
      scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
      preferences={host.preferences}
      preferencePolicy={host.preferencePolicy}
      preferencesAvailable={host.preferencesAvailable}
      onPreferenceChange={host.updatePreference}
    />
  );
}
