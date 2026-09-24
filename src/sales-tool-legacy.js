/* 傳承銷售工具 · 按已交付模版
 * 上傳計劃書 → 核對內容 → 輸出 7 頁個案 PPT
 * 兩款產品分開成章：產品介紹頁 + 計劃書案例頁，最後以組合時間軸收尾。
 * 預填內容為已交付的 WE3 + GF 版本，可直接生成或修改後生成。
 */

// === 預設數據（已交付的 WE3 + GF 版本） ===
const DEFAULT_CASE = {
  title: '盈選創富 · 傳承規劃簡報',
  client: { name: '陳大文', age: 35, gender: 'M', occupation: '企業主管', owner: '陳大文', beneficiary: '配偶及子女' },
  productA: {
    code: 'WE3', nameCn: '盈選傳承終身壽險', nameEn: 'Wealth Legacy Elite 3', insurer: '立橋人壽', fileName: '',
    extracted: { age: 35, gender: 'M', sumInsured: 1500000, annualPremium: 45000, paymentTerm: 5, breakEvenYear: 18, valueAt20: 1180000, valueAt100: 18600000 },
    highlights: ['保單現金價值鎖定，第 18 年回本', '5 年短供款，終身保障', '可轉換受保人，財富跨代傳承', '紅利鎖定機制，對抗市場波動'],
  },
  productB: {
    code: 'GF', nameCn: '創富傳承終身壽險', nameEn: 'Generational Fortune', insurer: '立橋人壽', fileName: '',
    extracted: { age: 35, gender: 'M', sumInsured: 1200000, annualPremium: 38000, paymentTerm: 10, breakEvenYear: 15, valueAt20: 980000, valueAt100: 15200000 },
    highlights: ['10 年供款，靈活財務規劃', '第 15 年回本，增值潛力高', '保單拆分功能，資產靈活分配', '身故賠償可選擇現金價值或保額'],
  },
  timeline: [
    { age: 35, year: 2025, event: '投保 WE3 + GF 組合', product: '組合', cumValue: 0 },
    { age: 40, year: 2030, event: 'WE3 供款完成', product: 'WE3', cumValue: 225000 },
    { age: 45, year: 2035, event: 'GF 供款完成', product: 'GF', cumValue: 600000 },
    { age: 50, year: 2040, event: 'GF 回本', product: 'GF', cumValue: 980000 },
    { age: 53, year: 2043, event: 'WE3 回本', product: 'WE3', cumValue: 1180000 },
    { age: 60, year: 2050, event: '退休提取規劃', product: '組合', cumValue: 2400000 },
    { age: 80, year: 2070, event: '財富傳承啟動', product: '組合', cumValue: 8900000 },
    { age: 100, year: 2090, event: '遺產傳承受益人', product: '組合', cumValue: 33800000 },
  ],
  advisor: '李顧問',
  preparedAt: new Date().toISOString().slice(0, 10),
};

