"use client";
import React,{useEffect,useRef} from 'react';
import {sentinelReference,reportSentinelFailure,subscribeSentinel,SentinelQueue,authedFetch,readToken,type SentinelEvent} from '@pepbits/auth';
import {DOCUMENTATION_RELEASE} from '@pepbits/erp-config';
import {useNavigation} from '@pepbits/platform-ports';
import {Button,LocalizedText} from '@pepbits/ops-ui';
import {useProduct,useProductPreferenceRequest} from './product-context';

export function SentinelBridge(){
 const product=useProduct(),navigation=useNavigation(),transport=useProductPreferenceRequest()??authedFetch,token=readToken();
 const context=useRef({pageId:navigation.current.pageId,breadcrumbs:[] as string[]});
 useEffect(()=>{context.current={pageId:navigation.current.pageId,breadcrumbs:[...context.current.breadcrumbs,navigation.current.pageId].slice(-8)};},[navigation.current.pageId]);
 useEffect(()=>{
  const controller=new AbortController();
  const queue=new SentinelQueue(async events=>{
   if(!token||readToken()!==token){queue.stop();return;}
   const delivery=new AbortController();const abort=()=>delivery.abort();controller.signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,10000);
   let response:Response;
   try{response=await transport('/monitoring/events',{method:'POST',signal:delivery.signal,headers:{'Content-Type':'application/json','X-Product-Id':product.id},body:JSON.stringify({events})});}finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort);}
   if([400,401,403].includes(response.status)){queue.stop();return;}
   if(!response.ok)throw Error('Monitoring delivery failed');
   if(events.some(e=>e.code==='native-panic'))void import('@tauri-apps/api/core').then(({invoke})=>invoke('sentinel_acknowledge_failure')).catch(()=>{});
  });
  const capture=(detail:Partial<SentinelEvent>)=>{try{
   if(!token||readToken()!==token||!product.pages[context.current.pageId])return;
   queue.capture({...detail,id:detail.id??sentinelReference(),pageId:context.current.pageId,breadcrumbs:context.current.breadcrumbs.filter(id=>product.pages[id]),release:DOCUMENTATION_RELEASE,platform:'__TAURI_INTERNALS__' in window?'native':'web'});
  }catch{/* Diagnostic capture must never cause a second exception. */}};
  const unsubscribe=subscribeSentinel(capture);
  const error=(event:ErrorEvent)=>capture({kind:'runtime',code:'runtime-error',line:event.lineno,column:event.colno});
  const rejection=()=>capture({kind:'promise',code:'unhandled-rejection'});
  const explicit=(event:Event)=>capture((event as CustomEvent).detail??{});
  const flush=()=>{void queue.flush();};
  window.addEventListener('error',error);window.addEventListener('unhandledrejection',rejection);window.addEventListener('nexora-sentinel',explicit);window.addEventListener('online',flush);
  const timer=window.setInterval(flush,5000);
  // Optional Tauri bridge: native code emits an allowlisted signal, never panic text.
  let unlisten:(()=>void)|undefined;
  if('__TAURI_INTERNALS__' in window){
   void import('@tauri-apps/api/event').then(({listen})=>listen('sentinel-native-error',()=>capture({kind:'native',code:'native-panic'}))).then(stop=>{if(controller.signal.aborted)stop();else unlisten=stop;}).catch(()=>{});
   void import('@tauri-apps/api/core').then(({invoke})=>invoke<boolean>('sentinel_pending_failure')).then(pending=>{if(pending&&!controller.signal.aborted)capture({kind:'native',code:'native-panic'});}).catch(()=>{});
  }
  return()=>{unsubscribe();queue.stop();controller.abort();clearInterval(timer);unlisten?.();window.removeEventListener('error',error);window.removeEventListener('unhandledrejection',rejection);window.removeEventListener('nexora-sentinel',explicit);window.removeEventListener('online',flush);};
 },[product.id,transport,token]);
 return null;
}
export class SentinelBoundary extends React.Component<{children:React.ReactNode;resetKey?:string},{failed:boolean;reference:string}>{
 state={failed:false,reference:''};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){const id=sentinelReference();this.setState({reference:id});reportSentinelFailure({id,kind:'render',code:'render-error'});}
 componentDidUpdate(previous:{resetKey?:string}){if(this.state.failed&&previous.resetKey!==this.props.resetKey)this.setState({failed:false,reference:''});}
 render(){return this.state.failed?<div role="alert" className="m-5 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"><p><LocalizedText message="This page encountered an error. Please retry." /></p><p><LocalizedText message="Reference" />: <bdi>{this.state.reference}</bdi></p><Button onClick={()=>this.setState({failed:false,reference:''})}><LocalizedText message="Retry" /></Button><Button onClick={()=>window.location.reload()}><LocalizedText message="Reload" /></Button></div>:this.props.children;}
}
