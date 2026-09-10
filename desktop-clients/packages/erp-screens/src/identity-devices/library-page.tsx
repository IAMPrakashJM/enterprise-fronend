"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { createIdentityAdapter } from "@pepbits/erp-data";
import { useProductRequest } from "../product-services";
import { IdentityDeviceWorkspace } from "./workspace";
export function IdentityLibraryPage({ pageId }: { pageId: string }) {
  const request = useProductRequest(),
    product = useProduct(),
    host = useERP(),
    { user } = useSession(),
    adapter = useMemo(
      () => createIdentityAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <IdentityDeviceWorkspace
      adapter={adapter}
      scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
      pageId={pageId}
      preferences={host.preferences}
      preferencePolicy={host.preferencePolicy}
      preferencesAvailable={host.preferencesAvailable}
      onPreferenceChange={host.updatePreference}
    />
  );
}
