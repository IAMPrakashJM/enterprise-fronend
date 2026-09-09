"use client";
import React, {useState} from "react";
import {Card, CardHeader, CardTitle, CardContent, CardGrid, Button, Badge, SearchInput, Select, Input, Toggle, RangeInput, DescriptionList, EmptyState, useLocalization} from "@pepbits/ops-ui";
import {useERP, useProduct} from "@pepbits/erp-shell";
import {useNavigation} from "@pepbits/platform-ports";
import {THEME_OPTIONS, SHORTCUTS, type PageDefinition, type ThemeKey} from "@pepbits/erp-config";
import {PreferenceControl} from "../preferences/policy-controls";
import {CATALOG_ENTRIES, CATALOG_GROUPS} from "./catalog";

export const LIBRARY_REFERENCE_PAGES = ["theme-studio", "accessibility", "page-catalog", "component-contracts", "keyboard-shortcuts", "integration-guide"] as const;
export function LibraryReferencePage({page}: {page: PageDefinition}) {
  const {t}=useLocalization();
  return <div className="space-y-4" data-library-reference={page.id}>
    <Card><CardContent><h2 className="text-2xl font-bold">{t(page.titleKey??page.title)}</h2><p className="mt-2 text-sm text-[var(--text-muted)]">{t(`catalog.reference.${page.id}`)}</p></CardContent></Card>
    {page.id==='theme-studio'?<ThemeStudio/>:page.id==='accessibility'?<AccessibilityGuide/>:page.id==='page-catalog'?<PageCatalog/>:page.id==='component-contracts'?<ComponentContracts/>:page.id==='keyboard-shortcuts'?<KeyboardGuide/>:<IntegrationGuide/>}
  </div>;
}
function ThemeStudio() {
  const {preferences, updatePreference, format}=useERP(),{t}=useLocalization();
  return <CardGrid columns={2}><Card><CardContent className="space-y-4">
    <PreferenceControl preferenceKey="theme"><Select label="Theme" value={preferences.theme} options={THEME_OPTIONS.map(theme=>({value:theme.id,label:theme.name}))} onChange={e=>updatePreference('theme',e.target.value as ThemeKey)}/></PreferenceControl>
    <PreferenceControl preferenceKey="cornerRadius"><RangeInput label="Corner radius" min={0} max={20} value={preferences.cornerRadius} onChange={value=>updatePreference('cornerRadius',value)}/></PreferenceControl>
    <p>{t('catalog.reference.livePreferences')}</p>
  </CardContent></Card><Card><CardHeader><CardTitle title="catalog.preview"/></CardHeader><CardContent className="space-y-4">
    <Input label="Name"/><Select label="Status" options={[{value:'active',label:'Active'},{value:'pending',label:'Pending'}]}/>
    <DescriptionList items={[{id:'amount',label:'Amount',value:format.money(12345.67)},{id:'date',label:'Date',value:format.date('2026-09-09')}]}/>
    <div className="flex gap-2"><Badge tone="success">{t('Active')}</Badge><Badge tone="warning">{t('Pending')}</Badge><Badge tone="danger">{t('Error')}</Badge></div>
  </CardContent></Card></CardGrid>;
}
function AccessibilityGuide() {
  const {preferences,updatePreference}=useERP(),{t}=useLocalization();
  return <CardGrid columns={2}><Card><CardContent className="space-y-4">
    <PreferenceControl preferenceKey="reducedMotion"><Toggle label="Reduced motion" checked={preferences.reducedMotion} onChange={v=>updatePreference('reducedMotion',v)}/></PreferenceControl>
    <PreferenceControl preferenceKey="showKeyboardHints"><Toggle label="Keyboard shortcut hints" checked={preferences.showKeyboardHints} onChange={v=>updatePreference('showKeyboardHints',v)}/></PreferenceControl>
    <PreferenceControl preferenceKey="fontSizeForm"><RangeInput label="Form field size" min={11} max={17} value={preferences.fontSizeForm} onChange={value=>updatePreference('fontSizeForm',value)}/></PreferenceControl>
    <p>{t('catalog.reference.accessibilityCheck')}</p>
  </CardContent></Card><Card><CardContent className="space-y-4" style={{'--fs-scale':'var(--fs-form)'} as React.CSSProperties}>
    <Input label="Name" required hint="catalog.reference.focusHelp"/><Input label="Email" type="email" error="Invalid email address"/>
    <Button>{t('catalog.preview')}</Button><p>{t('catalog.reference.accessibilityLimit')}</p>
  </CardContent></Card></CardGrid>;
}
function PageCatalog() {
  const product=useProduct(),navigation=useNavigation(),{t}=useLocalization(),[query,setQuery]=useState('');
  const pages=Object.values(product.pages).filter(page=>`${t(page.titleKey??page.title)} ${page.id} ${page.kind}`.toLowerCase().includes(query.toLowerCase()));
  return <><SearchInput aria-label="Search" value={query} onChange={setQuery} onClear={()=>setQuery('')}/>
    {!pages.length?<EmptyState/>:<CardGrid columns={3}>{pages.map(page=><Card key={page.id}><CardContent className="space-y-3"><h3 className="text-lg font-bold">{t(page.titleKey??page.title)}</h3><p dir="ltr" className="font-mono text-xs break-all">{page.id}</p><Button onClick={()=>navigation.open({pageId:page.id})}>{t('Open')}</Button></CardContent></Card>)}</CardGrid>}
  </>;
}
function ComponentContracts() {
  const navigation=useNavigation(),{t}=useLocalization();
  return <><Card><CardContent><p>{t('catalog.reference.contract')}</p></CardContent></Card><CardGrid columns={2}>{CATALOG_ENTRIES.map(entry=><Card key={entry.id}><CardContent className="space-y-3"><h3 dir="ltr" className="font-bold">{entry.components.join(' / ')}</h3><p dir="ltr" className="font-mono text-xs break-all">{entry.source.startsWith('@')?entry.source:`@pepbits/ops-ui: ${entry.source}`}</p><p>{t(`catalog.example.${entry.id}`)}</p><Button onClick={()=>navigation.open({pageId:CATALOG_GROUPS.find(group=>group.key===entry.group)!.pageId})}>{t('template.typescript')}</Button></CardContent></Card>)}</CardGrid></>;
}
function KeyboardGuide() {
  const {preferences,updatePreference}=useERP(),{t}=useLocalization();
  return <><Card><CardContent><PreferenceControl preferenceKey="keyboardShortcuts"><Toggle label="Keyboard shortcuts" checked={preferences.keyboardShortcuts} onChange={v=>updatePreference('keyboardShortcuts',v)}/></PreferenceControl><p className="mt-3">{t('catalog.reference.shortcutScope')}</p></CardContent></Card>
    <CardGrid columns={3}>{SHORTCUTS.map(shortcut=><Card key={shortcut.id}><CardContent className="space-y-2"><kbd dir="ltr">{shortcut.display}</kbd><p>{t(shortcut.label)}</p>{shortcut.requires?<Badge>{t('Workspace')}</Badge>:null}</CardContent></Card>)}</CardGrid>
  </>;
}
function IntegrationGuide() {
  const {t}=useLocalization(),navigation=useNavigation();
  return <><Card><CardContent className="space-y-4"><DescriptionList layout="stacked" items={[
    {id:'providers',label:'catalog.reference.providers',value:t('catalog.reference.providersHelp')},
    {id:'preferences',label:'template.preferences',value:t('catalog.reference.preferencesHelp')},
    {id:'adapter',label:'template.integration',value:t('template.adapterHelp')},
    {id:'scope',label:'template.scope',value:t('template.scopeHelp')},
    {id:'validation',label:'template.domainRules',value:t('template.domainHelp')},
  ]}/><p>{t('catalog.reference.integrationSteps')}</p><div className="flex gap-2"><Button onClick={()=>navigation.open({pageId:'page-templates'})}>{t('template.library')}</Button><Button onClick={()=>navigation.open({pageId:'component-library'})}>{t('catalog.code')}</Button></div></CardContent></Card></>;
}
