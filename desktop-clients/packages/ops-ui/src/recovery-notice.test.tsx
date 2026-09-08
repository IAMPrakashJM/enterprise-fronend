import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import {RecoveryNotice,failureFromError} from './recovery-notice';
import {LocalizationProvider} from './localization';
import {UI_MESSAGES,loadFallbackLanguage} from '@pepbits/erp-config';
afterEach(cleanup);
it.each(['en','ar','hi','ml'] as const)('renders all failure categories in %s with safe actions',async language=>{
 await loadFallbackLanguage(language);const t=(key:string)=>UI_MESSAGES[language][key]??key;
 for(const status of [undefined,408,403,422,401]){
  const retry=vi.fn(),reload=vi.fn(),signIn=vi.fn(),back=vi.fn();const failure=failureFromError({status,reference:'trace-123',message:'PRIVATE SQL'});
  const view=render(<LocalizationProvider value={{language,direction:language==='ar'?'rtl':'ltr',t,dateTime:String}}><RecoveryNotice failure={failure} preservesValues onRetry={retry} onReload={reload} onSignIn={signIn} onReturn={back}/></LocalizationProvider>);
  expect(screen.getByRole('alert')).toHaveTextContent(t(failure.description));expect(screen.getByRole('alert')).not.toHaveTextContent('PRIVATE');expect(screen.queryByRole('button',{name:t('Reload')})).toBeNull();
  if(failure.retryable){fireEvent.click(screen.getByRole('button',{name:t('Retry')}));expect(retry).toHaveBeenCalledOnce();}else expect(screen.queryByRole('button',{name:t('Retry')})).toBeNull();
  if(status===401){fireEvent.click(screen.getByRole('button',{name:t('Sign in')}));expect(signIn).toHaveBeenCalledOnce();}
  fireEvent.click(screen.getByRole('button',{name:t('recovery.return')}));expect(back).toHaveBeenCalledOnce();view.unmount();
 }
});
it('does not invent a reference when a domain adapter did not supply one',()=>{
 expect(failureFromError(new Error('secret')).reference).toBeUndefined();
});
