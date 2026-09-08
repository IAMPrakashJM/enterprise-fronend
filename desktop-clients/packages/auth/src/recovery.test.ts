import {it,expect,vi,afterEach} from 'vitest';
import {recoveryRequest} from './recovery';
import {subscribeSentinel} from './sentinel';
afterEach(()=>vi.useRealTimers());
it('aborts a stalled request, reports one traceable timeout, and never retries a write automatically',async()=>{
 vi.useFakeTimers();const events:unknown[]=[];const stop=subscribeSentinel(e=>events.push(e));
 const send=vi.fn((_path,init)=>new Promise<Response>((_,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('SECRET','AbortError')))));
 const pending=recoveryRequest(send,'/records',{method:'PUT',body:'PRIVATE'},50).catch(e=>e);
 await vi.advanceTimersByTimeAsync(50);const error=await pending;
 expect(error.status).toBe(408);expect(error.reference).toMatch(/^[a-f0-9-]{36}$/);expect(send).toHaveBeenCalledOnce();expect(events).toHaveLength(1);expect(JSON.stringify(events)).not.toMatch(/SECRET|PRIVATE/);expect(events[0]).toMatchObject({id:error.reference,code:'request-timeout'});stop();
});
it.each([401,403,422,429,503])('preserves HTTP %i and returns the collected reference',async status=>{
 const events:unknown[]=[];const stop=subscribeSentinel(e=>events.push(e));const response=await recoveryRequest(async()=>new Response('{}',{status}),'/records');
 expect(response.status).toBe(status);expect(events[0]).toMatchObject({id:response.headers.get('X-Sentinel-Reference'),status});stop();
});
it('caller cancellation is not a service timeout and does not produce an incident',async()=>{
 const events:unknown[]=[];const stop=subscribeSentinel(e=>events.push(e));const controller=new AbortController();controller.abort();
 await expect(recoveryRequest(async()=>{throw new DOMException('Cancelled','AbortError');},'/records',{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});expect(events).toHaveLength(0);stop();
});
it('keeps the JSON deadline active after response headers arrive',async()=>{
 vi.useFakeTimers();const send=async(_path:string,init:RequestInit)=>new Response(new ReadableStream({start(controller){init.signal?.addEventListener('abort',()=>controller.error(new DOMException('Aborted','AbortError')));}}),{headers:{'Content-Type':'application/json'}});
 const result=recoveryRequest(send,'/records',{},50).catch(error=>error);await vi.advanceTimersByTimeAsync(50);expect(await result).toMatchObject({status:408});
});
