import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {suites,validateSuites} from '../suites.mjs';
import {assertApiTarget} from '../harness.mjs';
test('every suite declares a runtime; native suites never join the browser group',()=>{
 const files=readdirSync(new URL('..',import.meta.url));
 assert.doesNotThrow(()=>validateSuites(files));
 assert.throws(()=>validateSuites([...files,'forgotten.mjs']),/unregistered/);
 assert.throws(()=>validateSuites(files.filter(file=>file!=='records.mjs')),/missing/);
 assert.ok(!suites.browser.some(file=>suites.native.includes(file)));
});
test('authentication refuses a different backend before submitting credentials',()=>{
 assert.doesNotThrow(()=>assertApiTarget('http://127.0.0.1:3330/auth/login','http://127.0.0.1:3330'));
 assert.throws(()=>assertApiTarget('https://desktop.front-design.pepbits.com/api/auth/login','http://127.0.0.1:3330'),/API target mismatch/);
});
