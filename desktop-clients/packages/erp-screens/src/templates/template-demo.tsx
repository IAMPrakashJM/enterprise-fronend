"use client";
import React,{useMemo} from 'react';
import type {PageTemplateDefinition,TemplateLayout,UserPreferences} from '@pepbits/erp-config';
import type {PreferenceHost} from '../preference-choice';
import {PageTemplateWorkspace} from './page-template';
import {createTemplateSample,type PageTemplateAdapter} from './template-state';
export interface TemplateDemoProps extends Partial<PreferenceHost> {definition:PageTemplateDefinition;preferences?:UserPreferences;layout?:TemplateLayout;scenario?:'ready'|'loading'|'empty'|'denied'|'readOnly'|'failure'}
/** In-memory demonstration adapter. Replace it with your authorized application adapter. */
export function TemplateDemo({definition,preferences,layout,preferencePolicy,preferencesAvailable,onPreferenceChange,scenario='ready'}:TemplateDemoProps) {
 const initial=useMemo(()=>createTemplateSample(definition),[definition]);
 const store=useMemo(()=>({current:structuredClone(initial),receipts:new Map<string,typeof initial>()}),[initial]);
 const adapter=useMemo<PageTemplateAdapter>(()=>({
  async save(request){
   if(scenario==='failure')throw {status:503,reference:'DEMO-TEMPLATE'};
   const previous=store.receipts.get(request.operationId);if(previous)return structuredClone(previous);
   if(request.expectedVersion!==store.current.version)throw {status:409};
   store.current={...structuredClone(request.document),version:store.current.version+1};store.receipts.set(request.operationId,structuredClone(store.current));return structuredClone(store.current);
  },
  async load(){return structuredClone(store.current);},
 }),[store,scenario]);
 return <PageTemplateWorkspace definition={definition} scope={{tenantId:'demo-tenant',applicationId:'demo-app',userId:'demo-user',pageId:definition.id,recordId:initial.id}} initialDocument={initial} adapter={adapter} preferences={preferences} layout={layout} preferencePolicy={preferencePolicy} preferencesAvailable={preferencesAvailable} onPreferenceChange={onPreferenceChange} readOnly={scenario==='readOnly'} state={scenario==='loading'||scenario==='empty'||scenario==='denied'?scenario:'ready'}/>;
}
