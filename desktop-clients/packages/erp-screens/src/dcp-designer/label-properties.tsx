'use client';
import React,{useState} from 'react';
import {Select,Input,useLocalization} from '@pepbits/ops-ui';
import type {DesignerLabels} from '@pepbits/erp-config';
export function LabelProperties({labels,disabled,change}:{labels?:DesignerLabels;disabled:boolean;change:(labels:DesignerLabels)=>void}){
 const {t}=useLocalization(),[locale,setLocale]=useState<keyof DesignerLabels>('en');
 return <div className="space-y-2"><Select label={t('designer.labelLanguage')} value={locale} disabled={disabled} options={['en','ar','hi','ml'].map(value=>({value,label:t('designer.locale.'+value)}))} onChange={e=>setLocale(e.target.value as keyof DesignerLabels)}/><Input label={t('designer.translatedLabel')} maxLength={160} value={labels?.[locale]??''} disabled={disabled} onChange={e=>{const next={...labels};if(e.target.value.trim())next[locale]=e.target.value;else delete next[locale];change(next);}}/><p>{t('designer.labelFallback')}</p></div>;
}
