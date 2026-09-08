"use client";
import React,{useEffect,useState} from 'react';
import {DEFAULT_PREFERENCES, PREFERENCE_OPTIONS, PREFERENCE_RANGES, EMPTY_PREFERENCE_POLICY, parsePreferencePolicy, type PreferenceKey, type PreferencePolicy} from '@pepbits/erp-config';
import {useERP,useProduct} from '@pepbits/erp-shell';
import {Button,Card,Input,LocalizedText,Select,Table,TableBody,TableCell,TableHead,TableHeader,TableRow,Toggle} from '@pepbits/ops-ui';
import {useProductRequest} from '../product-services';

export function PreferencePolicyAdmin() {
 const request=useProductRequest();const product=useProduct();const {t,refreshPreferences}=useERP();
 const [policy,setPolicy]=useState<PreferencePolicy>(EMPTY_PREFERENCE_POLICY);const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState(false);const [search,setSearch]=useState('');
 const [history,setHistory]=useState<Array<{revision:number;actor:string;at:string}>>([]);
 async function load(){setReady(false);setError('');try{
  const response=await request('/preference-policy',{headers:{'X-Product-Id':product.id}});if(!response.ok)throw new Error('Could not load preference policy.');
  const body=await response.json();setPolicy(parsePreferencePolicy(body.policy));setHistory(body.history??[]);setReady(true);
 }catch{setError('Could not load preference policy.');}}
 useEffect(()=>{void load();},[product.id]);
 const change=(key:PreferenceKey,value:unknown,locked:boolean)=>{setSaved(false);setPolicy(current=>({...current,rules:{...current.rules,[key]:{value:value as never,locked}}}));};
 async function save(){setBusy(true);setError('');setSaved(false);try {
  const response=await request('/preference-policy',{method:'PUT',headers:{'Content-Type':'application/json','X-Product-Id':product.id},body:JSON.stringify(policy)});
  if(response.status===409){setError('Preference policy changed. Reload before saving.');setReady(false);return;}
  if(!response.ok)throw new Error('Could not save preference policy.');
  await load();setSaved(true);await refreshPreferences();window.dispatchEvent(new Event('nexora-preference-policy-changed'));
 }catch{setError('Could not save preference policy.');}finally{setBusy(false);}}
 const label=(key:string)=>t(`preference.label.${key}`);
 return <Card className="flex min-w-0 flex-col gap-3 p-4">
  <p className="font-bold"><LocalizedText message="Preference policies" /> — {product.name}</p>
  <p className="text-sm"><LocalizedText message="Set defaults and lock settings for everyone in this tenant and application. Unlocking restores personal choices." /></p>
  {error?<p role="alert"><LocalizedText message={error} /></p>:null}
  {saved?<p role="status"><LocalizedText message="Preference policy saved." /></p>:null}
  <div className="flex gap-2"><Input aria-label="Search settings" placeholder="Search settings…" value={search} onChange={event=>setSearch(event.target.value)} /><Button disabled={busy} onClick={()=>void load()}><LocalizedText message="Reload" /></Button><Button variant="primary" disabled={!ready||busy} onClick={()=>void save()}><LocalizedText message="Save policy" /></Button></div>
  <Table><TableHeader><TableRow><TableHead><LocalizedText message="Preference" /></TableHead><TableHead><LocalizedText message="Default or locked value" /></TableHead><TableHead><LocalizedText message="Locked" /></TableHead><TableHead><LocalizedText message="Actions" /></TableHead></TableRow></TableHeader><TableBody>
   {(Object.keys(DEFAULT_PREFERENCES) as PreferenceKey[]).filter(key=>label(key).toLowerCase().includes(search.toLowerCase())).map(key=>{
    const rule=policy.rules[key],value=rule?.value??DEFAULT_PREFERENCES[key],locked=rule?.locked??false;
    const options=PREFERENCE_OPTIONS[key],range=PREFERENCE_RANGES[key];
    return <TableRow key={key} data-policy-key={key}><TableCell>{label(key)}</TableCell><TableCell>
     <fieldset disabled={!ready||busy} className="m-0 border-0 p-0">
      {typeof value==='boolean'?<Toggle label={label(key)} checked={value} onChange={value=>change(key,value,locked)} />:options?<Select aria-label={label(key)} value={String(value)} options={options.map(value=>({value:String(value),label:t(`preference.option.${key}.${value}`)}))} onChange={event=>change(key,typeof DEFAULT_PREFERENCES[key]==='number'?Number(event.target.value):event.target.value,locked)} />:<Input aria-label={label(key)} type="number" value={Number.isFinite(Number(value))?Number(value):""} min={range?.[0]} max={range?.[1]} step={key==='cornerRadius'?1:0.5} onChange={event=>change(key,event.target.value===''?NaN:Number(event.target.value),locked)} />}
     </fieldset>
    </TableCell><TableCell><Toggle label="Locked" checked={locked} disabled={!ready||busy} onChange={locked=>change(key,value,locked)} /></TableCell><TableCell><Button disabled={!ready||busy||!rule} onClick={()=>{setSaved(false);setPolicy(current=>{const rules={...current.rules};delete rules[key];return {...current,rules};});}}><LocalizedText message="Use application default" /></Button></TableCell></TableRow>;
   })}
  </TableBody></Table>
  <p className="font-bold"><LocalizedText message="Policy history" /></p>
  {history.map(item=><p key={item.revision} className="text-sm">{item.revision} · {item.actor} · {item.at}</p>)}
 </Card>;
}
