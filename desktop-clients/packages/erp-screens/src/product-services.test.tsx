import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {test,expect,vi} from 'vitest';
import {ProductServicesProvider,useProductRequest} from './product-services';
const session=vi.hoisted(()=>({token:'one'}));
vi.mock('@pepbits/auth',async importOriginal=>({...await importOriginal<typeof import('@pepbits/auth')>(),readToken:()=>session.token,authedFetch:vi.fn()}));
function Probe(){
 const request=useProductRequest();const [status,setStatus]=React.useState('idle');
 return <><button onClick={()=>void request('/worklists/search',{method:'POST',body:'{}'}).then(()=>setStatus('done')).catch(()=>setStatus('ended'))}>Search</button><span>{status}</span></>;
}
test('a product replaces transport and an old session cannot make another request',async()=>{
 session.token='one';const request=vi.fn().mockResolvedValue(new Response('{}'));
 render(<ProductServicesProvider services={{request}}><Probe /></ProductServicesProvider>);
 fireEvent.click(screen.getByText('Search'));await waitFor(()=>expect(screen.getByText('done')).toBeVisible());
 expect(request).toHaveBeenCalledWith('/worklists/search',expect.objectContaining({method:'POST',body:'{}',signal:expect.any(AbortSignal)}));
 session.token='two';fireEvent.click(screen.getByText('Search'));await waitFor(()=>expect(screen.getByText('ended')).toBeVisible());
 expect(request).toHaveBeenCalledTimes(1);
});

test('localizes an API error descriptor while preserving HTTP status and diagnostics',async()=>{
 session.token='one';
 const request=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'English fallback',errorMessage:{messageKey:'test.error',messageValues:{record:'CUS-001'}},detail:'Trace X-19'}),{status:409,headers:{'Content-Type':'application/json','ETag':'"v2"'}}));
 const {LocalizationProvider}=await import('@pepbits/ops-ui');
 function ErrorProbe(){const send=useProductRequest();const [result,setResult]=React.useState('');return <button onClick={()=>void send('/records').then(async response=>{const body=await response.json();setResult(`${response.status}|${response.headers.get('ETag')}|${body.error}|${body.detail}`);})}>{result||'Send error'}</button>}
 render(<LocalizationProvider value={{language:'ar',direction:'rtl',dateTime:String,t:(key,values)=>key==='test.error'?`تعارض ${values?.record}`:key}}><ProductServicesProvider services={{request}}><ErrorProbe/></ProductServicesProvider></LocalizationProvider>);
 fireEvent.click(screen.getByText('Send error'));await waitFor(()=>expect(screen.getByText('409|"v2"|تعارض CUS-001|Trace X-19')).toBeVisible());
});
