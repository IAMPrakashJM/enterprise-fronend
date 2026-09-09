"use client";
import React, { useMemo, useState } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  createClinicalTemplateAdapter,
  createClinicalTriageAdapter,
} from "@pepbits/erp-data";
import { Tabs, Textarea, Button, useLocalization } from "@pepbits/ops-ui";
import { useProductRequest } from "../product-services";
import { ClinicalTriageWorkspace } from "./workspace";
import { ClinicPanel } from "../clinic-billing/parts";
const source = `import React from 'react';
import { ClinicalTriageWorkspace, type PreferenceHost } from '@pepbits/erp-screens';
import { createClinicalTriageAdapter, createClinicalTemplateAdapter } from '@pepbits/erp-data';

export function TriagePage({ request, productId, scopeKey, ...host }: PreferenceHost & {
 request: (path: string, init?: RequestInit) => Promise<Response>;
 productId: string;
 scopeKey: string; // authenticated tenant + application + user
}) {
 const adapter = React.useMemo(() => createClinicalTriageAdapter(request, productId), [request, productId]);
 const patients = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);
 return <ClinicalTriageWorkspace adapter={adapter} patients={patients} scopeKey={scopeKey} {...host} />;
}`;
export function ClinicalTriageLibraryPage() {
  const { t } = useLocalization(),
    { user } = useSession(),
    product = useProduct(),
    request = useProductRequest(),
    host = useERP(),
    [tab, setTab] = useState("preview"),
    [copied, setCopied] = useState(false),
    adapter = useMemo(
      () => createClinicalTriageAdapter(request, product.id),
      [request, product.id],
    ),
    patients = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    );
  return (
    <div className="space-y-4">
      <Tabs
        items={[
          { id: "preview", label: "template.preview" },
          { id: "code", label: "template.typescript" },
          { id: "guide", label: "template.guide" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div hidden={tab !== "preview"}>
        <ClinicalTriageWorkspace
          adapter={adapter}
          patients={patients}
          scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
          preferences={host.preferences}
          preferencePolicy={host.preferencePolicy}
          preferencesAvailable={host.preferencesAvailable}
          onPreferenceChange={host.updatePreference}
        />
      </div>
      {tab === "code" ? (
        <ClinicPanel
          title="template.typescript"
          action={
            <Button
              onClick={() =>
                void navigator.clipboard
                  ?.writeText(source)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false))
              }
            >
              {t("catalog.copy")}
            </Button>
          }
        >
          <Textarea
            label="template.source"
            value={source}
            readOnly
            rows={20}
            dir="ltr"
            className="font-mono"
          />
          <p role="status">
            {t(copied ? "catalog.copied" : "catalog.copyHint")}
          </p>
        </ClinicPanel>
      ) : tab === "guide" ? (
        <ClinicPanel title="template.guide">
          {[
            "guideFlow",
            "guideIntegration",
            "guidePreferences",
            "guideRecovery",
            "guideLimits",
          ].map((key) => (
            <p key={key}>{t("template.triage." + key)}</p>
          ))}
        </ClinicPanel>
      ) : null}
    </div>
  );
}
