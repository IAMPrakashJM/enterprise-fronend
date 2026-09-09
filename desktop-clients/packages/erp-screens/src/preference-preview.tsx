"use client";
import React from "react";
import {Button, Card, CardHeader, CardTitle, CardContent, LocalizedText, CenterRecordCard, Drawer, Modal} from "@pepbits/ops-ui";
import type {PreviewMode} from "@pepbits/erp-config";
export function InlineRecordPreview({open,onClose,title,children,footer}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;footer?:React.ReactNode}) {
  if(!open)return null;
  return <Card data-inline-preview><CardHeader><CardTitle title={title}/><Button variant="ghost" onClick={onClose}><LocalizedText message="Close"/></Button></CardHeader><CardContent>{children}{footer?<div className="mt-4 flex flex-wrap gap-2">{footer}</div>:null}</CardContent></Card>;
}
export function PreferencePreview({mode, ...props}: {mode:PreviewMode;open:boolean;onClose:()=>void;title:string;children:React.ReactNode}) {
  if(mode==='inline')return <InlineRecordPreview {...props}/>;
  if(mode==='left-drawer'||mode==='right-drawer')return <Drawer {...props} side={mode==='left-drawer'?'left':'right'}/>;
  if(mode==='center-modal')return <Modal {...props}/>;
  return <CenterRecordCard {...props}/>;
}
