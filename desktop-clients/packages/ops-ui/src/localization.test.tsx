import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect} from 'vitest';
import {LocalizationProvider,LocalizedText,type Localization} from './localization';
import {Input,Select} from './form-controls';
import {Button} from './button';
const locale=(language:string):Localization=>({language,direction:language==='ar'?'rtl':'ltr',t:key=>language==='ar'?({Name:'الاسم',Save:'حفظ',Active:'نشط',Status:'الحالة'}[key]??key):key,dateTime:String});
function Form(){const[value,setValue]=useState('');return <><Input label="Name" value={value} onChange={e=>setValue(e.target.value)}/><Select label="Status" defaultValue="active" options={[{label:'Active',value:'active'}]}/><Button>Save</Button><LocalizedText message="Unknown extension"/></>;}
it('switches displayed labels without remounting drafts or changing option values',()=>{
 const {rerender}=render(<LocalizationProvider value={locale('en')}><Form/></LocalizationProvider>);
 fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Save CUS-001'}});
 rerender(<LocalizationProvider value={locale('ar')}><Form/></LocalizationProvider>);
 expect(screen.getByLabelText('الاسم')).toHaveValue('Save CUS-001');
 expect(screen.getByLabelText('الحالة')).toHaveValue('active');
 expect(screen.getByRole('option',{name:'نشط'})).toHaveAttribute('value','active');
 expect(screen.getByRole('button',{name:'حفظ'})).toBeVisible();
 expect(screen.getByText('Unknown extension')).toBeVisible();
});
