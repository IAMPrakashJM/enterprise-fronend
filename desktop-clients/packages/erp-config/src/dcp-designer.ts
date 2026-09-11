import type {TemplateField,TemplateSection} from './page-templates';
export const DESIGNER_TYPES=['text','textarea','email','number','date','time','select','checkbox'] as const;
/** Frontend template authoring draft, not the backend DCP wire schema. */
export interface DesignerDefinition {title:string;sections:TemplateSection[]}
export interface DesignerRecord {id:string;revision:number;updatedAt:string;definition:DesignerDefinition}
export interface DesignerView {initial:DesignerDefinition;canDesign:boolean;records:DesignerRecord[];record:DesignerRecord|null;types:TemplateField['type'][]}
export interface DesignerCommand {action:'load'|'save';id?:string;revision?:number;operationId?:string;definition?:DesignerDefinition}
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const title=(x:unknown)=>typeof x==='string'&&x.trim().length>0&&x.length<=160;
const key=(x:unknown)=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(x)&&!['constructor','prototype','__proto__'].includes(x);
export function isDesignerDefinition(x:unknown):x is DesignerDefinition {
 if(!object(x)||!title(x.title)||!Array.isArray(x.sections)||x.sections.length<1||x.sections.length>20)return false;
 const ids=new Set<string>();let count=0;
 for(const s of x.sections){if(!object(s)||!key(s.id)||!title(s.title)||!Array.isArray(s.fields)||ids.has(s.id as string))return false;ids.add(s.id as string);
 for(const f of s.fields){if(!object(f)||!key(f.id)||!title(f.label)||!DESIGNER_TYPES.includes(f.type as typeof DESIGNER_TYPES[number])||ids.has(f.id as string)||++count>100)return false;ids.add(f.id as string);
 if(f.required!==undefined&&typeof f.required!=='boolean')return false;
 if(f.min!==undefined&&(f.type!=='number'||typeof f.min!=='number'||!Number.isFinite(f.min)))return false;
 if(f.options!==undefined){if(f.type!=='select'||!Array.isArray(f.options)||f.options.length>50)return false;const keys=new Set();for(const o of f.options){if(!object(o)||!title(o.label)||typeof o.value!=='string'||!o.value.trim()||o.value.length>80||keys.has(o.value))return false;keys.add(o.value);}}
 if(f.type==='select'&&(!Array.isArray(f.options)||!f.options.length))return false;
 }}return true;
}
export function isDesignerView(x:unknown):x is DesignerView {
 if(!object(x)||!isDesignerDefinition(x.initial)||typeof x.canDesign!=='boolean'||!Array.isArray(x.types)||x.types.some(t=>!DESIGNER_TYPES.includes(t as never))||!Array.isArray(x.records))return false;
 const record=(r:unknown)=>object(r)&&typeof r.id==='string'&&Number.isInteger(r.revision)&&Number(r.revision)>0&&typeof r.updatedAt==='string'&&isDesignerDefinition(r.definition);
 return x.records.length<=100&&x.records.every(record)&&(x.record===null||record(x.record));
}
export function previewErrors(def:DesignerDefinition,values:Record<string,string|number|boolean>):Record<string,string>{
 const errors:Record<string,string>={};for(const s of def.sections)for(const f of s.fields){const v=values[f.id];if(f.required&&(v===undefined||v===false||String(v).trim()===''))errors[f.id]='designer.requiredError';else if(v!==undefined&&v!==''){if(f.type==='number'&&(!Number.isFinite(Number(v))||(f.min!==undefined&&Number(v)<f.min)))errors[f.id]='designer.numberError';if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))errors[f.id]='designer.emailError';if(f.type==='select'&&!f.options?.some(o=>o.value===v))errors[f.id]='designer.optionError';}}return errors;
}
