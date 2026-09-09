import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIBRARY_PAGE_IDS} from '../packages/erp-config/src/library-pages.ts';
import {PAGE_REGISTRY} from '../packages/erp-config/src/navigation.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const nav=JSON.parse(readFileSync(new URL('../../dummy-api/config/navigation/nexora.json',import.meta.url),'utf8'));
const parents=new Set(['module.library']);let size;
do{size=parents.size;for(const node of nav.nodes)if(parents.has(node.parentId))parents.add(node.id);}while(size!==parents.size);
const backend=[...new Set(nav.nodes.filter(node=>parents.has(node.id)&&node.pageId).map(node=>node.pageId))].sort();
assert.deepEqual([...LIBRARY_PAGE_IDS].sort(),backend,'Library frontend/API routes must agree');
for(const id of LIBRARY_PAGE_IDS)assert.ok(PAGE_REGISTRY[id],`Unregistered Library route ${id}`);
const demos=read('packages/erp-screens/src/library/demos.tsx');
assert.ok(!/DEFAULT_PREFERENCES|new Intl\.(NumberFormat|DateTimeFormat)/.test(demos),'Demos must consume resolved preference formatters');
for(const file of ['query-layout.module.css','record-layout.module.css']){
 const css=read('packages/erp-screens/src/clinical-templates/'+file);
 assert.ok(!/font-size:\s*[\d.]+px|border-radius:\s*[1-9][\d.]*px/.test(css),`${file}: use font and radius tokens`);
}
assert.ok(!read('packages/erp-screens/src/library/index.tsx').includes('LegacyLibraryPage'),'Dedicated reference pages must not regress to a generic fallback');
const example=JSON.parse(read('packages/erp-screens/src/templates/template-example.generated.json')).source;
assert.ok(!/from\s+['"]\.\.?\//.test(example),'Copied examples must use public package imports');
console.log(`PASS ${LIBRARY_PAGE_IDS.length} Library routes match API navigation; formatter, clinical token, dedicated-page and public example contracts checked. Runtime policy behavior is covered by preference-compliance tests and e2e/library-preferences.ts.`);
