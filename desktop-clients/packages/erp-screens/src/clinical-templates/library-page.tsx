"use client";
import React, { useMemo } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  CLINICAL_TEMPLATE_PAGES,
  type PageDefinition,
} from "@pepbits/erp-config";
import { createClinicalTemplateAdapter } from "@pepbits/erp-data";
import { useNavigation, type NavigationTarget } from "@pepbits/platform-ports";
import { useProductRequest } from "../product-services";
import { ClinicalPatientWorkspace } from "./workspace";
import type { ClinicalView } from "./shared";
const views: ClinicalView[] = ["query", "record", "overview"];
export function ClinicalLibraryPage({
  page,
  target,
}: {
  page: PageDefinition;
  target: NavigationTarget;
}) {
  const { user } = useSession(),
    { preferences, preferencePolicy, preferencesAvailable, updatePreference } =
      useERP(),
    product = useProduct(),
    request = useProductRequest(),
    navigation = useNavigation();
  const adapter = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    ),
    view =
      views[CLINICAL_TEMPLATE_PAGES.findIndex((p) => p.id === page.id)] ??
      "query";
  return (
    <div data-clinical-library={page.id}>
      <ClinicalPatientWorkspace
        adapter={adapter}
        scopeKey={JSON.stringify([
          user?.tenantId,
          product.id,
          user?.id,
          target,
        ])}
        initialPage={{ view, patientId: target.recordId, mode: target.mode }}
        preferences={preferences}
        preferencePolicy={preferencePolicy}
        preferencesAvailable={preferencesAvailable}
        onPreferenceChange={updatePreference}
        onOpen={(destination) =>
          navigation.openInNewContext({
            pageId: CLINICAL_TEMPLATE_PAGES[views.indexOf(destination.view)].id,
            recordId: destination.patientId,
            mode: destination.mode,
          })
        }
      />
    </div>
  );
}
