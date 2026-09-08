import React from 'react';
import {render,screen} from '@testing-library/react';
import {test,expect} from 'vitest';
import {defineProduct} from '@pepbits/erp-config';
import {ProductProvider} from '@pepbits/erp-shell';
import {PageRenderer} from './page-renderer';
const product=defineProduct({id:'restricted',name:'Restricted',tagline:'',defaultModule:'finance',enabledModules:['finance'],access:{actions:{edit:['manager'],create:['manager']},pages:{'customer-master':['manager']}}});
test('a direct edit target cannot bypass action permissions',()=>{
 render(<ProductProvider product={product} role="viewer"><PageRenderer target={{pageId:'billing-entry',mode:'edit',recordId:'one'}} /></ProductProvider>);
 expect(screen.getByText('Action unavailable for your role')).toBeVisible();
 expect(screen.queryByRole('button',{name:'Save'})).not.toBeInTheDocument();
});
test('a direct page target cannot bypass page permissions',()=>{
 render(<ProductProvider product={product} role="viewer"><PageRenderer target={{pageId:'customer-master'}} /></ProductProvider>);
 expect(screen.getByText('Page unavailable for your role')).toBeVisible();
});
