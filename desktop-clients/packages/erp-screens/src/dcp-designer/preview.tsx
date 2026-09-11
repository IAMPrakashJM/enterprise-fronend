'use client';
import React,{useEffect,useRef} from 'react';
import {Button,useLocalization} from '@pepbits/ops-ui';
import type {DesignerDefinition,TemplateValue} from '@pepbits/erp-config';
import {TemplateFields} from '../templates/template-parts';
import styles from './designer.module.css';
interface DesignerPreviewProps{definition:DesignerDefinition;values:Record<string,TemplateValue>;errors:Record<string,string>;change:(id:string,value:TemplateValue)=>void;reset:()=>void;validate:()=>void}
export function DesignerPreview({definition,values,errors,change,reset,validate}:DesignerPreviewProps){
 const {t}=useLocalization(),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
 return <section className={styles.preview} aria-label={t('designer.preview')} data-designer-preview>
  <h2 ref={heading} tabIndex={-1}>{t(definition.title)}</h2>
  <p>{t('designer.previewOnly')}</p>
  {definition.sections.map(section=><TemplateFields key={section.id} section={section} values={values} errors={Object.fromEntries(Object.entries(errors).map(([id,key])=>[id,t(key)]))} onChange={change}/>)}
  <div className={styles.toolbar}><Button variant="primary" onClick={validate}>{t('designer.validate')}</Button><Button onClick={reset}>{t('template.reset')}</Button></div>
 </section>;
}
