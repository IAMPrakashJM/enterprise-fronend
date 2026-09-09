"use client";
import React from "react";
import type { TriageValues, TriageConfiguration } from "@pepbits/erp-config";
import {
  ClinicalDocumentWorkspace,
  type ClinicalDocumentWorkspaceProps,
} from "../clinical-document/workspace";
import { triageDefinition } from "./editor";
export type ClinicalTriageWorkspaceProps = Omit<
  ClinicalDocumentWorkspaceProps<TriageValues, TriageConfiguration>,
  "definition" | "pageId"
>;
export function ClinicalTriageWorkspace(props: ClinicalTriageWorkspaceProps) {
  return (
    <ClinicalDocumentWorkspace
      {...props}
      pageId="clinical-triage"
      definition={triageDefinition}
    />
  );
}
