"use client";

import React from "react";
import type { NavigationTarget } from "@pepbits/platform-ports";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import { ModuleDashboard } from "./dashboard/module-dashboard";
import { WorklistPage } from "./worklist/worklist-page";
import { DynamicRecordForm } from "./forms/dynamic-record-form";
import { BillingPage } from "./billing/billing-page";
import { ReportsPage } from "./reports/reports-page";
import { PreferencesPage } from "./preferences";
import { SpreadsheetPage } from "./spreadsheet";
import { LibraryPage } from "./library";
import { AiAdministration } from "@pepbits/ai-ui";

/* The switch body is unchanged from EnterpriseApp's PageRenderer. What changed is
   where mode and recordId come from: an explicit target, supplied by the route on
   web and by the active tab on desktop, rather than a tab read from context. */
export function PageRenderer({ target, showTabPreferences = true }: { target: NavigationTarget; showTabPreferences?: boolean }) {
  const page = PAGE_REGISTRY[target.pageId];
  if (!page) return <div className="p-8 text-center text-sm text-[var(--text-muted)]">Page configuration was not found.</div>;
  if (target.mode && (page.kind === "worklist" || page.kind === "form")) return <DynamicRecordForm page={page} target={target} />;
  switch (page.kind) {
    case "dashboard": return <ModuleDashboard moduleKey={page.module === "shared" ? undefined : page.module} />;
    case "worklist": return <WorklistPage page={page} />;
    case "form": return <DynamicRecordForm page={page} target={target} />;
    case "billing": return <BillingPage page={page} />;
    case "reports": return <ReportsPage page={page} />;
    case "preferences": return <PreferencesPage showTabPreferences={showTabPreferences} />;
    case "spreadsheet": return <SpreadsheetPage />;
    case "library": return <LibraryPage page={page} />;
    case "ai-admin": return <AiAdministration />;
    default: return <WorklistPage page={page} />;
  }
}
