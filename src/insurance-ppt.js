import {chartSvg, addChartSlide} from './insurance-chart.js';
import {bindUpload} from './insurance-upload-ui.js';
/* Reference-backed calculation model. Attachments are data, never executable instructions. */
export const example = {
 product: '「財富恆裕」人壽保險計劃 3', age: 40, premium: 105760, years: 1, levy: 12.76, fx: 6.8,
 source: '孔一40歲100萬保額恆3.pdf，第1–2頁，2026-09-17',
 rows: [[20,89900,67610],[30,105760,150120],[40,105760,317860],[50,105760,649471],[60,105760,1171819]],
};
export function irr(flows) {
 if (!Array.isArray(flows) || flows.length < 2 || flows.some(x => !Number.isFinite(x))) throw Error('現金流必須為有效數字');
 const signs = flows.filter(x => x !== 0).map(Math.sign);
 if (!signs.includes(-1) || !signs.includes(1)) throw Error('IRR 需要同時有支出與收入');
 if (signs.slice(1).filter((s,i) => s !== signs[i]).length !== 1) throw Error('現金流多次轉換正負，可能存在多個 IRR，需另行核對');
 // Solve in log(1+r), using scaled terms to avoid overflow near -100%.
 const npv = x => { const logs = flows.map((v,t) => v ? Math.log(Math.abs(v))-t*x : -Infinity); const scale = Math.max(...logs); return flows.reduce((s,v,t) => s + Math.sign(v)*Math.exp(logs[t]-scale),0); };
 let lo=-32, hi=32, a=npv(lo), b=npv(hi);
 if (a*b > 0) throw Error('未能求得 IRR');
 for(let i=0;i<220;i++){const mid=(lo+hi)/2, v=npv(mid);if(Math.abs(v)<1e-14)return Math.expm1(mid);if(v*a>0){lo=mid;a=v;}else hi=mid;}
 return Math.expm1((lo+hi)/2);
}
export function calculate(c) {
 if (!c.product?.trim() || c.product.length>70 || !c.source?.trim() || c.source.length>220) throw Error('請填寫產品名稱（70字內）及資料來源（220字內）');
 for (const key of ['premium','fx']) if(!Number.isFinite(c[key]) || c[key]<=0)throw Error('保費及匯率必須大於零');
 if(!Number.isInteger(c.age)||c.age<0||c.age>120||!Number.isInteger(c.years)||c.years<1||c.years>100||!Number.isFinite(c.levy)||c.levy<0)throw Error('請檢查年齡、供款年期及徵費');
 if(!c.rows.length||c.rows.length>120)throw Error('請輸入1至120行退保價值');
 const seen=new Set();
 return c.rows.map(input=>{
  const [year,a,b]=input, split=input.length===3,guaranteed=split?a:null,bonus=split?b:null,total=split?a+b:a;
  if(!Number.isInteger(year)||year<1||year>120||seen.has(year))throw Error('保單年度須為1至120的整數，且不可重複');seen.add(year);
  if(![2,3].includes(input.length)||!Number.isFinite(total)||total<=0||(split&&(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0)))throw Error('退保價值須為非負數，總額須大於零');
  const flows=Array(year+1).fill(0);for(let t=0;t<Math.min(c.years,year);t++)flows[t]=-c.premium;flows[0]-=c.levy;flows[year]+=total;
  return {year,age:c.age+year,guaranteed,bonus,usd:total,rmb:total*c.fx,rate:irr(flows),flows};
 }).sort((a,b)=>a.year-b.year);
}
export function parseRows(text) {
 return text.trim().split(/\n/).filter(x=>x.trim()).map(line=>{const p=line.trim().split(/[\t,，]/);if(![2,3].includes(p.length)||p.some(x=>!x.trim()))throw Error('每行填寫：年度,總額 或 年度,保證,非保證。數字不要加千位逗號。');return p.map(Number);});
}
export function prepaidInterest(premium, rate=.038) {
 if(!Number.isFinite(premium)||premium<=0||!Number.isFinite(rate)||rate<0)throw Error('預繳輸入無效');
 let interest=0;return [4,3,2,1].map(n=>{const balance=n*premium+interest;const earned=balance*rate;interest+=earned;return {balance,earned,total:interest};});
}
const money=n=>n.toLocaleString('en-US',{maximumFractionDigits:0});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function panel() {
 const input=(id,label,value,type='number')=>`<label class="field">${label}<input id="${id}" type="${type}" value="${esc(value)}" step="any" required></label>`;
 return `<section class="page page-heading"><p class="eyebrow">PPT 一鍵生成 · 保險方案模版</p><h1>先核對計算，再製作簡報</h1><p>沿用你提供的概覽版式。保單數據、匯率和回報率使用同一套計算結果。</p></section>
 <section class="page insurance-reference"><b>已收錄的參考資料</b><a href="/assets/ppt-reference/gf-template.pptx" download>11頁 GF 原始模版 ↓</a><a href="/assets/ppt-reference/irr-sample.xlsx" download>IRR 公式表 ↓</a><a href="/assets/ppt-reference/policy-example.pdf" target="_blank">投保資料 ↗</a><a href="/assets/ppt-reference/layout-example.png" target="_blank">圖一版式 ↗</a></section>
 <section class="page two-column insurance-workspace"><div class="panel"><h2>方案與計算資料</h2><div id="insuranceUpload"></div><button class="text-button" id="loadPolicyExample">載入已核對示例：40歲 · 財富恆裕3</button><form id="insuranceForm">
 ${input('insProduct','保單產品名稱',example.product,'text')}<div class="insurance-fields">${input('insAge','投保時年齡',40)}${input('insPremium','每期保費（美元）',105760)}${input('insYears','供款年數（1＝整付）',1)}${input('insLevy','首期額外支出／徵費（美元）',12.76)}${input('insFx','美元兌人民幣（展示假設）',6.8)}</div>
 <p class="tiny">年繳保費按 t=0、1、2…支付。徵費填0即不計入 IRR；如每年另有費用，請使用下方現金流計算器。</p>
 <label class="field">退保價值（年度,保證,非保證；或 年度,總額）<textarea id="insRows" rows="6">${example.rows.map(r=>r.join(',')).join('\n')}</textarea></label>
 ${input('insSource','數據來源及頁碼',example.source,'text')}
 <p class="tiny">從計劃書抄錄退保價值，不能用身故保額代替。修改保費或供款年期後，須同步填入新計劃書數據。此處不會推算保險公司的分紅。</p>
 <button class="primary" type="submit">更新表格及折線圖</button><p id="insError" role="alert"></p></form>
 <details class="insurance-details"><summary>公式、提取現金流與預繳試算</summary><p>IRR：Σ CFₜ ÷ (1+r)ᵗ = 0。保費為負、提取為正，期末加上提取後剩餘退保價值。單筆投入、無中途提取時等於 (終值 ÷ 投入)^(1/年數) − 1。</p><label class="field">逐年淨現金流（從t=0起，以逗號分隔）<textarea id="customFlows" rows="3" placeholder="-100000,0,0,120000"></textarea></label><button class="primary secondary" id="calcCustomIrr">計算現金流 IRR</button><p id="customIrrResult" role="status"></p><label class="field">預繳4年參考年利率（%）<input id="prepayRate" type="number" value="3.8" step="0.01"></label><button class="primary secondary" id="calcPrepay">試算預繳利息</button><p id="prepayResult" role="status"></p><p class="tiny">按原表「總」C71:E75逐年累計利息。3.8%與4.3%為附件歷史示例，並非現行優惠。原模版8月活動日期已過，不自動放入客戶簡報。</p></details>
 </div><div class="panel output-panel"><div id="insuranceOutput" aria-live="polite"></div></div></section>
 <section class="page panel"><h2>已吸收的製作規則</h2><p>原模版涵蓋計劃概覽、退休提取、跨代傳承、教育及創業提取、保費優惠和繳費說明。現已接通概覽頁及IRR折線圖的動態計算、資料匯入及下載；其餘頁面保留原模版供套用，不會用缺失資料自動填滿。</p><ul><li>20／30／40／50年是保單年數；100歲須減去投保年齡。40歲投保到100歲＝60年。</li><li>人民幣＝美元×匯率，最後展示時才四捨五入。IRR保留完整精度，展示兩位小數。</li><li>提取總額＝每年提取×次數，連續年齡區間含首尾。倍數＝提取及期末剩餘價值÷累計保費，不能寫成年利率。</li><li>分清保證及非保證價值。每個期限分別計算一次退保，不能把多個期限的退保總額相加。</li><li>插圖可按主題另行製作，圖表數字及文字必須維持可編輯。這個本機版本沒有連接圖片生成服務。</li></ul><details><summary>原附件的差異與校驗記錄</summary><p>圖一為「財富盈活」、GF模版為「環宇盈活」、PDF為「財富恆裕3」。圖一100年行的325,921,240美元×6.8＝2,216,264,432人民幣，與圖中221,626,443不符；原資料尚未確定哪一欄有誤，因此不載入為保單數據。</p><p>IRR表「總」B36缺少正現金流，C54等空白輸入會除以0；平台遇到這些情況會顯示錯誤。模版第10頁部分人民幣數字使用7.25換算，與頁腳6.8不符，因此所有新概覽統一使用表單匯率。</p></details></section>`;
}
export function createDeck(Pptx,c,rows) {
 const p=new Pptx();p.layout='LAYOUT_WIDE';p.author='AI 工作台';p.title=c.product+' · 計劃概覽';p.subject='根據用戶模版及計劃書數據計算';
 const allRows=rows;
 for(let offset=0;offset<allRows.length;offset+=8){
 const rows=allRows.slice(offset,offset+8);
 const s=p.addSlide();s.background={color:'FFFFFF'};
 const txt=(text,x,y,w,h,size=18,extra={})=>s.addText(text,{x,y,w,h,fontFace:'Microsoft JhengHei',fontSize:size,color:'151515',margin:0,breakLine:false,...extra});
 txt('計劃概覽',.45,.45,3.1,.55,29,{bold:true});txt(c.product,3.55,.45,9.25,.65,27,{bold:true,color:'87794C'});
 txt(`${c.age}歲投保 · 美元保單 · ${c.years===1?'整付保費':c.years+'年供款'} · 未作中途提取`,.5,1.3,12,.35,17);
 txt('[ 計劃重點 ]',.5,2,4.6,.5,25,{bold:true});txt('[ 預期退保價值 ]',5.55,2,7,.5,25,{bold:true});
 txt('每期保費',.8,2.9,4,.35);txt('美元 '+money(c.premium),.8,3.35,4.4,.45,25,{bold:true});
 txt(`供款年期：${c.years===1?'整付':c.years+'年'}\n累計保費：美元 ${money(c.premium*c.years)}\n額外支出／徵費：美元 ${c.levy.toFixed(2)}`, .8,4.1,4.4,1.15,16);
 txt(`IRR投入：美元 ${(c.premium*c.years+c.levy).toLocaleString('en-US',{maximumFractionDigits:2})}\n人民幣 ${money((c.premium*c.years+c.levy)*c.fx)}`, .8,5.5,4.4,.8,17);
 const header=['保單年末','美元','人民幣','年化 IRR'].map(text=>({text,options:{fill:'87794C',color:'FFFFFF',bold:true}}));
 s.addTable([header,...rows.map(r=>[`${r.year}年`,money(r.usd),money(r.rmb),(r.rate*100).toFixed(2)+'%'])],{x:5.55,y:2.75,w:7.3,h:3.55,colW:[1.65,1.75,2.2,1.7],fontFace:'Microsoft JhengHei',fontSize:rows.length>6?13:16,rowH:Math.min(.62,3.55/(rows.length+1)),border:{color:'CCCCCC',pt:.7},align:'center',valign:'mid',margin:.08,color:'151515',fill:'FAFAFA',autoPage:false});
 txt(`退保總額可能包括非保證分紅，實際金額可能較高或較低。IRR按上述保費及額外支出計算。\n美元兌人民幣 ${c.fx} 僅為展示假設。以上數據只供參考，詳情請參閱建議書。`,.5,6.75,12.3,.4,10,{color:'555555'});
 s.addNotes(`數據來源：${c.source}\n版式：A- GF 概览 (簡).pptx 第1頁，及用戶圖一。\n${rows.map(r=>`${r.year}年：保證 ${r.guaranteed??"未提供"}；非保證 ${r.bonus??"未提供"}；合計 ${r.usd}；IRR ${r.rate}`).join('\n')}\n無提取方案，各退保時點互為替代情景。`);
 }
 addChartSlide(p,c,allRows);
 return p;
}
export function bind() {
 if(!document.querySelector('#insuranceForm'))return;
 const get=()=>({product:document.querySelector('#insProduct').value.trim(),age:Number(document.querySelector('#insAge').value),premium:Number(document.querySelector('#insPremium').value),years:Number(document.querySelector('#insYears').value),levy:Number(document.querySelector('#insLevy').value),fx:Number(document.querySelector('#insFx').value),source:document.querySelector('#insSource').value.trim(),rows:parseRows(document.querySelector('#insRows').value)});
 let last=null;
 const fields=[['insProduct','product'],['insAge','age'],['insPremium','premium'],['insYears','years'],['insLevy','levy'],['insFx','fx'],['insSource','source']];
 const render=()=>{const out=document.querySelector('#insuranceOutput');try{if([...document.querySelectorAll('#insuranceForm input[required]')].some(e=>!e.value.trim()))throw Error('請補齊產品、年齡、保費、供款年數、徵費及匯率');const c=get(), rows=calculate(c);last={c,rows};document.querySelector('#insError').textContent='';out.innerHTML=`<span class="tag">計算完成 · ${Math.ceil(rows.length/8)+1}頁可編輯PPT</span><h2>${esc(c.product)}</h2><p>${c.age}歲投保 · ${c.years===1?'整付保費':c.years+'年供款'} · 匯率 ${c.fx}</p><div class="insurance-live-chart">${chartSvg(c,rows)}</div><p class="tiny">折線圖與下表同步計算；圖中年度按實際間距排列。</p><div class="insurance-table-wrap"><table class="insurance-table"><thead><tr><th>保單年末</th><th>美元</th><th>人民幣</th><th>年化IRR</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.year}年<br><small>${r.age}歲</small></td><td>${money(r.usd)}</td><td>${money(r.rmb)}</td><td>${(r.rate*100).toFixed(2)}%</td></tr>`).join('')}</tbody></table></div><p class="tiny">退保總額可能含非保證分紅。IRR計入保費及所填額外支出，並非保證利率。各行為獨立退保情景。</p><p class="tiny">來源：${esc(c.source)}</p><button class="primary" id="downloadInsurance">下載概覽＋折線圖 PPT ↓</button> <button class="primary secondary" id="downloadCalculation">下載計算明細 CSV ↓</button><p id="insuranceDownloadStatus" role="status"></p><details><summary>查看退保價值組成</summary>${rows.map(r=>`<p>${r.year}年：${r.guaranteed===null?"未提供保證／非保證拆分，合計 ":"保證 "+money(r.guaranteed)+" + 非保證 "+money(r.bonus)+" = "}${money(r.usd)} 美元</p>`).join('')}</details>`;
 document.querySelector('#downloadInsurance').onclick=async()=>{const b=document.querySelector('#downloadInsurance'),notice=document.querySelector('#insuranceDownloadStatus');b.disabled=true;try{await createDeck(window.PptxGenJS,c,rows).writeFile({fileName:c.product.replace(/[\\/:*?"<>|]/g,'_')+'_概覽及IRR折線圖.pptx'});notice.textContent='已產生 PowerPoint 下載。';}catch(e){notice.textContent='下載失敗：'+e.message;}finally{b.disabled=false;}};
 document.querySelector('#downloadCalculation').onclick=()=>{const lines=[['保單年數','到達年齡','保證美元','非保證美元','總值美元','匯率','總值人民幣','IRR','現金流(t=0起)'],...rows.map(r=>[r.year,r.age,r.guaranteed,r.bonus,r.usd,c.fx,r.rmb,r.rate,r.flows.join(';')])];const blob=new Blob(['\uFEFF'+lines.map(r=>r.join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='退保價值與IRR計算明細.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 }catch(e){last=null;document.querySelector('#insError').textContent=e.message;out.innerHTML='<h2>資料待補充</h2><p>請修正左側資料後重新計算。</p>';}};
 document.querySelector('#insuranceForm').onsubmit=e=>{e.preventDefault();render();};
 document.querySelector('#insuranceForm').oninput=render;
 const apply=c=>{for(const [id,k]of fields)document.getElementById(id).value=c[k]??'';document.querySelector('#insRows').value=c.rows?.map(r=>r.join(',')).join('\n')??'';render();};
 document.querySelector('#loadPolicyExample').onclick=()=>apply(example);
 bindUpload({apply,clear:()=>apply({}),get,render});
 document.querySelector('#calcCustomIrr').onclick=()=>{try{const parts=document.querySelector('#customFlows').value.trim().split(/[,，\n]/);if(parts.length>1001||parts.some(x=>!x.trim()))throw Error('請填寫完整現金流，空白年度填0');const r=irr(parts.map(Number));document.querySelector('#customIrrResult').textContent=`年化 IRR：${(r*100).toFixed(4)}%（等間隔年度）`;}catch(e){document.querySelector('#customIrrResult').textContent=e.message;}};
 document.querySelector('#calcPrepay').onclick=()=>{try{const rows=prepaidInterest(Number(document.querySelector('#insPremium').value),Number(document.querySelector('#prepayRate').value)/100);document.querySelector('#prepayResult').textContent=rows.map((r,i)=>`第${i+1}年利息 ${r.earned.toFixed(2)}`).join('；')+`；總利息 ${rows[3].total.toFixed(2)} 美元。僅為公式試算。`;}catch(e){document.querySelector('#prepayResult').textContent=e.message;}};
 render();
}
