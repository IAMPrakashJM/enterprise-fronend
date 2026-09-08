"use client";
import React from 'react';
import {useERP} from '@pepbits/erp-shell';
import {LocalizedText} from '@pepbits/ops-ui';
import type {PreferenceKey} from '@pepbits/erp-config';
export function PreferenceControl({preferenceKey,children}:{preferenceKey:PreferenceKey;children:React.ReactNode}) {
 const {preferencePolicy,preferencesAvailable}=useERP();const locked=preferencePolicy.rules[preferenceKey]?.locked===true;
 return <fieldset disabled={locked||!preferencesAvailable} data-preference={preferenceKey} className="m-0 min-w-0 border-0 p-0">
  {children}
  {locked?<p className="mt-1 text-xs text-[var(--text-muted)]"><LocalizedText message="Managed by your administrator" /></p>:null}
 </fieldset>;
}
