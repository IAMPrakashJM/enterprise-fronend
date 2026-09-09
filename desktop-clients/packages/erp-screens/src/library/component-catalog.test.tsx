import React from 'react';
import {render,screen,fireEvent,within,waitFor} from '@testing-library/react';
import {expect,test,vi} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {ComponentCatalog} from './component-catalog';
import {CATALOG_ENTRIES,CATALOG_GROUPS} from './catalog';
import examples from './examples.generated.json';
import type {PageDefinition} from '@pepbits/erp-config';
const {navigate}=vi.hoisted(()=>({navigate:vi.fn()}));
vi.mock('@pepbits/platform-ports',()=>({useNavigation:()=>({open:navigate})}));
vi.mock('@pepbits/erp-shell',()=>({useProduct:()=>({pages:Object.fromEntries(['component-library','form-controls','feedback-components','table-components'].map(id=>[id,{id}]))})}));
function setup(id='form-controls'){render(<ComponentCatalog page={{id,title:id,kind:'library',module:'library'} as PageDefinition}/>);}
function demo(id:string){return within(document.querySelector(`[data-catalog-example="${id}"]`) as HTMLElement);}
test('every public ops-ui component is indexed and every example has runnable code',()=>{
 const directory=process.cwd()+'/packages/ops-ui/src/';
 const components=readdirSync(directory).filter(f=>f.endsWith('.tsx')&&!f.includes('.test.')).flatMap(file=>[...readFileSync(directory+file,'utf8').matchAll(/export function ([A-Z]\w*)/g)].map(match=>match[1]));
 const documented=new Set<string>(CATALOG_ENTRIES.flatMap(entry=>[...entry.components]));
 expect(components.filter(name=>!documented.has(name))).toEqual([]);
 for(const entry of CATALOG_ENTRIES){expect(examples[entry.id]).toContain(`export function ${entry.id}(`);expect(CATALOG_GROUPS.some(group=>group.key===entry.group)).toBe(true);}
});
test('form search finds component names and reset clears only the demo',()=>{
 setup();fireEvent.change(demo('TextDemo').getByLabelText(/Name/),{target:{value:'Draft example'}});
 fireEvent.click(demo('TextDemo').getByRole('button',{name:'Reset demo'}));expect(demo('TextDemo').getByLabelText(/Name/)).toHaveValue('');
 fireEvent.change(screen.getByLabelText('Search component names or source files'),{target:{value:'MultiSelect'}});
 expect(document.querySelectorAll('[data-catalog-example]')).toHaveLength(1);expect(demo('SelectDemo').getByRole('heading',{level:3})).toHaveTextContent('MultiSelect');
});
test('copy uses actual rendered source and clipboard failure has manual fallback',async()=>{
 const writeText=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
 setup();fireEvent.click(demo('TextDemo').getByRole('button',{name:'Copy code'}));await screen.findByText('Code copied.');expect(writeText).toHaveBeenCalledWith(examples.TextDemo);
 writeText.mockRejectedValueOnce(new Error('denied'));fireEvent.click(demo('TextDemo').getByRole('button',{name:'Copy code'}));await screen.findByText('Clipboard unavailable. Select the code and copy it manually.');
 expect(demo('TextDemo').getByRole('textbox',{name:'React integration code'})).toHaveValue(examples.TextDemo);
});
test('navigation exposes only available product pages',()=>{
 setup();fireEvent.click(screen.getByRole('button',{name:'Tables'}));expect(navigate).toHaveBeenCalledWith({pageId:'table-components'});
 expect(screen.queryByRole('button',{name:'Dates & Calendars'})).not.toBeInTheDocument();
});
test('overlays confirm locally and recovery retry preserves inputs',async()=>{
 setup('feedback-components');fireEvent.click(demo('OverlaysDemo').getByRole('button',{name:'ConfirmDialog'}));
 const dialog=screen.getByRole('dialog');fireEvent.click(within(dialog).getByRole('button',{name:'Confirm'}));await screen.findByText('Demo action confirmed.');
 fireEvent.change(demo('RecoveryDemo').getByLabelText('Notes'),{target:{value:'Keep this'}});fireEvent.click(demo('RecoveryDemo').getByRole('button',{name:'Retry'}));
 expect(demo('RecoveryDemo').getByLabelText('Notes')).toHaveValue('Keep this');await waitFor(()=>expect(demo('RecoveryDemo').getByText('Recovered. Your input is unchanged.')).toBeVisible());
});
