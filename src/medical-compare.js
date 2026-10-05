/* ==========================================================================
   醫療產品對比中心 — 互動邏輯
   六個視圖：產品速覽 / 內部產品定位 / 市場特性比較 / 保費比較 /
             國籍及居住地資格 / 智能推薦（客戶畫像）
   ========================================================================== */
/* ==========================================================================
   AIA 產品對比中心 — 互動邏輯
   ========================================================================== */
import {medicalDb as DB} from './medical-compare-data.js';

/* 由平台 main.js 於 render() 後呼叫 bind()；掛載點為 .mc-root */
let root = null;
  const $ = (s, r) => (r || root).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || root).querySelectorAll(s));
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const fmt = n => (n == null ? '—' : n.toLocaleString('en-US'));
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const state = {
    tab: 'overview',
    compare: ['AVSW', 'SWP'],
    marketCols: { aia: true, prx: true, manx: true, axx: true },
    onlyWin: false,
    kw: '',
    ded: '0',
    type: 'basic',
    age: 40,
    premCols: null,      // 初始化時填入全部
    eligPlan: 'avsw',
    qRow: 0,
    qRes: 0
  };

  /* ---------------- Tab 切換 ---------------- */
  function initTabs() {
    $$('.mc-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mc-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $$('.mc-view').forEach(v => v.classList.remove('active'));
        $('#view-' + btn.dataset.view).classList.add('active');
        state.tab = btn.dataset.view;
        if (root) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------------- ① 產品速覽 ---------------- */
  function renderOverview() {
    const grid = $('#heroGrid');
    grid.innerHTML = '';
    DB.hero.forEach(p => {
      const card = el('div', 'hero-card');
      const isSel = state.compare.indexOf(p.id) > -1;
      card.innerHTML = `
        <div class="hc-top">
          <h3 class="hc-name">${esc(p.name)}</h3>
          <div class="hc-en">${esc(p.en)}</div>
          <div class="chips">
            <span class="chip">${esc(p.tag)}</span>
            <span class="chip gray">目標客戶：${esc(p.target)}</span>
          </div>
          <p class="hc-summary">${esc(p.summary)}</p>
        </div>
        <div class="hc-body">
          <div class="hl-title">關鍵資料</div>
          <dl class="kv">
            ${p.keyFacts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
          </dl>
          <div class="hl-title">產品特點</div>
          <ul class="hl-list">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
          <div class="hl-title">競爭優勢</div>
          <div class="adv-grid">
            ${p.advantages.map(a => `<div class="adv"><b>${esc(a.t)}</b><span>${esc(a.d)}</span></div>`).join('')}
          </div>
          <div style="margin-top:14px;display:flex;gap:8px;">
            <button class="btn ${isSel ? '' : 'primary'}" data-cmp="${esc(p.id)}">
              ${isSel ? '已加入對比 ✓' : '加入產品對比'}
            </button>
          </div>
        </div>`;
      grid.appendChild(card);
    });

    $$('#heroGrid [data-cmp]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.cmp;
        const i = state.compare.indexOf(id);
        if (i > -1) state.compare.splice(i, 1); else state.compare.push(id);
        renderOverview();
        renderTray();
      });
    });

    // 產品特點詳解
    const fg = $('#featGrid');
    fg.innerHTML = '';
    DB.featureDetail.forEach(f => {
      const d = el('div', 'feat');
      d.innerHTML = `<h4>${esc(f.cat)}${f.isNew ? '<span class="new">全新</span>' : ''}</h4>
        <ul>${f.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`;
      fg.appendChild(d);
    });
  }

  function renderTray() {
    const tray = $('#tray');
    const names = state.compare.map(id => {
      const p = allInternal().find(x => x.code === id);
      return p ? p.code : id;
    });
    if (!names.length) { tray.classList.remove('show'); return; }
    tray.classList.add('show');
    $('#trayItems').innerHTML = names.map(n =>
      `<span class="t-item">${esc(n)}<button data-rm="${esc(n)}" title="移除">×</button></span>`).join('');
    $$('#trayItems [data-rm]').forEach(b => {
      b.addEventListener('click', () => {
        const i = state.compare.indexOf(b.dataset.rm);
        if (i > -1) state.compare.splice(i, 1);
        renderOverview(); renderLineup(); renderTray();
      });
    });
  }

  function allInternal() {
    return DB.lineup.groups.reduce((a, g) => a.concat(g.products), []);
  }

  /* ---------------- ② 內部產品定位 ---------------- */
  const LINEUP_FIELDS = [
    ['目標客戶', 'target'], ['計劃類別', 'type'], ['投保年齡', 'age'], ['保障年期', 'term'],
    ['保費釐定', 'premium'], ['賠償形式', 'claim'], ['終身限額 (港元)', 'lifetime'],
    ['每年限額 (港元)', 'annual'], ['地域保障範圍', 'region'], ['病房級別', 'room'],
    ['墊底費 / 自付費', 'deductible'], ['附加保障', 'rider'],
    ['個人療程管理與復康管理', 'care'], ['醫療網絡服務', 'network'],
    ['保費參考（40 歲男性非吸煙）', 'price']
  ];

  function renderLineup() {
    const host = $('#lineupHost');
    host.innerHTML = '';
    const sel = state.compare.slice();
    const showSelectedOnly = $('#lineupOnlySel') && $('#lineupOnlySel').checked;

    DB.lineup.groups.forEach(g => {
      const products = showSelectedOnly && sel.length ? g.products.filter(p => sel.indexOf(p.code) > -1) : g.products;
      if (!products.length) return;

      const card = el('div', 'card');
      const head = el('div', 'card-head');
      head.innerHTML = `<h3>${esc(g.name)}產品線</h3><span class="page-tag">資料冊 ${esc(g.page)}</span>`;
      card.appendChild(head);

      const scroll = el('div', 'table-scroll');
      const t = el('table', 'cmp');
      let html = '<thead><tr><th>比較項目</th>' +
        products.map(p => `<th class="prod-head ${p.hero ? 'col-aia' : ''}">
            <div class="ph-co">${esc(p.name)}</div>
            <div class="ph-pd">${esc(p.code)}</div>
            <div class="ph-meta">${esc(p.target)}</div>
          </th>`).join('') + '</tr></thead><tbody>';

      LINEUP_FIELDS.forEach(([label, key]) => {
        html += `<tr><th>${esc(label)}</th>` +
          products.map(p => {
            const isHero = p.hero && (key === 'lifetime' || key === 'annual' || key === 'deductible');
            return `<td class="${isHero ? 'win' : ''}">${esc(p[key])}</td>`;
          }).join('') + '</tr>';
      });
      html += '</tbody>';
      t.innerHTML = html;
      scroll.appendChild(t);
      card.appendChild(scroll);
      host.appendChild(card);
    });
  }

  function initLineupControls() {
    // 產品選擇器
    const box = $('#lineupPicker');
    box.innerHTML = allInternal().map(p =>
      `<label class="switch" style="font-size:12px;">
         <input type="checkbox" data-code="${esc(p.code)}" ${state.compare.indexOf(p.code) > -1 ? 'checked' : ''}>
         ${esc(p.code)}
       </label>`).join('');
    $$('#lineupPicker input').forEach(cb => {
      cb.addEventListener('change', () => {
        const i = state.compare.indexOf(cb.dataset.code);
        if (cb.checked && i === -1) state.compare.push(cb.dataset.code);
        if (!cb.checked && i > -1) state.compare.splice(i, 1);
        renderLineup(); renderTray(); renderOverview();
      });
    });
    $('#lineupOnlySel').addEventListener('change', renderLineup);
  }

  /* ---------------- ③ 市場特性比較 ---------------- */
  function renderMarket() {
    const host = $('#marketHost');
    host.innerHTML = '';
    const cols = DB.market.columns.filter(c => state.marketCols[c.id]);
    const kw = state.kw.trim().toLowerCase();
    let total = 0, winCount = 0;

    DB.market.groups.forEach(g => {
      const items = g.items.filter(it => {
        if (state.onlyWin && !(it.win && it.win[0])) return false;
        if (kw && (it.item + it.v.join(' ')).toLowerCase().indexOf(kw) === -1) return false;
        return true;
      });
      if (!items.length) return;

      const card = el('div', 'card');
      const head = el('div', 'card-head');
      head.innerHTML = `<h3>${esc(g.name)}</h3><span class="page-tag">資料冊 ${esc(g.page)} · ${items.length} 項</span>`;
      card.appendChild(head);

      const scroll = el('div', 'table-scroll');
      const t = el('table', 'cmp');
      let html = '<thead><tr><th>保障項目</th>' +
        cols.map(c => `<th class="prod-head ${c.isAIA ? 'col-aia' : ''}">
            <div class="ph-co ${c.isAIA ? '' : ''}">${esc(c.company)}</div>
            <div class="ph-pd">${esc(c.product)}</div>
          </th>`).join('') + '</tr></thead><tbody>';

      items.forEach(it => {
        total++;
        if (it.win && it.win[0]) winCount++;
        html += `<tr><th>${esc(it.item)}</th>` +
          cols.map((c, ci) => {
            const orig = DB.market.columns.findIndex(x => x.id === c.id);
            const isWin = it.win && it.win[orig];
            const val = it.v[orig] || '—';
            const cls = isWin ? 'win' : (c.isAIA ? 'col-aia' : '');
            return `<td class="${cls}">${esc(val)}</td>`;
          }).join('') + '</tr>';
      });
      html += '</tbody>';
      t.innerHTML = html;
      scroll.appendChild(t);
      card.appendChild(scroll);
      host.appendChild(card);
    });

    if (!host.children.length) {
      host.innerHTML = '<div class="card"><div class="empty">沒有符合篩選條件的項目。</div></div>';
    }
    $('#marketStat').textContent = `共 ${total} 個比較項目，其中 AIA 較優勝 ${winCount} 項`;
  }

  function initMarketControls() {
    const box = $('#marketColPicker');
    box.innerHTML = DB.market.columns.map(c =>
      `<label class="switch"><input type="checkbox" data-cid="${esc(c.id)}" checked>${esc(c.company)}</label>`).join('');
    $$('#marketColPicker input').forEach(cb => {
      cb.addEventListener('change', () => { state.marketCols[cb.dataset.cid] = cb.checked; renderMarket(); });
    });
    $('#onlyWin').addEventListener('change', e => { state.onlyWin = e.target.checked; renderMarket(); });
    $('#marketSearch').addEventListener('input', e => { state.kw = e.target.value; renderMarket(); });
  }

  /* ---------------- ④ 保費比較 ---------------- */
  function currentSheet() {
    return DB.premium.sheets.find(s => s.deductible === state.ded);
  }
  function premiumCols() {
    const s = currentSheet();
    return s.columns.filter(c => {
      if (!state.premCols[c.id]) return false;
      if (state.type === 'basic') return c.type === '基本計劃';
      if (state.type === 'rider') return c.type === '附加契約';
      return true;
    });
  }
  function baseCol() {
    const s = currentSheet();
    return s.columns.find(c => c.isAIA && c.type === (state.type === 'rider' ? '附加契約' : '基本計劃'));
  }

  function renderPremium() {
    const s = currentSheet();
    const cols = premiumCols();
    const base = baseCol();
    $('#premiumTitle').textContent = s.title + (state.type === 'basic' ? '（基本計劃）' : state.type === 'rider' ? '（附加契約）' : '');

    // --- 柱狀圖（當前年齡） ---
    const ai = DB.premium.ages.indexOf(state.age);
    const bars = $('#premBars');
    bars.innerHTML = '';
    const max = Math.max.apply(null, cols.map(c => c.v[ai]));
    cols.forEach(c => {
      const v = c.v[ai];
      const diff = base ? Math.round((v - base.v[ai]) / base.v[ai] * 1000) / 10 : null;
      const row = el('div', 'bar-row');
      row.innerHTML = `
        <div class="bl" title="${esc(c.company)} — ${esc(c.product)}">${esc(c.company)}<br><span style="color:#7b8794;font-size:11.5px;">${esc(c.product)} · ${esc(c.type)}</span></div>
        <div class="bar-track"><div class="bar-fill ${c.isAIA ? 'aia' : ''}" style="width:${(v / max * 100).toFixed(1)}%"></div></div>
        <div class="bar-val">${fmt(v)}<br><small>${base && !c.isAIA ? (diff > 0 ? 'AIA 低 ' + diff + '%' : diff < 0 ? 'AIA 高 ' + Math.abs(diff) + '%' : '相同') : (c.isAIA ? '基準' : '')}</small></div>`;
      bars.appendChild(row);
    });

    // --- 表格 ---
    const t = $('#premTable');
    let html = '<thead><tr><th>實際年齡</th>' +
      cols.map(c => `<th class="prod-head ${c.isAIA ? 'col-aia' : ''}">
          <div class="ph-co">${esc(c.company)}</div>
          <div class="ph-pd">${esc(c.product)}</div>
          <div class="ph-meta">${esc(c.room)} · ${esc(c.type)} · 自付費 ${fmt(c.ded)}</div>
        </th>`).join('') + '</tr></thead><tbody>';

    DB.premium.ages.forEach((age, i) => {
      const focus = age === state.age ? ' class="age-focus"' : '';
      html += `<tr${focus}><th class="age-cell">${age} 歲</th>` +
        cols.map(c => {
          const v = c.v[i];
          let delta = '';
          if (base && !c.isAIA) {
            const d = (v - base.v[i]) / base.v[i] * 100;
            const cls = d > 0 ? 'up' : 'down';
            delta = `<div class="delta ${cls}">${d > 0 ? 'AIA 低 ' : 'AIA 高 '}${Math.abs(d).toFixed(0)}%</div>`;
          }
          const cls = c.isAIA ? 'col-aia' : '';
          return `<td class="num ${cls}">${fmt(v)}${delta}</td>`;
        }).join('') + '</tr>';
    });
    html += '</tbody>';
    t.innerHTML = html;

    // 年齡選擇器同步
    const sel = $('#premAge');
    if (!sel.options.length) {
      sel.innerHTML = DB.premium.ages.map(a => `<option value="${a}">${a} 歲</option>`).join('');
      sel.addEventListener('change', () => { state.age = parseInt(sel.value, 10); renderPremium(); });
    }
    sel.value = String(state.age);

    $('#premNote').textContent = DB.premium.note;
  }

  function initPremiumControls() {
    // 自付費檔
    const seg = $('#premDed');
    seg.innerHTML = DB.premium.sheets.map(s =>
      `<button data-ded="${esc(s.deductible)}">${esc(s.deductible === '0' ? '0' : fmt(parseInt(s.deductible, 10)))}</button>`).join('');
    $$('#premDed button').forEach(b => {
      b.addEventListener('click', () => {
        state.ded = b.dataset.ded;
        $$('#premDed button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderPremium();
      });
    });
    seg.querySelector('[data-ded="0"]').classList.add('active');

    // 類型
    $$('#premType button').forEach(b => {
      b.addEventListener('click', () => {
        state.type = b.dataset.type;
        $$('#premType button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderPremium();
      });
    });

    // 競品列
    const box = $('#premColPicker');
    const s = currentSheet();
    const uniq = [];
    s.columns.forEach(c => {
      if (uniq.indexOf(c.company) === -1) uniq.push(c.company);
    });
    box.innerHTML = uniq.map(co =>
      `<label class="switch"><input type="checkbox" data-co="${esc(co)}" checked>${esc(co)}</label>`).join('');
    $$('#premColPicker input').forEach(cb => {
      cb.addEventListener('change', () => {
        currentSheet().columns.forEach(c => {
          if (c.company === cb.dataset.co) {
            state.premCols[c.id] = cb.checked;
          }
        });
        renderPremium();
      });
    });

    $('#btnCsv').addEventListener('click', () => exportTable($('#premTable'), '保費比較_' + state.ded + '.csv'));
    $('#btnPrint').addEventListener('click', () => window.print());
  }

  /* ---------------- ⑤ 投保資格 ---------------- */
  function renderEligibility() {
    const host = $('#eligHost');
    host.innerHTML = '';
    const planId = state.eligPlan;
    const rows = DB.eligibility.rows.filter(r => r.plan === planId);

    const card = el('div', 'card');
    const plan = DB.eligibility.plans.find(p => p.id === planId);
    card.innerHTML = `<div class="card-head"><h3>${esc(plan.name)}</h3>
        <span class="page-tag">資料冊 P.86-95 · ${esc(plan.desc)}</span></div>`;

    const scroll = el('div', 'table-scroll');
    const t = el('table', 'cmp');
    let html = '<thead><tr><th>受保人情況</th>' +
      DB.eligibility.residences.map(r => `<th class="prod-head"><div class="ph-co">${esc(r)}</div><div class="ph-pd">居住地</div></th>`).join('') +
      '</tr></thead><tbody>';
    rows.forEach(r => {
      html += `<tr><th>${esc(r.situation)}</th>` +
        r.v.map(v => {
          const cls = v.indexOf('標準保費') === 0 ? 'win' : (v === '不接受' ? 'lose' : 'muted');
          return `<td class="${cls}">${esc(v)}</td>`;
        }).join('') + '</tr>';
    });
    html += '</tbody>';
    t.innerHTML = html;
    scroll.appendChild(t);
    card.appendChild(scroll);
    host.appendChild(card);

    // 查詢器
    const qs = $('#qSituation');
    qs.innerHTML = rows.map((r, i) => `<option value="${i}">${esc(r.situation)}</option>`).join('');
    qs.onchange = () => { state.qRow = parseInt(qs.value, 10); renderQuery(); };
    const qr = $('#qResidence');
    if (!qr.options.length) {
      qr.innerHTML = DB.eligibility.residences.map((r, i) => `<option value="${i}">${esc(r)}</option>`).join('');
      qr.onchange = () => { state.qRes = parseInt(qr.value, 10); renderQuery(); };
    }
    state.qRow = Math.min(state.qRow, rows.length - 1);
    qs.value = String(state.qRow);
    renderQuery();
  }

  function renderQuery() {
    const rows = DB.eligibility.rows.filter(r => r.plan === state.eligPlan);
    const r = rows[state.qRow] || rows[0];
    const v = r.v[state.qRes];
    const box = $('#qResult');
    const ok = v.indexOf('標準保費') === 0;
    const na = v === '不適用';
    box.className = 'result ' + (ok ? 'ok' : 'no');
    box.innerHTML = `
      <div class="r-title">${esc(DB.eligibility.residences[state.qRes])}　
        <span class="status ${ok ? 'ok' : na ? 'na' : 'no'}">${esc(v)}</span></div>
      <div class="r-sub">${esc(r.situation)}</div>
      <div class="r-sub" style="margin-top:6px;color:#7b8794">
        ${ok ? (r.remark ? '備註：' + esc(r.remark) : '可按標準保費評級接受申請；最終以核保結果為準。')
             : na ? '此居住地不適用於本計劃。'
             : '此居住地／國籍組合不接受投保。'}
      </div>`;
  }

  function initEligControls() {
    const seg = $('#eligPlanSeg');
    seg.innerHTML = DB.eligibility.plans.map(p =>
      `<button data-plan="${esc(p.id)}">${esc(p.short)}</button>`).join('');
    $$('#eligPlanSeg button').forEach((b, i) => {
      b.addEventListener('click', () => {
        state.eligPlan = b.dataset.plan;
        state.qRow = 0;
        $$('#eligPlanSeg button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderEligibility();
      });
      if (i === 0) b.classList.add('active');
    });
    $('#eligNote').textContent = DB.eligibility.note;
  }

  /* ---------------- 匯出 CSV ---------------- */
  function exportTable(table, filename) {
    const rows = [];
    $$('tr', table).forEach(tr => {
      const cells = $$('th,td', tr).map(td => '"' + td.innerText.replace(/\n/g, ' ').replace(/"/g, '""') + '"');
      rows.push(cells.join(','));
    });
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------------- ⑥ 智能推薦（客戶畫像） ---------------- */
  const ADV = {
    age: 35, identity: 'hk', residence: 0, budget: 8000,
    ded: 'auto', priority: 'balance', needs: []
  };
  const WEIGHTS = {
    balance: { budget: 30, needs: 35, limit: 15, ded: 10, age: 10 },
    budget: { budget: 45, needs: 20, limit: 8, ded: 12, age: 15 },
    cover: { budget: 18, needs: 45, limit: 20, ded: 7, age: 10 }
  };
  const DED_ORDER = ['0', '8800', '18000', '30000', '55000'];

  /* 年齡係數（線性插值，40 歲 = 1.000） */
  function ageFactor(age) {
    const c = DB.advisor.ageCurve;
    if (age <= c[0].age) return c[0].f;
    if (age >= c[c.length - 1].age) return c[c.length - 1].f;
    for (let i = 0; i < c.length - 1; i++) {
      if (age >= c[i].age && age <= c[i + 1].age) {
        const t = (age - c[i].age) / (c[i + 1].age - c[i].age);
        return c[i].f + t * (c[i + 1].f - c[i].f);
      }
    }
    return 1;
  }

  /* 於保費表的 10 個年齡點之間線性插值 */
  function interpAges(age, vals) {
    const ages = DB.premium.ages;
    if (age <= ages[0]) return vals[0];
    if (age >= ages[ages.length - 1]) return vals[vals.length - 1];
    for (let i = 0; i < ages.length - 1; i++) {
      if (age >= ages[i] && age <= ages[i + 1]) {
        const t = (age - ages[i]) / (ages[i + 1] - ages[i]);
        return Math.round(vals[i] + t * (vals[i + 1] - vals[i]));
      }
    }
    return vals[vals.length - 1];
  }

  /* AIA 精確保費：AVSW 用保費比較表；SWP ≈ AVSW × 1.10（由 P.5-8 兩者基準價推導） */
  function aiaPremAt(code, ded, age) {
    const sheet = DB.premium.sheets.find(s => s.deductible === String(ded)) || DB.premium.sheets[0];
    const col = sheet.columns.find(c => c.isAIA && c.type === '基本計劃');
    const v = interpAges(age, col.v);
    return code === 'SWP' ? Math.round(v * 1.10 / 10) * 10 : v;
  }

  /* 自動檔位：於預算內取自付費最低（保障最大）的一檔 */
  function resolveDed(age, budget) {
    if (ADV.ded !== 'auto') return String(ADV.ded);
    for (let i = 0; i < DED_ORDER.length; i++) {
      if (aiaPremAt('AVSW', DED_ORDER[i], age) <= budget) return DED_ORDER[i];
    }
    return DED_ORDER[DED_ORDER.length - 1];
  }

  function estPremium(p, age, budget) {
    if (p.deductiblePlans) return aiaPremAt(p.code, resolveDed(age, budget), age);
    return Math.round(p.price40 * ageFactor(age) / 10) * 10;
  }

  /* 客戶資格：查國籍及居住地表 */
  function advEligibility() {
    const id = DB.advisor.identities.find(i => i.id === ADV.identity) || DB.advisor.identities[0];
    const rows = DB.eligibility.rows.filter(r => r.plan === id.plan);
    const row = rows.find(r => r.situation === id.situation) || rows[0];
    const v = row.v[ADV.residence];
    const hkId = id.plan === 'avsw' || id.id === 'stu_hk';
    return {
      id: id, row: row, value: v || '—',
      ok: (v || '').indexOf('標準保費') === 0,
      na: v === '不適用',
      hkId: hkId,
      student: id.plan === 'student'
    };
  }

  /* 保障額度：以每年限額的對數刻度評分（10 萬 = 0 分，3,000 萬 = 滿分） */
  function limitPct(annual) {
    if (!annual) return 0;
    const lo = 100000, hi = 30000000;
    const r = (Math.log(annual) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return Math.max(0, Math.min(1, r));
  }

  /* 墊底費／自付費負擔：相對於客戶全年保費預算的倍數，倍數越高負擔越大 */
  function dedPct(dedAmount, budget) {
    const r = dedAmount / budget;
    if (r === 0) return 1;
    if (r <= 0.25) return 0.95;
    if (r <= 0.5) return 0.85;
    if (r <= 1) return 0.7;
    if (r <= 2) return 0.5;
    if (r <= 4) return 0.3;
    if (r <= 6) return 0.2;
    return 0.15;
  }

  function budgetPct(prem, budget) {
    const r = prem / budget;
    if (r <= 0.75) return 1;
    if (r <= 1) return 0.571 + (1 - (r - 0.75) / 0.25) * 0.429;
    if (r <= 1.25) return (1 - (r - 1) / 0.25) * 0.571;
    return 0;
  }

  function scoreProduct(p, ctx) {
    // —— 硬性門檻 ——
    if (ctx.age < p.minAge || ctx.age > p.maxAge) {
      return { drop: '投保年齡為 ' + p.minAge + '–' + p.maxAge + ' 歲，客戶 ' + ctx.age + ' 歲不合資格' };
    }
    if (p.code === 'AVSW' && !ctx.hkId) return { drop: '須持有香港／澳門居民身份證' };
    if (p.code === 'SWP' && ctx.hkId) return { drop: '客戶持有港澳居民身份證，應選 AVSW' };
    if (!ctx.hkId && p.needs.indexOf('vhis') > -1) {
      return { drop: '自願醫保計劃只供香港／澳門居民身份證持有人投保' };
    }
    // 國籍／居住地核保結果為「不接受」時，所有自願醫保計劃（vhis 標籤）均不可投保
    if (!ctx.eligOK && p.needs.indexOf('vhis') > -1) {
      return { drop: '此國籍／居住地核保結果為「' + ctx.eligValue + '」，自願醫保計劃不獲接受' };
    }
    if (p.deductiblePlans && !ctx.eligOK) {
      return { drop: '此國籍／居住地組合於「' + (p.code === 'AVSW' ? '自願醫保睿選' : '睿選明珠') + '」為「' + ctx.eligValue + '」' };
    }

    const prem = estPremium(p, ctx.age, ctx.budget);
    const w = WEIGHTS[ADV.priority] || WEIGHTS.balance;

    // 預算符合度
    const bPct = budgetPct(prem, ctx.budget);
    // 需求匹配
    let nPct = 0.7;
    const hits = [], miss = [];
    if (ctx.needs.length) {
      DB.advisor.needs.forEach(n => {
        if (ctx.needs.indexOf(n.id) === -1) return;
        if (p.needs.indexOf(n.id) > -1) hits.push(n); else miss.push(n);
      });
      nPct = hits.length / ctx.needs.length;
    } else {
      p.needs.forEach(nid => {
        const n = DB.advisor.needs.find(x => x.id === nid);
        if (n) hits.push(n);
      });
    }
    // 保障額度（每年限額對數刻度）
    const lPct = limitPct(p.annual);
    // 墊底費負擔
    const dedAmt = p.deductiblePlans ? parseInt(resolveDed(ctx.age, ctx.budget), 10) : (p.dedAmount || 0);
    const dPct = dedPct(dedAmt, ctx.budget);
    // 年齡適配
    const aPct = ctx.age > p.maxAge - 5 ? 0.6 : 1;

    let total = (bPct * w.budget + nPct * w.needs + lPct * w.limit + dPct * w.ded + aPct * w.age) /
      (w.budget + w.needs + w.limit + w.ded + w.age) * 100;

    // 不能單獨作為住院主計劃的產品（附加契約／補充保障）下调；主推產品因市場特性比較佔優而加成
    if (p.riderOnly || p.supplement) total *= 0.85;
    if (p.hero) total += 5;
    total = Math.max(0, Math.min(100, Math.round(total)));

    return {
      score: total, prem: prem, hits: hits, miss: miss,
      overBudget: prem > ctx.budget,
      pctOfBudget: Math.round(prem / ctx.budget * 100)
    };
  }

  /* 墊底費標籤：同時標示相對於客戶預算的倍數，方便顧問判斷客戶能否承擔 */
  function dedLabel(p, age, budget) {
    if (p.deductiblePlans) {
      const d = parseInt(resolveDed(age, budget), 10);
      return d === 0 ? '0（不設自付費）' : fmt(d) + ' 港元（= 預算 ' + (d / budget).toFixed(1) + ' 倍）';
    }
    if (!p.dedAmount) return p.deductibleNote || '不設墊底費';
    return p.deductibleNote + '（= 預算 ' + (p.dedAmount / budget).toFixed(1) + ' 倍）';
  }

  function renderAdvisor() {
    const ctxBase = advEligibility();
    const ctx = {
      age: ADV.age, budget: ADV.budget, needs: ADV.needs,
      hkId: ctxBase.hkId, eligOK: ctxBase.ok, eligValue: ctxBase.value
    };

    /* —— 資格警示條 —— */
    const bar = $('#advEligBar');
    const place = DB.eligibility.residences[ADV.residence];
    const planName = ctxBase.id.plan === 'swp' ? '「睿選明珠」醫療計劃 (SWP)'
      : ctxBase.id.plan === 'student' ? '海外留學生安排' : 'AIA 自願醫保睿選計劃 (AVSW)';
    let cls = 'bad', title, sub;
    if (ctxBase.ok) {
      cls = 'ok';
      title = '可投保 — ' + planName;
      sub = '居住地「' + place + '」的核保結果為「' + ctxBase.value + '」' +
        (ctxBase.row.remark ? '。' + ctxBase.row.remark : '。') +
        (ctxBase.student ? '注意：留學生只可選擇附有墊底費的計劃。' : '');
    } else if (ctxBase.na) {
      cls = 'warn';
      title = '此居住地不適用 — ' + planName;
      sub = '居住地「' + place + '」於本計劃為「不適用」，請改以其他身份或計劃查詢。';
    } else {
      cls = 'bad';
      title = '不接受投保 — ' + planName;
      sub = '居住地「' + place + '」於本計劃為「不接受」。下列推薦僅供參考，如需進一步處理請向核保部查詢。';
    }
    bar.className = 'adv-alert ' + cls;
    bar.innerHTML = `<div class="a-title">${esc(title)}</div>
      <div class="a-sub">${esc(sub)}</div>
      <div class="a-sub" style="margin-top:4px;color:#7b8794">身份：${esc(ctxBase.id.label)}　·　保障需要年齡：${ADV.age} 歲　·　預算上限：HK$${fmt(ADV.budget)}</div>`;

    /* —— 評分與排序 —— */
    const scored = [];
    const dropped = [];
    DB.advisor.products.forEach(p => {
      const r = scoreProduct(p, ctx);
      if (r.drop) { dropped.push({ p: p, why: r.drop }); return; }
      scored.push({ p: p, r: r });
    });
    scored.sort((a, b) => b.r.score - a.r.score);

    const host = $('#advRecs');
    host.innerHTML = '';
    $('#advSummaryTag').textContent = ADV.needs.length
      ? '已選 ' + ADV.needs.length + ' 項需求 · ' + (WEIGHTS[ADV.priority] ? ADV.priority : '') + '排序'
      : '未指定需求 · 按預算與保障額度排序';

    if (!scored.length) {
      host.innerHTML = '<div class="rec-na">沒有產品同時符合年齡、身份與預算條件。請放寬預算上限、調整年齡或更改身份／居住地後再試。</div>';
    } else {
      const top3 = scored.slice(0, 3);
      const rest = scored.slice(3);

      // 主推產品若非第一名，額外提示其表現，避免被其他產品的保費優勢掩蓋
      const heroCode = ctxBase.hkId ? 'AVSW' : 'SWP';
      const heroIdx = scored.findIndex(s => s.p.code === heroCode);
      if (heroIdx > 0) {
        const hs = scored[heroIdx];
        const hd = el('div', 'adv-hero-note');
        hd.innerHTML = `<b>主推產品 ${esc(heroCode)}（${esc(hs.p.name)}）</b>：配對度 ${hs.r.score}/100，排名第 ${heroIdx + 1}，
          估算年繳保費 HK$${fmt(hs.r.prem)}（自付費 ${fmt(parseInt(resolveDed(ADV.age, ADV.budget), 10))} 港元）。
          ${hs.r.overBudget ? '已超出客戶預算上限，可調高自付費檔或與客戶確認預算。' : '於市場特性比較 47 個項目中佔優 40 項（P.54-66）。'}`;
        host.appendChild(hd);
      }

      top3.forEach((s, i) => {
        const p = s.p, r = s.r;
        const box = el('div', 'rec' + (i === 0 ? ' top' : ''));
        const dedNote = p.deductiblePlans ? '（自付費 ' + fmt(parseInt(resolveDed(ADV.age, ADV.budget), 10)) + ' 港元）' : '';
        box.innerHTML = `
          <div class="rec-head">
            <div class="rec-rank">${i + 1}</div>
            <div class="rec-name">
              <h4>${esc(p.name)}<span class="code">${esc(p.code)}</span><span class="grp">${esc(p.group)}</span>
                ${p.riderOnly ? '<span class="code flag">只可作附加契約</span>' : ''}
                ${p.supplement ? '<span class="code flag">補充保障</span>' : ''}
              </h4>
              <div style="font-size:12px;color:var(--ink-3);margin-top:2px;">${esc(p.room)}　·　${esc(p.region)}</div>
            </div>
            <div class="rec-score">
              <div class="pct">${r.score}<small> / 100</small></div>
              <div class="gauge"><i style="width:${r.score}%"></i></div>
              <div style="font-size:11px;color:var(--ink-3);margin-top:3px;">配對度</div>
            </div>
          </div>
          <div class="rec-meta">
            <div><div class="m-k">估算年繳保費</div><div class="m-v ${r.overBudget ? 'over' : 'fit'}">HK$${fmt(r.prem)}</div></div>
            <div><div class="m-k">佔預算</div><div class="m-v ${r.overBudget ? 'over' : ''}">${r.pctOfBudget}%${r.overBudget ? '（超出）' : ''}</div></div>
            <div><div class="m-k">投保年齡</div><div class="m-v">${p.minAge} – ${p.maxAge} 歲</div></div>
            <div><div class="m-k">每年限額</div><div class="m-v" style="font-size:12px;font-weight:600">${p.annual ? 'HK$' + fmt(p.annual) : '不適用（門診為主）'}</div></div>
            <div><div class="m-k">自付費／墊底費假設</div><div class="m-v" style="font-size:12px;font-weight:600">${esc(dedLabel(p, ADV.age, ADV.budget))}</div></div>
          </div>
          <div class="rec-tags">
            ${r.hits.map(n => `<span class="tg hit">✓ ${esc(n.label)}</span>`).join('')}
            ${r.miss.map(n => `<span class="tg miss">✕ ${esc(n.label)}</span>`).join('')}
          </div>
          <ul class="rec-why">
            <li>${esc(p.fit)}</li>
            <li>估算年繳保費約 HK$${fmt(r.prem)}${dedNote}，${r.overBudget ? '已超出客戶預算上限 HK$' + fmt(ADV.budget) + '，建議調高自付費檔或縮減保障要求' : '在客戶預算 HK$' + fmt(ADV.budget) + ' 之內，佔 ' + r.pctOfBudget + '%'}。</li>
            ${ADV.needs.length ? '<li>客戶指定需求命中 ' + r.hits.length + ' / ' + ADV.needs.length + ' 項。</li>' : ''}
            ${p.riderOnly ? '<li><b>只可作附加契約投保</b>，須另購主計劃，實際總保費高於上述估算。</li>' : ''}
            ${p.supplement ? '<li><b>屬補充性質的專項保障</b>，不能取代住院醫療主計劃。</li>' : ''}
          </ul>
          <div class="rec-watch"><b>注意：</b>${esc(p.watch)}</div>
          <div class="rec-actions">
            <button class="btn primary" data-add="${esc(p.code)}">加入產品對比</button>
            ${p.deductiblePlans ? `<button class="btn" data-prem="${esc(p.code)}" title="跳至「04 保費比較」並套用此自付費檔；年齡會上調至保費表最接近的一檔（避免低估保費）">於保費比較查看</button>` : ''}
          </div>`;
        host.appendChild(box);
      });

      $$('#advRecs [data-add]').forEach(b => {
        b.addEventListener('click', () => {
          if (state.compare.indexOf(b.dataset.add) === -1) state.compare.push(b.dataset.add);
          renderOverview(); renderLineup(); renderTray();
          $$('#lineupPicker input').forEach(cb => {
            if (cb.dataset.code === b.dataset.add) cb.checked = true;
          });
          $('#lineupOnlySel').checked = true;
          renderLineup();
          $('.mc-tab[data-view="lineup"]').click();
        });
      });
      $$('#advRecs [data-prem]').forEach(b => {
        b.addEventListener('click', () => {
          state.ded = resolveDed(ADV.age, ADV.budget);
          state.age = closestAge(ADV.age);
          state.type = 'basic';
          $$('#premDed button').forEach(x => x.classList.toggle('active', x.dataset.ded === state.ded));
          $$('#premType button').forEach(x => x.classList.toggle('active', x.dataset.type === 'basic'));
          renderPremium();
          $('.mc-tab[data-view="premium"]').click();
        });
      });

      if (rest.length) {
        const o = el('div', 'adv-others');
        o.innerHTML = '<div class="o-title">其他可考慮方案</div>' + rest.map(s =>
          `<div class="o-row">
             <span class="o-name">${esc(s.p.name)} <span style="color:#7b8794">(${esc(s.p.code)})</span></span>
             <span class="o-price">HK$${fmt(s.r.prem)}</span>
             <span class="o-pct">${s.r.score}</span>
           </div>`).join('');
        host.appendChild(o);
      }

      if (dropped.length) {
        const d = el('div', 'adv-others');
        d.innerHTML = '<div class="o-title">未納入推薦</div>' + dropped.map(x =>
          `<div class="o-row"><span class="o-name" style="color:var(--ink-3)">${esc(x.p.name)}（${esc(x.p.code)}） — ${esc(x.why)}</span></div>`).join('');
        host.appendChild(d);
      }
    }

    renderAdvPlanTable(ctxBase);
    renderAdvMarket(ctxBase);
    $('#advNote').textContent = DB.advisor.note;
  }

  /* 保費比較表只有 10 個年齡點，跳轉時向上取最接近的一檔，避免低估保費 */
  function closestAge(age) {
    const ages = DB.premium.ages;
    for (let i = 0; i < ages.length; i++) {
      if (ages[i] >= age) return ages[i];
    }
    return ages[ages.length - 1];
  }

  /* 自付費檔位建議表 */
  function renderAdvPlanTable(elig) {
    const code = elig.hkId ? 'AVSW' : 'SWP';
    const name = code === 'AVSW' ? 'AIA 自願醫保睿選計劃' : '「睿選明珠」醫療計劃';
    $('#advPlanAge').textContent = ADV.age;
    const auto = resolveDed(ADV.age, ADV.budget);
    const forced = ADV.ded !== 'auto';
    const t = $('#advPlanTable');
    let html = '<thead><tr><th>每年自付費</th><th>估算年繳保費' +
      `<div class="ph-meta">${esc(name)}</div></th><th>與預算比較</th><th>建議</th></tr></thead><tbody>`;
    DED_ORDER.forEach(d => {
      const v = aiaPremAt(code, d, ADV.age);
      const fit = v <= ADV.budget;
      const isPick = (forced && d === ADV.ded) || (!forced && d === auto);
      html += `<tr>
        <th>${d === '0' ? '0 港元' : fmt(parseInt(d, 10)) + ' 港元'}</th>
        <td class="num ${isPick ? 'plan-best' : ''}">HK$${fmt(v)}</td>
        <td class="num ${fit ? '' : 'plan-over'}">${fit ? '預算內（' + Math.round(v / ADV.budget * 100) + '%）' : '超出 HK$' + fmt(v - ADV.budget)}</td>
        <td>${isPick ? '<b style="color:var(--brand)">★ 建議方案</b>' : ''}</td>
      </tr>`;
    });
    html += '</tbody>';
    t.innerHTML = html;

    const v = aiaPremAt(code, auto, ADV.age);
    $('#advPlanNote').textContent =
      (code === 'SWP'
        ? '「睿選明珠」之保費按 AVSW 保費比較表（P.67-71）乘以 1.10 估算（依 P.5-8 兩者 40 歲基準保費 17,048 ÷ 15,496 推導）。'
        : 'AVSW 保費取自保費比較表（P.67-71）基本計劃，並於表列年齡之間以線性插值估算。') +
      ' 基本計劃、' + ADV.age + ' 歲、未計保監局徵費及 AIA Vitality 首年折扣。' +
      (v > ADV.budget ? '目前預算下所有檔位均超出上限，建議與客戶確認可承擔的自付費金額。' : '');
  }

  /* 市場保費參考 */
  function renderAdvMarket(elig) {
    const code = elig.hkId ? 'AVSW' : 'SWP';
    const host = $('#advMarket');
    if (!elig.ok) {
      host.innerHTML = '<div style="font-size:12.5px;color:var(--ink-3)">' +
        '此客戶畫像不獲「' + esc(code) + '」接受，故不提供市場保費比較。可先於「04 保費比較」選定其他自付費檔查看。</div>';
      return;
    }
    const ded = resolveDed(ADV.age, ADV.budget);
    const sheet = DB.premium.sheets.find(s => s.deductible === ded) || DB.premium.sheets[0];
    const aia = aiaPremAt(code, ded, ADV.age);
    const rivals = sheet.columns.filter(c => !c.isAIA && c.type === '基本計劃');
    const rows = rivals.map(c => {
      const v = interpAges(ADV.age, c.v);
      return { c: c, v: v, d: (v - aia) / aia * 100 };
    }).sort((a, b) => a.v - b.v);

    host.innerHTML =
      `<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:8px;">
        自付費 <b>${esc(ded === '0' ? '0' : fmt(parseInt(ded, 10)))} 港元</b>、基本計劃、${ADV.age} 歲：
        AIA ${esc(code)} 估算年繳保費 <b>HK$${fmt(aia)}</b>。
        下表為競爭對手同類計劃（基本計劃）比較，綠色「AIA 低」表示 AIA 較便宜。
      </div>` +
      rows.map(r =>
        `<div class="mk-row">
           <span class="mk-co">${esc(r.c.company)} <span style="color:#7b8794">${esc(r.c.product)} · ${esc(r.c.room)} · 自付費 ${fmt(r.c.ded)}</span></span>
           <span class="mk-v">HK$${fmt(r.v)}</span>
           <span class="mk-d" style="color:${r.d > 0 ? 'var(--brand)' : '#2f7d4f'}">${r.d > 0 ? 'AIA 低 ' : 'AIA 高 '}${Math.abs(r.d).toFixed(0)}%</span>
         </div>`).join('') +
      `<div style="font-size:11.5px;color:#7b8794;margin-top:8px;">請留意市場產品之間保障／自付費／房型的差異，不應以保費差異為唯一考慮因素。</div>`;
  }

  function initAdvisorControls() {
    // 身份
    const idSel = $('#advIdentity');
    idSel.innerHTML = DB.advisor.identities.map(i =>
      `<option value="${esc(i.id)}">${esc(i.label)}</option>`).join('');
    idSel.value = ADV.identity;
    idSel.addEventListener('change', () => { ADV.identity = idSel.value; renderAdvisor(); });

    // 居住地
    const rSel = $('#advResidence');
    rSel.innerHTML = DB.eligibility.residences.map((r, i) =>
      `<option value="${i}">${esc(r)}</option>`).join('');
    rSel.value = String(ADV.residence);
    rSel.addEventListener('change', () => { ADV.residence = parseInt(rSel.value, 10); renderAdvisor(); });

    // 年齡
    const ageR = $('#advAge');
    ageR.addEventListener('input', () => {
      ADV.age = parseInt(ageR.value, 10);
      $('#advAgeVal').textContent = ADV.age;
      renderAdvisor();
    });

    // 預算
    const budR = $('#advBudget');
    budR.addEventListener('input', () => {
      ADV.budget = parseInt(budR.value, 10);
      $('#advBudgetVal').textContent = 'HK$' + fmt(ADV.budget);
      renderAdvisor();
    });
    $('#advBudgetQuick').innerHTML = [3000, 5000, 8000, 12000, 20000, 40000]
      .map(v => `<button data-b="${v}">HK$${fmt(v)}</button>`).join('');
    $$('#advBudgetQuick button').forEach(b => {
      b.addEventListener('click', () => {
        ADV.budget = parseInt(b.dataset.b, 10);
        budR.value = ADV.budget;
        $('#advBudgetVal').textContent = 'HK$' + fmt(ADV.budget);
        renderAdvisor();
      });
    });

    // 自付費
    $('#advDed').addEventListener('change', e => { ADV.ded = e.target.value; renderAdvisor(); });

    // 排序偏好
    const seg = $('#advPriority');
    seg.innerHTML = DB.advisor.priorities.map(p =>
      `<button data-pri="${esc(p.id)}" title="${esc(p.desc)}">${esc(p.label)}</button>`).join('');
    $$('#advPriority button').forEach(b => {
      b.addEventListener('click', () => {
        ADV.priority = b.dataset.pri;
        $$('#advPriority button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderAdvisor();
      });
    });
    seg.querySelector('[data-pri="balance"]').classList.add('active');

    // 需求
    const nb = $('#advNeeds');
    nb.innerHTML = DB.advisor.needs.map(n =>
      `<label title="${esc(n.desc)}"><input type="checkbox" data-need="${esc(n.id)}">${esc(n.label)}</label>`).join('');
    $$('#advNeeds input').forEach(cb => {
      cb.addEventListener('change', () => {
        const i = ADV.needs.indexOf(cb.dataset.need);
        if (cb.checked && i === -1) ADV.needs.push(cb.dataset.need);
        if (!cb.checked && i > -1) ADV.needs.splice(i, 1);
        cb.parentNode.classList.toggle('on', cb.checked);
        renderAdvisor();
      });
    });

    // 重設 / 複製
    $('#advReset').addEventListener('click', () => {
      ADV.age = 35; ADV.identity = 'hk'; ADV.residence = 0; ADV.budget = 8000;
      ADV.ded = 'auto'; ADV.priority = 'balance'; ADV.needs = [];
      ageR.value = 35; budR.value = 8000;
      $('#advAgeVal').textContent = '35';
      $('#advBudgetVal').textContent = 'HK$8,000';
      idSel.value = 'hk'; rSel.value = '0'; $('#advDed').value = 'auto';
      $$('#advPriority button').forEach(x => x.classList.remove('active'));
      seg.querySelector('[data-pri="balance"]').classList.add('active');
      $$('#advNeeds input').forEach(cb => { cb.checked = false; cb.parentNode.classList.remove('on'); });
      renderAdvisor();
    });

    $('#advCopy').addEventListener('click', () => copySummary(advEligibility()));
  }

  function copySummary(elig) {
    const ctx = {
      age: ADV.age, budget: ADV.budget, needs: ADV.needs,
      hkId: elig.hkId, eligOK: elig.ok, eligValue: elig.value
    };
    const scored = [];
    DB.advisor.products.forEach(p => {
      const r = scoreProduct(p, ctx);
      if (!r.drop) scored.push({ p: p, r: r });
    });
    scored.sort((a, b) => b.r.score - a.r.score);
    const lines = [
      '【AIA 產品智能推薦摘要｜僅供內部參考】',
      '客戶年齡：' + ADV.age + ' 歲｜身份：' + elig.id.label,
      '居住地：' + DB.eligibility.residences[ADV.residence] + '｜每年預算上限：HK$' + fmt(ADV.budget),
      '投保資格：' + elig.value + (elig.row.remark ? '（' + elig.row.remark + '）' : ''),
      ''
    ];
    scored.slice(0, 3).forEach((s, i) => {
      lines.push((i + 1) + '. ' + s.p.name + '（' + s.p.code + '）— 配對度 ' + s.r.score + '/100');
      lines.push('   估算年繳保費：HK$' + fmt(s.r.prem) + '（佔預算 ' + s.r.pctOfBudget + '%）');
      lines.push('   賣點：' + s.p.fit);
      lines.push('   注意：' + s.p.watch);
    });
    const text = lines.join('\n');
    const done = () => {
      const b = $('#advCopy');
      const old = b.textContent;
      b.textContent = '已複製 ✓';
      setTimeout(() => { b.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    cb();
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    $('#srcNote').textContent = DB.meta.source + '｜' + DB.meta.updated;
    $('#footDisc').textContent = DB.meta.disclaimer;

    // 預設勾選全部保費欄位
    state.premCols = {};
    DB.premium.sheets.forEach(s => s.columns.forEach(c => { state.premCols[c.id] = true; }));

    initTabs();
    renderOverview();
    initLineupControls();
    renderLineup();
    renderTray();
    initMarketControls();
    renderMarket();
    initPremiumControls();
    renderPremium();
    initEligControls();
    renderEligibility();
    initAdvisorControls();
    renderAdvisor();

    $('#trayGo').addEventListener('click', () => {
      $('.mc-tab[data-view="lineup"]').click();
    });
    $('#trayClear').addEventListener('click', () => {
      state.compare = [];
      renderOverview(); renderLineup(); renderTray();
      $$('#lineupPicker input').forEach(cb => { cb.checked = false; });
    });
  }


/* --------------------------------------------------------------------------
   面板 HTML：掛載於 .mc-root，所有樣式與事件均作用域化，不干擾平台其他模組
   -------------------------------------------------------------------------- */
export function panel() {
  return `<div class="mc-root">
  <div class="mc-bar">
    <div class="mc-bar-left">
      <span class="mc-src" id="srcNote"></span>
    </div>
    <div class="mc-bar-right">
      <button type="button" class="mc-btn" id="btnPrint">列印／存成 PDF</button>
      <span class="mc-internal">● 只供 AIA 內部使用 · For AIA Internal Use Only</span>
    </div>
  </div>

  <nav class="mc-tabs">
    <button type="button" class="mc-tab active" data-view="overview"><span class="mc-tab-idx">01</span>產品速覽與特色</button>
    <button type="button" class="mc-tab" data-view="lineup"><span class="mc-tab-idx">02</span>內部產品定位</button>
    <button type="button" class="mc-tab" data-view="market"><span class="mc-tab-idx">03</span>市場特性比較</button>
    <button type="button" class="mc-tab" data-view="premium"><span class="mc-tab-idx">04</span>保費比較</button>
    <button type="button" class="mc-tab" data-view="elig"><span class="mc-tab-idx">05</span>國籍及居住地資格</button>
    <button type="button" class="mc-tab" data-view="advisor"><span class="mc-tab-idx">06</span>智能推薦（客戶畫像）</button>
  </nav>

  <section class="mc-view active" id="view-overview">
    <div class="mc-head">
      <h2><span class="mc-bar-accent"></span>產品速覽：一眼看清特色與優勢</h2>
      <p>資料來源：產品特點 P.9–10、內部產品定位 P.5–8。勾選產品可加入下方「產品對比」，於「內部產品定位」並排比較。</p>
    </div>
    <div class="mc-hero-grid" id="heroGrid"></div>
    <div class="mc-card" style="margin-top:16px;">
      <div class="mc-card-head">
        <h3>產品特點詳解 — AIA 自願醫保睿選計劃 /「睿選明珠」醫療計劃</h3>
        <span class="mc-page-tag">資料冊 P.9-10</span>
      </div>
      <div class="mc-card-body"><div class="mc-feat-grid" id="featGrid"></div></div>
    </div>
  </section>

  <section class="mc-view" id="view-lineup">
    <div class="mc-head">
      <h2><span class="mc-bar-accent"></span>內部產品定位：自家產品線並排比較</h2>
      <p>資料來源：內部產品定位 P.5–8。勾選產品代號即可加入／移除對比；保費為基本計劃、40 歲男性（非吸煙人士）、標準核保結果（截至 2025 年 10 月）。</p>
    </div>
    <div class="mc-card">
      <div class="mc-controls">
        <span class="mc-label">選擇比較產品：</span>
        <div id="lineupPicker" class="mc-inline"></div>
        <label class="mc-switch"><input type="checkbox" id="lineupOnlySel">只顯示已選產品</label>
      </div>
    </div>
    <div id="lineupHost" style="margin-top:14px;"></div>
  </section>

  <section class="mc-view" id="view-market">
    <div class="mc-head">
      <h2><span class="mc-bar-accent"></span>市場特性比較：條款級逐項對比</h2>
      <p>資料來源：產品特點比較 P.54–66。<strong class="mc-strong">底色標示的項目代表友邦的產品較優勝</strong>；可直接搜尋關鍵字，或只看 AIA 佔優的項目。</p>
    </div>
    <div class="mc-card">
      <div class="mc-controls">
        <input type="search" id="marketSearch" placeholder="搜尋保障項目（例：門診、自付費、現金）">
        <span class="mc-label">顯示公司：</span>
        <div id="marketColPicker" class="mc-inline"></div>
        <label class="mc-switch"><input type="checkbox" id="onlyWin">只看 AIA 較優勝項目</label>
        <span class="mc-label mc-stat" id="marketStat"></span>
      </div>
    </div>
    <div id="marketHost" style="margin-top:14px;"></div>
  </section>

  <section class="mc-view" id="view-premium">
    <div class="mc-head">
      <h2><span class="mc-bar-accent"></span>保費比較：按年齡與自付費即時對照</h2>
      <p>資料來源：保費比較 P.67–71。選擇自付費檔、基本／附加契約、聚焦年齡，即可看見 AIA 與競爭對手的差幅。</p>
    </div>
    <div class="mc-card">
      <div class="mc-controls">
        <span class="mc-label">AIA 自付費：</span>
        <div class="mc-seg" id="premDed"></div>
        <span class="mc-label">契約形式：</span>
        <div class="mc-seg" id="premType">
          <button type="button" data-type="basic" class="active">基本計劃</button>
          <button type="button" data-type="rider">附加契約</button>
          <button type="button" data-type="both">兩者並列</button>
        </div>
        <span class="mc-label">聚焦年齡：</span>
        <select id="premAge"></select>
        <span class="mc-label">顯示公司：</span>
        <div id="premColPicker" class="mc-inline"></div>
        <button type="button" class="mc-btn" id="btnCsv">匯出 CSV</button>
      </div>
      <div class="mc-card-head">
        <h3 id="premiumTitle"></h3>
        <span class="mc-page-tag">年繳保費（港元）</span>
      </div>
      <div class="mc-card-body"><div class="mc-bars" id="premBars"></div></div>
      <div class="mc-table-scroll"><table class="mc-cmp" id="premTable"></table></div>
      <div class="mc-legend">
        <span><i class="mc-sw-aia"></i>AIA 欄位（比較基準）</span>
        <span><i class="mc-sw-win"></i>「AIA 低 xx%」= 競爭對手保費高於 AIA，AIA 較便宜</span>
        <span><i class="mc-sw-lose"></i>「AIA 高 xx%」= AIA 保費高於競爭對手</span>
        <span class="mc-muted">百分比由系統按同一基準重新計算（對手保費 − AIA 保費）÷ AIA 保費</span>
      </div>
      <div class="mc-card-body mc-note" id="premNote"></div>
    </div>
  </section>

  <section class="mc-view" id="view-elig">
    <div class="mc-head">
      <h2><span class="mc-bar-accent"></span>國籍及居住地資格查詢</h2>
      <p>資料來源：國籍及居住地概覽表 P.86–95（Updated as of Oct 2025）。選擇計劃與受保人情況，即可查詢指定居住地可否投保及保費評級。</p>
    </div>
    <div class="mc-card">
      <div class="mc-controls">
        <span class="mc-label">適用計劃：</span>
        <div class="mc-seg" id="eligPlanSeg"></div>
      </div>
      <div class="mc-card-body">
        <div class="mc-elig-picker">
          <div class="mc-field"><label>受保人情況</label><select id="qSituation"></select></div>
          <div class="mc-field"><label>居住地</label><select id="qResidence"></select></div>
        </div>
        <div class="mc-result" id="qResult"></div>
      </div>
    </div>
    <div id="eligHost" style="margin-top:14px;"></div>
    <div class="mc-card">
      <div class="mc-card-head"><h3>備註與條款說明</h3><span class="mc-page-tag">P.86-95</span></div>
      <div class="mc-card-body mc-note" id="eligNote"></div>
    </div>
  </section>

  <section class="mc-view" id="view-advisor">
    <div class="mc-head">
      <h2><span class="mc-bar-accent"></span>智能推薦：輸入客戶畫像，即時配對最合適的產品</h2>
      <p>結合國籍及居住地資格（P.86-95）、內部產品定位（P.5-8）與保費比較（P.67-71）。左方輸入客戶情況，右方即時給出配對度排名、估算保費與推薦理由。</p>
    </div>
    <div class="mc-adv-layout">
      <div class="mc-card mc-adv-form">
        <div class="mc-card-head"><h3>客戶畫像</h3><span class="mc-page-tag">輸入即時更新</span></div>
        <div class="mc-card-body">
          <div class="mc-field">
            <label>實際年齡：<b id="advAgeVal">35</b> 歲</label>
            <input type="range" id="advAge" min="0" max="90" step="1" value="35">
            <div class="mc-range-ax"><span>0</span><span>45</span><span>90</span></div>
          </div>
          <div class="mc-field"><label>身份／國籍</label><select id="advIdentity"></select></div>
          <div class="mc-field"><label>居住地</label><select id="advResidence"></select></div>
          <div class="mc-field">
            <label>每年保費預算上限：<b id="advBudgetVal">HK$8,000</b></label>
            <input type="range" id="advBudget" min="1000" max="60000" step="500" value="8000">
            <div class="mc-range-ax"><span>1 千</span><span>3 萬</span><span>6 萬</span></div>
            <div class="mc-quick-row" id="advBudgetQuick"></div>
          </div>
          <div class="mc-field">
            <label>自付費取向（適用 AVSW／SWP）</label>
            <select id="advDed">
              <option value="auto">自動：在預算內選最低自付費</option>
              <option value="0">0 港元</option>
              <option value="8800">8,800 港元</option>
              <option value="18000">18,000 港元</option>
              <option value="30000">30,000 港元</option>
              <option value="55000">55,000 港元</option>
            </select>
          </div>
          <div class="mc-field"><label>排序偏好</label><div class="mc-seg" id="advPriority"></div></div>
          <div class="mc-field"><label>保障需求（可多選）</label><div class="mc-need-chips" id="advNeeds"></div></div>
          <div class="mc-adv-actions">
            <button type="button" class="mc-btn" id="advReset">重設</button>
            <button type="button" class="mc-btn" id="advCopy">複製推薦摘要</button>
          </div>
        </div>
      </div>
      <div class="mc-adv-result">
        <div class="mc-adv-alert" id="advEligBar"></div>
        <div class="mc-card">
          <div class="mc-card-head"><h3>配對結果</h3><span class="mc-page-tag" id="advSummaryTag"></span></div>
          <div class="mc-card-body" id="advRecs"></div>
        </div>
        <div class="mc-card" id="advPlanCard">
          <div class="mc-card-head">
            <h3>自付費檔位建議 — AIA 自願醫保睿選計劃 /「睿選明珠」</h3>
            <span class="mc-page-tag">按 <b id="advPlanAge"></b> 歲估算</span>
          </div>
          <div class="mc-table-scroll"><table class="mc-cmp" id="advPlanTable"></table></div>
          <div class="mc-card-body mc-note" id="advPlanNote"></div>
        </div>
        <div class="mc-card">
          <div class="mc-card-head"><h3>市場保費參考</h3><span class="mc-page-tag">資料冊 P.67-71</span></div>
          <div class="mc-card-body" id="advMarket"></div>
        </div>
        <div class="mc-card">
          <div class="mc-card-head"><h3>評分方式與注意事項</h3></div>
          <div class="mc-card-body mc-note" id="advNote"></div>
        </div>
      </div>
    </div>
  </section>

  <div class="mc-foot">
    <div class="mc-disc" id="footDisc"></div>
    <ol class="mc-footnotes">
      <li>「全數賠償*」指就醫療所需的服務不設分項賠償限額，而賠償申請將按合理及慣常收費進行評估；賠償金額以保障表所列明的保障限額為限，包括每年保障限額、終身保障限額及每年自付費。</li>
      <li>「睿選醫療網絡」只適用於香港，並不適用於澳門；網絡服務供應商為獨立承辦商，並非友邦的代理人或僱員。</li>
      <li>請留意市場產品之間保障／自付費／房型的差異，不應在產品比較時以保費差異為唯一考慮因素。</li>
      <li>本頁數據擷取自內部產品資料冊表格版，如有疑問請以最新保單契約及標準保費表為準。</li>
    </ol>
  </div>

  <div class="mc-tray" id="tray">
    <span class="mc-t-label">產品對比：</span>
    <span class="mc-t-items" id="trayItems"></span>
    <button type="button" class="mc-btn mc-btn-primary" id="trayGo">查看並排比較</button>
    <button type="button" class="mc-btn mc-btn-ghost" id="trayClear">清空</button>
  </div>
</div>`;
}

export function bind() {
  root = document.querySelector('.mc-root');
  if (!root) return;
  init();
  // 平台切換模組後 DOM 會重建：還原使用者上次檢視的頁籤（不觸發滾動）
  if (state.tab && state.tab !== 'overview') {
    const btn = $('.mc-tab[data-view="' + state.tab + '"]');
    if (btn) {
      $$('.mc-tab').forEach(b => b.classList.remove('active'));
      $$('.mc-view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const view = $('#view-' + state.tab);
      if (view) view.classList.add('active');
    }
  }
}
