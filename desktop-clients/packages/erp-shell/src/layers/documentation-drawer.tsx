"use client";
import { LocalizedText } from "@pepbits/ops-ui";


import { useProduct } from "../product-context";

import React from "react";
import { Badge, Button, Drawer } from "@pepbits/ops-ui";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "../erp-context";

export function DocumentationDrawer() {
  const product = useProduct();
  const { documentationOpen, setDocumentationOpen, preferences } = useERP();
  const navigation = useNavigation();
  if (!preferences.documentationEnabled) return null;
  const page = product.pages[navigation.current.pageId];
  return (
    <Drawer open={documentationOpen} onClose={() => setDocumentationOpen(false)} title="Product documentation" subtitle={page?.title ?? "Enterprise workspace"} side={preferences.docsPosition} width="lg" footer={<><Button variant="ghost" onClick={() => setDocumentationOpen(false)}><LocalizedText message="ui.close.7d9eb7ac" /></Button><Button variant="primary" onClick={() => { navigation.open({ pageId: "integration-guide" }); setDocumentationOpen(false); }}><LocalizedText message="ui.developer.guide.b361713a" /></Button></>}>
      <div className="space-y-4 p-5"><div className="rounded-2xl bg-[var(--primary-soft)] p-4"><Badge tone="brand"><LocalizedText message="ui.page.guide.c2948632" /></Badge><h3 className="mt-2 text-[length:calc(15px*var(--fs-scale))] font-black">{page?.title}</h3><p className="mt-1 text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{page?.subtitle}</p></div>{[
        ["Purpose", "This page is rendered from the central page registry and uses shared shell, theme, access and preference contracts."],
        ["Interaction model", "Search, filtering, forms, views and feedback are composed from reusable components so behavior remains consistent."],
        ["Extension rule", "Add new fields through entity schemas, new pages through the page registry and new themes through semantic design tokens."],
        ["Accessibility", "All primary actions are keyboard focusable, overlays close with Escape and reduced motion is available in preferences."],
      ].map(([title, text]) => <section key={title} className="rounded-xl border border-[var(--border)] p-4"><h4 className="text-[length:calc(11px*var(--fs-scale))] font-black">{title}</h4><p className="mt-1.5 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{text}</p></section>)}</div>
    </Drawer>
  );
}
