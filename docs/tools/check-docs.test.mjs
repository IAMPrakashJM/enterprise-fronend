import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {checkLinks,checkRelease,validateDocumentation} from './check-docs.mjs';
test('broken destinations, headings and repository escapes fail; valid local links pass',()=>{
 const root=mkdtempSync(join(tmpdir(),'frontend-doc-links-'));
 try{
  mkdirSync(join(root,'docs'));writeFileSync(join(root,'docs/target.md'),'# Known heading\n');
  const page=join(root,'docs/index.md');writeFileSync(page,'[valid](target.md#known-heading)\n[missing](absent.md)\n[anchor](target.md#absent)\n[outside](../../outside.md)\n');
  const errors=checkLinks(root,[page]);assert.equal(errors.length,3);assert.ok(errors.some(e=>e.includes('missing link target')));assert.ok(errors.some(e=>e.includes('missing heading')));assert.ok(errors.some(e=>e.includes('escapes repository')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('release records cannot claim publication without identity or mutate recorded hashes',()=>{
 const files=[{path:'source.ts',sha256:'a'.repeat(64)}];
 const implementationDigest=createHash('sha256').update(`source.ts\0${'a'.repeat(64)}\n`).digest('hex');
 const record={schemaVersion:1,recordId:'example',status:'unreleased-working-tree',baseCommit:'b'.repeat(40),testGuideVersion:'1.0.0',implementationDigest,digestAlgorithm:'sha256',identityScope:'test',evidence:'evidence.md',published:false,deployed:false,limits:[],files};
 assert.deepEqual(checkRelease(record),[]);
 assert.ok(checkRelease({...record,published:true}).some(e=>e.includes('actual commit')));
 assert.ok(checkRelease({...record,implementationDigest:'c'.repeat(64)}).some(e=>e.includes('digest')));
});
test('the repository documentation satisfies the current contract',async()=>{
 const result=await validateDocumentation();assert.deepEqual(result.errors,[]);assert.ok(result.documents>=20);
});
