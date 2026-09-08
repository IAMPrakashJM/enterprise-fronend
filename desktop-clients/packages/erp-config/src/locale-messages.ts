// Generated loader. English is immediate; other offline fallbacks load on demand.
import english from './locales/en.ts';
import type {LanguageKey} from './types';
export const UI_MESSAGES: Record<LanguageKey, Record<string,string>> = {en:english,ar:{},hi:{},ml:{}};
const loaders = {ar:()=>import('./locales/ar.ts'),hi:()=>import('./locales/hi.ts'),ml:()=>import('./locales/ml.ts')};
const pending = new Map<LanguageKey,Promise<void>>();
export function loadFallbackLanguage(language:LanguageKey):Promise<void> {
 if(language==='en'||Object.keys(UI_MESSAGES[language]).length)return Promise.resolve();
 if(!pending.has(language))pending.set(language,loaders[language]().then(module=>{UI_MESSAGES[language]=module.default;}).catch(error=>{pending.delete(language);throw error;}));
 return pending.get(language)!;
}
