import React,{useState} from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {translate,localizeFieldError,localizeImportError,localizeApprovalNotice,type LanguageKey} from '@pepbits/erp-config';
import {LocalizationProvider,LocalizedText} from './localization';
import {ENGLISH_MESSAGES} from './messages.en';
import {DropdownSelect} from './dropdown';
import {Input,MultiSelect} from './form-controls';
import {StatCard} from './stat-card';
const locale=(language:LanguageKey)=>({language,direction:language==='ar'?'rtl' as const:'ltr' as const,t:(key:string,values?:Record<string,string|number>)=>translate(language,key,values),dateTime:(value:string|Date)=>new Date(value).toISOString()});
function Fixture(){const [name,setName]=useState('Save CUS-001'),[role,setRole]=useState('finance'),[roles,setRoles]=useState<string[]>([]);return <>
 <Input label="Display name" value={name} onChange={e=>setName(e.target.value)}/>
 <DropdownSelect label="Role" value={role} options={[{value:'finance',label:'Finance Manager'},{value:'ops',label:'Operations Analyst'}]} onChange={setRole}/>
 <MultiSelect label="Assigned roles" options={[{value:'finance',label:'Finance Manager'},{value:'ops',label:'Operations Analyst'}]} value={roles} onChange={setRoles}/>
 <output data-testid="values">{JSON.stringify({name,role,roles})}</output>
 <StatCard label="Cash position" value="AED 42.16M" hint="Across 12 accounts" trend={{direction:'up',delta:'+4.3%',comparedTo:'vs previous period'}}/>
 </>;}
describe('page copy and stable data',()=>{
 it.each(['en','ar','hi','ml'] as const)('translates controls, search results and KPI copy in %s without changing values',language=>{
  render(<LocalizationProvider value={locale(language)}><Fixture/></LocalizationProvider>);
  const t=locale(language).t;
  expect(screen.getByLabelText(t('Display name'))).toHaveValue('Save CUS-001');
  expect(screen.getByText(t('Cash position'))).toBeVisible();expect(screen.getByText('AED 42.16M')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:t('Role')}));
  fireEvent.change(screen.getByRole('combobox'),{target:{value:t('Operations Analyst')}});
  fireEvent.click(screen.getByRole('option',{name:t('Operations Analyst')}));
  expect(JSON.parse(screen.getByTestId('values').textContent!).role).toBe('ops');
 });
 it('keeps a draft and selected code when language changes',()=>{
  const {rerender}=render(<LocalizationProvider value={locale('en')}><Fixture/></LocalizationProvider>);
  fireEvent.change(screen.getByLabelText('Display name'),{target:{value:'Name أنا CUS-002'}});
  rerender(<LocalizationProvider value={locale('ar')}><Fixture/></LocalizationProvider>);
  expect(screen.getByLabelText(translate('ar','Display name'))).toHaveValue('Name أنا CUS-002');
  expect(JSON.parse(screen.getByTestId('values').textContent!).role).toBe('finance');
 });
 it('has readable English fallbacks outside an ERP provider',()=>{
  const key=Object.keys(ENGLISH_MESSAGES).find(key=>ENGLISH_MESSAGES[key]==='Save invoice')!;
  render(<LocalizedText message={key}/>);expect(screen.getByText('Save invoice')).toBeVisible();
 });
 it.each(['ar','hi','ml'] as const)('localizes complete error templates in %s and preserves unknown service messages',language=>{
  const t=locale(language).t;
  expect(localizeFieldError('Name cannot be empty.','Name',t)).toBe(t('{field} cannot be empty.',{field:t('Name')}));
  expect(localizeImportError('Data row 7 has 2 cells; expected 4.',t)).toBe(t('Data row {row} has {actual} cells; expected {expected}.',{row:7,actual:2,expected:4}));
  expect(localizeImportError('Adapter-specific error ABC',t)).toBe('Adapter-specific error ABC');
  expect(localizeApprovalNotice('Submitted for My custom review',t)).toBe(t('Submitted for {stage}',{stage:'My custom review'}));
 });
});
