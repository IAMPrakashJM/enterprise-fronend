// Restores Next.js route-folder names that cannot be stored in the zip: (shell), [module], [entity], [id].
import { renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = join(process.cwd(), 'app');
const map = [['-shell-', '(shell)'], ['-module-', '[module]'], ['-entity-', '[entity]'], ['-id-', '[id]']];
function fix(dir) { for (const [from, to] of map) { const src = join(dir, from); if (existsSync(src)) { renameSync(src, join(dir, to)); console.log('renamed', join(dir, from), '→', to); } } }
fix(root); fix(join(root, '(shell)')); fix(join(root, '(shell)', '[module]')); fix(join(root, '(shell)', '[module]', '[entity]'));
