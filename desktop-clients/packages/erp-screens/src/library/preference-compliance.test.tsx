import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi,beforeEach} from 'vitest';
import {DEFAULT_PREFERENCES,createFormatters,PAGE_REGISTRY,type PreferencePolicy,type UserPreferences} from '@pepbits/erp-config';
import {LibraryReferencePage,LIBRARY_REFERENCE_PAGES} from './reference-pages';
import {ComponentCatalog} from './component-catalog';
import {CATALOG_GROUPS} from './catalog';
import {ValuesDemo,BillingDemo,TableDemo,PaginationDemo} from './demos';
const state=vi.hoisted(()=>({preferences:{} as UserPreferences,policy:{revision:0,rules:{}} as PreferencePolicy,update:vi.fn(),open:vi.fn()}));
vi.mock('@pepbits/erp-shell',()=>({useERP:()=>({preferences:state.preferences,preferencePolicy:state.policy,preferencesAvailable:true,updatePreference:state.update,format:createFormatters(state.preferences)}),useProduct:()=>({pages:PAGE_REGISTRY})}));
vi.mock('@pepbits/platform-ports',()=>({useNavigation:()=>({open:state.open})}));
beforeEach(()=>{state.preferences={...DEFAULT_PREFERENCES,currencyCode:'USD',dateFormat:'iso'} as UserPreferences;state.policy={revision:0,rules:{}};state.update.mockClear();});
test('all 12 component catalog routes render their actual examples under non-default preferences',()=>{
  for(const id of ['component-library',...CATALOG_GROUPS.map(g=>g.pageId)]){const {container}=render(<ComponentCatalog page={PAGE_REGISTRY[id]}/>);expect(container.querySelectorAll('[data-catalog-example]').length,id).toBeGreaterThan(0);cleanup();}
});
test('all six reference pages have dedicated localized content',()=>{
  for(const id of LIBRARY_REFERENCE_PAGES){const {container}=render(<LibraryReferencePage page={PAGE_REGISTRY[id]}/>);expect(container.querySelector(`[data-library-reference="${id}"]`)).toBeTruthy();expect(container.textContent).not.toContain('catalog.reference.');cleanup();}
});
test('value and billing examples use selected currency',()=>{
  render(<><ValuesDemo/><BillingDemo/></>);expect(screen.getByText(createFormatters(state.preferences).money(12345.67))).toBeInTheDocument();expect(screen.getByText(createFormatters(state.preferences).money(200))).toBeInTheDocument();
});
test('demo controls cannot override managed table settings',()=>{
  state.policy={revision:1,rules:{density:{locked:true,value:'comfortable'},zebraStripes:{locked:true,value:false},pageSize:{locked:true,value:20}}};
  render(<><TableDemo/><PaginationDemo/></>);
  const compact=screen.getByRole('switch',{name:'Compact'});expect(compact).toBeDisabled();fireEvent.click(compact);expect(state.update).not.toHaveBeenCalled();expect(screen.getByRole('combobox',{name:'Rows per page'})).toBeDisabled();
});
