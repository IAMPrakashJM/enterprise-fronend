"use client";
import React, { useState } from "react";
import { Button, Card, CardContent, CardGrid, SearchInput, EmptyState, Textarea, useLocalization } from "@pepbits/ops-ui";
import { useNavigation } from "@pepbits/platform-ports";
import { useProduct } from "@pepbits/erp-shell";
import type { PageDefinition } from "@pepbits/erp-config";
import { CATALOG_GROUPS, CATALOG_ENTRIES, filterCatalog, type CatalogEntry } from "./catalog";
import * as demos from "./demos";
import examples from "./examples.generated.json";

function Example({entry}: {entry:CatalogEntry}) {
  const {t} = useLocalization();
  const [revision,setRevision] = useState(0);
  const [copyState,setCopyState] = useState<"idle"|"copied"|"failed">("idle");
  const Demo = demos[entry.id];
  const code = examples[entry.id];
  const copy = async () => {
    try {await navigator.clipboard.writeText(code);setCopyState("copied");}
    catch {setCopyState("failed");}
  };
  return <Card as="article" className="min-w-0" data-catalog-example={entry.id}>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="text-base font-bold break-words" dir="ltr">{entry.components.join(" / ")}</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)] break-words" dir="ltr">{entry.source.startsWith("@") ? entry.source : `@pepbits/ops-ui: ${entry.source}`}</p>
        </div>
        <Button onClick={() => {setRevision(value=>value+1);setCopyState("idle");}}>{t("catalog.reset")}</Button>
      </div>
      <p className="text-sm text-[var(--text-muted)]">{t(`catalog.example.${entry.id}`)}</p>
      <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
        <section style={{"--fs-scale":"var(--fs-form)"} as React.CSSProperties} className="min-w-0 space-y-3" aria-label={t("catalog.preview")}><h4 className="text-sm font-semibold">{t("catalog.preview")}</h4><Demo key={revision}/></section>
        <section className="min-w-0 space-y-3" aria-label={t("catalog.code")}>
          <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">{t("catalog.code")}</h4><Button onClick={() => void copy()}>{t("catalog.copy")}</Button></div>
          <Textarea aria-label="catalog.code" label="catalog.code" value={code} readOnly spellCheck={false} dir="ltr" rows={14} className="font-mono text-xs" onFocus={e=>e.target.select()}/>
          <p role="status" className="text-sm">{copyState === "copied" ? t("catalog.copied") : copyState === "failed" ? t("catalog.copyFailed") : t("catalog.copyHint")}</p>
        </section>
      </div>
    </CardContent>
  </Card>;
}

export function ComponentCatalog({page}: {page:PageDefinition}) {
  const {t} = useLocalization();
  const navigation=useNavigation();
  const product=useProduct();
  const [query,setQuery]=useState("");
  const group=CATALOG_GROUPS.find(item=>item.pageId===page.id);
  const entries=filterCatalog(group?.key,query);
  const available=CATALOG_GROUPS.filter(item=>product.pages[item.pageId]);
  return <div className="space-y-4" data-component-catalog={page.id}>
    <Card><CardContent className="space-y-3">
      <h2 className="text-2xl font-bold">{t(group ? `catalog.group.${group.key}` : "catalog.title")}</h2>
      <p className="text-sm text-[var(--text-muted)]">{t("catalog.intro")}</p>
      <p className="text-sm">{t("catalog.setup")}</p>
      <p className="text-sm">{t("catalog.safety")}</p>
      {group ? <p className="text-sm font-medium">{t(`catalog.help.${group.key}`)}</p> : null}
      <SearchInput aria-label="catalog.search" placeholder="catalog.search" value={query} onChange={setQuery} onClear={()=>setQuery("")}/>
      <p role="status" className="text-sm text-[var(--text-muted)]">{t("catalog.count",{count:entries.length,total:CATALOG_ENTRIES.length})}</p>
    </CardContent></Card>
    <nav aria-label={t("catalog.groups")} className="flex flex-wrap gap-2">
      {product.pages["component-library"] ? <Button aria-current={!group?"page":undefined} variant={!group?"primary":"secondary"} onClick={()=>navigation.open({pageId:"component-library"})}>{t("catalog.all")}</Button> : null}
      {available.map(item=><Button key={item.pageId} aria-current={item.key===group?.key?"page":undefined} variant={item.key===group?.key?"primary":"secondary"} onClick={()=>navigation.open({pageId:item.pageId})}>{t(`catalog.group.${item.key}`)}</Button>)}
    </nav>
    {!group && !query ? <CardGrid columns={3}>{available.map(item=><Card key={item.pageId}><CardContent className="space-y-3"><h3 className="font-semibold">{t(`catalog.group.${item.key}`)}</h3><p className="text-sm text-[var(--text-muted)]">{t(`catalog.help.${item.key}`)}</p><Button onClick={()=>navigation.open({pageId:item.pageId})}>{t("catalog.browse")}</Button></CardContent></Card>)}</CardGrid> : null}
    {entries.length ? entries.map(entry=><Example key={`${page.id}:${entry.id}`} entry={entry}/>) : <EmptyState/>}
  </div>;
}
