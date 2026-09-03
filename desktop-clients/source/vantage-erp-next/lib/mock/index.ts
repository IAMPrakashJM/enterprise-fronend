import DATA from './data';
import type { EntitySchema, ModuleDef, Route } from '@/lib/types';
export const ERP = DATA;
export const schemas = ERP.entities;
export const modules: ModuleDef[] = ERP.modules;
export const getModule = (id: string) => modules.find(m => m.id === id) ?? modules[0];
export const getSchema = (id: string): EntitySchema | undefined => schemas[id];
export function hrefFor(moduleId: string, r: Route): string {
  switch (r.page) {
    case 'dashboard': return '/' + moduleId;
    case 'worklist': return '/' + moduleId + '/' + r.entity;
    case 'billing': case 'reports': case 'excel': return '/' + moduleId + '/' + r.page;
    case 'prefs': return '/preferences';
    case 'settings': return '/settings';
    case 'profile': return '/profile';
    case 'library': return '/library/' + (r.section ?? 'overview');
  }
}
export const today = '2026-09-02';
