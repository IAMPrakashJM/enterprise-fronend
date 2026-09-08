import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {test,expect,vi} from 'vitest';
import {PAGE_REGISTRY} from '@pepbits/erp-config';
import type {ImportJob} from '@pepbits/erp-data';
import {ProductServicesProvider} from '../product-services';
import {CsvImportDialog} from './csv-import-dialog';
vi.mock('@pepbits/auth',()=>({readToken:()=> 'token',authedFetch:vi.fn(),reportOperationFailure:vi.fn(),reportSentinelFailure:vi.fn()}));
const pending:ImportJob={id:'job',productId:'test',pageId:'customer-master',confirmed:false,createdAt:new Date().toISOString(),rows:[{row:1,values:{customerCode:'NEW'},errors:{},status:'pending'},{row:2,values:{customerCode:'BAD'},errors:{email:'Invalid email'},status:'invalid'}]};
function setup(job:ImportJob){const adapter={latest:vi.fn().mockResolvedValue(job),preview:vi.fn(),run:vi.fn()};const onImported=vi.fn();render(<ProductServicesProvider services={{imports:adapter}}><CsvImportDialog open onClose={vi.fn()} page={PAGE_REGISTRY['customer-master']} productId="test" onImported={onImported}/></ProductServicesProvider>);return {adapter,onImported};}
test('restored validation requires explicit confirmation before writing',async()=>{
 const {adapter,onImported}=setup(pending);adapter.run.mockResolvedValue({...pending,confirmed:true,rows:pending.rows.map(row=>row.status==='pending'?{...row,status:'success'}:row)});
 fireEvent.click(await screen.findByRole('button',{name:'Import valid rows: 1'}));expect(adapter.run).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Confirm import'}));await waitFor(()=>expect(onImported).toHaveBeenCalledOnce());expect(adapter.run).toHaveBeenCalledWith('job',false);expect(screen.getByText(/Imported: 1 · Invalid: 1/)).toBeVisible();
});
test('retry preserves completed rows and retries failed writes once',async()=>{
 const job:ImportJob={...pending,confirmed:true,rows:[{...pending.rows[0],status:'success'},{...pending.rows[1],status:'failed',retryable:true}]};
 const {adapter}=setup(job);adapter.run.mockResolvedValue({...job,rows:job.rows.map(row=>({...row,status:'success',errors:{}}))});
 fireEvent.click(await screen.findByRole('button',{name:'Retry failed rows'}));await waitFor(()=>expect(adapter.run).toHaveBeenCalledOnce());expect(adapter.run).toHaveBeenCalledWith('job',true);expect(screen.getByText(/Imported: 2/)).toBeVisible();
});
test('an interrupted request retains the job for safe resume',async()=>{
 const {adapter}=setup({...pending,confirmed:true});adapter.run.mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValue({...pending,confirmed:true,rows:pending.rows.map(row=>row.status==='pending'?{...row,status:'success'}:row)});
 fireEvent.click(await screen.findByRole('button',{name:'Resume import'}));expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');fireEvent.click(screen.getByRole('button',{name:'Resume import'}));await waitFor(()=>expect(adapter.run).toHaveBeenCalledTimes(2));expect(adapter.run.mock.calls[0]).toEqual(adapter.run.mock.calls[1]);
});
