import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {test,expect,vi} from 'vitest';
import {DEFAULT_PREFERENCES,TEMPLATE_BY_ID,type PageDefinition} from '@pepbits/erp-config';
import {ProductServicesProvider} from '../product-services';
import {ConfiguredTemplatePage} from './configured-template-page';
import {createTemplateSample} from './template-state';
vi.mock('@pepbits/auth',()=>({useSession:()=>({user:{id:'user',tenantId:'tenant'}}),readToken:()=>null,authedFetch:vi.fn(),recoveryRequest:vi.fn()}));
vi.mock('@pepbits/erp-shell',()=>({useERP:()=>({preferences:DEFAULT_PREFERENCES}),useProduct:()=>({id:'app',currentRole:'reader',access:{actions:{edit:['editor'],create:['editor']}}})}));
const page={id:'patients',kind:'template',title:'Patients',subtitle:'',module:'healthcare',templateId:'template-patient-master'} satisfies PageDefinition;
test('business templates require an explicitly configured adapter',()=>{
 render(<ProductServicesProvider services={{}}><ConfiguredTemplatePage page={page} target={{pageId:'patients',recordId:'DEMO-001'}}/></ProductServicesProvider>);expect(screen.getByText('Application integration')).toBeVisible();expect(screen.queryByRole('button',{name:'Save changes'})).toBeNull();
});
test('loads with authenticated scope and enforces application edit permissions',async()=>{
 const initial=createTemplateSample(TEMPLATE_BY_ID['template-patient-master']);const load=vi.fn().mockResolvedValue(initial),save=vi.fn();render(<ProductServicesProvider services={{pageTemplates:{load,save}}}><ConfiguredTemplatePage page={page} target={{pageId:'patients',recordId:'DEMO-001'}}/></ProductServicesProvider>);
 await screen.findByRole('textbox',{name:'Name'});expect(load).toHaveBeenCalledWith({tenantId:'tenant',applicationId:'app',userId:'user',pageId:'patients',recordId:'DEMO-001'},'template-patient-master');expect(screen.getByRole('button',{name:'Save changes'})).toBeDisabled();expect(save).not.toHaveBeenCalled();
});
test('refuses a loader response for another record',async()=>{
 const initial=createTemplateSample(TEMPLATE_BY_ID['template-patient-master']);const load=vi.fn().mockResolvedValue({...initial,id:'ANOTHER'});render(<ProductServicesProvider services={{pageTemplates:{load,save:vi.fn()}}}><ConfiguredTemplatePage page={page} target={{pageId:'patients',recordId:'DEMO-001'}}/></ProductServicesProvider>);
 await screen.findByRole('alert');expect(screen.queryByRole('textbox',{name:'Name'})).toBeNull();
});