const money = n => n >= 1000000 ? `US$${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `US$${(n / 1000).toFixed(0)}K` : `US$${n}`;
const moneyFull = n => `US$${n.toLocaleString('en-US')}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// === 面板 HTML ===
export function panel() {
  const c = getState();
  const field = (id, label, value, type = 'number') => `<label class="field">${label}<input id="${id}" type="${type}" value="${esc(value)}" step="any"></label>`;
  const productForm = (p, prefix) => `
    <div class="insurance-fields">
      ${field(prefix + 'SumInsured', '保額 (USD)', p.extracted.sumInsured)}
      ${field(prefix + 'Premium', '年繳保費 (USD)', p.extracted.annualPremium)}
      ${field(prefix + 'Term', '供款期 (年)', p.extracted.paymentTerm)}
      ${field(prefix + 'BreakEven', '回本期 (年)', p.extracted.breakEvenYear)}
      ${field(prefix + 'Value20', '20 年現金價值', p.extracted.valueAt20)}
      ${field(prefix + 'Value100', '100 歲現金價值', p.extracted.valueAt100)}
    </div>
    <p class="tiny">總供款：${moneyFull(p.extracted.annualPremium * p.extracted.paymentTerm)} · 20 年增值：<b style="color:var(--success,#2D6A4F)">${moneyFull(p.extracted.valueAt20 - p.extracted.annualPremium * p.extracted.paymentTerm)}</b></p>`;

  return `
    <section class="page page-heading">
      <p class="eyebrow">傳承銷售工具 · 按已交付模版</p>
      <h1>上傳計劃書，輸出傳承個案 PPT</h1>
      <p>兩款產品分開成章：產品介紹頁 + 計劃書案例頁，最後以組合時間軸收尾。預填內容為已交付的 WE3 + GF 版本，可直接生成或修改後生成。</p>
    </section>
    <section class="page two-column">
      <div class="panel">
        <h2>STEP 1 · 上傳計劃書（可選填）</h2>
        <p class="tiny">上傳後自動匯入數字；未上傳則使用預設值。</p>
        <div class="salestool-upload" id="stUploadA">
          <span class="tag" style="background:#C9A961;color:#fff">${c.productA.code}</span>
          <label class="field">產品 A 計劃書（PDF / PPTX）<input id="stFileA" type="file" accept=".pdf,.pptx"></label>
          <p class="tiny" id="stStatusA">尚未上傳 · 使用預設 ${c.productA.nameCn}</p>
        </div>
        <div class="salestool-upload" id="stUploadB">
          <span class="tag" style="background:#C9A961;color:#fff">${c.productB.code}</span>
          <label class="field">產品 B 計劃書（PDF / PPTX）<input id="stFileB" type="file" accept=".pdf,.pptx"></label>
          <p class="tiny" id="stStatusB">尚未上傳 · 使用預設 ${c.productB.nameCn}</p>
        </div>
      </div>
      <div class="panel">
        <h2>STEP 2 · 核對內容</h2>
        <details open><summary><b>客戶資料</b></summary>
        <div class="insurance-fields">
          ${field('stClientName', '姓名', c.client.name, 'text')}
          ${field('stClientAge', '年齡', c.client.age)}
          <label class="field">性別<select id="stClientGender"><option value="M" ${c.client.gender === 'M' ? 'selected' : ''}>男</option><option value="F" ${c.client.gender === 'F' ? 'selected' : ''}>女</option></select></label>
          ${field('stClientOcc', '職業', c.client.occupation, 'text')}
          ${field('stClientOwner', '持有人', c.client.owner, 'text')}
          ${field('stClientBen', '受益人', c.client.beneficiary, 'text')}
        </div></details>
        <details open><summary><b>產品 A · ${c.productA.code} — ${c.productA.nameCn}</b></summary>${productForm(c.productA, 'stA')}</details>
        <details open><summary><b>產品 B · ${c.productB.code} — ${c.productB.nameCn}</b></summary>${productForm(c.productB, 'stB')}</details>
        <details><summary><b>組合時間軸（${c.timeline.length} 個節點）</b></summary>
          <div class="salestool-timeline" id="stTimeline">
            ${c.timeline.map((n, i) => `<div class="insurance-fields"><input type="number" class="st-tl-age" value="${n.age}" data-idx="${i}" style="width:60px"><input type="number" class="st-tl-year" value="${n.year}" data-idx="${i}" style="width:80px"><input type="text" class="st-tl-event" value="${esc(n.event)}" data-idx="${i}"><select class="st-tl-product" data-idx="${i}"><option value="WE3" ${n.product === 'WE3' ? 'selected' : ''}>WE3</option><option value="GF" ${n.product === 'GF' ? 'selected' : ''}>GF</option><option value="組合" ${n.product === '組合' ? 'selected' : ''}>組合</option></select><input type="number" class="st-tl-value" value="${n.cumValue}" data-idx="${i}" style="width:120px"></div>`).join('')}
          </div>
          <p class="tiny">欄位順序：年齡 / 年份 / 事件 / 關聯產品 / 累計現金價值</p>
        </details>
      </div>
    </section>
    <section class="page panel">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <h2>STEP 3 · 生成 PPT</h2>
        <span class="tag">${c.productA.code} + ${c.productB.code} · 7 頁模版 · ${c.timeline.length} 個時間軸節點</span>
        <button class="primary" id="stGenerate">生成 PPT 並下載 ↓</button>
        <button class="primary secondary" id="stReset">重置為預設版本</button>
        <p id="stGenStatus" role="status" class="tiny"></p>
      </div>
    </section>`;
}

