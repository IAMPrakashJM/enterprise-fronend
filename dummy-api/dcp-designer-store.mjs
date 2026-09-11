import {readFileSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {parseCsv,writeCsvSnapshot} from './clinical-template-csv.ts';
import {DESIGNER_TYPES,isDesignerDefinition} from '../desktop-clients/packages/erp-config/src/dcp-designer.ts';
const initial=JSON.parse(readFileSync(new URL('./config/dcp-designer/initial.json',import.meta.url),'utf8'));
const fail=(status,error)=>({status,body:{error}});
export function createDesignerStore(file){return {handle(user,product,input){
 if(!user?.id||!user?.tenantId)return fail(403,'designer.denied');
 if(!input||!['load','save'].includes(input.action))return fail(400,'designer.invalid');
 let all={};try{const [header,...rows]=parseCsv(readFileSync(file,'utf8'));if(header.join(',')!=='scope,data')throw Error('Invalid designer store');all=Object.fromEntries(rows.map(([k,v])=>[k,JSON.parse(v)]));}catch(e){if(e.code!=='ENOENT')throw e;}
 const scope=JSON.stringify([user.tenantId,product,user.id]),bucket=all[scope]??{records:[],receipts:{}};
 const view=record=>({canDesign:user.role==='enterprise-admin',types:[...DESIGNER_TYPES],records:bucket.records,record});
 if(input.action==='load'){const r=input.id?bucket.records.find(r=>r.id===input.id):null;if(input.id&&!r)return fail(404,'designer.notFound');return {status:200,body:{...view(r),initial}};}
 if(user.role!=='enterprise-admin')return fail(403,'designer.denied');
 if(typeof input.operationId!=='string'||! /^[\w-]{1,100}$/.test(input.operationId)||!isDesignerDefinition(input.definition))return fail(400,'designer.invalid');
 const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex'),receipt=bucket.receipts[input.operationId];
 if(receipt)return receipt.hash===hash?{status:200,body:receipt.result}:fail(409,'designer.conflict');
 const prior=input.id?bucket.records.find(r=>r.id===input.id):null;
 if(input.id&&!prior)return fail(404,'designer.notFound');
 if(prior&&input.revision!==prior.revision)return fail(409,'designer.conflict');
 if(!prior&&bucket.records.length>=100)return fail(400,'designer.limit');
 const r={id:prior?.id??randomUUID(),revision:(prior?.revision??0)+1,updatedAt:new Date().toISOString(),definition:structuredClone(input.definition)};
 if(prior)bucket.records[bucket.records.indexOf(prior)]=r;else bucket.records.push(r);
 const result={...view(r),initial};bucket.receipts[input.operationId]={hash,result};const keys=Object.keys(bucket.receipts);while(keys.length>100)delete bucket.receipts[keys.shift()];all[scope]=bucket;
 const q=s=>'"'+String(s).replaceAll('"','""')+'"';writeCsvSnapshot(file,'scope,data\n'+Object.entries(all).map(([k,v])=>q(k)+','+q(JSON.stringify(v))).join('\n')+'\n');return {status:200,body:result};
 }};}
