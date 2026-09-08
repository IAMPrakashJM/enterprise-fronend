/** Prepare fixtures inside an isolated CI checkout, never the developer's profile. */
import {cpSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
const group=process.argv[2];
const directory=process.env.E2E_FIXTURE_DIR;
if(!directory)throw new Error('Set E2E_FIXTURE_DIR to an isolated temporary directory.');
mkdirSync(directory,{recursive:true});
cpSync(new URL('../../dummy-api/config',import.meta.url),join(directory,'config'),{recursive:true});
if(group==='navigation'){
 const file=join(directory,'config/navigation/nexora.json');const navigation=JSON.parse(readFileSync(file));
 navigation.nodes=navigation.nodes.filter(node=>node.pageId!=='vendor-master');
 writeFileSync(file,JSON.stringify(navigation,null,2)+'\n');
 const localeFile=join(directory,'config/localization/products/nexora/ar.json');
 const locale=JSON.parse(readFileSync(localeFile));
 Object.assign(locale.messages,{'menu.finance.customer-master.label':'عملاء من الخادم','page.customer-master.title':'صفحة العملاء من الخادم','column.customer-master.id.label':'المعرف من الخادم','field.customer.legalName.label':'اسم المؤسسة من الخادم'});
 writeFileSync(localeFile,JSON.stringify(locale,null,2)+'\n');
}
if(group==='product'){
 // This mutation is only permitted in the CI checkout. Local runs use a worktree.
 if(process.env.CI!=='true')throw new Error('Prepare the Ledger profile in a dedicated CI checkout/worktree with CI=true.');
 writeFileSync(new URL('../products/active.ts',import.meta.url),'export {product} from "./ledger/product";\nexport {services} from "./ledger/services";\n');
}
console.log(resolve(directory));