// === 狀態管理 ===
let state = JSON.parse(JSON.stringify(DEFAULT_CASE));
function getState() { return state; }
function setState(s) { state = s; }

// === 從 DOM 讀取表單數據 ===
function readForm() {
  const num = id => Number(document.getElementById(id)?.value || 0);
  const str = id => document.getElementById(id)?.value?.trim() || '';
  const client = { name: str('stClientName'), age: num('stClientAge'), gender: str('stClientGender'), occupation: str('stClientOcc'), owner: str('stClientOwner'), beneficiary: str('stClientBen') };
  const readProduct = (p, prefix) => ({
    ...p,
    extracted: {
      ...p.extracted,
      sumInsured: num(prefix + 'SumInsured'), annualPremium: num(prefix + 'Premium'), paymentTerm: num(prefix + 'Term'),
      breakEvenYear: num(prefix + 'BreakEven'), valueAt20: num(prefix + 'Value20'), valueAt100: num(prefix + 'Value100'),
    },
  });
  const timeline = [...document.querySelectorAll('.st-tl-age')].map(el => {
    const i = Number(el.dataset.idx);
    return {
      age: Number(el.value), year: Number(document.querySelector(`.st-tl-year[data-idx="${i}"]`).value),
      event: document.querySelector(`.st-tl-event[data-idx="${i}"]`).value,
      product: document.querySelector(`.st-tl-product[data-idx="${i}"]`).value,
      cumValue: Number(document.querySelector(`.st-tl-value[data-idx="${i}"]`).value),
    };
  });
  return { ...state, client, productA: readProduct(state.productA, 'stA'), productB: readProduct(state.productB, 'stB'), timeline, preparedAt: state.preparedAt };
}

// === PPTX 解析（瀏覽器端 JSZip） ===
async function parsePptxNumbers(file) {
  if (!window.JSZip) throw Error('JSZip 未載入');
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  let text = '';
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort();
  for (const f of slides) {
    const xml = await zip.files[f].async('text');
    text += (xml.match(/<a:t>([^<]*)<\/a:t>/g) || []).map(m => m.replace(/<\/?a:t>/g, '')).join(' ') + '\n';
  }
  return extractNumbers(text);
}

function extractNumbers(text) {
  const result = {};
  const ageM = text.match(/(?:年齡|age|歲)[^\d]{0,5}(\d{1,2})\s*(?:歲)?/i);
  if (ageM) { const a = parseInt(ageM[1]); if (a >= 18 && a <= 80) result.age = a; }
  const sumM = text.match(/(?:保額|sum\s*insured|face\s*amount)[^\d]{0,10}([\d,]+)/i);
  if (sumM) { const n = parseFloat(sumM[1].replace(/,/g, '')); if (n > 10000) result.sumInsured = n; }
  const premM = text.match(/(?:年繳|annual\s*premium|保費)[^\d]{0,10}([\d,]+)/i);
  if (premM) { const n = parseFloat(premM[1].replace(/,/g, '')); if (n > 1000) result.annualPremium = n; }
  const termM = text.match(/(?:供款期|payment\s*term)[^\d]{0,5}(\d{1,2})\s*(?:年)?/i);
  if (termM) { const n = parseInt(termM[1]); if (n >= 1 && n <= 30) result.paymentTerm = n; }
  return result;
}

