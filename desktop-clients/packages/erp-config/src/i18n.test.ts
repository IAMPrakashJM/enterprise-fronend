import {describe,it,expect} from 'vitest';
import {LANGUAGE_OPTIONS,UI_MESSAGES,translate,localizeFieldError} from './i18n';
import {createFormatters} from './format';
import {DEFAULT_PREFERENCES} from './preference-defaults';
describe('localization contracts',()=>{
 it('provides every catalog message and preserves interpolation names in each language',()=>{
  const tokens=(s:string)=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const {value} of LANGUAGE_OPTIONS){expect(Object.keys(UI_MESSAGES[value]).sort()).toEqual(Object.keys(UI_MESSAGES.en).sort());for(const [key,message] of Object.entries(UI_MESSAGES[value])){expect(message.trim(),`${value}: ${key}`).not.toBe('');expect(tokens(message),`${value}: ${key}`).toEqual(tokens(UI_MESSAGES.en[key]));}}
 });
 it('falls back safely and applies product overrides before shared messages',()=>{
  expect(translate('ar','Unknown feature')).toBe('Unknown feature');
  expect(translate('xx' as 'en','save')).toBe('Save');
  expect(translate('ar','Save',{}, {ar:{Save:'CUSTOM'}})).toBe('CUSTOM');
  expect(translate('ml','product.custom',{}, {en:{'product.custom':'Fallback'}})).toBe('Fallback');
  expect(translate('hi','Import {page}',{page:'CUS-001'})).toContain('CUS-001');
  expect(translate('en','{missing}',{})).toBe('{missing}');
  expect(translate('en','toString')).toBe('toString');
 });
 it('translates known validation errors while preserving unknown server detail',()=>{
  const t=(key:string,values?:Record<string,string|number>)=>translate('ar',key,values);
  expect(localizeFieldError('Legal name is required','Legal name',t)).toBe('الاسم القانوني مطلوب');
  expect(localizeFieldError('Credit limit must be at least 0','Credit limit',t)).toContain('0');
  expect(localizeFieldError('Custom backend constraint X-19','Legal name',t)).toBe('Custom backend constraint X-19');
 });
 it('localizes month names without changing explicit numeric and calendar preferences',()=>{
  const en=createFormatters({...DEFAULT_PREFERENCES,language:'en',dateFormat:'medium'});
  const ar=createFormatters({...DEFAULT_PREFERENCES,language:'ar',dateFormat:'medium'});
  expect(ar.date('2026-09-08')).not.toBe(en.date('2026-09-08'));
  expect(ar.money(1234.5)).toBe(en.money(1234.5));
  expect(createFormatters({...DEFAULT_PREFERENCES,language:'ar',dateFormat:'dmy'}).date('2026-09-08')).toBe('08/09/2026');
 });
});
