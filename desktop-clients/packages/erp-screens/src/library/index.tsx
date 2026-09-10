"use client";
import React, {Suspense, lazy} from "react";
import {LocalizedText} from "@pepbits/ops-ui";
import type {PageDefinition} from "@pepbits/erp-config";
import {LibraryReferencePage} from "./reference-pages";
import { TEMPLATE_BY_ID, CLINICAL_TEMPLATE_PAGES } from "@pepbits/erp-config";
const TemplateLibrary = lazy(() => import("../templates/template-library").then(module => ({default:module.TemplateLibraryPage})));
import { CATALOG_GROUPS } from "./catalog";
const Catalog = lazy(() => import("./component-catalog").then(module => ({default:module.ComponentCatalog})));

import type {NavigationTarget} from '@pepbits/platform-ports';
const ClinicalTriage=lazy(()=>import('../clinical-triage/library-page').then(m=>({default:m.ClinicalTriageLibraryPage})));
const ClinicalConsultation=lazy(()=>import('../clinical-consultation/library-page').then(m=>({default:m.ClinicalConsultationLibraryPage})));
const OPConsultation=lazy(()=>import('../op-consultation/library-page').then(m=>({default:m.OPConsultationLibraryPage})));
const BillingClinic=lazy(()=>import('../clinic-billing/library-page').then(m=>({default:m.BillingClinicLibraryPage})));
const ClinicalLibrary=lazy(()=>import('../clinical-templates/library-page').then(m=>({default:m.ClinicalLibraryPage})));
export function LibraryPage({page,target={pageId:page.id}}: {page:PageDefinition;target?:NavigationTarget}) {
  if(page.id==='clinical-triage')return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><ClinicalTriage/></Suspense>;
  if(page.id==='clinical-consultation')return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><ClinicalConsultation/></Suspense>;
  if(page.id==='op-consultation')return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><OPConsultation/></Suspense>;
  if(page.id==='billing-clinic')return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><BillingClinic/></Suspense>;
  if(CLINICAL_TEMPLATE_PAGES.some(p=>p.id===page.id))return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><ClinicalLibrary page={page} target={target}/></Suspense>;
  if(page.id === "page-templates" || TEMPLATE_BY_ID[page.id]) return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><TemplateLibrary key={page.id} page={page}/></Suspense>;
  if(page.id === "component-library" || CATALOG_GROUPS.some(group => group.pageId === page.id)) return <Suspense fallback={<p role="status"><LocalizedText message="Loading…"/></p>}><Catalog key={page.id} page={page}/></Suspense>;
  return <LibraryReferencePage page={page}/>;
}

