"use client";
import React, { createContext, useContext } from 'react';
import { ENGLISH_MESSAGES } from './messages.en';
export type MessageValues = Record<string, string | number>;
export interface Localization {
    language: string;
    direction: 'ltr' | 'rtl';
    t: (message: string, values?: MessageValues) => string;
    dateTime: (value: string | Date) => string;
}
const defaults: Localization = { language: 'en', direction: 'ltr', t: (message, values) => (Object.hasOwn(ENGLISH_MESSAGES, message) ? ENGLISH_MESSAGES[message] : message).replace(/\{(\w+)\}/g, (match, key) => values?.[key] === undefined ? match : String(values[key])), dateTime: value => new Date(value).toLocaleString('en-US') };
const Context = createContext<Localization>(defaults);
/** UI-only translation boundary. Never transforms input values or service payloads. */
export function LocalizationProvider({ value, children }: {
    value: Localization;
    children: React.ReactNode;
}) { return <Context.Provider value={value}>{children}</Context.Provider>; }
export const useLocalization = () => useContext(Context);
export function LocalizedText({ message, values }: {
    message?: string;
    values?: MessageValues;
}) { return <>{useLocalization().t(message ?? "", values)}</>; }
