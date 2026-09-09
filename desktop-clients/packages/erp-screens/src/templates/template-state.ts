import type {PageTemplateDefinition,TemplateDocument,TemplateLine} from '@pepbits/erp-config';
export interface TemplateScope {tenantId:string;applicationId:string;userId:string;pageId:string;recordId:string}
export interface TemplateSaveRequest {scope:TemplateScope;templateId:string;document:TemplateDocument;expectedVersion:number;operationId:string}
/** Implement authorization, version checks and operation receipts on the server. */
export interface PageTemplateAdapter {save(request:TemplateSaveRequest):Promise<TemplateDocument>;load?(scope:TemplateScope,templateId:string):Promise<TemplateDocument>}
export function lineTotals(lines:TemplateLine[],precision=2) {
 const scale=10**precision;
 const sum=(get:(line:TemplateLine)=>number)=>lines.reduce((total,line)=>total+Math.round(get(line)*scale),0)/scale;
 const debit=sum(line=>line.debit),credit=sum(line=>line.credit);
 return {amount:sum(line=>line.quantity*line.price),debit,credit,difference:Math.round((debit-credit)*scale)/scale};
}
export function validateTemplate(definition:PageTemplateDefinition,document:TemplateDocument):Record<string,string> {
 const errors:Record<string,string>={};
 for(const section of definition.sections)for(const field of section.fields){
  const value=document.values[field.id];
  if(field.required&&(value===undefined||String(value).trim()===''))errors[field.id]='template.validation.required';
  else if(field.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))errors[field.id]='template.validation.email';
  else if(field.type==='number'&&value!==undefined&&(!Number.isFinite(Number(value))||(field.min!==undefined&&Number(value)<field.min)))errors[field.id]='template.validation.number';
 }
 if(document.values.dueDate&&document.values.effectiveDate&&String(document.values.dueDate)<String(document.values.effectiveDate))errors.dueDate='template.validation.date';
 if(definition.engine==='booking'&&String(document.values.endTime??'')<=String(document.values.startTime??''))errors.endTime='template.validation.time';
 if(['order','finance'].includes(definition.engine)){
  if(!document.lines.length)errors.lines='template.validation.lines';
  if(document.lines.some(line=>!line.description.trim()||![line.quantity,line.price,line.debit,line.credit].every(value=>Number.isFinite(value)&&value>=0)||(definition.engine==='order'&&line.quantity<=0)))errors.lines='template.validation.lines';
 }
 if(definition.engine==='finance'){
  const totals=lineTotals(document.lines);
  if(totals.difference!==0||totals.debit<=0||document.lines.some(line=>line.debit>0&&line.credit>0))errors.balance='template.validation.balance';
 }
 if(definition.id==='template-hierarchical-master'){for(const row of document.rows){const visited=new Set<string>();let id=String(row.code);while(id){if(visited.has(id)){errors.hierarchy='template.validation.hierarchy';break;}visited.add(id);id=String(document.values[`parent.${id}`]??'');}}}
 return errors;
}
export function createTemplateSample(definition:PageTemplateDefinition):TemplateDocument {
 const values:TemplateDocument['values']={code:'DEMO-001',name:'Alex Morgan',status:'active',effectiveDate:'2026-09-09',dueDate:'2026-09-20',birthDate:'1990-04-12',email:'alex@example.test',phone:'0000000000',address:'Example address',city:'Demo City',department:'Demo department',owner:'Demo team',party:'Example organization',resource:'Room A',startTime:'09:00',endTime:'09:30',enabled:true,frequency:definition.id==='template-schedule-configuration'||definition.id==='template-recurring-order'?'daily':'active',payer:'Example payer',vehicle:'DEMO-V01',driver:'Example driver',origin:'Depot A',destination:'Depot B',endpoint:'https://api.example.test',subject:'DEMO-001',relationship:'Example relationship',target:'DEMO-002',account:'DEMO-1000',reason:'Example request',notes:'',observations:'',assessment:'',plan:'',findings:'',conclusion:''};
 const lines:TemplateLine[]=[{id:'line-1',description:'Example A',quantity:2,price:120,debit:240,credit:0,result:'12',reference:'Example range: 10–20',checked:false},{id:'line-2',description:'Example B',quantity:1,price:80,debit:0,credit:240,result:'18',reference:'Example range: 10–20',checked:true}];
 const rows=Array.from({length:8},(_,i)=>({code:`DEMO-${String(i+1).padStart(3,'0')}`,name:`Example ${String.fromCharCode(65+i)}`,date:`2026-09-${String(9+i).padStart(2,'0')}`,amount:(i+1)*120,status:['requested','inProgress','review','completed'][i%4],resource:['Room A','Room B','Room C'][i%3],owner:['Demo team A','Demo team B'][i%2]}));
 if(definition.id==='template-hierarchical-master')for(const row of rows.slice(1))values[`parent.${row.code}`]='DEMO-001';
 return {id:'DEMO-001',version:1,values,lines,rows};
}
