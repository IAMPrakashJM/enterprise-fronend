"use client";
import React, { useMemo, useState } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import {
  CLINICAL_TEMPLATE_PAGES,
  type PageDefinition,
} from "@pepbits/erp-config";
import { createClinicalTemplateAdapter } from "@pepbits/erp-data";
import { useNavigation, type NavigationTarget } from "@pepbits/platform-ports";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  Textarea,
  useLocalization,
} from "@pepbits/ops-ui";
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
  const { t } = useLocalization(),
    { user } = useSession(),
    { preferences, preferencePolicy, preferencesAvailable, updatePreference } = useERP(),
    product = useProduct(),
    request = useProductRequest(),
    navigation = useNavigation(),
    [tab, setTab] = useState("preview"),
    [copied, setCopied] = useState(false);
  const adapter = useMemo(
      () => createClinicalTemplateAdapter(request, product.id),
      [request, product.id],
    ),
    view =
      views[CLINICAL_TEMPLATE_PAGES.findIndex((p) => p.id === page.id)] ??
      "query";
  const code = `import { ClinicalPatientWorkspace } from '@pepbits/erp-screens';\nimport { createClinicalTemplateAdapter } from '@pepbits/erp-data';\nimport type { PreferenceHost } from '@pepbits/erp-screens';\n\nexport function PatientPage({ request, productId, scopeKey, ...host }: {\n  request: (path: string, init?: RequestInit) => Promise<Response>;\n  productId: string;\n  scopeKey: string; // tenant + application + user + record\n} & PreferenceHost) {\n  const adapter = React.useMemo(() => createClinicalTemplateAdapter(request, productId), [request, productId]);\n  return <ClinicalPatientWorkspace adapter={adapter} scopeKey={scopeKey}\n    initialPage={{ view: '${view}' }} {...host} />;\n}\n`;
  return (
    <div className="space-y-4" data-clinical-library={page.id}>
      {view !== "overview" ? (
        <div className="flex items-center justify-between gap-2">
          <Tabs
            items={[
              { id: "preview", label: "template.preview" },
              { id: "code", label: "template.typescript" },
              { id: "guide", label: "template.guide" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <Badge>
            {t(
              view === "record"
                ? "template.clinical.demoRecord"
                : "template.clinical.demoQuery",
            )}
          </Badge>
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <Badge tone="brand">{t("template.clinical.library")}</Badge>
                <h2 className="text-xl font-bold">
                  {t(page.titleKey ?? page.title)}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {CLINICAL_TEMPLATE_PAGES.map((p) => (
                  <Button
                    key={p.id}
                    variant={p.id === page.id ? "primary" : "secondary"}
                    onClick={() => navigation.open({ pageId: p.id })}
                  >
                    {t(p.title)}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {t("template.clinical.demoNotice")}
            </p>
            <Tabs
              items={[
                { id: "preview", label: "template.preview" },
                { id: "code", label: "template.typescript" },
                { id: "guide", label: "template.guide" },
              ]}
              value={tab}
              onChange={setTab}
            />
          </CardContent>
        </Card>
      )}
      <div hidden={tab !== "preview"}>
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
              pageId:
                CLINICAL_TEMPLATE_PAGES[views.indexOf(destination.view)].id,
              recordId: destination.patientId,
              mode: destination.mode,
            })
          }
        />
      </div>
      {tab === "code" ? (
        <Card>
          <CardHeader>
            <CardTitle
              title="template.typescript"
              action={
                <Button
                  onClick={() =>
                    void navigator.clipboard
                      ?.writeText("import React from 'react';\n" + code)
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false))
                  }
                >
                  {t("catalog.copy")}
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              label="template.source"
              value={"import React from 'react';\n" + code}
              readOnly
              dir="ltr"
              rows={22}
              className="font-mono text-xs"
            />
            <p role="status">
              {t(copied ? "catalog.copied" : "catalog.copyHint")}
            </p>
          </CardContent>
        </Card>
      ) : tab === "guide" ? (
        <Card>
          <CardHeader>
            <CardTitle title="template.guide" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "guideFlow",
              "guideComponents",
              "guideApi",
              "guideSave",
              "guidePreferences",
              "guideLimits",
            ].map((key) => (
              <p key={key}>{t(`template.clinical.${key}`)}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
