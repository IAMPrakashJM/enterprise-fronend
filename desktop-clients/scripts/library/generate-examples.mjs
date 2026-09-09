/** The code shown in Library is generated from the exact functions rendered there. */
import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
const directory=new URL('../../packages/erp-screens/src/library/',import.meta.url);
const source=readFileSync(new URL('demos.tsx',directory),'utf8');
const file=ts.createSourceFile('demos.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const imports=file.statements.filter(ts.isImportDeclaration);
const result={};
for(const fn of file.statements.filter(ts.isFunctionDeclaration)){
 if(!fn.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;
 const names=new Set();
 function visit(node){if(ts.isIdentifier(node))names.add(node.text);ts.forEachChild(node,visit);}visit(fn);
 const needed=[];
 for(const imp of imports){
  const clause=imp.importClause;if(!clause)continue;
  const defaults=clause.name&&names.has(clause.name.text)?clause.name.text:'';
  const bindings=clause.namedBindings&&ts.isNamedImports(clause.namedBindings)?clause.namedBindings.elements.filter(e=>names.has(e.name.text)).map(e=>e.getText(file)):[];
  if(!defaults&&!bindings.length)continue;
  const module=imp.moduleSpecifier.text.startsWith('../')?'@pepbits/erp-screens':imp.moduleSpecifier.text;
  needed.push(`import ${[defaults,bindings.length?`{ ${bindings.join(', ')} }`:''].filter(Boolean).join(', ')} from "${module}";`);
 }
 result[fn.name.text]='"use client";\n'+needed.join('\n')+'\n\n'+fn.getText(file)+'\n';
}
const output=JSON.stringify(result,null,2)+'\n',path=new URL('examples.generated.json',directory);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Library examples are stale: run npm run library:sync');}
else writeFileSync(path,output);
console.log(`PASS ${Object.keys(result).length} examples match their compiled demo functions`);
