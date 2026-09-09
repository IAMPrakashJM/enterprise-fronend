"use client";
import React,{useContext,useEffect,useMemo,useState} from 'react';
import {useSession} from '@pepbits/auth';
import {TEMPLATE_BY_ID,canProductAction,type PageDefinition,type PageTemplateDefinition,type TemplateDocument} from '@pepbits/erp-config';
import {useERP,useProduct} from '@pepbits/erp-shell';
import type {NavigationTarget} from '@pepbits/platform-ports';
import {AccessDenied,ErrorState,LoadingState,RecoveryNotice,failureFromError} from '@pepbits/ops-ui';
import {ProductPageTemplateContext} from '../product-services';
import {PageTemplateWorkspace} from './page-template';
import type {TemplateScope,PageTemplateAdapter} from './template-state';
/** Business pages opt in explicitly; Library demos never use this adapter. */
export function ConfiguredTemplatePage({page,target}: {page:PageDefinition;target:NavigationTarget}) {
 const adapter=useContext(ProductPageTemplateContext),{user}=useSession(),product=useProduct(),{preferences,preferencePolicy,preferencesAvailable,updatePreference}=useERP();
 const definition=page.templateDefinition??TEMPLATE_BY_ID[page.templateId??''];
 const scope=useMemo<TemplateScope>(()=>({tenantId:user?.tenantId??'',applicationId:product.id,userId:user?.id??'',pageId:page.id,recordId:target.recordId??'new'}),[user?.tenantId,user?.id,product.id,page.id,target.recordId]);
 if(!user)return <AccessDenied/>;
 if(!definition||!adapter?.load)return <ErrorState title="template.integration" description="template.adapterHelp"/>;
 return <ConnectedEditor key={JSON.stringify(scope)} scope={scope} definition={definition} adapter={adapter} preferences={preferences} preferencePolicy={preferencePolicy} preferencesAvailable={preferencesAvailable} onPreferenceChange={updatePreference} readOnly={target.mode==='view'||!canProductAction(product,target.mode==='new'?'create':'edit')}/>;
}
function ConnectedEditor({scope,definition,adapter,preferences,preferencePolicy,preferencesAvailable,onPreferenceChange,readOnly}: Partial<import("../preference-choice").PreferenceHost> & {scope:TemplateScope;definition:PageTemplateDefinition;adapter:PageTemplateAdapter;preferences:React.ComponentProps<typeof PageTemplateWorkspace>['preferences'];readOnly:boolean}) {
 const [document,setDocument]=useState<TemplateDocument|null>(null),[error,setError]=useState<unknown>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setDocument(null);setError(null);void adapter.load!(scope,definition.id).then(value=>{if(!active)return;if((scope.recordId!=='new'&&value.id!==scope.recordId)||typeof value.id!=='string'||!value.id||!Number.isSafeInteger(value.version)||value.version<0||!value.values||!Array.isArray(value.lines)||!Array.isArray(value.rows)){setError({status:502});return;}setDocument(value);}).catch(failure=>{if(active)setError(failure);});return()=>{active=false;};},[scope,definition,adapter,revision]);
 if(error)return <RecoveryNotice failure={failureFromError(error)} onRetry={()=>setRevision(value=>value+1)}/>;
 if(!document)return <LoadingState/>;
 return <PageTemplateWorkspace definition={definition} scope={{...scope,recordId:document.id}} initialDocument={document} adapter={adapter} preferences={preferences} preferencePolicy={preferencePolicy} preferencesAvailable={preferencesAvailable} onPreferenceChange={onPreferenceChange} readOnly={readOnly}/>;
}
