"use client";
import React, { useMemo, useState } from "react";
import { useSession } from "@pepbits/auth";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { createDesignerAdapter, createDcpRuntimeDemoAdapter } from "@pepbits/erp-data";

import { useProductRequest } from "../product-services";
import {Button,Modal,PresentationProvider,useLocalization} from "@pepbits/ops-ui";
import {effectivePreferences} from "@pepbits/erp-config";
import {DcpHostRuntime} from "./host-runtime";
import { DcpDesignerWorkspace } from "./workspace";
export function DcpDesignerLibraryPage() {
  const request = useProductRequest(),
    product = useProduct(),
    host = useERP(),
    { user } = useSession(),
    adapter = useMemo(
      () => createDesignerAdapter(request, product.id),
      [request, product.id],
    );
  const {t}=useLocalization(),[open,setOpen]=useState(false),[runtimeDirty,setRuntimeDirty]=useState(false),[confirmClose,setConfirmClose]=useState(false),runtime=useMemo(()=>createDcpRuntimeDemoAdapter(request,product.id),[request,product.id]);
  return (
   <><Button onClick={()=>setOpen(true)}>{t("designer.v1.open")}</Button>
   {open&&<Modal open onClose={()=>runtimeDirty?setConfirmClose(true):setOpen(false)} title={t("designer.v1.open")} size="xl"><PresentationProvider value={host.preferencePolicy?effectivePreferences(host.preferences,host.preferencePolicy):host.preferences}><DcpHostRuntime draftScope={{productId:product.id,pageId:"dcp-designer",recordId:"v1-employee-extras",kind:"dcp"}} onDirtyChange={setRuntimeDirty} adapter={runtime} scopeKey={JSON.stringify([user?.tenantId,product.id,user?.id])}/>{confirmClose&&<div><p>{t("designer.discardWarning")}</p><Button onClick={()=>{setOpen(false);setConfirmClose(false);}}>{t("designer.discard")}</Button><Button onClick={()=>setConfirmClose(false)}>{t("designer.keep")}</Button></div>}</PresentationProvider></Modal>}
    <DcpDesignerWorkspace
      adapter={adapter}
      scopeKey={JSON.stringify([user?.tenantId, product.id, user?.id])}
      preferences={host.preferences}
      preferencePolicy={host.preferencePolicy}
      preferencesAvailable={host.preferencesAvailable}
      onPreferenceChange={host.updatePreference}
    /></>
  );
}