// === PPT 生成（7 頁模版） ===
function createSalesDeck(Pptx, d) {
  const p = new Pptx();
  p.layout = 'LAYOUT_WIDE';
  p.author = 'AI 工作台'; p.title = d.title; p.subject = '傳承銷售工具 · 按已交付模版';
  const C = { navy: '1A2B4A', gold: 'C9A961', goldL: 'E8D9A8', white: 'FFFFFF', ivory: 'F7F3EC', charcoal: '2D3142', muted: '6B7280', green: '2D6A4F', lineG: 'D1D5DB' };
  const F = 'Microsoft JhengHei';

  // Page 1: 封面
  {
    const s = p.addSlide(); s.background = { color: C.navy };
    s.addShape('rect', { x: 0.8, y: 2.0, w: 1.5, h: 0.06, fill: { color: C.gold } });
    s.addText(d.title, { x: 0.8, y: 2.2, w: 11.5, h: 1.2, fontFace: F, fontSize: 40, bold: true, color: C.white, align: 'left', valign: 'middle' });
    s.addText(`${d.productA.nameCn} × ${d.productB.nameCn}`, { x: 0.8, y: 3.5, w: 11.5, h: 0.6, fontFace: F, fontSize: 20, color: C.goldL, align: 'left' });
    s.addText([{ text: '客戶：', options: { color: C.muted, fontSize: 14 } }, { text: `${d.client.name}　${d.client.gender === 'M' ? '男' : '女'}　${d.client.age} 歲`, options: { color: C.white, fontSize: 14, bold: true } }], { x: 0.8, y: 4.4, w: 11.5, h: 0.4, fontFace: F });
    s.addText([{ text: '顧問：', options: { color: C.muted, fontSize: 14 } }, { text: d.advisor, options: { color: C.white, fontSize: 14, bold: true } }], { x: 0.8, y: 4.9, w: 11.5, h: 0.4, fontFace: F });
    s.addText([{ text: '日期：', options: { color: C.muted, fontSize: 14 } }, { text: d.preparedAt, options: { color: C.white, fontSize: 14, bold: true } }], { x: 0.8, y: 5.4, w: 11.5, h: 0.4, fontFace: F });
    s.addText('立橋人壽 · 傳承規劃', { x: 0.8, y: 6.7, w: 11.5, h: 0.4, fontFace: F, fontSize: 12, color: C.gold, align: 'left' });
  }
  // Page 2 & 4: 產品介紹頁
  const introPage = (prod) => {
    const s = p.addSlide(); s.background = { color: C.ivory };
    s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 1.4, fill: { color: C.navy } });
    s.addShape('rect', { x: 0, y: 1.34, w: 13.333, h: 0.06, fill: { color: C.gold } });
    s.addText(prod.code, { x: 0.6, y: 0.3, w: 2, h: 0.8, fontFace: F, fontSize: 36, bold: true, color: C.gold, align: 'left', valign: 'middle' });
    s.addText(prod.nameCn, { x: 2.6, y: 0.3, w: 9, h: 0.5, fontFace: F, fontSize: 22, bold: true, color: C.white, align: 'left', valign: 'middle' });
    s.addText(prod.nameEn, { x: 2.6, y: 0.78, w: 9, h: 0.4, fontFace: F, fontSize: 13, color: C.goldL, align: 'left' });
    s.addText(prod.insurer, { x: 10.8, y: 0.5, w: 2.2, h: 0.5, fontFace: F, fontSize: 11, bold: true, color: C.navy, align: 'center', valign: 'middle', fill: { color: C.gold }, rectRadius: 0.05 });
    s.addText('產品亮點', { x: 0.6, y: 1.8, w: 6, h: 0.4, fontFace: F, fontSize: 16, bold: true, color: C.navy });
    prod.highlights.forEach((h, i) => {
      const y = 2.4 + i * 0.85;
      s.addShape('ellipse', { x: 0.6, y: y + 0.08, w: 0.18, h: 0.18, fill: { color: C.gold } });
      s.addText(h, { x: 0.95, y, w: 6.5, h: 0.7, fontFace: F, fontSize: 14, color: C.charcoal, align: 'left', valign: 'top' });
    });
    const cx = 7.6, cw = 5.1;
    s.addText('關鍵數字', { x: cx, y: 1.8, w: cw, h: 0.4, fontFace: F, fontSize: 16, bold: true, color: C.navy });
    const stats = [
      ['保額', moneyFull(prod.extracted.sumInsured)], ['年繳保費', moneyFull(prod.extracted.annualPremium)],
      ['供款期', `${prod.extracted.paymentTerm} 年`], ['預期回本期', `${prod.extracted.breakEvenYear} 年`], ['20 年現金價值', moneyFull(prod.extracted.valueAt20)],
    ];
    stats.forEach((st, i) => {
      const y = 2.4 + i * 0.7;
      s.addShape('roundRect', { x: cx, y, w: cw, h: 0.6, fill: { color: C.white }, line: { color: C.lineG, width: 0.5 }, rectRadius: 0.05 });
      s.addText(st[0], { x: cx + 0.2, y, w: 2.2, h: 0.6, fontFace: F, fontSize: 12, color: C.muted, align: 'left', valign: 'middle' });
      s.addText(st[1], { x: cx + 2.4, y, w: cw - 2.6, h: 0.6, fontFace: F, fontSize: 14, bold: true, color: C.navy, align: 'right', valign: 'middle' });
    });
    s.addText(String(p.slides.length), { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontFace: F, fontSize: 10, color: C.muted, align: 'right' });
  };
  // Page 3 & 5: 產品案例頁
  const casePage = (prod) => {
    const s = p.addSlide(); s.background = { color: C.ivory };
    s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 1.2, fill: { color: C.navy } });
    s.addShape('rect', { x: 0, y: 1.14, w: 13.333, h: 0.06, fill: { color: C.gold } });
    s.addText(`${prod.code} · 個案分析`, { x: 0.6, y: 0.25, w: 10, h: 0.7, fontFace: F, fontSize: 24, bold: true, color: C.white, align: 'left', valign: 'middle' });
    // 受保人卡
    s.addShape('roundRect', { x: 0.6, y: 1.6, w: 5.8, h: 1.5, fill: { color: C.white }, line: { color: C.lineG, width: 0.5 }, rectRadius: 0.08 });
    s.addText('受保人資料', { x: 0.8, y: 1.75, w: 5.4, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: C.gold });
    const cl = d.client;
    [['姓名', cl.name], ['年齡 / 性別', `${cl.age} 歲 / ${cl.gender === 'M' ? '男' : '女'}`], ['職業', cl.occupation]].forEach((row, i) => {
      const y = 2.2 + i * 0.3;
      s.addText(row[0], { x: 0.8, y, w: 1.8, h: 0.3, fontFace: F, fontSize: 11, color: C.muted, valign: 'middle' });
      s.addText(row[1], { x: 2.6, y, w: 3.6, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: C.charcoal, valign: 'middle' });
    });
    // 財務結構卡
    s.addShape('roundRect', { x: 6.7, y: 1.6, w: 6, h: 1.5, fill: { color: C.navy }, rectRadius: 0.08 });
    s.addText('財務結構', { x: 6.9, y: 1.75, w: 5.6, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: C.gold });
    [['保額', moneyFull(prod.extracted.sumInsured)], ['年繳保費', moneyFull(prod.extracted.annualPremium)], ['總供款', moneyFull(prod.extracted.annualPremium * prod.extracted.paymentTerm)]].forEach((row, i) => {
      const y = 2.2 + i * 0.3;
      s.addText(row[0], { x: 6.9, y, w: 2, h: 0.3, fontFace: F, fontSize: 11, color: C.goldL, valign: 'middle' });
      s.addText(row[1], { x: 8.9, y, w: 3.6, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: C.white, align: 'right', valign: 'middle' });
    });
    // 現金價值圖表
    s.addText('現金價值成長預測', { x: 0.6, y: 3.4, w: 10, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: C.navy });
    const chartData = [
      { name: '現金價值', labels: ['第 1 年', `第 ${prod.extracted.breakEvenYear} 年`, '第 20 年', `第 ${100 - cl.age} 年`], values: [Math.round(prod.extracted.annualPremium * prod.extracted.paymentTerm * 0.4), Math.round(prod.extracted.sumInsured * 0.7), prod.extracted.valueAt20, prod.extracted.valueAt100] },
    ];
    s.addChart('bar', chartData, { x: 0.6, y: 3.9, w: 8, h: 3, chartColors: [C.gold], showValue: true, valueFontSize: 10, valueColor: C.charcoal, catAxisLabelColor: C.charcoal, catAxisLabelFontSize: 10, valAxisLabelColor: C.muted, valAxisLabelFontSize: 9, showLegend: false, barGapWidthPct: 60 });
    // 右側重點
    s.addShape('roundRect', { x: 8.9, y: 3.9, w: 3.8, h: 3, fill: { color: C.white }, line: { color: C.lineG, width: 0.5 }, rectRadius: 0.08 });
    s.addText('規劃重點', { x: 9.1, y: 4.05, w: 3.4, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: C.gold });
    const pts = [`${prod.extracted.paymentTerm} 年供款後免供免費`, `第 ${prod.extracted.breakEvenYear} 年現金價值回本`, `20 年增值 ${money(prod.extracted.valueAt20 - prod.extracted.annualPremium * prod.extracted.paymentTerm)}`, '終身保障至 100 歲'];
    pts.forEach((pt, i) => {
      const y = 4.55 + i * 0.55;
      s.addShape('ellipse', { x: 9.1, y: y + 0.07, w: 0.12, h: 0.12, fill: { color: C.green } });
      s.addText(pt, { x: 9.35, y, w: 3.2, h: 0.5, fontFace: F, fontSize: 10, color: C.charcoal, valign: 'top' });
    });
    s.addText(String(p.slides.length), { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontFace: F, fontSize: 10, color: C.muted, align: 'right' });
  };

  introPage(d.productA); casePage(d.productA);
  introPage(d.productB); casePage(d.productB);

  // Page 6: 組合時間軸
  {
    const s = p.addSlide(); s.background = { color: C.navy };
    s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 1.4, fill: { color: C.gold } });
    s.addText('組合傳承時間軸', { x: 0.6, y: 0.35, w: 12, h: 0.7, fontFace: F, fontSize: 28, bold: true, color: C.navy, align: 'left', valign: 'middle' });
    const lineY = 4.0;
    s.addShape('line', { x: 0.8, y: lineY, w: 11.7, h: 0, line: { color: C.gold, width: 2.5 } });
    const tl = d.timeline;
    const ages = tl.map(n => n.age);
    const minAge = Math.min(...ages), maxAge = Math.max(...ages), ageRange = maxAge - minAge || 1;
    const startX = 0.8, endX = 12.5, span = endX - startX;
    tl.forEach((node, idx) => {
      const ratio = (node.age - minAge) / ageRange;
      const x = startX + ratio * span;
      const isCombo = node.product === '組合';
      const color = isCombo ? C.gold : node.product === 'WE3' ? '5B8DEF' : '7BC47F';
      s.addShape('ellipse', { x: x - 0.12, y: lineY - 0.12, w: 0.24, h: 0.24, fill: { color }, line: { color: C.white, width: 1.5 } });
      const isTop = idx % 2 === 0;
      const labelY = isTop ? lineY - 1.6 : lineY + 0.3;
      s.addShape('line', { x, y: isTop ? lineY - 0.12 : lineY + 0.12, w: 0, h: isTop ? -1.4 : 1.4, line: { color, width: 1 } });
      s.addText(`${node.age} 歲`, { x: x - 0.7, y: labelY, w: 1.4, h: 0.35, fontFace: F, fontSize: 12, bold: true, color: C.gold, align: 'center' });
      s.addText(`${node.year}`, { x: x - 0.7, y: labelY + 0.32, w: 1.4, h: 0.25, fontFace: F, fontSize: 9, color: C.goldL, align: 'center' });
      s.addText(node.event, { x: x - 0.85, y: labelY + 0.58, w: 1.7, h: 0.5, fontFace: F, fontSize: 9, color: C.white, align: 'center', valign: 'top' });
      s.addText(money(node.cumValue), { x: x - 0.7, y: labelY + 1.05, w: 1.4, h: 0.25, fontFace: F, fontSize: 10, bold: true, color, align: 'center' });
    });
    const legY = 6.5;
    [['WE3', '5B8DEF'], ['GF', '7BC47F'], ['組合', C.gold]].forEach((lg, i) => {
      const x = 4 + i * 2;
      s.addShape('ellipse', { x, y: legY + 0.05, w: 0.15, h: 0.15, fill: { color: lg[1] } });
      s.addText(lg[0], { x: x + 0.25, y: legY, w: 1, h: 0.3, fontFace: F, fontSize: 11, color: C.white, valign: 'middle' });
    });
    s.addText(String(p.slides.length), { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontFace: F, fontSize: 10, color: C.goldL, align: 'right' });
  }
  // Page 7: 結語
  {
    const s = p.addSlide(); s.background = { color: C.navy };
    s.addShape('rect', { x: 5.9, y: 2.0, w: 1.5, h: 0.06, fill: { color: C.gold } });
    s.addText('財富傳承', { x: 0.8, y: 2.3, w: 11.7, h: 0.9, fontFace: F, fontSize: 44, bold: true, color: C.white, align: 'center' });
    s.addText('始於今日規劃', { x: 0.8, y: 3.3, w: 11.7, h: 0.7, fontFace: F, fontSize: 32, color: C.gold, align: 'center' });
    const totalPrem = d.productA.extracted.annualPremium * d.productA.extracted.paymentTerm + d.productB.extracted.annualPremium * d.productB.extracted.paymentTerm;
    const finalVal = d.timeline[d.timeline.length - 1]?.cumValue || 0;
    const mult = finalVal / totalPrem;
    s.addText([{ text: '組合總供款：', options: { color: C.muted, fontSize: 14 } }, { text: moneyFull(totalPrem), options: { color: C.white, fontSize: 14, bold: true } }], { x: 1.5, y: 4.5, w: 10.3, h: 0.4, fontFace: F, align: 'center' });
    s.addText([{ text: '預期 100 歲傳承價值：', options: { color: C.muted, fontSize: 14 } }, { text: moneyFull(finalVal), options: { color: C.gold, fontSize: 14, bold: true } }], { x: 1.5, y: 4.95, w: 10.3, h: 0.4, fontFace: F, align: 'center' });
    s.addText([{ text: '財富增值倍數：', options: { color: C.muted, fontSize: 14 } }, { text: `${mult.toFixed(1)} 倍`, options: { color: C.green, fontSize: 14, bold: true } }], { x: 1.5, y: 5.4, w: 10.3, h: 0.4, fontFace: F, align: 'center' });
    s.addText(`${d.advisor} · 立橋人壽`, { x: 0.8, y: 6.7, w: 11.7, h: 0.4, fontFace: F, fontSize: 12, color: C.gold, align: 'center' });
  }
  return p;
}

