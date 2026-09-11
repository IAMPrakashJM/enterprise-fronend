import React from 'react';
import {test,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {DesignerSections} from './sections';
import type {DesignerDefinition} from '@pepbits/erp-config';
const definition:DesignerDefinition={title:'Example',layout:'tabs',sections:[{id:'first',title:'First',fields:[{id:'flag',label:'Flag',type:'checkbox'}]},{id:'second',title:'Second',fields:[{id:'name',label:'Name',type:'text',rules:{visibleWhen:{fieldId:'flag',operator:'eq',value:true}}}]}]};
test('shared section tabs reveal the first error and honor conditional visibility and disabled checkbox states',()=>{
 const {rerender}=render(<DesignerSections definition={definition} values={{flag:true}} errors={{}} states={{flag:{disabled:true}}} change={vi.fn()}/>);expect(screen.getByLabelText('Flag')).toBeDisabled();
 rerender(<DesignerSections definition={definition} values={{flag:true}} errors={{name:'Required'}} states={{}} change={vi.fn()}/>);expect(screen.getByLabelText('Name')).toBeVisible();
 rerender(<DesignerSections definition={definition} values={{flag:false}} errors={{}} states={{}} change={vi.fn()}/>);expect(screen.queryByLabelText('Name')).toBeNull();
});
test('step layout moves through shared fields without losing externally owned values',()=>{
 render(<DesignerSections definition={{...definition,layout:'steps'}} values={{flag:true,name:'Kept'}} errors={{}} states={{}} change={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(screen.getByLabelText('Name')).toHaveValue('Kept');fireEvent.click(screen.getByRole('button',{name:'Previous'}));expect(screen.getByLabelText('Flag')).toBeChecked();
});

test('revalidating unchanged errors returns from another tab to the invalid section',()=>{
 const props={definition,values:{flag:true},states:{},change:vi.fn()};const {rerender}=render(<DesignerSections {...props} errors={{name:'Required'}}/>);
 fireEvent.click(screen.getByRole('tab',{name:'First'}));expect(screen.getByLabelText('Flag')).toBeVisible();rerender(<DesignerSections {...props} errors={{name:'Required'}}/>);expect(screen.getByLabelText('Name')).toBeVisible();
});

test('repeatable section keeps rows independent and enforces add/remove limits',()=>{
 const def:DesignerDefinition={title:'Repeated',sections:[{id:'rows',title:'Observations',repeatable:true,minItems:1,maxItems:2,fields:[{id:'note',label:'Note',type:'text'}]}]};
 function Example(){const [values,setValues]=React.useState<import('@pepbits/erp-config').DesignerValues>({rows:[{_id:'first',note:'First'}]});return <DesignerSections definition={def} values={values} errors={{}} states={{}} change={(id,value)=>setValues(v=>({...v,[id]:value}))}/>;}
 render(<Example/>);expect(screen.getByRole('button',{name:'Remove row'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Add row'}));expect(screen.getByRole('button',{name:'Add row'})).toBeDisabled();
 const inputs=screen.getAllByLabelText('Note');expect(inputs).toHaveLength(2);fireEvent.change(inputs[1],{target:{value:'Second'}});expect(inputs[0]).toHaveValue('First');expect(inputs[1]).toHaveValue('Second');
 fireEvent.click(screen.getAllByRole('button',{name:'Remove row'})[0]);expect(screen.getByLabelText('Note')).toHaveValue('Second');expect(screen.getByRole('button',{name:'Remove row'})).toBeDisabled();
});
