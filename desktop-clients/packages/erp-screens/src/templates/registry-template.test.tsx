import React from 'react';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {test,expect,vi} from 'vitest';
import {REGISTRY_TEMPLATES,DEFAULT_PREFERENCES} from '@pepbits/erp-config';
import {PageTemplateWorkspace} from './page-template';
import {createTemplateSample,type TemplateSaveRequest} from './template-state';
const scope={tenantId:'demo',applicationId:'app',userId:'user',pageId:'template',recordId:'DEMO-001'};
test('all five registry templates render through shared engines with preference-owned layouts',()=>{
 expect(REGISTRY_TEMPLATES).toHaveLength(5);
 for(const definition of REGISTRY_TEMPLATES){
  const {container}=render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={createTemplateSample(definition)} preferences={{...DEFAULT_PREFERENCES,formNavigation:'wizard',density:'spacious'}} adapter={{save:vi.fn()}}/>);
  expect(container.querySelector(`[data-registry-template="${definition.id}"]`)).toBeTruthy();
  if(definition.engine!=='list')expect(container.querySelector('[data-layout="wizard"]')).toBeTruthy();
  expect(screen.queryByRole('combobox',{name:'Preview layout'})).not.toBeInTheDocument();
  cleanup();
 }
});
test('changing managed layout preserves edits and discard restores the saved record only after confirmation',async()=>{
 const definition=REGISTRY_TEMPLATES.find(d=>d.engine==='master')!;const initialDocument=createTemplateSample(definition);const adapter={save:vi.fn(async (request:TemplateSaveRequest)=>({...request.document,version:2}))};
 const props={definition,scope,initialDocument,adapter};
 const view=render(<PageTemplateWorkspace {...props} preferences={DEFAULT_PREFERENCES}/>);
 fireEvent.change(screen.getByRole('textbox',{name:/^Name/}),{target:{value:'Unsaved department'}});
 view.rerender(<PageTemplateWorkspace {...props} preferences={DEFAULT_PREFERENCES} preferencePolicy={{revision:1,rules:{formNavigation:{locked:true,value:'tabs'}}}}/>);
 expect(view.container.querySelector('[data-layout="tabs"]')).toBeTruthy();
 expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue('Unsaved department');
 fireEvent.click(screen.getByRole('button',{name:'Discard'}));
 expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue('Unsaved department');
 fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button',{name:'Discard'}));
 expect(screen.getByRole('textbox',{name:/^Name/})).toHaveValue(String(initialDocument.values.name));
 expect(adapter.save).not.toHaveBeenCalled();
});
test('claim requires a reference before saving and retains entered payer details',async()=>{
 const definition=REGISTRY_TEMPLATES.find(d=>d.id==='template-registry-claim')!;const save=vi.fn();
 render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={createTemplateSample(definition)} preferences={DEFAULT_PREFERENCES} adapter={{save}}/>);
 fireEvent.change(screen.getByRole('textbox',{name:/^Reference/}),{target:{value:''}});
 fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 expect(save).not.toHaveBeenCalled();expect(await screen.findByRole('alert')).toHaveTextContent('Complete all required fields.');
});
