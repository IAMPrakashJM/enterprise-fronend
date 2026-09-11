import {isDesignerView,type DesignerCommand,type DesignerView} from '@pepbits/erp-config';
import {ClinicalRequestFailure} from './clinical-templates';
export interface DesignerAdapter {command(input:DesignerCommand):Promise<DesignerView>}
export function createDesignerAdapter(request:(path:string,init?:RequestInit)=>Promise<Response>,product:string):DesignerAdapter{return {async command(input){const r=await request('/dcp-designer',{method:'POST',headers:{'Content-Type':'application/json','X-Product-Id':product},body:JSON.stringify(input)});const body=await r.json();if(!r.ok)throw new ClinicalRequestFailure(r.status,body.fieldErrors??{form:body.error});if(!isDesignerView(body))throw new ClinicalRequestFailure(502,{form:'designer.invalidResponse'});return body;}};}
