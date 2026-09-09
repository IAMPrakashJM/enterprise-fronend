import {readFileSync,writeFileSync} from 'node:fs';
const directory=new URL('../../packages/erp-screens/src/templates/',import.meta.url);
const source=readFileSync(new URL('template-demo.tsx',directory),'utf8').replace("from './page-template'","from '@pepbits/erp-screens'").replace("from './template-state'","from '@pepbits/erp-screens'");
const output=JSON.stringify({source},null,2)+'\n',path=new URL('template-example.generated.json',directory);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Template example is stale: run templates:sync');}else writeFileSync(path,output);
console.log('PASS TypeScript template example matches the rendered demo adapter');
