/** Gzipped largest-client-chunk budget. Run after building both shells. */
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
function* scripts(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory())yield* scripts(path);else if(path.endsWith('.js'))yield path;}}
const budget=550000; // 550 kB gzip: measured 461 kB after splitting catalogs, with ~19% headroom.
let failed=false;
for(const [shell,relative] of [['desktop','apps/desktop/dist/assets'],['web','apps/web/.next/static/chunks']]){
 const directory=new URL(`../${relative}`,import.meta.url).pathname;
 const chunks=[...scripts(directory)].map(path=>({path,bytes:gzipSync(readFileSync(path)).length})).sort((a,b)=>b.bytes-a.bytes);
 if(!chunks.length)throw new Error(`Build ${shell} before verifying its bundle`);
 const largest=chunks[0];console.log(`${largest.bytes<=budget?'PASS':'FAIL'} ${shell}: largest client chunk ${largest.bytes} gzip bytes; budget ${budget}`);
 if(largest.bytes>budget)failed=true;
}
if(failed)process.exitCode=1;