// === 事件綁定 ===
export function bind() {
  if (!document.querySelector('#stGenerate')) return;

  // 上傳處理
  const setupUpload = async (inputId, statusId, which) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      const status = document.getElementById(statusId);
      status.textContent = `正在解析 ${file.name}...`;
      try {
        const nums = await parsePptxNumbers(file);
        const prod = state[which];
        state[which] = { ...prod, fileName: file.name, extracted: { ...prod.extracted, ...nums } };
        if (which === 'productA' && nums.age) state.client.age = nums.age;
        status.textContent = `✅ 已匯入 ${file.name}：${Object.keys(nums).join('、')}`;
        render(); // 重新渲染表單
        bind();
      } catch (err) {
        status.textContent = `解析失敗：${err.message}，請手動填寫`;
      }
    };
  };
  setupUpload('stFileA', 'stStatusA', 'productA');
  setupUpload('stFileB', 'stStatusB', 'productB');

  // 表單即時同步到 state
  document.querySelectorAll('#stForm input, #stForm select, .st-tl-age, .st-tl-year, .st-tl-event, .st-tl-product, .st-tl-value').forEach(el => {
    el.addEventListener('input', () => { state = readForm(); });
  });

  // 生成 PPT
  const genBtn = document.getElementById('stGenerate');
  genBtn.onclick = async () => {
    const status = document.getElementById('stGenStatus');
    genBtn.disabled = true;
    status.textContent = '正在生成 7 頁模版 PPT...';
    try {
      state = readForm();
      const deck = createSalesDeck(window.PptxGenJS, state);
      const filename = state.title.replace(/\s+/g, '_') + '_' + state.preparedAt + '.pptx';
      await deck.writeFile({ fileName: filename });
      status.textContent = `✅ 已下載 ${filename}（7 頁，可在 PowerPoint / Keynote 開啟編輯）`;
    } catch (err) {
      status.textContent = '生成失敗：' + err.message;
    } finally {
      genBtn.disabled = false;
    }
  };

  // 重置
  document.getElementById('stReset')?.addEventListener('click', () => {
    state = JSON.parse(JSON.stringify(DEFAULT_CASE));
    render();
    bind();
  });
}
