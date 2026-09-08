import { expect, test } from 'vitest';
import type { EntitySchema } from './types';
import { fieldOptions, isFieldVisible, updateFormValue, validateForm } from './form-rules';
const fields = [
 {id:'country',label:'Country',type:'select'},
 {id:'region',label:'Region',type:'select',optionsByField:{field:'country',values:{AE:[{value:'Dubai',label:'Dubai'}],GB:[{value:'England',label:'England'}]}}},
 {id:'notes',label:'Notes',type:'textarea',visibleWhen:{field:'hold',equals:true},requiredWhen:{field:'hold',equals:true}},
 {id:'limit',label:'Limit',type:'number',min:0},
 {id:'email',label:'Email',type:'email'},
 {id:'from',label:'Start',type:'date'},
 {id:'to',label:'End',type:'date',notBefore:'from'},
] as EntitySchema['sections'][number]['fields'];
const schema={sections:[{id:'details',title:'Details',fields}]} as EntitySchema;
test('dependent options clear when their parent changes',()=>{
 expect(fieldOptions(fields[1],{country:'AE'}).map(v=>v.value)).toEqual(['Dubai']);
 expect(updateFormValue(schema,{country:'AE',region:'Dubai'},'country','GB')).toEqual({country:'GB',region:''});
 expect(validateForm(schema,{country:'GB',region:'Dubai'})).toHaveProperty('region');
});
test('conditional requirements ignore hidden fields and enforce visible fields',()=>{
 expect(isFieldVisible(fields[2],{hold:false})).toBe(false);
 expect(validateForm(schema,{hold:false,notes:''})).toEqual({});
 expect(validateForm(schema,{hold:true,notes:' '})).toHaveProperty('notes');
});
test('cross-field dates, email and numeric bounds identify the field to correct',()=>{
 expect(Object.keys(validateForm(schema,{from:'2026-09-07',to:'2026-09-06',email:'bad',limit:-1})).sort()).toEqual(['email','limit','to']);
 expect(validateForm(schema,{from:'2026-09-07',to:'2026-09-07',email:'a@example.test',limit:0})).toEqual({});
});
