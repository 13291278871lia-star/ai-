const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function chartScale(rows){
 const vals=rows.map(r=>r.rate),low=Math.min(0,...vals),high=Math.max(0,...vals);const span=Math.max(.01,high-low);
 const raw=span/5,power=10**Math.floor(Math.log10(raw));const step=[1,2,5,10].map(n=>n*power).find(n=>n>=raw);
 const min=Math.floor(low/step)*step,max=Math.ceil((high+step*.5)/step)*step;
 const years=rows.map(r=>r.year),first=Math.min(...years),last=Math.max(...years);
 return {min,max,step,xMin:Math.max(0,first-(last===first?1:0)),xMax:last+(last===first?1:0)};
}
export function chartSvg(c,rows) {
 const sc=chartScale(rows),left=130,right=1450,top=210,bottom=680;
 const x=v=>left+(v-sc.xMin)/(sc.xMax-sc.xMin)*(right-left),y=v=>bottom-(v-sc.min)/(sc.max-sc.min)*(bottom-top);
 const ticks=[];for(let n=sc.min;n<=sc.max+sc.step/10;n+=sc.step)ticks.push(n);
 const labelEvery=Math.max(1,Math.ceil(rows.length/10));
 const path=rows.map((r,i)=>`${i?'L':'M'} ${x(r.year)} ${y(r.rate)}`).join(' ');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="不同保單年度的年化IRR折線圖"><rect width="1600" height="900" fill="#fff"/><g font-family="Arial Unicode MS,Microsoft JhengHei,sans-serif" fill="#242722"><text x="80" y="78" font-size="40" font-weight="bold">年化 IRR 隨持有年期變化</text><text x="82" y="124" font-size="23" fill="#73776f">${esc(c.product.slice(0,40))} · ${c.age}歲投保 · ${c.years===1?'整付保費':c.years+'年供款'}</text><text x="82" y="179" font-size="19" fill="#73776f">年化 IRR（%）</text>
 ${ticks.map(t=>`<line x1="${left}" x2="${right}" y1="${y(t)}" y2="${y(t)}" stroke="${Math.abs(t)<1e-10?'#b8bcb5':'#e7e9e4'}"/><text x="108" y="${y(t)+7}" text-anchor="end" font-size="20" fill="#73776f">${(t*100).toFixed(sc.step<.01?1:0)}%</text>`).join('')}
 <path d="${path}" fill="none" stroke="#87794c" stroke-width="5" stroke-linejoin="round"/>
 ${rows.map((r,i)=>{const label=i%labelEvery===0||i===rows.length-1;return `<circle cx="${x(r.year)}" cy="${y(r.rate)}" r="${rows.length>30?4:8}" fill="#87794c" stroke="white" stroke-width="2"/>${label?`<text x="${x(r.year)}" y="${y(r.rate)-23}" text-anchor="middle" font-size="${rows.length>8?22:29}" fill="#87794c">${(r.rate*100).toFixed(2)}%</text><text x="${x(r.year)}" y="722" text-anchor="middle" font-size="22">${r.year}年</text><text x="${x(r.year)}" y="753" text-anchor="middle" font-size="17" fill="#73776f">${r.age}歲</text>`:''}`;}).join('')}
 <text x="790" y="797" text-anchor="middle" font-size="19" fill="#73776f">持有年期（保單年度）</text><text x="82" y="844" font-size="17" fill="#73776f">按所填保費及額外支出計算，無中途提取。退保價值含非保證部分時，IRR並非保證回報。</text><text x="82" y="875" font-size="16" fill="#73776f">連線僅連接所列時點，不代表中間年度測算值。資料來源：${esc(c.source.slice(0,65))}</text></g></svg>`;
}
export function addChartSlide(p,c,rows){
 const s=p.addSlide(),sc=chartScale(rows);s.background={color:'FFFFFF'};
 const text=(t,x,y,w,h,size,color='242722')=>s.addText(t,{x,y,w,h,fontSize:size,fontFace:'Microsoft JhengHei',color,margin:0});
 text('年化 IRR 隨持有年期變化',.55,.38,12,.6,29);
 text(`${c.product} · ${c.age}歲投保 · ${c.years===1?'整付保費':c.years+'年供款'}`,.57,1.1,12.2,.5,c.product.length>35?14:17,'73776F');
 s.addChart(p.ChartType.scatter,[{name:'保單年度',values:rows.map(r=>r.year)},{name:'年化 IRR',values:rows.map(r=>r.rate)}],{
  x:.65,y:1.85,w:12.0,h:4.75,showTitle:false,showLegend:false,showValue:rows.length<=12,
  chartColors:['87794C'],showLine:true,lineSize:2.6,lineDataSymbol:'circle',lineDataSymbolSize:7,lineSmooth:false,
  catAxes:[{valAxisLabelFormatCode:'0"年"'}],valAxes:[{}],
  catAxisMinVal:sc.xMin,catAxisMaxVal:sc.xMax,catAxisMajorUnit:Math.max(1,Math.ceil((sc.xMax-sc.xMin)/8)),
  catAxisLabelFontSize:13,catAxisLabelColor:'73776F',catAxisLabelFontFace:'Microsoft JhengHei',catAxisTitle:'持有年期（保單年度）',catAxisTitleFontSize:13,showCatAxisTitle:true,catLabelFormatCode:'0"年"',catGridLine:{style:'none'},catAxisLineColor:'B8BCB5',
  valAxisMinVal:sc.min,valAxisMaxVal:sc.max,valAxisMajorUnit:sc.step,valAxisLabelFormatCode:'0.0%',valAxisLabelColor:'73776F',valAxisLabelFontSize:13,valAxisLineShow:false,valGridLine:{color:'E7E9E4',size:.6},
  dataLabelPosition:'t',dataLabelFormatCode:'0.00%',dataLabelColor:'87794C',dataLabelFontFace:'Microsoft JhengHei',dataLabelFontSize:17,
  showBorder:false,showCatName:false,showSerName:false,
 });
 text('按所填保費及額外支出計算，無中途提取。退保價值含非保證部分時，IRR並非保證回報。',.55,6.88,12.2,.22,10,'62665E');
 text('連線僅連接所列時點，不代表中間年度測算值。',.55,7.15,12,.2,10,'62665E');
 s.addNotes(`來源：${c.source}\n每個期限分別退保，並非把各年價值相加。\n${rows.map(r=>`${r.year}年（${r.age}歲）：${r.rate*100}%`).join('\n')}`);
 return s;
}
