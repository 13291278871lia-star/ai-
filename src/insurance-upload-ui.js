import {readUpload,mapTable,escapeHtml as esc} from './insurance-import.js';
export function bindUpload({apply,clear,get,render}){
 const host=document.querySelector('#insuranceUpload');if(!host)return;let upload=null,revision=0;
 host.innerHTML=`<div class="insurance-upload"><h3>上傳資料，更新圖表</h3><label class="field">選擇PPTX、計劃書或資料表<input id="insUploadFile" type="file" accept=".pptx,.pdf,.xlsx,.csv,.tsv,.json"></label><p class="tiny">PPTX／PDF／Excel／CSV／JSON，20MB以內。本機瀏覽器讀取，不上傳外部服務。文字PDF可讀取候選表格；掃描件需先OCR。僅支援美元、無中途提取方案。</p><a href="/assets/ppt-reference/import-example.csv" download>下載 CSV 欄位範例</a> · <button type="button" class="text-button" id="saveInsuranceData">儲存當前方案 JSON</button><p id="insUploadStatus" role="status"></p><div id="insUploadMapping"></div></div>`;
 const status=t=>{if(host.isConnected)host.querySelector('#insUploadStatus').textContent=t;};
 const choose=()=>{
  const root=host.querySelector('#insUploadMapping');const index=Number(root.querySelector('#insUploadSheet')?.value||0),table=upload.tables[index],c=table.columns||{};
  const sheet=`<label class="field">工作表／幻燈片／PDF頁碼<select id="insUploadSheet">${upload.tables.map((t,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>`;
  const select=(key,label,value)=>`<label class="field">${label}<select id="map-${key}"><option value="-1">請選擇</option>${table.headers.map((h,i)=>`<option value="${i}" ${i===value?'selected':''}>${i+1}. ${esc(h)}</option>`).join('')}</select></label>`;
  root.innerHTML=sheet+`<p class="tiny">先核對原表的列序，再指定欄位。請選退保價值，不是身故賠償；悲觀、預期、樂觀情景須分開匯入。</p><div class="insurance-import-preview"><table><thead><tr>${table.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${table.rows.slice(0,8).map(r=>`<tr>${table.headers.map((_,i)=>`<td>${esc(r[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="tiny">共 ${table.rows.length} 行，預覽前8行。</p><div class="insurance-map-grid">${select('year','保單年度／到達年齡',c.year)}<label class="field">年期含義<select id="map-yearKind"><option value="auto">保單年數；含「歲」時按年齡換算</option><option value="age">全欄為到達年齡</option><option value="year">全欄為保單年數</option></select></label><label class="field">退保資料口徑<select id="map-mode"><option value="split" ${c.guaranteed>=0&&c.bonus>=0?'selected':''}>保證＋非保證</option><option value="total" ${!(c.guaranteed>=0&&c.bonus>=0)?'selected':''}>只有退保總額</option></select></label>${select('guaranteed','保證退保價值',c.guaranteed)}${select('bonus','非保證退保價值',c.bonus)}${select('total','退保總額',c.total)}</div><label class="field">展示年期（例如20,30,40,50,60；留空顯示全部）<input id="importYears" value="" placeholder="留空顯示全部可用年度"></label><label><input type="checkbox" id="importUSD"> 已核對：金額為美元，屬同一無提取方案</label><button type="button" class="primary" id="applyInsuranceUpload">套用已核對欄位，更新圖表</button>${table.text?`<details><summary>查看本頁提取文字</summary><pre>${esc(table.text)}</pre></details>`:''}`;
  const meta=Object.fromEntries(Object.entries(table.meta||{}).filter(([k])=>['age','premium','years','levy','fx','product'].includes(k)));
  apply({...meta,fx:meta.fx??6.8,source:`${upload.filename} · ${table.name}`,rows:[]});
  status([`已讀取 ${upload.filename}。請補齊下方保費等欄位，再核對列對應。`,...(upload.warnings||[]),table.meta?.currency&&!['USD','美元','美金'].includes(table.meta.currency)?`原檔幣種為 ${table.meta.currency}，此工具只接受美元，請勿直接套用。`:'' ].filter(Boolean).join('\n'));
  root.querySelector('#insUploadSheet').onchange=choose;
  const mapping=()=>({year:Number(root.querySelector('#map-year').value),guaranteed:Number(root.querySelector('#map-guaranteed').value),bonus:Number(root.querySelector('#map-bonus').value),total:Number(root.querySelector('#map-total').value),mode:root.querySelector('#map-mode').value,yearKind:root.querySelector('#map-yearKind').value,age:document.querySelector('#insAge').value.trim()?Number(document.querySelector('#insAge').value):NaN});
  const suggest=()=>{try{const r=mapTable(table,mapping()).rows;const common=r.filter(r=>[20,30,40,50,60].includes(r[0])).map(r=>r[0]);root.querySelector('#importYears').value=r.length>8&&common.length>=2?common.join(','):'';}catch{}};suggest();
  root.querySelector('#applyInsuranceUpload').onclick=()=>{try{
   if(!root.querySelector('#importUSD').checked)throw Error('請先核對幣種及方案口徑');
   if(table.meta?.currency&&!['USD','美元','美金'].includes(table.meta.currency))throw Error('原檔不是美元方案，不能直接以美元計算');
   const mapped=mapTable(table,mapping()),selectText=root.querySelector('#importYears').value.trim();let rows=mapped.rows;
   if(selectText){const years=selectText.split(/[,，\s]+/).map(Number);if(years.some(y=>!Number.isInteger(y)||y<1)||new Set(years).size!==years.length)throw Error('展示年期必須為不重複正整數');const missing=years.filter(y=>!rows.some(r=>r[0]===y));if(missing.length)throw Error(`原檔沒有第${missing.join('、')}年數值，不會自行補算`);rows=rows.filter(r=>years.includes(r[0]));}
   const config=get();apply({...config,rows,source:`${upload.filename} · ${table.name}`});
   status(`已套用 ${rows.length} 個年期，圖表與PPT使用相同數據。${mapped.skipped?`略過 ${mapped.skipped} 行非年度／第0年記錄。`:''}請檢查右側結果；缺失輸入會阻止下載。`);
  }catch(e){status('未套用：'+e.message);}};
 };
 const manualRead=async(file,current)=>{
  try{const result=await readUpload(file,t=>{if(current===revision)status(t);});if(current!==revision||!host.isConnected)return;upload={...result,filename:file.name};
 if(!result.tables.length){status(`已識別 ${file.name}（${result.slideCount||0}頁）。`+(result.warnings||[]).join(' '));host.querySelector('#insUploadMapping').innerHTML=`<details open><summary>查看PPTX提取文字</summary><pre>${esc(result.text||'未找到可讀取文字，可能是圖片型簡報。')}</pre></details>`;return;}
 choose();}catch(e){if(current===revision)status('讀取失敗：'+e.message);}
 };
 host.querySelector('#insUploadFile').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;const current=++revision;upload=null;clear();host.querySelector('#insUploadMapping').innerHTML='';
  if(file.name.toLowerCase().endsWith('.pdf')){
   status('正在後端解析計劃書…');
   try{
    const resp=await fetch('/api/parse-proposal',{method:'POST',headers:{'Content-Type':'application/pdf'},body:await file.arrayBuffer()});
    if(current!==revision||!host.isConnected)return;
    if(resp.ok){
     const data=await resp.json();const p=data.profile||{};
     if(data.known&&p.product&&p.age&&p.premium){
      apply({product:p.product,age:p.age,premium:p.premium,years:p.years||1,levy:p.levy??0,fx:p.fx||6.8,source:`${file.name} · 後端自動解析（${data.rowCount}個年度）`,rows:data.rows});
      status(`✅ 已自動辨識 AIA 計劃書，套用 ${data.rowCount} 個年度數據。正在下載完整模版 PPT…`);
      setTimeout(()=>{const btn=document.querySelector('#downloadInsurance');if(btn&&!btn.disabled){btn.click();}else{status(`已套用數據，請按右側「下載完整模版 PPT」按鈕。`);}},700);
      host.querySelector('#insUploadMapping').innerHTML=`<p class="tiny">已自動套用後端解析結果（${data.rowCount}年）。如需手動調整，<button type="button" class="text-button" id="switchManualMap">改用瀏覽器手動對應</button>。</p>`;
      host.querySelector('#switchManualMap').onclick=()=>{status('改用手動對應，請稍候…');manualRead(file,current);};
      return;
     }
     status(`後端未辨識為標準 AIA 計劃書（${(data.warnings||[]).join('；')||'未知格式'}），改用瀏覽器手動對應…`);
    }else{status('後端解析未成功（HTTP '+resp.status+'），改用瀏覽器手動對應…');}
   }catch(e){if(current===revision)status('後端解析失敗：'+e.message+'，改用瀏覽器手動對應…');}
  }
  status('正在本機讀取資料…');manualRead(file,current);
 };
 host.querySelector('#saveInsuranceData').onclick=()=>{try{const c=get();if(!c.product||!c.rows.length)throw Error('請先填寫完整方案');const blob=new Blob([JSON.stringify({...c,currency:'USD'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='保險方案資料.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已下載方案JSON，可重新上傳使用。');}catch(e){status(e.message);}};
}
