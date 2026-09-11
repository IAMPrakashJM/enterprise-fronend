import {isDcpLoaded,isDcpSaved,isDcpRevision,isDcpValues,type DcpLoaded,type DcpSaved,type DcpSave} from '@pepbits/erp-config';
import {ClinicalRequestFailure} from './clinical-templates';
export interface DcpRuntimeAdapter {load(signal?:AbortSignal):Promise<DcpLoaded>;preview(command:DcpSave,signal?:AbortSignal):Promise<DcpSaved>;save(command:DcpSave,signal?:AbortSignal):Promise<DcpSaved>}
/** Authenticated host request and record-bound paths. No route is installed or inferred here. */
export function createDcpRuntimeAdapter(request:(path:string,init:RequestInit)=>Promise<Response>,paths:{load:string;preview:string;save:string}):DcpRuntimeAdapter{
 async function call(action:keyof typeof paths,body?:DcpSave,signal?:AbortSignal){
  const path=paths[action];if(!path.startsWith('/')||path.startsWith('//')||path.includes('\\'))throw new ClinicalRequestFailure(400,{form:'designer.invalid'});
  if(body&&(!isDcpRevision(body.expectedVersion)||!isDcpValues(body.patch)||!['PINNED','LIVE'].includes(body.mode)||!body.checksum))throw new ClinicalRequestFailure(400,{form:'designer.invalidValues'});
  const abort=new AbortController(),cancel=()=>abort.abort();if(signal?.aborted)cancel();signal?.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,30000);
  try{const r=await request(path,{method:action==='load'?'GET':'POST',headers:{'Content-Type':'application/json','Pepbits-Contract-Version':'1'},body:body?JSON.stringify(body):undefined,signal:abort.signal});const payload:unknown=await r.json();
   if((r.ok||r.status===422)&&(action==='load'?isDcpLoaded(payload):isDcpSaved(payload))){if(r.status===422&&!(payload as DcpSaved).view.violations.length)throw new ClinicalRequestFailure(502,{form:'designer.invalidResponse'});return payload;}
   throw new ClinicalRequestFailure(r.ok?502:r.status,{form:r.ok?'designer.invalidResponse':'designer.hostError'},r.headers.get('X-Sentinel-Reference')??undefined);
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
 }
 return {load:signal=>call('load',undefined,signal) as Promise<DcpLoaded>,preview:(body,signal)=>call('preview',body,signal) as Promise<DcpSaved>,save:(body,signal)=>call('save',body,signal) as Promise<DcpSaved>};
}
/** Library demonstration uses the API-owned fixture/snapshot, never frontend response mocks. */
export function createDcpRuntimeDemoAdapter(request:(path:string,init?:RequestInit)=>Promise<Response>,product:string):DcpRuntimeAdapter{
 return createDcpRuntimeAdapter((path,init)=>request('/dcp-designer',{...init,method:'POST',headers:{...init.headers,'X-Product-Id':product},body:JSON.stringify({action:'backend-'+path.slice(1),...(init.body?{command:JSON.parse(String(init.body))}:{})})}),{load:'/load',preview:'/preview',save:'/save'});
}
