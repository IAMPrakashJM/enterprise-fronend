/** Application-neutral page contracts. Rendering lives in erp-screens; data stays serializable. */
export type TemplateEngine = "master" | "list" | "order" | "booking" | "case" | "result" | "finance" | "reconcile" | "report" | "dashboard" | "entity" | "admin";
export type TemplateLayout = "rail" | "tabs" | "wizard";
export type TemplateView = "table" | "cards" | "board" | "timeline" | "matrix" | "document";
export type TemplateValue = string | number | boolean;
export interface TemplateField {id:string;label:string;type:"text"|"email"|"number"|"date"|"time"|"select"|"textarea"|"checkbox";required?:boolean;options?:Array<{value:string;label:string}>;min?:number}
export interface TemplateSection {id:string;title:string;fields:TemplateField[]}
export interface TemplateColumn {key:string;label:string;type?:"text"|"number"|"money"|"status"|"date"}
export interface TemplateLine {id:string;description:string;quantity:number;price:number;debit:number;credit:number;result:string;reference:string;checked:boolean}
export interface TemplateDocument {id:string;version:number;values:Record<string,TemplateValue>;lines:TemplateLine[];rows:Array<Record<string,TemplateValue>>}
export interface PageTemplateDefinition {id:string;group:string;engine:TemplateEngine;title:string;description:string;layout:TemplateLayout;view:TemplateView;sections:TemplateSection[];columns:TemplateColumn[];stages:string[];tags:string[];editable:boolean;designFamily?:"registry"}
export const TEMPLATE_GROUPS = [
  {id:"registry",title:"template.group.registry"},
  {id:"masters",title:"template.group.masters"},{id:"worklists",title:"template.group.worklists"},
  {id:"orders",title:"template.group.orders"},{id:"bookings",title:"template.group.bookings"},
  {id:"cases",title:"template.group.cases"},{id:"results",title:"template.group.results"},
  {id:"logistics",title:"template.group.logistics"},{id:"finance",title:"template.group.finance"},
  {id:"reports",title:"template.group.reports"},{id:"entity",title:"template.group.entity"},{id:"administration",title:"template.group.administration"},
] as const;
const option=(value:string)=>({value,label:`template.status.${value}`});
const field=(id:string,type:TemplateField['type']="text",required=false):TemplateField=>({id,label:`template.field.${id}`,type,required,...(type==="select"?{options:[option("active"),option("pending"),option("completed")]}:{})});
const identity=(person=false):TemplateSection=>({id:"identity",title:"template.section.identity",fields:[field("code","text",true),field("name","text",true),field(person?"birthDate":"effectiveDate","date"),field("status","select",true)]});
const contact:TemplateSection={id:"contact",title:"template.section.contact",fields:[field("email","email"),field("phone"),field("address","textarea"),field("city")]};
const details:TemplateSection={id:"details",title:"template.section.details",fields:[field("department"),field("owner"),field("notes","textarea"),field("enabled","checkbox")]};
const order:TemplateSection={id:"header",title:"template.section.header",fields:[field("code","text",true),field("party","text",true),field("effectiveDate","date",true),field("dueDate","date"),field("department"),field("notes","textarea")]};
const booking:TemplateSection={id:"booking",title:"template.section.booking",fields:[field("name","text",true),field("resource","text",true),field("effectiveDate","date",true),field("startTime","time",true),field("endTime","time",true),field("notes","textarea")]};
const clinical:TemplateSection={id:"assessment",title:"template.section.assessment",fields:[field("reason","text",true),field("observations","textarea"),field("assessment","textarea"),field("plan","textarea"),field("followUp","date")]};
const result:TemplateSection={id:"result",title:"template.section.result",fields:[field("code","text",true),field("name","text",true),field("specimen"),field("effectiveDate","date",true),field("findings","textarea"),field("conclusion","textarea")]};
const account:TemplateSection={id:"accounts",title:"template.section.accounts",fields:[field("code","text",true),field("account","text",true),field("effectiveDate","date",true),field("reference"),field("notes","textarea")]};
const settings:TemplateSection={id:"configuration",title:"template.section.configuration",fields:[field("name","text",true),field("owner"),field("frequency","select",true),field("effectiveDate","date"),field("enabled","checkbox"),field("notes","textarea")]};
const columns:TemplateColumn[]=[{key:"code",label:"template.field.code"},{key:"name",label:"template.field.name"},{key:"date",label:"template.field.effectiveDate",type:"date"},{key:"amount",label:"template.field.amount",type:"money"},{key:"status",label:"template.field.status",type:"status"}];
function define(id:string,group:string,engine:TemplateEngine,tags:string[],view:TemplateView="table"):PageTemplateDefinition {
 const person=/patient|person|employee|student/.test(id);
 let sections=engine==="master"?[identity(person),...(id==="simple-master"?[]:[contact,details])]:engine==="booking"?[booking,details]:engine==="case"?[identity(person),clinical,details]:engine==="result"?[result,details]:engine==="finance"||engine==="reconcile"?[account,details]:engine==="admin"?[settings,details]:engine==="entity"?[identity(person),contact,details]:[order,details];

 if(/item-service/.test(id))sections=[identity(),{id:'attributes',title:'template.section.details',fields:[field('category'),field('unit'),field('barcode'),field('price','number'),field('notes','textarea')]}];
 if(id==='relationship-master')sections=[{id:'relationship',title:'template.section.details',fields:[field('code','text',true),field('name','text',true),field('subject','text',true),field('relationship','text',true),field('target','text',true)]}];
 if(id==='transport-plan')sections=[{id:'trip',title:'template.section.booking',fields:[field('code','text',true),field('vehicle','text',true),field('driver','text',true),field('origin','text',true),field('destination','text',true),field('effectiveDate','date',true),field('startTime','time',true)]},details];
 if(id==='lab-order'||id==='service-test-order')sections=[{id:'order',title:'template.section.header',fields:[field('code','text',true),field('name','text',true),field('specimen'),field('priority','select'),field('effectiveDate','date',true),field('notes','textarea')]},details];
 if(id==='schedule-configuration'||id==='recurring-order')sections=[{id:'schedule',title:'template.section.configuration',fields:[field('name','text',true),{...field('frequency','select',true),options:['daily','weekly','monthly'].map(option)},field('startTime','time',true),field('effectiveDate','date',true),field('enabled','checkbox')]},details];
 if(id==='integration-configuration')sections=[{id:'connection',title:'template.section.configuration',fields:[field('name','text',true),field('endpoint','text',true),field('reference'),field('mapping','textarea'),field('enabled','checkbox')]}];
 if(id==='invoice-billing'||id==='patient-billing'||id==='school-fees')sections=[order,{id:'payer',title:'template.section.accounts',fields:[field('payer','text',true),field('account'),field('reference'),field('notes','textarea')]}];
 return {id:`template-${id}`,group,engine,title:`template.name.${id}`,description:`template.help.${group}`,layout:person?"tabs":"rail",view,sections,columns,stages:["requested","inProgress","review","completed"],tags,editable:!["report","dashboard","entity"].includes(engine)||["document-workspace","communication-workspace"].includes(id)};
}
/** Registry family shares the approved query/record presentation, with domain-specific fields. */
const registry = (id:string,engine:TemplateEngine,sections:TemplateSection[]):PageTemplateDefinition => ({
 ...define(id,"registry",engine,["ERP","Healthcare","School"]),designFamily:"registry",sections,
});
export const REGISTRY_TEMPLATES:readonly PageTemplateDefinition[] = [
 registry("registry-worklist","list",[order]),
 registry("registry-small-master","master",[{id:"identity",title:"template.section.identity",fields:[field("code","text",true),field("name","text",true),field("category"),field("status","select",true),field("enabled","checkbox"),field("notes","textarea")]}]),
 registry("registry-billing","order",[order,{id:"payer",title:"template.section.accounts",fields:[field("payer","text",true),field("account"),field("reference"),field("notes","textarea")]}]),
 registry("registry-claim","order",[{id:"claim",title:"template.section.header",fields:[field("code","text",true),field("name","text",true),field("effectiveDate","date",true),field("reference","text",true)]},{id:"payer",title:"template.section.accounts",fields:[field("payer","text",true),field("account","text",true),field("dueDate","date"),field("notes","textarea")]}]),
 registry("registry-consultation","case",[identity(true),clinical,{id:"review",title:"template.section.details",fields:[field("department"),field("owner"),field("notes","textarea"),field("enabled","checkbox")]}]),
];
export const PAGE_TEMPLATES:readonly PageTemplateDefinition[] = [
  ...REGISTRY_TEMPLATES,
  define("simple-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("detailed-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("person-registration","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("person-profile","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("organization-profile","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("item-service-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("hierarchical-master","masters","master",["ERP", "Healthcare", "School"],"matrix"),
  define("relationship-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("configuration-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("patient-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("employee-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("customer-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("supplier-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("student-master","masters","master",["ERP", "Healthcare", "School"],"table"),
  define("master-list","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("transaction-register","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("operational-worklist","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("assignment-queue","worklists","list",["ERP", "Healthcare", "School"],"board"),
  define("approval-inbox","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("exception-queue","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("board-workspace","worklists","list",["ERP", "Healthcare", "School"],"board"),
  define("split-list-detail","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("batch-processing","worklists","list",["ERP", "Healthcare", "School"],"table"),
  define("header-lines-order","orders","order",["ERP", "Laboratory"],"table"),
  define("service-test-order","orders","order",["ERP", "Laboratory"],"table"),
  define("quotation-estimate","orders","order",["ERP", "Laboratory"],"table"),
  define("order-fulfillment","orders","order",["ERP", "Laboratory"],"table"),
  define("return-cancellation","orders","order",["ERP", "Laboratory"],"table"),
  define("order-comparison","orders","order",["ERP", "Laboratory"],"matrix"),
  define("recurring-order","orders","order",["ERP", "Laboratory"],"table"),
  define("purchase-order","orders","order",["ERP", "Laboratory"],"table"),
  define("sales-order","orders","order",["ERP", "Laboratory"],"table"),
  define("lab-order","orders","order",["ERP", "Laboratory"],"table"),
  define("appointment","bookings","booking",["Healthcare", "School", "Transport"],"table"),
  define("calendar-workspace","bookings","booking",["Healthcare", "School", "Transport"],"table"),
  define("resource-timeline","bookings","booking",["Healthcare", "School", "Transport"],"timeline"),
  define("occupancy-board","bookings","booking",["Healthcare", "School", "Transport"],"board"),
  define("allocation-workspace","bookings","booking",["Healthcare", "School", "Transport"],"table"),
  define("roster-timetable","bookings","booking",["Healthcare", "School", "Transport"],"matrix"),
  define("waitlist-check-in","bookings","list",["Healthcare", "School", "Transport"],"table"),
  define("patient-encounter","cases","case",["Healthcare", "Service"],"table"),
  define("service-case","cases","case",["Healthcare", "Service"],"table"),
  define("long-running-episode","cases","case",["Healthcare", "Service"],"table"),
  define("procedure-planning","cases","case",["Healthcare", "Service"],"table"),
  define("surgery-workspace","cases","case",["Healthcare", "Service"],"table"),
  define("procedure-execution","cases","case",["Healthcare", "Service"],"table"),
  define("checklist-workspace","cases","case",["Healthcare", "Service"],"table"),
  define("discharge-closure","cases","case",["Healthcare", "Service"],"table"),
  define("structured-result","results","result",["Laboratory", "School"],"table"),
  define("lab-result","results","result",["Laboratory", "School"],"table"),
  define("narrative-result","results","result",["Laboratory", "School"],"document"),
  define("observation-chart","results","result",["Laboratory", "School"],"timeline"),
  define("assessment-scoring","results","result",["Laboratory", "School"],"table"),
  define("result-verification","results","result",["Laboratory", "School"],"table"),
  define("result-comparison","results","result",["Laboratory", "School"],"matrix"),
  define("certificate-output","results","result",["Laboratory", "School"],"document"),
  define("goods-receipt","logistics","order",["ERP", "Transport"],"table"),
  define("issue-dispatch","logistics","order",["ERP", "Transport"],"table"),
  define("stock-transfer","logistics","order",["ERP", "Transport"],"table"),
  define("stock-count","logistics","order",["ERP", "Transport"],"table"),
  define("batch-serial-tracking","logistics","order",["ERP", "Transport"],"table"),
  define("pick-pack","logistics","order",["ERP", "Transport"],"table"),
  define("transport-plan","logistics","order",["ERP", "Transport"],"table"),
  define("dispatch-board","logistics","list",["ERP", "Transport"],"board"),
  define("journal-voucher","finance","finance",["Finance", "ERP", "School"],"table"),
  define("payment-voucher","finance","finance",["Finance", "ERP", "School"],"table"),
  define("receipt-voucher","finance","finance",["Finance", "ERP", "School"],"table"),
  define("invoice-billing","finance","order",["Finance", "ERP", "School"],"table"),
  define("patient-billing","finance","order",["Finance", "ERP", "School"],"table"),
  define("school-fees","finance","order",["Finance", "ERP", "School"],"table"),
  define("credit-debit-note","finance","order",["Finance", "ERP", "School"],"table"),
  define("allocation-settlement","finance","reconcile",["Finance", "ERP", "School"],"table"),
  define("bank-reconciliation","finance","reconcile",["Finance", "ERP", "School"],"table"),
  define("budget-workspace","finance","order",["Finance", "ERP", "School"],"table"),
  define("period-processing","finance","finance",["Finance", "ERP", "School"],"table"),
  define("statement-account","finance","report",["Finance", "ERP", "School"],"table"),
  define("report-parameters","reports","report",["ERP", "Healthcare", "School"],"table"),
  define("tabular-report","reports","report",["ERP", "Healthcare", "School"],"table"),
  define("grouped-report","reports","report",["ERP", "Healthcare", "School"],"table"),
  define("pivot-report","reports","report",["ERP", "Healthcare", "School"],"matrix"),
  define("printable-report","reports","report",["ERP", "Healthcare", "School"],"document"),
  define("operational-dashboard","reports","dashboard",["ERP", "Healthcare", "School"],"table"),
  define("management-dashboard","reports","dashboard",["ERP", "Healthcare", "School"],"table"),
  define("analytical-workspace","reports","dashboard",["ERP", "Healthcare", "School"],"table"),
  define("entity-360","entity","entity",["ERP", "Healthcare", "School"],"table"),
  define("history-timeline","entity","entity",["ERP", "Healthcare", "School"],"timeline"),
  define("document-workspace","entity","entity",["ERP", "Healthcare", "School"],"table"),
  define("task-workspace","entity","list",["ERP", "Healthcare", "School"],"board"),
  define("communication-workspace","entity","entity",["ERP", "Healthcare", "School"],"table"),
  define("policy-editor","administration","admin",["ERP", "Healthcare", "School"],"table"),
  define("permissions-matrix","administration","admin",["ERP", "Healthcare", "School"],"matrix"),
  define("workflow-configuration","administration","admin",["ERP", "Healthcare", "School"],"table"),
  define("import-wizard","administration","admin",["ERP", "Healthcare", "School"],"table"),
  define("background-jobs","administration","list",["ERP", "Healthcare", "School"],"table"),
  define("schedule-configuration","administration","admin",["ERP", "Healthcare", "School"],"table"),
  define("audit-explorer","administration","list",["ERP", "Healthcare", "School"],"table"),
  define("integration-configuration","administration","admin",["ERP", "Healthcare", "School"],"table"),
];
export const TEMPLATE_BY_ID:Readonly<Record<string,PageTemplateDefinition>> = Object.fromEntries(PAGE_TEMPLATES.map(template=>[template.id,template]));
