import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { MODULES } from "../../packages/erp-config/src/navigation.ts";
const modules = Object.keys(MODULES);
export async function createProduct({root,id,name,module='finance'}) {
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(id ?? '')) throw new Error('Use a product id of 1–40 lowercase letters, numbers or hyphens, starting with a letter.');
  if (typeof name !== 'string' || !name.trim() || name.length > 80) throw new Error('Provide a name of 1–80 characters.');
  if (!modules.includes(module)) throw new Error('Choose a supported module: '+modules.join(', '));
  const directory=join(root,id);
  await mkdir(root,{recursive:true});
  await mkdir(directory); // Deliberately refuses to overwrite any existing product.
  try {
    await writeFile(join(directory,'product.ts'),`import { defineProduct } from "@pepbits/erp-config";
export const product = defineProduct({
  id: ${JSON.stringify(id)}, name: ${JSON.stringify(name.trim())}, tagline: "Desktop workspace",
  defaultModule: ${JSON.stringify(module)}, enabledModules: [${JSON.stringify(module)}],
  // Optional: enabledPages, pageTitles and page/action role rules.
  access: {actions: {
    create: ["enterprise-admin"], edit: ["enterprise-admin"],
    archive: ["enterprise-admin"], export: ["enterprise-admin"],
  }},
});
`);
    await writeFile(join(directory,'services.ts'),`import { authedFetch } from "@pepbits/auth";
import type { ProductServices } from "@pepbits/erp-screens";
// Replace this transport with your authenticated service adapter.
// Preserve RequestInit.signal and the response/status contracts.
// No API keys or other server secrets belong in browser code.
export const services: ProductServices = { request: authedFetch };
// For a different record protocol, also provide services.records: RecordAdapter.
`);
    await writeFile(join(directory,'README.md'),`# ${name.trim()}\n\nEdit product.ts for branding, catalog selection and role rules. Edit services.ts\nfor worklist and record transports. See ../../docs/product-profiles.md for API\ncontracts, remaining boundaries and upgrade steps.\n\nTo activate in both shells, change products/active.ts to:\n\n\x60\x60\x60ts\nexport { product } from "./${id}/product";\nexport { services } from "./${id}/services";\n\x60\x60\x60\n\nRun typecheck, tests and both builds before deploying.\n`);
    return directory;
  } catch(error) { await rm(directory,{recursive:true,force:true}); throw error; }
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const {values}=parseArgs({options:{id:{type:'string'},name:{type:'string'},module:{type:'string',default:'finance'}}});
    const directory=await createProduct({root:fileURLToPath(new URL('../../products',import.meta.url)),...values});
    console.log(`Created ${directory}. Select it in products/active.ts when ready; the active product is unchanged.`);
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
