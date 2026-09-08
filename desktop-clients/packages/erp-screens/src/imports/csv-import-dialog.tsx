"use client";
import {reportOperationFailure} from "@pepbits/auth";
import { TableContainer } from "@pepbits/ops-ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@pepbits/ops-ui";
import { LocalizedText, useLocalization } from "@pepbits/ops-ui";
import React,{useContext,useEffect,useMemo,useRef,useState} from 'react';
import {getImportDefinition,localizeFieldError,localizeImportError,type PageDefinition} from '@pepbits/erp-config';
import {createHttpImportAdapter,mapImportRows,parseCsv,suggestMapping,type ImportJob} from '@pepbits/erp-data';
import {Button,Input,Modal,Select,ConfirmDialog} from '@pepbits/ops-ui';
import {ProductImportContext,useProductRequest} from '../product-services';
export function CsvImportDialog({open,onClose,page,productId,onImported}: {open:boolean;onClose:()=>void;page:PageDefinition;productId:string;onImported:()=>void}) {
  const {t: translateCopy} = useLocalization();
 const {t}=useLocalization();
 const request=useProductRequest(),provided=useContext(ProductImportContext);
 const adapter=useMemo(()=>provided??createHttpImportAdapter(request),[provided,request]);
 const definition=useMemo(()=>getImportDefinition(page.entity),[page.entity]);
 const fields=definition?.schema.sections.flatMap(section=>section.fields)??[];
 const [csv,setCsv]=useState<ReturnType<typeof parseCsv>|null>(null),[filename,setFilename]=useState(''),[mapping,setMapping]=useState<Record<string,string>>({});
 const [job,setJob]=useState<ImportJob|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState(false),[view,setView]=useState<'upload'|'mapping'|'review'>('upload');
 const [filter,setFilter]=useState<'all'|'errors'>('all');
 const closing=useRef(false);
 const active=useRef(true),stop=useRef(false),lock=useRef(false),generation=useRef(0),preview=useRef<{id:string;rows:Record<string,string>[]}|null>(null);
 const latest=useRef({onImported,onClose});latest.current={onImported,onClose};
 useEffect(()=>{active.current=true;return()=>{active.current=false;stop.current=true;generation.current++;};},[]);
 useEffect(()=>{
  if(!open)return;closing.current=false;stop.current=false;const version=++generation.current;
  if(job||csv)return;
  setBusy(true);void adapter.latest(productId,page.id).then(value=>{if(active.current&&version===generation.current&&value){setJob(value);setView('review');}}).catch(e=>{reportOperationFailure();if(active.current&&version===generation.current)setError(e.message);}).finally(()=>{if(active.current&&version===generation.current)setBusy(false);});
 },[open,adapter,productId,page.id]);
 const readFile=async(file?:File)=>{
  if(!file)return;const version=++generation.current;setError(null);setBusy(true);
  try{
   if(file.size>2*1024*1024||!file.name.toLowerCase().endsWith('.csv'))throw new Error('Choose a UTF-8 .csv file up to 2 MB.');
   const parsed=parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
   if(!active.current||version!==generation.current)return;
   setCsv(parsed);setFilename(file.name);setMapping(suggestMapping(parsed.headers,fields));setJob(null);preview.current=null;setView('mapping');
  }catch(e){reportOperationFailure();if(active.current&&version===generation.current)setError((e as Error).message);}
  finally{if(active.current&&version===generation.current)setBusy(false);}
 };
 const validate=async()=>{
  if(!csv||lock.current)return;lock.current=true;setBusy(true);setError(null);
  try{preview.current??={id:crypto.randomUUID(),rows:mapImportRows(csv.rows,mapping)};const result=await adapter.preview(productId,page.id,preview.current.rows,preview.current.id);if(active.current){setJob(result);setView('review');setFilter('all');}}
  catch(e){reportOperationFailure();if(active.current)setError((e as Error).message);}
  finally{lock.current=false;if(active.current){setBusy(false);if(closing.current)latest.current.onClose();}}
 };
 const run=async(retry=false)=>{
  if(!job||lock.current)return;lock.current=true;stop.current=false;setBusy(true);setConfirm(false);setError(null);
  try{
   let next=await adapter.run(job.id,retry);if(!active.current)return;setJob(next);latest.current.onImported();
   while(!stop.current&&active.current&&next.rows.some(row=>row.status==='pending')){next=await adapter.run(job.id);if(active.current){setJob(next);latest.current.onImported();}}
  }catch(e){reportOperationFailure();if(active.current)setError((e as Error).message);}
  finally{lock.current=false;if(active.current){setBusy(false);if(closing.current)latest.current.onClose();}}
 };
 const close=()=>{closing.current=true;stop.current=true;if(!lock.current)onClose();};
 const counts={pending:0,invalid:0,success:0,failed:0};job?.rows.forEach(row=>counts[row.status]++);
 const missing=fields.filter(field=>field.required&&field.defaultValue===undefined&&(mapping[field.id]===undefined||mapping[field.id]===''));
 const report=()=>{
  if(!job)return;
  const quote=(text:unknown)=>{let value=String(text??'');if(/^[=+@\-\t\r]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';};
  const records=[['Data row','Status','Record code','Errors'],...job.rows.filter(row=>row.status==='invalid'||row.status==='failed').map(row=>[row.row,row.status,row.values[definition?.uniqueField??''],Object.entries(row.errors).map(([field,error])=>`${field}: ${error}`).join('; ')])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+records.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='import-errors.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 if(!definition)return null;
 return <>
 <Modal open={open} onClose={close} title={t("Import {page}",{page:t(page.title)})} subtitle="ui.upload.csv.map.columns.review.validation.confirm.results.e725ed21" size="xl">
  <div className="space-y-4 p-5">
   {error?<div role="alert" className="rounded-lg border border-[var(--border)] p-3 text-[var(--danger-ink)]">{localizeImportError(error,t)}</div>:null}
   {view==='upload'?<><p><LocalizedText message="ui.create.new.records.from.utf.8.csv.existing.records.are.n.e8ccc310" /></p><Input type="file" accept=".csv,text/csv" label="ui.upload.csv.file.032e2024" disabled={busy} onChange={event=>{void readFile(event.target.files?.[0]);event.target.value='';}} /></>:null}
   {view==='mapping'&&csv?<>
    <p><b>{filename}</b> · {csv.rows.length}{" "}<LocalizedText message="ui.data.rows.the.first.row.supplies.column.headers.7533f307" /></p>
    <TableContainer tabIndex={0} role="region" aria-label={translateCopy("ui.csv.row.preview.e4755004")} className="max-h-48 rounded-lg border border-[var(--border)]"><Table className="w-full text-left text-sm"><TableCaption className="p-2 text-left"><LocalizedText message="ui.csv.preview.first.5.data.rows.ecc688e2" /></TableCaption><TableHeader><TableRow>{csv.headers.map(header=><TableHead className="p-2" key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{csv.rows.slice(0,5).map((row,index)=><TableRow key={index}>{row.map((value,column)=><TableCell key={column} className="max-w-64 break-words border-t border-[var(--border)] p-2">{value}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>
    <div className="grid max-h-72 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">{fields.map(field=><Select key={field.id} label={t(field.label)} required={field.required} hint={field.defaultValue!==undefined?t("Unmapped default: {value}",{value:String(field.defaultValue)}):field.options?.length?t("Values: {values}",{values:field.options.map(option=>option.value).join(", ")}):undefined} value={mapping[field.id]??''} disabled={busy} placeholder="ui.do.not.import.this.field.278b4151" options={csv.headers.map((header,index)=>({label:header,value:String(index)}))} onChange={event=>{setMapping(previous=>({...previous,[field.id]:event.target.value}));preview.current=null;}} />)}</div>
    {missing.length?<p role="status"><LocalizedText message="ui.map.required.fields.ac41d1c5" />{" "}{missing.map(field=>t(field.label)).join(', ')}.</p>:null}
    <div className="flex gap-2"><Button disabled={busy} onClick={()=>setView('upload')}><LocalizedText message="ui.choose.another.file.26eac8f8" /></Button><Button disabled={busy||!!missing.length} onClick={()=>void validate()}><LocalizedText message="ui.validate.mapped.rows.ecc729da" /></Button></div>
   </>:null}
   {view==='review'&&job?<>
    <p>{t("Rows: {total} · Ready: {ready} · Imported: {success} · Invalid: {invalid} · Failed: {failed}",{total:job.rows.length,ready:counts.pending,success:counts.success,invalid:counts.invalid,failed:counts.failed})}</p>
    {job.confirmed?<><progress className="w-full" aria-label={translateCopy("ui.import.progress.d3d5b27e")} max={job.rows.length} value={job.rows.length-counts.pending} /><p role="status">{t(busy?'Importing rows…':counts.pending?'Import paused. Resume to continue.':'Import processing finished.')}</p></>:<p><LocalizedText message="ui.review.the.errors.below.confirmation.imports.only.valid.f560aca8" /></p>}
    <div className="flex flex-wrap gap-2"><Button variant={filter==='all'?'primary':'secondary'} onClick={()=>setFilter('all')}><LocalizedText message="ui.all.rows.8e4d5816" /></Button><Button variant={filter==='errors'?'primary':'secondary'} onClick={()=>setFilter('errors')}><LocalizedText message="ui.error.rows.2e0bd452" /></Button><Button disabled={!counts.invalid&&!counts.failed} onClick={report}><LocalizedText message="ui.download.error.report.637a735e" /></Button></div>
    <TableContainer tabIndex={0} role="region" aria-label={translateCopy("ui.import.row.results.9434e9fe")} className="max-h-80 rounded-lg border border-[var(--border)]"><Table className="w-full text-left text-sm"><TableCaption className="p-2 text-left"><LocalizedText message="ui.validation.and.import.results.37168996" /></TableCaption><TableHeader><TableRow><TableHead className="p-2"><LocalizedText message="ui.data.row.c8519601" /></TableHead><TableHead className="p-2"><LocalizedText message="ui.record.code.23b720ff" /></TableHead><TableHead className="p-2"><LocalizedText message="ui.status.920e413c" /></TableHead><TableHead className="p-2"><LocalizedText message="ui.errors.cb702378" /></TableHead></TableRow></TableHeader><TableBody>{job.rows.filter(row=>filter==='all'||row.status==='invalid'||row.status==='failed').map(row=><TableRow key={row.row}><TableCell className="border-t border-[var(--border)] p-2">{row.row}</TableCell><TableCell className="border-t border-[var(--border)] p-2">{String(row.values[definition.uniqueField]??'')}</TableCell><TableCell className="border-t border-[var(--border)] p-2">{t(row.status==='pending'?'Ready':row.status)}</TableCell><TableCell className="border-t border-[var(--border)] p-2">{Object.entries(row.errors).map(([field,error])=><div key={field}>{t(fields.find(item=>item.id===field)?.label??field)}: {localizeFieldError(error,fields.find(item=>item.id===field)?.label??field,t)}</div>)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <div className="flex flex-wrap gap-2">
     {busy?<Button onClick={()=>{stop.current=true;}}><LocalizedText message="ui.pause.after.current.batch.96705400" /></Button>:<>
      {counts.pending?<Button onClick={()=>job.confirmed?void run():setConfirm(true)}>{job.confirmed?<LocalizedText message="ui.resume.import.f12822f9" />:t("Import valid rows: {count}",{count:counts.pending})}</Button>:null}
      {job.rows.some(row=>row.status==='failed'&&row.retryable)?<Button onClick={()=>void run(true)}><LocalizedText message="ui.retry.failed.rows.6160b90e" /></Button>:null}
      {!job.confirmed&&csv?<Button onClick={()=>{setView('mapping');setJob(null);preview.current=null;}}><LocalizedText message="ui.change.mapping.6872ef3c" /></Button>:null}
      <Button disabled={job.confirmed&&(counts.pending>0||job.rows.some(row=>row.status==='failed'&&row.retryable))} onClick={()=>{setView('upload');setJob(null);setCsv(null);preview.current=null;setError(null);}}><LocalizedText message="ui.start.new.import.eabc7445" /></Button>
     </>}
    </div>
   </>:null}
   {busy&&view!=='review'?<p role="status">{t(view==='mapping'?'Validating rows…':'Loading import…')}</p>:null}
   {busy?<p><LocalizedText message="ui.closing.pauses.after.the.current.batch.completed.rows.re.dd7e09b9" /></p>:null}
  </div>
 </Modal>
 <ConfirmDialog open={confirm} title="ui.confirm.import.8f8e1565" message={t("Create records: {count}. Excluded invalid rows: {invalid}. Existing records will not be overwritten.",{count:counts.pending,invalid:counts.invalid})} confirmLabel="ui.confirm.import.4ca48b42" onConfirm={()=>void run()} onCancel={()=>setConfirm(false)} />
 </>;
}
