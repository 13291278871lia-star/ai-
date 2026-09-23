// Parser-level integration test. XML.js supplies a small DOM adapter for Node only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('/Users/choix/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const JSZip=require('jszip'),{xml2js}=require('xml-js');
class Element{
 constructor(n){this.n=n;this.localName=(n.name||'').split(':').at(-1);}
 get children(){return(this.n.elements||[]).filter(e=>e.type==='element').map(e=>new Element(e));}
 get textContent(){return(this.n.elements||[]).map(e=>e.type==='text'?e.text:e.type==='cdata'?e.cdata:new Element(e).textContent).join('');}
 getAttribute(k){return this.n.attributes?.[k]??null;}
 getElementsByTagName(k){return this.children.flatMap(c=>[...(c.n.name===k?[c]:[]),...c.getElementsByTagName(k)]);}
 getElementsByTagNameNS(_,k){return this.children.flatMap(c=>[...(c.localName===k?[c]:[]),...c.getElementsByTagNameNS('*',k)]);}
 querySelector(k){if(k==='parsererror')return null;throw Error('Unexpected selector');}
}
globalThis.DOMParser=class{parseFromString(t){return new Element(xml2js(t));}};
globalThis.window={JSZip};
const {readUpload,mapTable}=await import('../src/insurance-import.js');
const {example,calculate}=await import('../src/insurance-ppt.js');
const file=path=>{const b=fs.readFileSync(path);return {name:path.split('/').at(-1),size:b.length,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
const parsed=await readUpload(file('/Users/choix/Documents/Codex/2026-09-21/wo-x/outputs/財富恆裕3_概覽及IRR折線圖.pptx'));
assert.equal(parsed.slideCount,2);assert.equal(parsed.tables.length,1);
const t=parsed.tables[0];assert.equal(t.meta.premium,105760);assert.equal(t.meta.age,40);assert.equal(t.meta.levy,12.76);assert.equal(t.columns.year,0);assert.equal(t.columns.total,1);
const mapped=mapTable(t,{...t.columns,mode:'total',age:t.meta.age});
const rows=calculate({...t.meta,source:'PPTX再匯入',rows:mapped.rows});assert.deepEqual(rows.map(r=>r.usd),calculate(example).map(r=>r.usd));assert.ok(Math.abs(rows[4].rate-calculate(example)[4].rate)<1e-12);
const template=await readUpload(file('assets/ppt-reference/gf-template.pptx'));assert.equal(template.slideCount,11);assert.ok(template.tables.length>0);assert.equal(template.tables[0].columns.year,0);
assert.throws(()=>mapTable(template.tables[0],{...template.tables[0].columns,mode:'total',age:40}));
const xlsx=await readUpload(file('/Users/choix/Documents/Codex/2026-09-21/wo-x/work/different-plan.xlsx'));assert.equal(xlsx.tables[0].meta.premium,20000);assert.equal(xlsx.tables[0].rows.length,3);
console.log('PASS: PPTX slide order, metadata, native table, recalculated IRR round-trip, 11-slide empty GF template, XLSX');
