import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi} from 'vitest';
import {DEFAULT_PREFERENCES,PAGE_TEMPLATES,TEMPLATE_BY_ID,type PreferencePolicy} from '@pepbits/erp-config';
import {PageTemplateWorkspace} from './page-template';
import {createTemplateSample} from './template-state';
import {usePreferenceChoice,type PreferenceHost} from '../preference-choice';
const scope={tenantId:'t',applicationId:'a',userId:'u',pageId:'p',recordId:'r'};
// This case renders two workspaces per template; allow for slower hosts and concurrent builds.
test('all registered templates inherit managed table preferences in both density profiles',()=>{
  for(const density of ['compact','spacious'] as const)for(const definition of PAGE_TEMPLATES){
    const preferences={...DEFAULT_PREFERENCES,density,zebraStripes:false,stickyTableHeader:false,wrapCellText:true};
    const {container}=render(<PageTemplateWorkspace definition={definition} preferences={preferences} scope={scope} initialDocument={createTemplateSample(definition)}/>);
    for(const table of container.querySelectorAll('table')){
      expect(table,definition.id).toHaveAttribute('data-managed-table','true');
      expect(table,definition.id).toHaveAttribute('data-density',density);
      expect(table,definition.id).toHaveAttribute('data-striped','false');
      expect(table,definition.id).toHaveAttribute('data-sticky','false');
      expect(table,definition.id).toHaveAttribute('data-wrap','true');
    }
    cleanup();
  }
}, 15000);
test('locked policy resolves conflicting input preferences and explicit layout overrides',()=>{
  const definition=TEMPLATE_BY_ID['template-patient-master'];
  const preferencePolicy:PreferencePolicy={revision:1,rules:{formNavigation:{locked:true,value:'rail'}}};
  const {rerender}=render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={createTemplateSample(definition)} preferences={{...DEFAULT_PREFERENCES,formNavigation:'wizard'}} preferencePolicy={preferencePolicy} layout="tabs"/>);
  expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation','vertical');
  rerender(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={createTemplateSample(definition)} preferences={{...DEFAULT_PREFERENCES,formNavigation:'wizard'}} preferencePolicy={{revision:2,rules:{formNavigation:{locked:true,value:'tabs'}}}} layout="rail"/>);
  expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation','horizontal');
});
function Choice(host:PreferenceHost){const [value,change,locked]=usePreferenceChoice(host,'resultView');return <button disabled={locked} onClick={()=>change('cards')}>{value}</button>;}
test('a live policy change replaces a local override and unlocking does not resurrect it',()=>{
  const onPreferenceChange=vi.fn(),host={preferences:DEFAULT_PREFERENCES,onPreferenceChange};
  const {rerender}=render(<Choice {...host}/>);fireEvent.click(screen.getByRole('button'));expect(screen.getByRole('button')).toHaveTextContent('cards');
  rerender(<Choice {...host} preferencePolicy={{revision:1,rules:{resultView:{locked:true,value:'table'}}}}/>);
  expect(screen.getByRole('button')).toHaveTextContent('table');expect(screen.getByRole('button')).toBeDisabled();
  fireEvent.click(screen.getByRole('button'));expect(onPreferenceChange).toHaveBeenCalledTimes(1);
  rerender(<Choice {...host} preferencePolicy={{revision:2,rules:{}}}/>);expect(screen.getByRole('button')).toHaveTextContent('table');expect(screen.getByRole('button')).not.toBeDisabled();
  rerender(<Choice {...host} preferencesAvailable={false}/>);expect(screen.getByRole('button')).toBeDisabled();
});
test('locked list page size is resolved from policy and cannot be changed',()=>{
  const definition=TEMPLATE_BY_ID['template-master-list'];
  render(<PageTemplateWorkspace definition={definition} scope={scope} initialDocument={createTemplateSample(definition)} preferences={{...DEFAULT_PREFERENCES,pageSize:50}} preferencePolicy={{revision:1,rules:{pageSize:{locked:true,value:10}}}}/>);
  expect(screen.getByRole('combobox',{name:'Rows per page'})).toHaveValue('10');expect(screen.getByRole('combobox',{name:'Rows per page'})).toBeDisabled();
});
