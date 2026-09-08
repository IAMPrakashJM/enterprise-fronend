"use client";
import React, { createContext, useContext, useMemo, useRef } from "react";
import { authedFetch, readToken, recoveryRequest, RequestFailure, expireCurrentSession } from "@pepbits/auth";
import {useLocalization} from "@pepbits/ops-ui";
import {localizeApiMessage} from "@pepbits/erp-config";
import type { DraftAdapter, RecordAdapter, RecordPanelsAdapter, ImportAdapter, ApprovalAdapter } from "@pepbits/erp-data";

export type ProductRequest = (path: string, init?: RequestInit) => Promise<Response>;
export interface ProductServices {
  /** Worklist search/archive/cell edits, personal views, reference lists and export audit. */
  request?: ProductRequest;
  /** Optional domain implementation of the versioned record/draft contract. */
  records?: RecordAdapter;
  panels?: RecordPanelsAdapter;
  imports?: ImportAdapter;
  approvals?: ApprovalAdapter;
  drafts?: DraftAdapter;
}
export const ProductDraftContext = createContext<DraftAdapter | null>(null);
export const ProductApprovalContext = createContext<ApprovalAdapter | null>(null);
export const ProductImportContext = createContext<ImportAdapter | null>(null);
export const ProductPanelsContext = createContext<RecordPanelsAdapter | null>(null);
export const ProductRecordContext = createContext<RecordAdapter | null>(null);
const RequestContext = createContext<ProductRequest>(authedFetch);
export function ProductServicesProvider({services,children}: {services:ProductServices;children:React.ReactNode}) {
  return <RequestContext.Provider value={services.request ?? authedFetch}>
    <ProductDraftContext.Provider value={services.drafts ?? null}><ProductApprovalContext.Provider value={services.approvals ?? null}><ProductImportContext.Provider value={services.imports ?? null}><ProductRecordContext.Provider value={services.records ?? null}><ProductPanelsContext.Provider value={services.panels ?? null}>{children}</ProductPanelsContext.Provider></ProductRecordContext.Provider></ProductImportContext.Provider></ProductApprovalContext.Provider></ProductDraftContext.Provider>
  </RequestContext.Provider>;
}
export function useProductRequest(): ProductRequest {
  const request = useContext(RequestContext);
  const token = useRef(readToken());token.current=readToken();
  const {t}=useLocalization();
  const translate=useRef(t);translate.current=t;
  return useMemo(() => (path,init) => {
    if (!token.current || token.current !== readToken()) return Promise.reject(new RequestFailure(401));
    const requestToken=token.current;
    return (request===authedFetch?request(path,init):recoveryRequest(request,path,init)).then(async response => {
      if(response.status===401&&!path.startsWith('/monitoring/'))expireCurrentSession(requestToken);
      if(response.ok || !response.headers.get('Content-Type')?.includes('application/json'))return response;
      const body=await response.clone().json().catch(()=>null);
      if(!body || typeof body.error!=='string' || !body.errorMessage)return response;
      const headers=new Headers(response.headers);headers.delete('Content-Length');headers.delete('Content-Encoding');
      return new Response(JSON.stringify({...body,error:localizeApiMessage(body.errorMessage,body.error,translate.current)}),{status:response.status,statusText:response.statusText,headers});
    });
  }, [request]);
}
