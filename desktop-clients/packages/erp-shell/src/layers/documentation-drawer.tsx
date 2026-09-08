"use client";
import React,{useEffect,useState} from 'react';
import {Button,Drawer,LocalizedText} from '@pepbits/ops-ui';
import {useNavigation} from '@pepbits/platform-ports';
import {DOCUMENTATION_RELEASE} from '@pepbits/erp-config';
import {useProduct} from '../product-context';
import {useERP} from '../erp-context';
import {DocumentationArticle} from '../documentation';
export function DocumentationDrawer(){
 const product=useProduct(),navigation=useNavigation();const {documentationOpen,setDocumentationOpen,setHelpOpen,preferences}=useERP();
 const [target,setTarget]=useState({pageId:'',sectionId:'',releaseId:DOCUMENTATION_RELEASE});
 useEffect(()=>{const select=(event:Event)=>setTarget((event as CustomEvent).detail);window.addEventListener('nexora-documentation-section',select);return()=>window.removeEventListener('nexora-documentation-section',select);},[]);
 useEffect(()=>{if(!documentationOpen)setTarget({pageId:'',sectionId:'',releaseId:DOCUMENTATION_RELEASE});},[documentationOpen]);
 if(!preferences.documentationEnabled)return null;
 const pageId=target.pageId||navigation.current.pageId;
 return <Drawer open={documentationOpen} onClose={()=>setDocumentationOpen(false)} title="Product documentation" subtitle={product.pages[pageId]?.title} side={preferences.docsPosition} width="lg" footer={<Button onClick={()=>{navigation.open({pageId:'documentation-center'});setDocumentationOpen(false);}}><LocalizedText message="Documentation Center" /></Button>}>
  {documentationOpen?<div className="p-5"><DocumentationArticle pageId={pageId} sectionId={target.sectionId} releaseId={target.releaseId} onTour={()=>{setDocumentationOpen(false);setHelpOpen(true);}} /></div>:null}
 </Drawer>;
}
