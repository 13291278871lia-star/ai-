// All document parsing stays in the browser. Files are untrusted data, never code.
export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function numeric(v) {
 if(typeof v==='number')return Number.isFinite(v)?v:NaN;
 const s=String(v??'').trim().replace(/[,，\s$]/g,'').replace(/^(USD|美元)/i,'');
 return /^-?\d+(\.\d+)?$/.test(s)?Number(s):NaN;
}
export function csvRows(text) {
 const s=text.replace(/^\uFEFF/,'');const delimiter=s.split('\n')[0].includes('\t')?'\t':',';
 let rows=[],row=[],cell='',quoted=false;
 for(let i=0;i<s.length;i++){let c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV 引號未閉合');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);if(rows.length>10000)throw Error('表格超過10,000行，請縮小範圍');return rows;
}
const normalize=s=>String(s).replace(/[\s_（）()／/\-]/g,'').toLowerCase();
const aliases={year:['year','policyyear','保單年度','保单年度','保單年數','保单年数','保單年末','保单年末','保單年度／歲','年數','年数'],guaranteed:['guaranteed','保證金額','保证金额','保證退保價值','保证退保价值','保證美元','保证美元'],bonus:['bonus','nonguaranteed','非保證金額','非保证金额','終期分紅','终期分红','非保證美元','非保证美元'],total:['total','cashvalue','退保總額','退保总额','總值美元','总值美元','退保價值','退保价值'],age:['age','投保年齡','投保年龄'],premium:['premium','每期保費','每期保费','年繳保費','年缴保费'],years:['years','供款年數','供款年数','供款年期'],levy:['levy','徵費','征费','額外支出','额外支出'],fx:['fx','匯率','汇率'],product:['product','產品名稱','产品名称'],currency:['currency','幣種','币种','保單貨幣','保单货币']};
export function inferColumns(headers){const result={};for(const [key,names]of Object.entries(aliases))result[key]=headers.findIndex(h=>names.map(normalize).includes(normalize(h)));return result;}
export function makeTable(name,raw) {
 if(!raw.length)throw Error('文件沒有可讀取的資料');const index=raw.findIndex(r=>inferColumns(r).year>=0);
 const header=index>=0?raw[index]:raw[0];const headers=header.map((v,i)=>String(v||`第${i+1}欄`));
 const rows=raw.slice((index>=0?index:0)+1).filter(r=>r.some(x=>String(x??'').trim()));
 const columns=inferColumns(headers),meta={};for(const k of ['age','premium','years','levy','fx','product','currency']){
 if(columns[k]>=0){const values=[...new Set(rows.map(r=>r[columns[k]]).filter(v=>v!==undefined&&v!==''))];if(values.length===1)meta[k]=['product','currency'].includes(k)?String(values[0]):numeric(values[0]);}
 }return {name,headers,rows,meta,columns};
}
export function mapTable(table,{year,guaranteed,bonus,total,mode,age,yearKind='auto'}) {
 if(year<0|| (mode==='total'?total<0:guaranteed<0||bonus<0))throw Error('請選擇年度及退保價值欄');
 const selected=[year,...(mode==='total'?[total]:[guaranteed,bonus])];if(new Set(selected).size!==selected.length)throw Error('年度及金額欄不能重複');
 const output=[],seen=new Map();let skipped=0;
 for(let i=0;i<table.rows.length;i++){
 const row=table.rows[i],rawYear=String(row[year]??'').trim();if(!rawYear)continue;
 const isAge=yearKind==='age'||(/[歲岁]/.test(rawYear)&&yearKind==='auto');
 let y=numeric(rawYear.replace(/年[後后]?|[歲岁]/g,''));if(!Number.isFinite(y)){skipped++;continue;}
 if(isAge){if(!Number.isInteger(age))throw Error('資料含到達年齡，請先填寫投保年齡');y-=age;}
 if(y===0){skipped++;continue;}
 if(!Number.isInteger(y)||y<1||y>120)throw Error(`第${i+2}行年期無效`);
 const vals=mode==='total'?[numeric(row[total])]:[numeric(row[guaranteed]),numeric(row[bonus])];
 if(vals.some(v=>!Number.isFinite(v)||v<0)||vals.reduce((a,b)=>a+b,0)<=0)throw Error(`第${i+2}行退保價值缺失或無效，請檢查欄位`);
 const values=[y,...vals];if(seen.has(y)){if(JSON.stringify(seen.get(y))!==JSON.stringify(values))throw Error(`第${y}年有不同數值，請選擇單一情景／產品的表格`);continue;}
 seen.set(y,values);output.push(values);
 }if(!output.length)throw Error('沒有有效的退保價值行');return {rows:output.sort((a,b)=>a[0]-b[0]),skipped};
}
export function pdfLines(items) {
 const lines=[];for(const item of items){if(!item.str?.trim())continue;const y=item.transform[5];let line=lines.find(l=>Math.abs(l.y-y)<2);if(!line){line={y,items:[]};lines.push(line);}line.items.push(item);}
 return lines.sort((a,b)=>b.y-a.y).map(l=>l.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str.trim()));
}
export function pdfTable(lines,page) {
 const rows=lines.filter(r=>r.length>=3&&/^\d+\s*[歲岁年]?$/.test(r[0])&&r.slice(1).every(v=>Number.isFinite(numeric(v))));
 if(!rows.length)return null;
 const text=lines.flat().join(' '),counts=rows.map(r=>r.length);const n=Math.max(...counts);const uniform=rows.filter(r=>r.length===n);
 // Recognize only the verified eight-column AIA summary, never the optimistic/pessimistic tables.
 const known=n===8&&/退保發還金額/.test(text)&&/身故賠償額/.test(text)&&/說明摘要/.test(text)&&!/悲觀|樂觀/.test(text);
 return {name:`PDF 第${page}頁`,headers:known?['保單年度／歲','累計保費','保證退保價值','非保證退保價值','退保總額','保證身故賠償','非保證身故賠償','身故賠償總額']:Array.from({length:n},(_,i)=>`第${i+1}欄`),rows:uniform,columns:known?{year:0,guaranteed:2,bonus:3,total:4}:{year:0,guaranteed:-1,bonus:-1,total:-1},meta:{},page,known,text:lines.map(r=>r.join('  ')).join('\n')};
}
export function pdfMeta(lines) {
 const text=lines.map(r=>r.join(' ')).join('\n'),meta={};
 const product=lines.find(r=>r[0]==='計劃：'||r[0]==='计划：');if(product)meta.product=product.slice(1).join(' ');
 const age=text.match(/年[齡龄][：:]\s*(\d+)/);if(age)meta.age=Number(age[1]);
 const currency=text.match(/保[單单][貨货][幣币][：:]\s*(\S+)/);if(currency)meta.currency=currency[1];
 const levy=lines.find(r=>/保費徵費/.test(r[0])&&Number.isFinite(numeric(r.at(-1))));if(levy)meta.levy=numeric(levy.at(-1));
 const payment=lines.find(r=>r.includes('整付保費')&&r.some(v=>/^\d[\d,]*\.\d{2}$/.test(v)));
 if(payment){const nums=payment.filter(v=>/^\d[\d,]*\.\d{2}$/.test(v));if(nums.length===1){meta.premium=numeric(nums[0]);meta.years=1;}}
 return meta;
}
const xml=text=>{const d=new DOMParser().parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw Error('Excel XML 資料損壞');return d;};
export function pptxMeta(blocks) {
 const text=blocks.join('\n'),meta={};
 const match=(re,key)=>{const m=text.match(re);if(m)meta[key]=numeric(m[1]);};
 match(/(\d+)\s*[歲岁]投保/,'age');
 match(/(?:每期保[費费]|年[繳缴]保[費费]|每年基本[儲储]蓄)\s*[：:]?\s*(?:美元|USD)?\s*([\d,]+(?:\.\d+)?)/,'premium');
 match(/(?:[額额]外支出[／/]徵[費费]|徵[費费]|征费)\s*[：:]\s*(?:美元|USD)?\s*([\d,]+(?:\.\d+)?)/,'levy');
 match(/(?:美元[兌兑]人民[幣币]|[匯汇]率)\s*([\d.]+)/,'fx');
 const years=text.match(/供款年期[：:]\s*(\d+)年|(?:^|[·\s])(\d+)年供款/);if(years)meta.years=Number(years[1]||years[2]);else if(/整付保[費费]|供款年期[：:]\s*整付/.test(text))meta.years=1;
 const product=blocks.find(b=>/計劃|计划/.test(b)&&!/[：:\n]/.test(b)&&b.length>5&&b.length<71&&!/計劃重點|计划重点/.test(b));if(product)meta.product=product;
 if(/美元保單|美元保单/.test(text))meta.currency='USD';return meta;
}
async function readPptx(file) {
 const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
 if(Object.values(zip.files).reduce((n,f)=>n+(f._data?.uncompressedSize||0),0)>60*1024*1024)throw Error('PPTX 展開後過大，請只保留相關頁面');
 const main=zip.file('ppt/presentation.xml'),relationships=zip.file('ppt/_rels/presentation.xml.rels');if(!main||!relationships)throw Error('不是有效的PPTX檔案');
 const pres=xml(await main.async('string')),rels=xml(await relationships.async('string'));
 const ids=Array.from(pres.getElementsByTagNameNS('*','sldId'));if(ids.length>150)throw Error('PPTX 超過150頁，請只保留相關頁面');
 const tables=[],texts=[];let pictures=0;
 for(let i=0;i<ids.length;i++){
 const id=ids[i].getAttribute('r:id');const rel=Array.from(rels.getElementsByTagNameNS('*','Relationship')).find(r=>r.getAttribute('Id')===id);if(!rel||rel.getAttribute('TargetMode')==='External')continue;
 const target=rel.getAttribute('Target'),path=target.startsWith('/')?target.slice(1):'ppt/'+target.replace(/^\.\//,'');const f=zip.file(path);if(!f)continue;const d=xml(await f.async('string'));
 pictures+=d.getElementsByTagNameNS('*','pic').length;
 const blocks=Array.from(d.getElementsByTagNameNS('*','sp')).map(sp=>Array.from(sp.getElementsByTagNameNS('*','p')).map(p=>Array.from(p.getElementsByTagNameNS('*','t')).map(t=>t.textContent).join('')).join('\n')).filter(Boolean);
 const meta=pptxMeta(blocks),text=blocks.join('\n');texts.push(`第${i+1}頁\n${text}`);
 let count=0;for(const tbl of d.getElementsByTagNameNS('*','tbl')){
 const raw=Array.from(tbl.getElementsByTagNameNS('*','tr')).map(tr=>Array.from(tr.children).filter(c=>c.localName==='tc').map(tc=>Array.from(tc.getElementsByTagNameNS('*','t')).map(t=>t.textContent).join('')));
 if(raw.length<2)continue;const t=makeTable(`PPTX 第${i+1}頁 · 表格${++count}`,raw);t.meta={...meta,...t.meta};t.text=text;t.page=i+1;
 if(t.columns.year<0&&t.rows.some(r=>/^\d+\s*年[後后]?$/.test(String(r[0]).trim())))t.columns.year=0;
 if(t.columns.total<0&&/預期.*(?:退保|現金)|预期.*(?:退保|现金)/.test(text)){const usd=t.headers.findIndex(h=>h.trim()==='美元');if(usd>=0)t.columns.total=usd;}
 tables.push(t);
 }
 }
 const warnings=['PPTX 讀取原生文字與表格，用於更新本平台的概覽及IRR圖。上傳簡報的版面、插圖及母版不會自動套用。'];
 if(pictures)warnings.push('圖片內的文字／數字不會自動OCR；若數據只在截圖裡，請補充文字表格。');
 const hasNumbers=tables.some(t=>t.rows.some(r=>r.slice(1).some(v=>Number.isFinite(numeric(v)))));
 if(!tables.length||!hasNumbers)warnings.push('已識別PPTX模版，但沒有可計算的退保數據。可查看提取文字，再補充計劃書或填寫下方金額。');
 return {tables,warnings,text:texts.join('\n\n'),slideCount:ids.length,templateOnly:!hasNumbers};
}
export async function readUpload(file,onProgress=()=>{}) {
 if(file.size>20*1024*1024)throw Error('請上傳20MB以內的文件');const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pptx')return readPptx(file);
 if(ext==='json'){
 const c=JSON.parse(await file.text());if(!Array.isArray(c.rows))throw Error('JSON 必須包含 rows');
 const total=c.rows.every(r=>Array.isArray(r)&&r.length===2);if(!total&&!c.rows.every(r=>Array.isArray(r)&&r.length===3))throw Error('JSON rows 須統一為[年數,總額]或[年數,保證,非保證]');
 return {tables:[{name:'JSON',headers:total?['year','total']:['year','guaranteed','bonus'],rows:c.rows,meta:Object.fromEntries(['product','age','premium','years','levy','fx','currency'].filter(k=>c[k]!==undefined).map(k=>[k,c[k]])),columns:total?{year:0,total:1,guaranteed:-1,bonus:-1}:{year:0,guaranteed:1,bonus:2,total:-1}}],warnings:[]};
 }
 if(['csv','tsv'].includes(ext))return {tables:[makeTable(file.name,csvRows(await file.text()))],warnings:[]};
 if(ext==='xlsx'){
 const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
 if(Object.values(zip.files).reduce((n,f)=>n+(f._data?.uncompressedSize||0),0)>60*1024*1024)throw Error('Excel 展開後過大，請縮小範圍');
 const read=async path=>{const f=zip.file(path);if(!f)throw Error('Excel 缺少 '+path);return xml(await f.async('string'));};
 const wb=await read('xl/workbook.xml'),rels=await read('xl/_rels/workbook.xml.rels');const strings=zip.file('xl/sharedStrings.xml')?Array.from((await read('xl/sharedStrings.xml')).getElementsByTagName('si')).map(s=>s.textContent):[];
 let tables=[],formulas=false;const sheetNodes=Array.from(wb.getElementsByTagName('sheet'));if(sheetNodes.length>30)throw Error('工作表超過30張，請先保留相關資料');
 for(const sheet of sheetNodes){const id=sheet.getAttribute('r:id');const rel=Array.from(rels.getElementsByTagName('Relationship')).find(r=>r.getAttribute('Id')===id);if(!rel||rel.getAttribute('TargetMode')==='External')continue;
 const target=rel.getAttribute('Target');const path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');const doc=await read(path);const raw=[];
 for(const row of doc.getElementsByTagName('row')){const r=[];for(const c of row.getElementsByTagName('c')){const letters=(c.getAttribute('r')||'A').match(/^[A-Z]+/)[0];let idx=0;for(const ch of letters)idx=idx*26+ch.charCodeAt(0)-64;if(idx>300)continue;
 const t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0]?.textContent??'';if(c.getElementsByTagName('f').length)formulas=true;
 r[idx-1]=t==='s'?(strings[Number(v)]??''):t==='inlineStr'?(c.getElementsByTagName('is')[0]?.textContent??''):v;
 }if(r.some(x=>String(x??'').trim()))raw.push(Array.from(r,x=>x??''));}
 if(raw.length)tables.push(makeTable(sheet.getAttribute('name'),raw));
 }if(!tables.length)throw Error('Excel 沒有可讀取的表格');return {tables,warnings:formulas?['Excel 公式使用文件中已保存的計算結果。請先在 Excel 重新計算並保存；缺失結果不會當作0。']:[]};
 }
 if(ext==='pdf'){
 const pdfjs=await import('../assets/vendor/pdfjs/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/assets/vendor/pdfjs/pdf.worker.min.mjs';
 const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true,isEvalSupported:false}).promise;
 try{if(doc.numPages>60)throw Error('PDF 超過60頁，請只保留方案及退保價值頁');const tables=[];let meta={},texts=[];
 for(let i=1;i<=doc.numPages;i++){onProgress(`正在讀取 PDF 第${i}/${doc.numPages}頁…`);const page=await doc.getPage(i);const lines=pdfLines((await page.getTextContent()).items);if(i===1)meta=pdfMeta(lines);const t=pdfTable(lines,i);if(t){t.meta=meta;tables.push(t);}texts.push(`第${i}頁\n`+lines.map(r=>r.join('  ')).join('\n'));}
 if(!tables.length)throw Error('未識別到文字型數值表格。掃描PDF需先OCR，或用下載的CSV範例整理資料再匯入。');
 return {tables,warnings:['PDF 為候選資料，請對照原文核對退保欄、年齡／年度及情景；不會自動選用身故賠償。'],text:texts.join('\n\n')};
 }finally{await doc.destroy();}
 }throw Error('支援 PPTX、PDF、XLSX、CSV、TSV、JSON；舊版PPT／XLS請另存為PPTX／XLSX');
}
