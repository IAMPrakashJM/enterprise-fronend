import type {DraftPolicy} from '@pepbits/erp-config';
import {RecordRequestFailure} from './records';
export interface DraftScope {productId:string;pageId:string;recordId:string;kind:'import'|'approval'}
export interface DraftPayload<T> {schemaVersion:number;context:string;data:T}
export interface SharedDraft<T> {values:DraftPayload<T>;version:number;savedAt:string;excludedFields?:string[];disabled?:boolean}
export interface SharedDraftBundle<T> {draft:SharedDraft<T>|null;draftVersion:number;draftPolicy:DraftPolicy}
export interface DraftAdapter {
 load<T>(scope:DraftScope):Promise<SharedDraftBundle<T>>;
 save<T>(scope:DraftScope,values:DraftPayload<T>,version:number,operationId:string):Promise<SharedDraft<T>>;
 discard(scope:DraftScope,version:number,operationId:string):Promise<void>;
}
export function createHttpDraftAdapter(request:(path:string,init?:RequestInit)=>Promise<Response>):DraftAdapter {
 async function call(scope:DraftScope,action:string,body={}){
  const {productId,...target}=scope;
  const response=await request('/drafts',{method:'POST',headers:{'Content-Type':'application/json','X-Product-Id':productId},body:JSON.stringify({...target,action,...body})});
  if(!response.ok)throw new RecordRequestFailure(response.status,response.headers.get('X-Sentinel-Reference')??undefined);
  if(response.status===204)return;
  const value=await response.json();
  const snapshot=(d:any)=>d&&Number.isSafeInteger(d.version)&&d.version>=0&&Number.isFinite(Date.parse(d.savedAt))&&(d.disabled||d.values&&typeof d.values.context==='string'&&typeof d.values.schemaVersion==='number'&&d.values.data&&typeof d.values.data==='object');
  if(action==='load'?(!value||!Number.isSafeInteger(value.draftVersion)||value.draftVersion<0||!value.draftPolicy||(value.draft!==null&&!snapshot(value.draft))):!snapshot(value))throw new RecordRequestFailure(502);
  return value;
 }
 return {load:scope=>call(scope,'load'),save:(scope,values,version,operationId)=>call(scope,'draft',{values,version,operationId}),discard:(scope,version,operationId)=>call(scope,'discard',{version,operationId})};
}
/** Contexts are hashes, never raw headers, record values or approval histories. */
export async function draftContext(value:unknown):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
