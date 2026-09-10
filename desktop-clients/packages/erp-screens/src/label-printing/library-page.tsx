"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { createLabelAdapter } from "@pepbits/erp-data";
import { LABEL_PAGES } from "@pepbits/erp-config";
import { useProductRequest } from "../product-services";
import { LabelPrintingWorkspace } from "./workspace";
export function LabelLibraryPage({ pageId }: { pageId: string }) {
  const request = useProductRequest(),
    product = useProduct(),
    host = useERP(),
    { user } = useSession(),
    adapter = useMemo(
      () => createLabelAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <LabelPrintingWorkspace
      adapter={adapter}
      scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
      category={LABEL_PAGES.find((p) => p[0] === pageId)?.[1] ?? "items"}
      preferences={host.preferences}
      preferencePolicy={host.preferencePolicy}
      preferencesAvailable={host.preferencesAvailable}
      onPreferenceChange={host.updatePreference}
    />
  );
}
