'use client';
import { useEffect } from 'react';
export interface Hotkey { keys: string; scope: 'global' | 'worklist' | 'form' | 'sheet'; what: string }
export const HOTKEYS: Hotkey[] = [
  { keys: 'Ctrl / ⌘ + K', scope: 'global', what: 'Command palette' }, { keys: '/', scope: 'worklist', what: 'Focus search' }, { keys: 'Alt + N', scope: 'worklist', what: 'New record' },
  { keys: 'Ctrl / ⌘ + S', scope: 'form', what: 'Save form' }, { keys: 'Alt + P', scope: 'global', what: 'Pin / unpin sidebar' }, { keys: 'Alt + 1…5', scope: 'global', what: 'Switch module' },
  { keys: 'Alt + ←/→', scope: 'global', what: 'Previous / next tab' }, { keys: 'Ctrl + W', scope: 'global', what: 'Close tab' }, { keys: 'Esc', scope: 'global', what: 'Close panel / dialog' }, { keys: '?', scope: 'global', what: 'Shortcut list' }, { keys: 'F1', scope: 'global', what: 'Help panel' }
];
export function useHotkeys(handler: (e: KeyboardEvent, typing: boolean) => void) {
  useEffect(() => { const h = (e: KeyboardEvent) => { const tag = ((e.target as HTMLElement)?.tagName ?? '').toLowerCase(); handler(e, tag === 'input' || tag === 'textarea' || tag === 'select'); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [handler]);
}
