"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { createCareAdapter } from "@pepbits/erp-data";
import type { CarePageId } from "@pepbits/erp-config";
import { useProductRequest } from "../product-services";
import { CareWorkspace } from "./workspace";
export function CareLibraryPage({ pageId }: { pageId: CarePageId }) {
  const request = useProductRequest(),
    product = useProduct(),
    host = useERP(),
    { user } = useSession(),
    adapter = useMemo(
      () => createCareAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <CareWorkspace
      pageId={pageId}
      adapter={adapter}
      scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
      preferences={host.preferences}
      preferencePolicy={host.preferencePolicy}
      preferencesAvailable={host.preferencesAvailable}
      onPreferenceChange={host.updatePreference}
    />
  );
}
