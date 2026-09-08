"use client";
import React, {useCallback, useEffect, useState} from "react";
import {Button, DateInput, Input, LocalizedText, Modal, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TimeInput} from "@pepbits/ops-ui";
import {useERP, useProduct} from "@pepbits/erp-shell";
import {useProductRequest} from "../product-services";

type Schedule = {id:string; enabled:number; next:number; spec:{name:string; language:string}};
type Delivery = {id:string; state:string; due:number; attempts:number; spec:{name:string}};
export function ScheduleModal({open,onClose,pageId}:{open:boolean;onClose:()=>void;pageId:string}) {
  const {preferences,t,format}=useERP();const product=useProduct();const request=useProductRequest();
  const [name,setName]=useState("");const [frequency,setFrequency]=useState("monthly");
  const [date,setDate]=useState(()=>new Date(Date.now()+86400000).toISOString().slice(0,10));
  const [time,setTime]=useState("07:30");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const [schedules,setSchedules]=useState<Schedule[]>([]);const [deliveries,setDeliveries]=useState<Delivery[]>([]);
  const call=useCallback(async(action:string,values:Record<string,unknown>={})=>{
    const response=await request('/report-schedules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,productId:product.id,pageId,...values})});
    const body=await response.json();if(!response.ok)throw new Error(body.error ?? t('Report request failed.'));return body;
  },[request,product.id,pageId,t]);
  useEffect(()=>{
    if(!open)return;let alive=true;
    const refresh=()=>{void call('list').then(body=>{if(alive){setSchedules(body.schedules);setDeliveries(body.deliveries);}}).catch(()=>{if(alive)setError(t('Report request failed.'));});};
    refresh();const timer=window.setInterval(refresh,5000);return()=>{alive=false;window.clearInterval(timer);};
  },[open,call,t]);
  const perform=async(action:string,values:Record<string,unknown>)=>{
    setBusy(true);setError('');
    try {
      const body=await call(action,values);
      if(action==='download') {
        const url=URL.createObjectURL(new Blob([body.content],{type:'text/csv;charset=utf-8'}));
        const anchor=document.createElement('a');anchor.href=url;anchor.download=body.filename;document.body.appendChild(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
      const latest=await call('list');setSchedules(latest.schedules);setDeliveries(latest.deliveries);
      if(action==='create')setName('');
    }catch(cause){setError(cause instanceof Error?cause.message:t('Report request failed.'));}finally{setBusy(false);}
  };
  return <Modal open={open} onClose={onClose} title="ui.schedule.report.delivery.e7dd43ec" size="lg" footer={<Button variant="ghost" onClick={onClose}><LocalizedText message="Close" /></Button>}>
    <div className="flex flex-col gap-4 p-5">
      <p className="text-sm"><LocalizedText message="Scheduled demo summaries are delivered here as CSV. Times use UTC. Email delivery is not configured." /></p>
      {error&&<p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
      <form className="grid grid-cols-2 gap-3" onSubmit={event=>{event.preventDefault();void perform('create',{name,frequency,startAt:`${date}T${time}:00Z`,language:preferences.language});}}>
        <Input label="ui.schedule.name.60918e4f" required maxLength={100} value={name} onChange={event=>setName(event.target.value)} />
        <Select label="ui.frequency.16b6668d" value={frequency} onChange={event=>setFrequency(event.target.value)} options={['daily','weekly','monthly','quarterly'].map(value=>({value,label:value[0].toUpperCase()+value.slice(1)}))} />
        <DateInput label="ui.start.date.81696931" required value={date} onChange={event=>setDate(event.target.value)} />
        <TimeInput label="Delivery time (UTC)" required value={time} onChange={event=>setTime(event.target.value)} />
        <Button type="submit" variant="primary" disabled={busy||!name.trim()}><LocalizedText message="ui.create.schedule.5b08f3c7" /></Button>
      </form>
      <Table><TableHeader><TableRow><TableHead><LocalizedText message="Name" /></TableHead><TableHead><LocalizedText message="Next run (UTC)" /></TableHead><TableHead><LocalizedText message="Actions" /></TableHead></TableRow></TableHeader><TableBody>
        {schedules.map(row=><TableRow key={row.id}><TableCell>{row.spec.name}</TableCell><TableCell>{new Date(row.next).toISOString().replace('T',' ').slice(0,16)}</TableCell><TableCell><Button disabled={busy} onClick={()=>void perform('toggle',{id:row.id,enabled:!row.enabled})}><LocalizedText message={row.enabled?'Pause':'Resume'} /></Button></TableCell></TableRow>)}
      </TableBody></Table>
      <p className="text-sm"><LocalizedText message="Delivered reports are retained for 30 days. Failed deliveries retry automatically up to five times." /></p>
      <Table><TableHeader><TableRow><TableHead><LocalizedText message="Name" /></TableHead><TableHead><LocalizedText message="Status" /></TableHead><TableHead><LocalizedText message="Actions" /></TableHead></TableRow></TableHeader><TableBody>
        {deliveries.map(row=><TableRow key={row.id}><TableCell>{row.spec.name}</TableCell><TableCell><LocalizedText message={{ready:'Ready',failed:'Failed',pending:'Pending',processing:'Processing'}[row.state]??'Pending'} /> ({format.number(row.attempts)})</TableCell><TableCell>{row.state==='ready'?<Button disabled={busy} onClick={()=>void perform('download',{id:row.id})}><LocalizedText message="Download" /></Button>:row.state==='failed'?<Button disabled={busy} onClick={()=>void perform('retry',{id:row.id})}><LocalizedText message="Retry" /></Button>:null}</TableCell></TableRow>)}
      </TableBody></Table>
    </div>
  </Modal>;
}
