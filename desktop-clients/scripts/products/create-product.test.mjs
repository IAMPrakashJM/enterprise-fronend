import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createProduct} from './create-product.mjs';
test('generates a product with safely encoded names and refuses overwrite',async t=>{
 const root=await mkdtemp(join(tmpdir(),'product-starter-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const options={root,id:'acme',name:'ACME "Finance"',module:'finance'};
 const directory=await createProduct(options);const source=await readFile(join(directory,'product.ts'),'utf8');
 assert.ok(source.includes('name: '+JSON.stringify(options.name)));
 assert.ok((await readFile(join(directory,'services.ts'),'utf8')).includes('ProductServices'));
 await assert.rejects(createProduct(options),{code:'EEXIST'});
 assert.equal(await readFile(join(directory,'product.ts'),'utf8'),source);
 for(const id of ['../escape','','Bad Name']) await assert.rejects(createProduct({...options,id}));
 await assert.rejects(createProduct({...options,id:'other',module:'missing'}));
});
