"use client";
import React from "react";
import {CenterRecordCard, Drawer, Modal} from "@pepbits/ops-ui";
import type {PreviewMode} from "@pepbits/erp-config";
export function PreferencePreview({mode, ...props}: {mode:PreviewMode;open:boolean;onClose:()=>void;title:string;children:React.ReactNode}) {
  if(mode==='left-drawer'||mode==='right-drawer')return <Drawer {...props} side={mode==='left-drawer'?'left':'right'}/>;
  if(mode==='center-modal')return <Modal {...props}/>;
  return <CenterRecordCard {...props}/>;
}
