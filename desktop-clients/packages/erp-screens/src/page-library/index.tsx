"use client";
import React, { useState } from "react";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { useNavigation } from "@pepbits/platform-ports";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardGrid,
  CardHeader,
  CardTitle,
  EmptyState,
  Modal,
  SearchInput,
  Tabs,
  Textarea,
  useLocalization,
} from "@pepbits/ops-ui";
import { BillingPatientLauncher } from "./billing-patient-launcher";
import { pageLibraryEntries } from "./catalog";
import { PAGE_LIBRARY_RESOURCES } from "./resources";

function PageResource({
  id,
  tab,
  onTab,
}: {
  id: string;
  tab: string;
  onTab: (value: string) => void;
}) {
  const { t } = useLocalization();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const resource = PAGE_LIBRARY_RESOURCES[id];
  if (!resource) return <p>{t("template.pageLibrary.noResource")}</p>;
  return (
    <div className="space-y-4" data-page-resource={id}>
      <Badge tone="warning">{t(resource.demo)}</Badge>
      <Tabs
        items={[
          { id: "code", label: "template.typescript" },
          { id: "guide", label: "template.guide" },
        ]}
        value={tab}
        onChange={onTab}
      />
      {tab === "code" ? (
        <>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(resource.source);
                  setCopy("copied");
                } catch {
                  setCopy("failed");
                }
              }}
            >
              {t("catalog.copy")}
            </Button>
          </div>
          <Textarea
            label="template.source"
            value={resource.source}
            readOnly
            spellCheck={false}
            dir="ltr"
            rows={20}
            className="font-mono text-xs"
          />
          <p role="status">
            {t(
              copy === "copied"
                ? "catalog.copied"
                : copy === "failed"
                  ? "catalog.copyFailed"
                  : "catalog.copyHint",
            )}
          </p>
        </>
      ) : (
        resource.guides.map((key) => (
          <p key={key} className="text-sm">
            {t(key)}
          </p>
        ))
      )}
    </div>
  );
}

export function PageLibraryCatalog() {
  const product = useProduct(),
    navigation = useNavigation(),
    { t } = useLocalization(),
    { format } = useERP();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("guide");
  const pages = pageLibraryEntries(product);
  const matches = pages.filter((page) =>
    [
      page.id,
      t(page.titleKey ?? page.title),
      t(page.subtitleKey ?? page.subtitle ?? ""),
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  // Recheck membership when an API policy update changes the product while mounted.
  const active = pages.find((page) => page.id === selected);
  const resource = (id: string, kind: string) => {
    setSelected(id);
    setTab(kind);
  };
  return (
    <div className="space-y-4" data-page-library-catalog data-tour="list-of-pages">
      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t("template.pageLibrary.title")}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {t("template.pageLibrary.help")}
          </p>
          <SearchInput
            aria-label="template.pageLibrary.search"
            placeholder="template.pageLibrary.search"
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
          />
          <p role="status" className="text-sm text-[var(--text-muted)]">
            {t("template.pageLibrary.count", {
              count: format.number(matches.length),
              total: format.number(pages.length),
            })}
          </p>
        </CardContent>
      </Card>
      {matches.length ? (
        <CardGrid columns="auto" minCardWidth={320}>
          {matches.map((page) => (
            <Card key={page.id} data-page-library-entry={page.id}>
              <CardHeader>
                <CardTitle title={page.titleKey ?? page.title} />
              </CardHeader>
              <CardContent className="space-y-3">
                {PAGE_LIBRARY_RESOURCES[page.id] ? (
                  <Badge tone="warning">
                    {t(PAGE_LIBRARY_RESOURCES[page.id].demo)}
                  </Badge>
                ) : null}
                <p className="text-sm text-[var(--text-muted)]">
                  {t(page.subtitleKey ?? page.subtitle ?? "")}
                </p>
                {page.id === "billing-clinic" ? <BillingPatientLauncher /> : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() =>
                      navigation.openInNewContext({ pageId: page.id })
                    }
                  >
                    {t("template.pageLibrary.open")}
                  </Button>
                  <Button onClick={() => resource(page.id, "code")}>
                    {t("template.typescript")}
                  </Button>
                  <Button onClick={() => resource(page.id, "guide")}>
                    {t("template.guide")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardGrid>
      ) : (
        <EmptyState title="template.pageLibrary.empty" />
      )}
      <Modal
        open={!!active}
        size="xl"
        title={active ? t(active.titleKey ?? active.title) : ""}
        onClose={() => setSelected("")}
      >
        {active ? (
          <PageResource
            key={active.id}
            id={active.id}
            tab={tab}
            onTab={setTab}
          />
        ) : null}
      </Modal>
    </div>
  );
}
