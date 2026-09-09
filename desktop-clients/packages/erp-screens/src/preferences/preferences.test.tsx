import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import {beforeEach, expect, test, vi} from 'vitest';
import {DEFAULT_PREFERENCES, type PreferencePolicy} from '@pepbits/erp-config';
import {PreferencesPage} from './index';
const state=vi.hoisted(()=>({policy:{revision:0,rules:{}} as PreferencePolicy,available:true,update:vi.fn()}));
vi.mock('@pepbits/erp-shell',()=>({TOUR_REVEAL_EVENT:'tour-reveal',useERP:()=>({preferences:DEFAULT_PREFERENCES,preferencePolicy:state.policy,preferencesAvailable:state.available,updatePreference:state.update,branch:'hq',t:(key:string)=>key,canManagePreferencePolicy:false})}));
beforeEach(()=>{state.policy={revision:0,rules:{}};state.available=true;state.update.mockClear();});
test('record layout and all three density options use the central preference update',()=>{
 render(<PreferencesPage/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Record form style'}),{target:{value:'wizard'}});
 expect(state.update).toHaveBeenCalledWith('formNavigation','wizard');
 fireEvent.click(screen.getByRole('tab',{name:'Page'}));
 const density=screen.getByRole('combobox',{name:'Density'});
 for(const value of ['compact','comfortable','spacious']){
  fireEvent.change(density,{target:{value}});
  expect(state.update).toHaveBeenCalledWith('density',value);
 }
});
test('live policy changes and unavailable preferences prevent layout updates',()=>{
 const view=render(<PreferencesPage/>);
 state.policy={revision:1,rules:{formNavigation:{locked:true,value:'rail'}}};
 view.rerender(<PreferencesPage/>);
 const layout=screen.getByRole('combobox',{name:'Record form style'});
 expect(layout).toBeDisabled();
 fireEvent.change(layout,{target:{value:'wizard'}});
 expect(state.update).not.toHaveBeenCalled();
 state.policy={revision:2,rules:{}};state.available=false;
 view.rerender(<PreferencesPage/>);
 expect(layout).toBeDisabled();
 fireEvent.change(layout,{target:{value:'tabs'}});
 expect(state.update).not.toHaveBeenCalled();
});
