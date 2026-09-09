import React from 'react';
import {render,screen,fireEvent,within,waitFor,cleanup} from '@testing-library/react';
import {test,expect,vi} from 'vitest';
import {PAGE_TEMPLATES,TEMPLATE_BY_ID} from '@pepbits/erp-config';
import {PageTemplateWorkspace} from './page-template';
import {createTemplateSample,lineTotals,validateTemplate,type PageTemplateAdapter} from './template-state';
const scope={tenantId:'tenant',applicationId:'app',userId:'user',pageId:'patients',recordId:'DEMO-001'};
function setup(id='template-patient-master',adapter?:PageTemplateAdapter){const definition=TEMPLATE_BY_ID[id],initialDocument=createTemplateSample(definition);const save=vi.fn(async(request)=>({...request.document,version:request.expectedVersion+1}));render(<PageTemplateWorkspace definition={definition} initialDocument={initialDocument} scope={scope} adapter={adapter??{save}}/>);return {save,definition,initialDocument};}
test('every configured template renders real shared content and starts with valid sample data',()=>{
 expect(PAGE_TEMPLATES.length).toBe(97);expect(new Set(PAGE_TEMPLATES.map(item=>item.id)).size).toBe(97);
 for(const definition of PAGE_TEMPLATES){
  const document=createTemplateSample(definition);expect(validateTemplate(definition,document),definition.id).toEqual({});
  const result=render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={document} adapter={{save:async request=>({...request.document,version:2})}}/>);
  expect(result.container.querySelector(`[data-page-template="${definition.id}"]`),definition.id).toBeTruthy();expect(result.container.querySelectorAll('section h2').length,definition.id).toBeGreaterThan(0);cleanup();
 }
});
test('required fields block submission and show the relevant section',async()=>{
 const {save}=setup();fireEvent.change(screen.getByRole('textbox',{name:/^Name/}),{target:{value:''}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));expect(save).not.toHaveBeenCalled();expect(await screen.findByRole('alert')).toHaveTextContent('Complete all required fields.');
});
test('a failed save retains values and retries the same operation identity',async()=>{
 const save=vi.fn().mockRejectedValueOnce({status:503}).mockImplementation(async request=>({...request.document,version:request.expectedVersion+1}));setup('template-patient-master',{save});
 fireEvent.change(screen.getByRole('textbox',{name:/^Name/}),{target:{value:'Retain this'}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await screen.findByRole('alert');expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue('Retain this');fireEvent.click(screen.getByRole('button',{name:'Retry'}));await screen.findByText('Changes saved.');expect(save.mock.calls[0][0]).toEqual(save.mock.calls[1][0]);
});
test('scope changes cannot expose the previous editor values',()=>{
 const definition=TEMPLATE_BY_ID['template-patient-master'],initialDocument=createTemplateSample(definition),adapter={save:vi.fn()};const result=render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={initialDocument} adapter={adapter}/>);
 fireEvent.change(screen.getByRole('textbox',{name:/^Name/}),{target:{value:'Private edit'}});result.rerender(<PageTemplateWorkspace definition={definition} scope={{...scope,userId:'another'}} initialDocument={initialDocument} adapter={adapter}/>);expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue('Alex Morgan');
});
test('readonly and missing adapters never allow changes or saves',()=>{
 const definition=TEMPLATE_BY_ID['template-patient-master'];render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={createTemplateSample(definition)}/>);expect(screen.getByRole('button',{name:'Save changes'})).toBeDisabled();expect(screen.getByRole('textbox',{name:/^Name/})).toBeDisabled();
});
test('line totals use configured precision and financial entries must balance',()=>{
 const definition=TEMPLATE_BY_ID['template-journal-voucher'],document=createTemplateSample(definition);document.lines[0].debit=0.1+0.2;document.lines[1].credit=0.3;expect(lineTotals(document.lines).difference).toBe(0);expect(validateTemplate(definition,document)).toEqual({});document.lines[1].credit=0.2;expect(validateTemplate(definition,document).balance).toBe('template.validation.balance');
});
test('booking validates the time range',()=>{
 const definition=TEMPLATE_BY_ID['template-appointment'],document=createTemplateSample(definition);document.values.endTime='08:00';expect(validateTemplate(definition,document).endTime).toBe('template.validation.time');
});
test('conflict review does not replace edits before explicit confirmation',async()=>{
 const definition=TEMPLATE_BY_ID['template-patient-master'],latest=createTemplateSample(definition);latest.version=2;latest.values.name='Latest record';setup(definition.id,{save:vi.fn().mockRejectedValue({status:409}),load:vi.fn().mockResolvedValue(latest)});
 fireEvent.change(screen.getByRole('textbox',{name:/^Name/}),{target:{value:'Local change'}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Review latest record'}));const dialog=await screen.findByRole('dialog');expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue('Local change');fireEvent.click(within(dialog).getByRole('button',{name:'Discard local changes and load'}));await waitFor(()=>expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue('Latest record'));
});
