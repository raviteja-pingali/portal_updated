// ── Page Renderers ────────────────────────────────────────────────────────────

const Pages = {

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  // Compute current period date range from a period key
  _getPeriodRange(key) {
    const anchor = new Date('2026-05-17');
    const fmt = d => d.toISOString().slice(0, 10);
    if (key === '7D')  { const s = new Date(anchor); s.setDate(anchor.getDate()-6);  return { startStr:fmt(s), endStr:fmt(anchor), days:7,  label:'Last 7 days' }; }
    if (key === '30D') { const s = new Date(anchor); s.setDate(anchor.getDate()-29); return { startStr:fmt(s), endStr:fmt(anchor), days:30, label:'Last 30 days' }; }
    if (key === 'WTD') {
      const dow = anchor.getDay(); // 0=Sun
      const sinceMonday = dow === 0 ? 6 : dow - 1;
      const s = new Date(anchor); s.setDate(anchor.getDate() - sinceMonday);
      return { startStr:fmt(s), endStr:fmt(anchor), days:sinceMonday+1, label:'Week to date' };
    }
    if (key === 'MTD') {
      const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      return { startStr:fmt(s), endStr:fmt(anchor), days:anchor.getDate(), label:'Month to date' };
    }
    if (key === 'YTD') {
      const s = new Date(anchor.getFullYear(), 0, 1);
      const days = Math.floor((anchor - s) / 86400000) + 1;
      return { startStr:fmt(s), endStr:fmt(anchor), days, label:'Year to date' };
    }
    const s = new Date(anchor); s.setDate(anchor.getDate()-6);
    return { startStr:fmt(s), endStr:fmt(anchor), days:7, label:'Last 7 days' };
  },

  // Compute comparison period date range
  _getComparisonRange(curr, mode) {
    const fmt = d => d.toISOString().slice(0, 10);
    if (mode === 'sply') {
      const s = new Date(curr.startStr); s.setFullYear(s.getFullYear()-1);
      const e = new Date(curr.endStr);   e.setFullYear(e.getFullYear()-1);
      return { startStr:fmt(s), endStr:fmt(e), days:curr.days, label:'Same period last year' };
    }
    const e = new Date(curr.startStr); e.setDate(e.getDate()-1);
    const s = new Date(e); s.setDate(e.getDate() - curr.days + 1);
    return { startStr:fmt(s), endStr:fmt(e), days:curr.days, label:'Prior period' };
  },

  dashboard() {
    const u        = Auth.current();
    const stores   = Auth.marketStores();
    const periodKey = App.dashPeriod;
    const compMode  = App.dashComparison;
    const kpis      = Data.STORE_KPIS;

    // Date ranges
    const curr = Pages._getPeriodRange(periodKey);
    const prev = Pages._getComparisonRange(curr, compMode);

    // Image stats — current period
    const periodImgs  = Data.IMAGE_GALLERY.filter(i => i.visit_date >= curr.startStr && i.visit_date <= curr.endStr);
    const flaggedImgs = periodImgs.filter(i => i.fraud_types.length > 0);
    const cleanImgs   = periodImgs.filter(i => i.fraud_types.length === 0);
    const totalImg    = periodImgs.length;
    const fraudCt     = flaggedImgs.length;

    // Image stats — comparison period
    const prevImgs    = Data.IMAGE_GALLERY.filter(i => i.visit_date >= prev.startStr && i.visit_date <= prev.endStr);
    const prevTotalImg = prevImgs.length;
    const prevFraudCt  = prevImgs.filter(i => i.fraud_types.length > 0).length;

    // Compliance (KPIs don't have date dimension — use seeded offset for prev)
    const avgComp   = kpis.reduce((a, k) => a + k.compliance_pct, 0) / kpis.length;
    const prevComp  = Math.max(50, Math.min(99, avgComp + ((kpis.length % 5) - 2) * 0.9));

    // Active stores
    const activeStores = stores.filter(s => s.status === 'Active').length;

    const roleGreet = { Admin: 'Portal Admin', Regular: 'Sales Representative' }[u.role] || u.role;

    // Delta formatter
    const fmtDelta = (cur, pre, suffix = '', lowerIsBetter = false) => {
      const d = cur - pre;
      const positive = lowerIsBetter ? d < 0 : d >= 0;
      const s   = d >= 0 ? '▲' : '▼';
      const cls = positive ? 'text-green-600' : 'text-red-500';
      const val = Math.abs(Number.isInteger(d) ? d : +d.toFixed(1));
      return `<span class="${cls} text-xs font-semibold">${s} ${val}${suffix}</span>`;
    };

    // Store movers
    const storeMovers = [...kpis].map((k, i) => {
      const delta = ((i % 7) - 3) * 2.5 + (i % 3 === 0 ? 3 : -1.5);
      return { ...k, prev_compliance: Math.max(30, Math.min(99, k.compliance_pct - delta)), delta };
    });
    const topImproved = [...storeMovers].sort((a, b) => b.delta - a.delta).slice(0, 3);
    const topDeclined = [...storeMovers].sort((a, b) => a.delta - b.delta).slice(0, 3);

    // Trend data (same length for overlay — regenerated on every render)
    const currTrend = Data.trendData(curr.days);
    const prevTrend = Data.trendData(curr.days);
    Pages._dashData = { curr, prev, currTrend, prevTrend };

    // Dashboard widget visibility
    const cfg  = Data.DASHBOARD_CONFIG?.[u.market.id]?.widgets || Data.DASHBOARD_WIDGETS.map(w => w.id);
    const show = id => cfg.includes(id);

    // Period selector buttons
    const periods    = ['7D', '30D', 'WTD', 'MTD', 'YTD'];
    const periodBtns = periods.map(p => `
      <button onclick="App.setDashPeriod('${p}')"
        class="px-3 py-1.5 text-xs rounded-lg font-medium transition ${p === periodKey
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">${p}</button>`).join('');

    // Comparison toggle buttons
    const compBtns = [
      { key:'prior', label:'Prior Period' },
      { key:'sply',  label:'Same Period LY' },
    ].map(c => `
      <button onclick="App.setDashComparison('${c.key}')"
        class="px-3 py-1.5 text-xs rounded-lg font-medium transition ${c.key === compMode
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">${c.label}</button>`).join('');

    const compLabel = compMode === 'sply' ? 'vs same period last year' : 'vs prior period';

    return `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p class="text-sm text-gray-500 mt-1">Welcome, <strong>${u.name}</strong> · ${roleGreet} · ${u.market.name}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          ${u.role === 'Admin' ? `
          <button onclick="Pages.configureDashboard()"
            class="text-xs border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
            ⚙ Customize Dashboard
          </button>` : ''}
          <div class="flex flex-col items-end gap-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 font-medium">Period</span>
              <div class="flex gap-1">${periodBtns}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 font-medium">Compare</span>
              <div class="flex gap-1">${compBtns}</div>
            </div>
            <span class="text-xs text-gray-400">${curr.label} ending 17 May 2026 · ${compLabel}</span>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      ${show('kpi_cards') ? `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-2"><span class="text-lg">🏪</span><p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Stores</p></div>
          <p class="text-2xl font-bold text-gray-800">${activeStores}</p>
          <p class="text-xs text-gray-400 mt-1">${stores.length} total · ${fmtDelta(activeStores, activeStores, '')} ${compLabel}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-2"><span class="text-lg">📊</span><p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Avg Compliance</p></div>
          <p class="text-2xl font-bold text-gray-800">${avgComp.toFixed(1)}%</p>
          <p class="text-xs text-gray-400 mt-1">Prev: ${prevComp.toFixed(1)}% · ${fmtDelta(avgComp, prevComp, '%')} ${compLabel}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-2"><span class="text-lg">📸</span><p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Images Captured</p></div>
          <p class="text-2xl font-bold text-gray-800">${totalImg.toLocaleString()}</p>
          <p class="text-xs text-gray-400 mt-1">Prev: ${prevTotalImg} · ${fmtDelta(totalImg, prevTotalImg)} ${compLabel}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-2"><span class="text-lg">🚨</span><p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Fraud Flags</p></div>
          <p class="text-2xl font-bold text-gray-800">${fraudCt}</p>
          <p class="text-xs text-gray-400 mt-1">Prev: ${prevFraudCt} · ${fmtDelta(fraudCt, prevFraudCt, '', true)} ${compLabel}</p>
        </div>
      </div>` : ''}

      <!-- Trend Charts — dual-line current vs previous -->
      ${(show('chart_visits') || show('chart_users') || show('chart_images')) ? `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${show('chart_visits') ? `
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm font-semibold text-gray-700">Stores Visited</h2>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="w-5 border-t-2 border-blue-500 inline-block"></span>Current</span>
              <span class="flex items-center gap-1"><span class="w-5 border-t-2 border-dashed border-gray-300 inline-block"></span>Previous</span>
            </div>
          </div>
          <canvas id="chartVisits" height="140"></canvas>
        </div>` : ''}
        ${show('chart_users') ? `
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm font-semibold text-gray-700">Active Users</h2>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="w-5 border-t-2 border-purple-500 inline-block"></span>Current</span>
              <span class="flex items-center gap-1"><span class="w-5 border-t-2 border-dashed border-gray-300 inline-block"></span>Previous</span>
            </div>
          </div>
          <canvas id="chartUsers" height="140"></canvas>
        </div>` : ''}
        ${show('chart_images') ? `
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:border-blue-300 transition-colors group" onclick="Pages._goToImageQuality()">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm font-semibold text-gray-700">Images Captured</h2>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="w-5 border-t-2 border-indigo-500 inline-block"></span>Current</span>
              <span class="flex items-center gap-1"><span class="w-5 border-t-2 border-dashed border-gray-300 inline-block"></span>Previous</span>
              <span class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View report →</span>
            </div>
          </div>
          <canvas id="chartImages" height="140"></canvas>
        </div>` : ''}
      </div>` : ''}

      <!-- Top / Bottom Stores -->
      ${show('top_stores') ? `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Top 5 Stores by Compliance</h2>
          <div class="space-y-3">
            ${[...storeMovers].sort((a, b) => b.compliance_pct - a.compliance_pct).slice(0, 5).map(k => `
            <div class="flex items-center gap-3">
              <button onclick="Pages._goToStore('${k.store_name.replace(/'/g, "\\'")}')"
                class="text-xs text-blue-600 hover:text-blue-800 hover:underline w-28 truncate text-left flex-shrink-0" title="${k.store_name}">${k.store_name}</button>
              ${Utils.scoreBar(k.compliance_pct)}
              <span class="text-xs font-semibold flex-shrink-0 ${k.delta >= 0 ? 'text-green-600' : 'text-red-500'}">${k.delta >= 0 ? '▲' : '▼'} ${Math.abs(k.delta).toFixed(1)}%</span>
            </div>`).join('')}
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Stores Needing Attention</h2>
          <div class="space-y-3">
            ${[...storeMovers].sort((a, b) => a.compliance_pct - b.compliance_pct).slice(0, 5).map(k => `
            <div class="flex items-center gap-3">
              <button onclick="Pages._goToStore('${k.store_name.replace(/'/g, "\\'")}')"
                class="text-xs text-blue-600 hover:text-blue-800 hover:underline w-28 truncate text-left flex-shrink-0" title="${k.store_name}">${k.store_name}</button>
              ${Utils.scoreBar(k.compliance_pct)}
              <span class="text-xs font-semibold flex-shrink-0 ${k.delta >= 0 ? 'text-green-600' : 'text-red-500'}">${k.delta >= 0 ? '▲' : '▼'} ${Math.abs(k.delta).toFixed(1)}%</span>
            </div>`).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- Store Movers vs previous period -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><span class="text-green-500">▲</span> Most Improved Stores</h2>
          <div class="space-y-2">
            ${topImproved.map(k => `
            <div class="flex items-center justify-between">
              <button onclick="Pages._goToStore('${k.store_name.replace(/'/g, "\\'")}')"
                class="text-xs text-blue-600 hover:underline truncate w-44 text-left flex-shrink-0">${k.store_name}</button>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-400">${k.prev_compliance.toFixed(1)}% → ${k.compliance_pct.toFixed(1)}%</span>
                <span class="text-green-600 font-semibold text-xs">▲ ${Math.abs(k.delta).toFixed(1)}%</span>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><span class="text-red-500">▼</span> Most Declined Stores</h2>
          <div class="space-y-2">
            ${topDeclined.map(k => `
            <div class="flex items-center justify-between">
              <button onclick="Pages._goToStore('${k.store_name.replace(/'/g, "\\'")}')"
                class="text-xs text-blue-600 hover:underline truncate w-44 text-left flex-shrink-0">${k.store_name}</button>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-400">${k.prev_compliance.toFixed(1)}% → ${k.compliance_pct.toFixed(1)}%</span>
                <span class="text-red-500 font-semibold text-xs">▼ ${Math.abs(k.delta).toFixed(1)}%</span>
              </div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Image Quality Summary -->
      ${show('fraud_breakdown') ? (() => {
        const prevCleanCt   = prevImgs.filter(i => i.fraud_types.length === 0).length;
        const prevFlaggedCt = prevImgs.filter(i => i.fraud_types.length > 0).length;
        return `
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-700">Image Quality Summary</h2>
          <button onclick="App.navigate('image-repo')" class="text-blue-500 text-xs hover:underline">View all →</button>
        </div>
        <div class="space-y-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xs font-semibold text-gray-600">${curr.label}</span>
              <span class="flex items-center gap-1 text-xs text-gray-500"><span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>${cleanImgs.length} Clean</span>
              <span class="flex items-center gap-1 text-xs text-gray-500"><span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span>${flaggedImgs.length} Flagged</span>
              <span class="text-xs text-gray-400">${totalImg} total</span>
            </div>
            <div class="flex flex-wrap gap-2">
              ${Data.FRAUD_TYPES.map(ft => {
                const ct = periodImgs.filter(i => i.fraud_types.includes(ft)).length;
                if (ct === 0) return '';
                return `<button onclick="Pages._goToImageRepoFraud('${ft}')"
                  class="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition flex items-center gap-1.5">
                  <span class="font-semibold text-gray-700">${ct}</span><span class="text-gray-500">${ft}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
          <div class="border-t border-gray-100 pt-3">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xs font-semibold text-gray-400">${prev.label}</span>
              <span class="flex items-center gap-1 text-xs text-gray-400"><span class="w-2 h-2 rounded-full bg-green-200 inline-block"></span>${prevCleanCt} Clean</span>
              <span class="flex items-center gap-1 text-xs text-gray-400"><span class="w-2 h-2 rounded-full bg-red-200 inline-block"></span>${prevFlaggedCt} Flagged</span>
              <span class="text-xs text-gray-400">${prevImgs.length} total</span>
            </div>
            <div class="flex flex-wrap gap-2">
              ${Data.FRAUD_TYPES.map(ft => {
                const pct = prevImgs.filter(i => i.fraud_types.includes(ft)).length;
                if (pct === 0) return '';
                return `<span class="text-xs border border-gray-100 rounded-lg px-3 py-1.5 bg-gray-50 flex items-center gap-1.5 text-gray-400">
                  <span class="font-semibold">${pct}</span><span>${ft}</span>
                </span>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;
      })() : ''}

    </div><!-- /outer -->

    ${u.role === 'Admin' ? Utils.modal('dashConfigModal', 'Customize Dashboard', `
      <div class="space-y-1">
        <p class="text-xs text-gray-400 mb-3">Choose which panels are visible on the dashboard for <strong>${u.market.name}</strong>. Changes apply immediately.</p>
        ${Data.DASHBOARD_WIDGETS.map(w => `
        <label class="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
          <input type="checkbox" id="dw_${w.id}" value="${w.id}" ${cfg.includes(w.id) ? 'checked' : ''}
            class="mt-0.5 rounded text-blue-600 cursor-pointer flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-gray-700">${w.label}</p>
            <p class="text-xs text-gray-400">${w.desc}</p>
          </div>
        </label>`).join('')}
      </div>`,
      `<button onclick="Utils.closeModal('dashConfigModal')" class="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
       <button onclick="Pages.saveDashboardConfig()" class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save & Refresh</button>`
    ) : ''}`;
  },

  afterDashboard() {
    const { currTrend, prevTrend } = Pages._dashData || {};
    if (!currTrend || !window.Chart) return;

    const dualDatasets = (currData, prevData, color, fillColor) => ([
      { label:'Current',  data:currData, borderColor:color,    backgroundColor:fillColor,
        tension:0.4, fill:true, pointRadius:2, pointHoverRadius:4, borderWidth:2 },
      { label:'Previous', data:prevData, borderColor:'#CBD5E1', backgroundColor:'transparent',
        borderDash:[5,4], tension:0.4, pointRadius:2, fill:false, borderWidth:1.5 },
    ]);
    const opts = (stepSize) => ({
      plugins: { legend:{ display:false } },
      scales:  { y:{ beginAtZero:true, ticks:{ stepSize } } },
    });

    const visitsCtx = document.getElementById('chartVisits');
    const usersCtx  = document.getElementById('chartUsers');
    const imagesCtx = document.getElementById('chartImages');

    if (visitsCtx) {
      Chart.getChart(visitsCtx)?.destroy();
      new Chart(visitsCtx, { type:'line',
        data:{ labels:currTrend.dates, datasets:dualDatasets(currTrend.visits, prevTrend.visits, '#3B82F6', 'rgba(59,130,246,0.08)') },
        options:opts(5) });
    }
    if (usersCtx) {
      Chart.getChart(usersCtx)?.destroy();
      new Chart(usersCtx, { type:'line',
        data:{ labels:currTrend.dates, datasets:dualDatasets(currTrend.users, prevTrend.users, '#8B5CF6', 'rgba(139,92,246,0.08)') },
        options:opts(2) });
    }
    if (imagesCtx) {
      Chart.getChart(imagesCtx)?.destroy();
      new Chart(imagesCtx, { type:'line',
        data:{ labels:currTrend.dates, datasets:dualDatasets(currTrend.images, prevTrend.images, '#6366F1', 'rgba(99,102,241,0.08)') },
        options:opts(20) });
    }
  },
  _goToStore(storeName) {
    App.navigate('store-report');
    setTimeout(() => {
      const kw = document.getElementById('kw_search');
      if (kw) { kw.value = storeName; App.applyFilters(); }
    }, 100);
  },

  _goToImageRepo(searchTerm) {
    App.navigate('image-repo');
    setTimeout(() => {
      App._irCurrentTab = 0;
      const s = document.getElementById('ir_search');
      if (s) { s.value = searchTerm; Pages.filterGallery(); }
    }, 100);
  },

  _goToImageRepoFraud(fraudType) {
    App.navigate('image-repo');
    setTimeout(() => {
      App._irCurrentTab = 0;
      App._irFraudFilters = new Set([fraudType]);
      Pages._irRenderFraudPills();
      Pages.filterGallery();
    }, 100);
  },

  _goToImageQuality() {
    const endDate = new Date('2026-05-17');
    const startDate = new Date('2026-05-17');
    startDate.setDate(startDate.getDate() - App.dashPeriod + 1);
    const from = startDate.toISOString().slice(0, 10);
    const to   = endDate.toISOString().slice(0, 10);
    App.navigate('image-quality');
    setTimeout(() => {
      const f = document.getElementById('f_date_from');
      const t = document.getElementById('f_date_to');
      if (f) f.value = from;
      if (t) t.value = to;
      App.applyFilters();
    }, 100);
  },

  // ─── Master Data ───────────────────────────────────────────────────────────
  _mdExportBar(tabIdx) {
    return `<div class="flex justify-end mb-3">
      <button onclick="App.exportMasterData(${tabIdx})"
        class="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export Excel
      </button>
    </div>`;
  },

  masterData() {
    return `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Master Data</h1>
      <div class="flex gap-2 border-b border-gray-200">
        ${['Stores', 'PEP Products', 'Competitor Products', 'CNDB SKUs'].map((t, i) => `
        <button onclick="Pages.switchMasterTab(${i})" id="mdTab${i}"
          class="px-4 py-2 text-sm font-medium border-b-2 transition ${i === 0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">${t}</button>`).join('')}
      </div>
      <div id="mdTabContent">${this._mdExportBar(0)}${this._storesTable(Auth.marketStores())}</div>
    </div>`;
  },

  switchMasterTab(idx) {
    [0, 1, 2, 3].forEach(i => {
      document.getElementById(`mdTab${i}`).className =
        `px-4 py-2 text-sm font-medium border-b-2 transition ${i === idx ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;
    });
    const content = {
      0: Pages._storesTable(Auth.marketStores()),
      1: Pages._productsTable(Data.PRODUCTS),
      2: Pages._competitorTable(),
      3: Pages._cndbTable(),
    };
    const bar = idx === 3 ? '' : this._mdExportBar(idx);
    document.getElementById('mdTabContent').innerHTML = bar + content[idx];
  },

  _storesTable(stores) {
    const cols = [
      { label:'ID', key:'id', sortable:true },
      { label:'Store Name', key:'name', sortable:true },
      { label:'Region', key:'region', sortable:true },
      { label:'City', key:'city', sortable:true },
      { label:'Status', key:'status', sortable:true },
    ];
    const rows = [...stores].sort((a,b)=>a.name.localeCompare(b.name)).map(s => Utils.tr([
      `<span class="font-mono text-xs text-gray-400">${s.id}</span>`,
      s.name, s.region, s.city,
      Utils.badge(s.status, s.status === 'Active' ? 'success' : 'inactive'),
    ]));
    return Utils.table(cols, rows);
  },

  _usersTable(users) {
    const roleBadge = r => r === 'Admin' ? Utils.badge(r, 'info') : r === 'Manager' ? Utils.badge(r, 'warning') : Utils.badge(r, 'default');
    const cols = [
      { label:'Name', key:'name', sortable:true },
      { label:'Email', key:'email', sortable:true },
      { label:'Role', key:'role', sortable:true },
      { label:'Status', key:'status', sortable:true },
      { label:'Last Login', key:'lastLogin', sortable:true },
    ];
    const rows = users.map(u => Utils.tr([u.name, u.email, roleBadge(u.role),
      Utils.badge(u.status, u.status === 'Active' ? 'success' : 'inactive'), u.lastLogin]));
    return Utils.table(cols, rows);
  },

  _productsTable(products) {
    const additions = JSON.parse(localStorage.getItem('pepAdditions') || '[]');
    const all = [...products, ...additions];
    const cols = [
      { label:'Packshot', key:'packshot', sortable:false },
      { label:'SKU', key:'sku', sortable:true },
      { label:'Product Name', key:'name', sortable:true },
      { label:'Brand', key:'brand', sortable:true },
      { label:'Category', key:'category', sortable:true },
    ];
    const rows = all.map(p => Utils.tr([
      `<img src="${p.packshot || 'https://placehold.co/56x56/CBD5E1/FFFFFF?text=?'}" alt="${p.name}" class="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-100" loading="lazy">`,
      `<span class="font-mono text-xs text-gray-500">${p.sku}</span>`,
      `<span class="font-medium text-gray-800">${p.name}</span>`,
      p.brand, p.category,
    ]));
    return Utils.table(cols, rows);
  },

  // ─── Competitor Products ────────────────────────────────────────────────────

  _cpGetActive() {
    return JSON.parse(localStorage.getItem('cpActiveStatus') || '{}');
  },

  _cpToggleActive(id) {
    const map = this._cpGetActive();
    const current = map[id] !== false;
    map[id] = !current;
    localStorage.setItem('cpActiveStatus', JSON.stringify(map));
    const isNowActive = map[id];
    const btn   = document.getElementById(`cpToggle_${id}`);
    const badge = document.getElementById(`cpBadge_${id}`);
    if (btn) {
      btn.textContent = isNowActive ? 'Set Inactive' : 'Set Active';
      btn.className = `text-xs font-medium ${isNowActive ? 'text-gray-500 hover:text-red-600' : 'text-green-600 hover:text-green-800'}`;
    }
    if (badge) {
      badge.textContent = isNowActive ? 'Active' : 'Inactive';
      badge.className = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isNowActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`;
    }
    Utils.toast(`Product marked as ${isNowActive ? 'Active' : 'Inactive'}.`, 'info');
  },

  _competitorTable() {
    const additions  = JSON.parse(localStorage.getItem('cpAdditions')    || '[]');
    const activeMap  = JSON.parse(localStorage.getItem('cpActiveStatus') || '{}');
    const isAdmin    = Auth.current().role === 'Admin';
    const all        = [...Data.COMPETITOR_PRODUCTS, ...additions];
    const exportSvg  = `<svg class="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`;

    const cols = [
      { label:'Packshot',     key:'packshot', sortable:false },
      { label:'SKU',          key:'sku',      sortable:true  },
      { label:'Product Name', key:'name',     sortable:true  },
      { label:'Brand',        key:'brand',    sortable:true  },
      { label:'Category',     key:'category', sortable:true  },
      { label:'Status',       key:'status',   sortable:false },
      ...(isAdmin ? [{ label:'Actions', key:'actions', sortable:false }] : []),
    ];

    const rows = all.map(p => {
      const isActive  = activeMap[p.id] !== false;
      const isCndb    = !!p.source;
      const badgeCls  = isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500';
      const statusBadge = `<span id="cpBadge_${p.id}" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeCls}">${isActive ? 'Active' : 'Inactive'}</span>`;
      const cndbBadge   = isCndb ? ' <span class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">CNDB</span>' : '';
      const cells = [
        `<img src="${p.packshot || 'https://placehold.co/56x56/CBD5E1/FFFFFF?text=?'}" alt="${p.name}" class="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-100" loading="lazy">`,
        `<span class="font-mono text-xs text-gray-500">${p.sku}</span>`,
        `<span class="font-medium text-gray-800">${p.name}</span>${cndbBadge}`,
        p.brand, p.category, statusBadge,
      ];
      if (isAdmin) {
        const btnCls = `text-xs font-medium ${isActive ? 'text-gray-500 hover:text-red-600' : 'text-green-600 hover:text-green-800'}`;
        cells.push(`<button id="cpToggle_${p.id}" onclick="Pages._cpToggleActive('${p.id}')" class="${btnCls}">${isActive ? 'Set Inactive' : 'Set Active'}</button>`);
      }
      return Utils.tr(cells);
    });

    return Utils.table(cols, rows);
  },

  // ─── CNDB SKU Tab ──────────────────────────────────────────────────────────

  _cndbGet() {
    const stored = localStorage.getItem('cndbSkus');
    return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(Data.CNDB_SKUS));
  },

  _cndbSave(list) {
    localStorage.setItem('cndbSkus', JSON.stringify(list));
  },

  _cndbStatusBadge(status) {
    const cls = {
      'New':            'bg-blue-100 text-blue-800',
      'Pending Review': 'bg-amber-100 text-amber-800',
      'Approved':       'bg-green-100 text-green-800',
      'Rejected':       'bg-red-100 text-red-800',
      'Irrelevant':     'bg-gray-100 text-gray-500',
    }[status] || 'bg-gray-100 text-gray-500';
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}">${status}</span>`;
  },

  _cndbTable() {
    const isAdmin = Auth.current().role === 'Admin';
    const items   = this._cndbGet();
    const exportSvg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`;

    const toolbar = `
      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div class="flex items-center gap-3 flex-wrap">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="cndbChkAll" onchange="Pages._cndbToggleAll(this.checked)"
              class="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer">
            <span class="text-sm text-gray-500">Select all</span>
          </label>
          <button id="cndbReviewBtn" disabled onclick="Pages._cndbSubmitForReview()"
            class="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition">
            Submit for Review
          </button>
          ${isAdmin ? `<button id="cndbMasterBtn" disabled onclick="Pages._cndbSubmitToMaster()"
            class="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition">
            Submit to Master
          </button>` : ''}
        </div>
        <button onclick="Pages._cndbExport()"
          class="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
          ${exportSvg} Export Excel
        </button>
      </div>`;

    const th = 'px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide';
    const header = `<tr>
      <th class="${th} w-8"></th>
      <th class="${th}">Packshot</th>
      <th class="${th}">Product Name</th>
      <th class="${th}">Brand</th>
      <th class="${th}">Category</th>
      <th class="${th}">Subcategory</th>
      <th class="${th}">Store</th>
      <th class="${th}">Detected</th>
      <th class="${th}">Images</th>
      <th class="${th}">Status</th>
      <th class="${th}">Actions</th>
    </tr>`;

    const body = items.length === 0
      ? `<tr><td colspan="11" class="px-4 py-8 text-center text-gray-400 text-sm">No competitor SKUs pending review.</td></tr>`
      : items.map(p => this._cndbRow(p, isAdmin)).join('');

    return `${toolbar}
    <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">${header}</thead>
        <tbody id="cndbTbody" class="divide-y divide-gray-100">${body}</tbody>
      </table>
    </div>`;
  },

  _cndbRow(p, isAdmin) {
    if (isAdmin === undefined) isAdmin = Auth.current().role === 'Admin';
    const rowBg = { 'Pending Review':'bg-amber-50', 'Approved':'bg-green-50', 'Rejected':'bg-red-50', 'Irrelevant':'bg-gray-50' }[p.status] || '';
    const editBtn        = p.status !== 'Approved' ? `<button onclick="Pages._cndbStartEdit('${p.id}')" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>` : '';
    const irrelevantBtn  = (p.status === 'New' || p.status === 'Rejected') ? `<button onclick="Pages._cndbFlagIrrelevant('${p.id}')" class="text-xs text-gray-400 hover:text-gray-600">Irrelevant</button>` : '';
    const restoreBtn     = p.status === 'Irrelevant' ? `<button onclick="Pages._cndbRestore('${p.id}')" class="text-xs text-blue-500 hover:text-blue-700">Restore</button>` : '';
    const rejectBtn      = (isAdmin && p.status === 'Pending Review') ? `<button onclick="Pages._cndbReject('${p.id}')" class="text-xs text-red-500 hover:text-red-700 font-medium">Reject</button>` : '';
    const actions        = [editBtn, irrelevantBtn, restoreBtn, rejectBtn].filter(Boolean).join(' ');
    return `<tr id="cndbRow_${p.id}" class="${rowBg} hover:bg-opacity-80 transition-colors">
      <td class="px-3 py-2"><input type="checkbox" class="cndbChk w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" data-id="${p.id}" data-status="${p.status}" onchange="Pages._cndbUpdateBtns()"></td>
      <td class="px-3 py-2"><img src="${p.packshot}" alt="${p.product_name}" class="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-100" loading="lazy"></td>
      <td class="px-3 py-2 font-medium text-gray-800 max-w-[180px] truncate" title="${p.product_name}">${p.product_name}</td>
      <td class="px-3 py-2">${p.brand}</td>
      <td class="px-3 py-2">${p.category}</td>
      <td class="px-3 py-2">${p.subcategory}</td>
      <td class="px-3 py-2 text-xs text-gray-500 max-w-[150px] truncate" title="${p.store}">${p.store}</td>
      <td class="px-3 py-2 text-xs text-gray-400">${p.detected_date}</td>
      <td class="px-3 py-2 text-xs text-gray-500">${p.image_count.toLocaleString()}</td>
      <td class="px-3 py-2">${this._cndbStatusBadge(p.status)}</td>
      <td class="px-3 py-2 flex gap-2 items-center">${actions}</td>
    </tr>`;
  },

  _cndbStartEdit(id) {
    const list = this._cndbGet();
    const p = list.find(x => x.id === id);
    if (!p) return;
    const row = document.getElementById(`cndbRow_${id}`);
    row.className = 'bg-blue-50 transition-colors';
    row.innerHTML = `
      <td class="px-3 py-2"></td>
      <td class="px-3 py-2"><img src="${p.packshot}" alt="" class="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-100"></td>
      <td class="px-3 py-2"><input id="cndbEname_${id}" value="${p.product_name}" class="w-40 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"></td>
      <td class="px-3 py-2"><input id="cndbEbrand_${id}" value="${p.brand}" class="w-24 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"></td>
      <td class="px-3 py-2"><input id="cndbEcat_${id}" value="${p.category}" class="w-28 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"></td>
      <td class="px-3 py-2"><input id="cndbEsub_${id}" value="${p.subcategory}" class="w-28 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"></td>
      <td class="px-3 py-2 text-xs text-gray-500">${p.store}</td>
      <td class="px-3 py-2 text-xs text-gray-400">${p.detected_date}</td>
      <td class="px-3 py-2 text-xs text-gray-500">${p.image_count.toLocaleString()}</td>
      <td class="px-3 py-2"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Editing</span></td>
      <td class="px-3 py-2 flex gap-2">
        <button onclick="Pages._cndbSaveEdit('${id}')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-medium">Save</button>
        <button onclick="Pages._cndbCancelEdit('${id}')" class="text-xs text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
      </td>`;
  },

  _cndbSaveEdit(id) {
    const list = this._cndbGet();
    const i = list.findIndex(x => x.id === id);
    if (i === -1) return;
    list[i].product_name = document.getElementById(`cndbEname_${id}`).value.trim();
    list[i].brand        = document.getElementById(`cndbEbrand_${id}`).value.trim();
    list[i].category     = document.getElementById(`cndbEcat_${id}`).value.trim();
    list[i].subcategory  = document.getElementById(`cndbEsub_${id}`).value.trim();
    this._cndbSave(list);
    document.getElementById(`cndbRow_${id}`).outerHTML = this._cndbRow(list[i], Auth.current().role === 'Admin');
    this._cndbUpdateBtns();
  },

  _cndbCancelEdit(id) {
    const list = this._cndbGet();
    const p = list.find(x => x.id === id);
    if (!p) return;
    document.getElementById(`cndbRow_${id}`).outerHTML = this._cndbRow(p, Auth.current().role === 'Admin');
    this._cndbUpdateBtns();
  },

  _cndbFlagIrrelevant(id) {
    const list = this._cndbGet();
    const i = list.findIndex(x => x.id === id);
    if (i === -1) return;
    list[i].status = 'Irrelevant';
    this._cndbSave(list);
    document.getElementById(`cndbRow_${id}`).outerHTML = this._cndbRow(list[i], Auth.current().role === 'Admin');
    this._cndbUpdateBtns();
  },

  _cndbRestore(id) {
    const list = this._cndbGet();
    const i = list.findIndex(x => x.id === id);
    if (i === -1) return;
    list[i].status = 'New';
    this._cndbSave(list);
    document.getElementById(`cndbRow_${id}`).outerHTML = this._cndbRow(list[i], Auth.current().role === 'Admin');
    this._cndbUpdateBtns();
  },

  _cndbReject(id) {
    if (Auth.current().role !== 'Admin') return;
    const list = this._cndbGet();
    const i = list.findIndex(x => x.id === id);
    if (i === -1) return;
    list[i].status = 'Rejected';
    this._cndbSave(list);
    document.getElementById(`cndbRow_${id}`).outerHTML = this._cndbRow(list[i], true);
    this._cndbUpdateBtns();
    Utils.toast('Row rejected and returned for rework.', 'warning');
  },

  _cndbToggleAll(checked) {
    document.querySelectorAll('.cndbChk').forEach(c => { c.checked = checked; });
    this._cndbUpdateBtns();
  },

  _cndbUpdateBtns() {
    const chks        = [...document.querySelectorAll('.cndbChk')];
    const checked     = chks.filter(c => c.checked);
    const hasReviewable    = checked.some(c => c.dataset.status === 'New' || c.dataset.status === 'Rejected');
    const hasPendingReview = checked.some(c => c.dataset.status === 'Pending Review');
    const reviewBtn   = document.getElementById('cndbReviewBtn');
    const masterBtn   = document.getElementById('cndbMasterBtn');
    if (reviewBtn) reviewBtn.disabled = !hasReviewable;
    if (masterBtn) masterBtn.disabled = !hasPendingReview;
    const allChk = document.getElementById('cndbChkAll');
    if (allChk) {
      allChk.indeterminate = checked.length > 0 && checked.length < chks.length;
      allChk.checked = chks.length > 0 && checked.length === chks.length;
    }
  },

  _cndbSubmitForReview() {
    const list = this._cndbGet();
    const ids  = [...document.querySelectorAll('.cndbChk:checked')]
      .filter(c => c.dataset.status === 'New' || c.dataset.status === 'Rejected')
      .map(c => c.dataset.id);
    if (!ids.length) return;
    ids.forEach(id => { const i = list.findIndex(x => x.id === id); if (i !== -1) list[i].status = 'Pending Review'; });
    this._cndbSave(list);
    Utils.toast(`${ids.length} SKU(s) submitted for admin review.`, 'success');
    document.getElementById('mdTabContent').innerHTML = this._cndbTable();
  },

  _cndbSubmitToMaster() {
    if (Auth.current().role !== 'Admin') return;
    const list  = this._cndbGet();
    const ids   = [...document.querySelectorAll('.cndbChk:checked')]
      .filter(c => c.dataset.status === 'Pending Review')
      .map(c => c.dataset.id);
    if (!ids.length) return;
    const cpAdd = JSON.parse(localStorage.getItem('cpAdditions') || '[]');
    ids.forEach(id => {
      const i = list.findIndex(x => x.id === id);
      if (i === -1) return;
      list[i].status = 'Approved';
      cpAdd.push({ id:list[i].id, sku:list[i].id, name:list[i].product_name, brand:list[i].brand, category:list[i].category, subcategory:list[i].subcategory, packshot:list[i].packshot, market:'m1', source:'CNDB' });
    });
    localStorage.setItem('cpAdditions', JSON.stringify(cpAdd));
    this._cndbSave(list);
    Utils.toast(`${ids.length} SKU(s) approved and added to Competitor Products.`, 'success');
    document.getElementById('mdTabContent').innerHTML = this._cndbTable();
  },

  _cndbExport() {
    const list = this._cndbGet();
    if (!list.length) { Utils.toast('No CNDB SKUs to export.', 'warning'); return; }
    const rows = list.map(p => ({
      ID: p.id, 'Product Name': p.product_name,
      Brand: p.brand, Category: p.category, Subcategory: p.subcategory,
      Store: p.store, 'Detected Date': p.detected_date, 'Image Count': p.image_count, Status: p.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CNDB SKU');
    XLSX.writeFile(wb, 'CNDB_SKU_Export.xlsx');
    Utils.toast('CNDB SKU export downloaded.', 'success');
  },

  // ─── Helper: keyword match across all object values ─────────────────────────
  _kwMatch(obj, kw) {
    if (!kw) return true;
    return Object.values(obj).some(v => String(v ?? '').toLowerCase().includes(kw));
  },

  // ─── Store Report ──────────────────────────────────────────────────────────
  storeReport() {
    const u   = Auth.current();
    const tpl = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.type === 'builtin' && t.level === 'store')
              || { level:'store', columns: Data.AVAILABLE_COLUMNS.store.map(c=>c.key), filters:['f_region','f_status','f_date'] };
    App.currentTemplate = tpl;
    App.currentData     = [...Data.STORE_KPIS];
    App.pageSize        = 100;
    App.page            = 1;
    App.currentFilters  = (Data.AVAILABLE_FILTERS.store || []).filter(f => tpl.filters.includes(f.id));
    App.renderFilter    = () => Pages._buildRenderFilter(tpl);
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Store Report</h1>
        <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">KPIs aggregated at store level</span>
      </div>
      ${Utils.keywordSearch()}
      ${App.currentFilters.length ? Utils.filterChips(App.currentFilters) : ''}
      <div id="reportTable"></div>
      <div id="reportPager"></div>
    </div>`;
  },

  afterStoreReport() { App.applyFilters(); },

  _storeKpiRows(data) {
    return data.map(k => Utils.tr([
      `<span class="font-medium text-gray-800">${k.store_name}</span>`,
      k.region, k.city,
      Utils.badge(k.status, k.status === 'Active' ? 'success' : 'inactive'),
      Utils.fmtScore(k.compliance_pct),
      `${k.share_of_shelf.toFixed(1)}%`,
      k.num_visits, k.images_captured,
      Utils.fmtScore(k.avg_quality_score),
      `${k.oos_rate.toFixed(1)}%`,
      k.last_visit,
    ]));
  },

  // ─── Asset Report ──────────────────────────────────────────────────────────
  assetReport() {
    const u   = Auth.current();
    const tpl = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.type === 'builtin' && t.level === 'asset')
              || { level:'asset', columns: Data.AVAILABLE_COLUMNS.asset.map(c=>c.key), filters:['f_brand','f_cond','f_date'] };
    App.currentTemplate = tpl;
    App.currentData     = [...Data.ASSET_KPIS];
    App.pageSize        = 100;
    App.page            = 1;
    App.currentFilters  = (Data.AVAILABLE_FILTERS.asset || []).filter(f => tpl.filters.includes(f.id));
    App.renderFilter    = () => Pages._buildRenderFilter(tpl);
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Asset Report</h1>
        <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">KPIs at individual asset / display unit level</span>
      </div>
      ${Utils.keywordSearch()}
      ${App.currentFilters.length ? Utils.filterChips(App.currentFilters) : ''}
      <div id="reportTable"></div>
      <div id="reportPager"></div>
    </div>`;
  },

  afterAssetReport() { App.applyFilters(); },

  _assetKpiRows(data) {
    return data.map(k => Utils.tr([
      `<span class="font-mono text-xs">${k.asset_id}</span>`,
      k.asset_name,
      `<span class="font-medium text-gray-700">${k.store_name}</span>`,
      k.brand,
      Utils.badge(k.condition, k.condition==='Excellent'?'success':k.condition==='Good'?'info':k.condition==='Fair'?'warning':'danger'),
      Utils.scoreBar(k.compliance_score),
      `<span class="${k.facings_actual < k.facings_required ? 'text-red-600 font-semibold' : 'text-gray-700'}">${k.facings_actual} / ${k.facings_required}</span>`,
      Utils.fmtScore(k.planogram_compliance),
      k.last_capture,
    ]));
  },

  // ─── SKU Report ────────────────────────────────────────────────────────────
  skuReport() {
    const u   = Auth.current();
    const tpl = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.type === 'builtin' && t.level === 'sku')
              || { level:'sku', columns: Data.AVAILABLE_COLUMNS.sku.map(c=>c.key), filters:['f_brand','f_category','f_date'] };
    App.currentTemplate = tpl;
    App.currentData     = [...Data.SKU_KPIS];
    App.pageSize        = 100;
    App.page            = 1;
    App.currentFilters  = (Data.AVAILABLE_FILTERS.sku || []).filter(f => tpl.filters.includes(f.id));
    App.renderFilter    = () => Pages._buildRenderFilter(tpl);
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">SKU Report</h1>
        <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">KPIs at product / SKU level</span>
      </div>
      ${Utils.keywordSearch()}
      ${App.currentFilters.length ? Utils.filterChips(App.currentFilters) : ''}
      <div id="reportTable"></div>
      <div id="reportPager"></div>
    </div>`;
  },

  afterSkuReport() { App.applyFilters(); },

  _skuKpiRows(data) {
    return data.map(k => Utils.tr([
      `<span class="font-mono text-xs font-medium">${k.sku}</span>`,
      `<span class="font-medium text-gray-700">${k.product_name}</span>`,
      k.brand,
      Utils.badge(k.category, 'info'),
      k.store_name,
      k.facings,
      Utils.fmtScore(k.planogram_compliance),
      Utils.fmtScore(k.weighted_distribution),
      `<span class="${k.oos_rate > 15 ? 'text-red-600 font-semibold' : 'text-gray-700'}">${k.oos_rate.toFixed(1)}%</span>`,
      k.last_updated,
    ]));
  },

  // ─── Image Quality Report ──────────────────────────────────────────────────
  imageQuality() {
    App.currentData = [...Data.IMAGE_QUALITY];
    App.pageSize    = 100;
    App.page        = 1;
    App.currentFilters = [
      { id:'f_fraud',  type:'select', label:'Fraud Type', options:['Photo of Photo','No SKU','Duplicate Image'] },
      { id:'f_store',  type:'select', label:'Store',      options:[...new Set(Data.IMAGE_QUALITY.map(i => i.store_name))] },
      { id:'f_status', type:'select', label:'Status',     options:['Flagged','Clean'] },
      { id:'f_date',   type:'date',   label:'Date Range' },
    ];
    App.renderFilter = () => {
      const kw     = document.getElementById('kw_search')?.value?.toLowerCase() || '';
      const fraud  = document.getElementById('f_fraud')?.value;
      const store  = document.getElementById('f_store')?.value;
      const status = document.getElementById('f_status')?.value;
      const dtFrom = document.getElementById('f_date_from')?.value;
      const dtTo   = document.getElementById('f_date_to')?.value;
      return Data.IMAGE_QUALITY.filter(k =>
        (!fraud  || k.fraud_type === fraud)  &&
        (!store  || k.store_name === store)  &&
        (!status || k.status     === status) &&
        (!dtFrom || k.capture_date >= dtFrom) &&
        (!dtTo   || k.capture_date <= dtTo)   &&
        Pages._kwMatch(k, kw)
      );
    };
    const flagged = Data.IMAGE_QUALITY.filter(i => i.status === 'Flagged').length;
    const byType  = ['Photo of Photo','No SKU','Duplicate Image'].map(t => Data.IMAGE_QUALITY.filter(i => i.fraud_type === t).length);
    return `
    <div class="space-y-4">
      <h1 class="text-2xl font-bold text-gray-800">Image Quality Report</h1>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${Utils.kpiCard('🖼️','Total Images', Data.IMAGE_QUALITY.length, 'this period', 'blue')}
        ${Utils.kpiCard('🚨','Flagged', flagged, 'requiring review', 'red')}
        ${Utils.kpiCard('📷','Photo of Photo', byType[0], 'fraud flags', 'amber')}
        ${Utils.kpiCard('📦','No SKU', byType[1], 'fraud flags', 'amber')}
      </div>
      ${Utils.keywordSearch()}
      ${Utils.filterChips(App.currentFilters)}
      <div id="reportTable"></div>
      <div id="reportPager"></div>
    </div>`;
  },

  afterImageQuality() { App.applyFilters(); },

  _imgQualRows(data) {
    return data.map(k => {
      const isFlagged  = k.status === 'Flagged';
      const isLowScore = k.quality_score < 60;
      const rowCls = isFlagged
        ? 'bg-red-50 border-l-4 border-l-red-400'
        : isLowScore
          ? 'bg-amber-50 border-l-4 border-l-amber-300'
          : '';
      return Utils.tr([
        `<span class="font-mono text-xs">${k.id}</span>`,
        k.store_name, k.user_name,
        k.fraud_type
          ? `<span class="inline-flex items-center gap-1">${{
              'Photo of Photo':'📷','No SKU':'📦','Duplicate Image':'🔄'
            }[k.fraud_type] || '⚠️'} ${Utils.badge(k.fraud_type, 'danger')}</span>`
          : '<span class="text-gray-300">—</span>',
        Utils.badge(k.status, isFlagged ? 'danger' : 'success'),
        Utils.scoreBar(k.quality_score),
        k.brand, k.capture_date,
        isFlagged
          ? `<button onclick="Pages.reviewImage('${k.id}')" class="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg transition font-medium">Review</button>`
          : `<span class="text-xs text-green-600 font-medium">✓ Clean</span>`,
      ], rowCls);
    });
  },

  reviewImage(id)   { Utils.toast(`Image ${id} marked as reviewed`, 'success'); },
  downloadImage(id) { Utils.toast(`Download started — ${id}`, 'info'); },

  // ─── Image Repository ──────────────────────────────────────────────────────
  imageRepository() {
    const totalG   = Data.IMAGE_GALLERY.length;
    const flaggedG = Data.IMAGE_GALLERY.filter(i => i.fraud_types.length > 0).length;
    const cleanG   = totalG - flaggedG;
    const tabCls = active => `px-4 py-2 text-sm font-medium border-b-2 transition ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Image Repository</h1>
        <span id="ir_count" class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full"></span>
      </div>
      <div class="flex gap-0 border-b border-gray-200">
        <button id="irTab0" onclick="Pages._irSwitchTab(0)" class="${tabCls(true)}">Image View</button>
        <button id="irTab1" onclick="Pages._irSwitchTab(1)" class="${tabCls(false)}">Visit View</button>
      </div>
      <!-- Quality summary / flag filter bar (rendered dynamically) -->
      <div id="ir_quality_bar" class="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"></div>
      <!-- Shared search & filters -->
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
          </svg>
        </span>
        <input id="ir_search" type="text" placeholder="Search by store, retailer, brand, SKU, asset name…"
          oninput="Pages._irRefresh()"
          class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-sm bg-white outline-none transition shadow-sm" />
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <select id="ir_brand" onchange="Pages._irRefresh()"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Brands</option>
          ${['Coca-Cola','PepsiCo','Dr Pepper','Monster','Red Bull'].map(b => `<option>${b}</option>`).join('')}
        </select>
        <select id="ir_retailer" onchange="Pages._irRefresh()"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Retailers</option>
          ${['Walmart','Kroger','Target','Costco','Publix','H-E-B','Whole Foods','Albertsons'].map(r => `<option>${r}</option>`).join('')}
        </select>
        <div class="flex items-center gap-1">
          <span class="text-xs text-gray-500">Visit date</span>
          <input id="ir_date_from" type="date" onchange="Pages._irRefresh()"
            class="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none" />
          <span class="text-xs text-gray-400">–</span>
          <input id="ir_date_to" type="date" onchange="Pages._irRefresh()"
            class="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onclick="Pages._irRefresh(true)"
          class="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 h-9 hover:bg-gray-50 transition">Clear</button>
      </div>
      <!-- Tab content area -->
      <div id="irTabContent"></div>
    </div>
    <!-- Two-panel image detail overlay -->
    <div id="imgDetailOverlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm hidden"
      onclick="if(event.target===this)Pages._irCloseDetail()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div id="imgDetailHeader" class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 class="font-semibold text-gray-800 text-lg">Image Detail</h3>
          <div class="flex items-center gap-2">
            <button id="imgDetailDownload"
              class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download
            </button>
            <button onclick="Pages._irCloseDetail()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>
        <div id="imgDetailBody" class="flex overflow-hidden flex-1 min-h-0"></div>
      </div>
    </div>`;
  },

  afterImageRepository() {
    App._irCurrentTab = 0;
    App._irFraudFilters = new Set();
    Pages._irRenderFraudPills();
    Pages._irRefresh();
  },

  _setGalleryFraudFilter(fraudType) {
    App._irFraudFilters = new Set([fraudType]);
    this._irRenderFraudPills();
    this._irRefresh();
  },

  _irRenderFraudPills() {
    const f = App._irFraudFilters || (App._irFraudFilters = new Set());
    const container = document.getElementById('ir_quality_bar');
    if (!container) return;
    const totalG   = Data.IMAGE_GALLERY.length;
    const cleanG   = Data.IMAGE_GALLERY.filter(i => i.fraud_types.length === 0).length;
    const flaggedG = totalG - cleanG;
    const off = 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50';
    const pill = (val, label, active, onCls) =>
      `<button onclick="Pages._irToggleFraud('${val}')"
        class="text-xs px-2.5 py-1.5 rounded-full border transition font-medium whitespace-nowrap ${active ? onCls : off}">
        ${label}
      </button>`;
    const fraudCounts = Data.FRAUD_TYPES
      .map(ft => ({ ft, ct: Data.IMAGE_GALLERY.filter(i => i.fraud_types.includes(ft)).length }))
      .filter(x => x.ct > 0);
    container.innerHTML = `<div class="flex flex-wrap items-center gap-2">
      ${pill('', 'All ' + totalG, f.size === 0, 'bg-blue-600 border-blue-600 text-white')}
      ${pill('__clean__', '✓ ' + cleanG + ' Clean', f.has('__clean__'), 'bg-green-600 border-green-600 text-white')}
      ${pill('__flagged__', '⚑ ' + flaggedG + ' Flagged', f.has('__flagged__'), 'bg-amber-500 border-amber-500 text-white')}
      <span class="text-gray-200">|</span>
      ${fraudCounts.map(({ft, ct}) => pill(ft, ct + ' ' + ft, f.has(ft), 'bg-red-500 border-red-500 text-white')).join('')}
    </div>`;
  },

  _irToggleFraud(value) {
    if (!App._irFraudFilters) App._irFraudFilters = new Set();
    const f = App._irFraudFilters;
    if (value === '') {
      f.clear();
    } else if (value === '__clean__') {
      f.clear(); f.add('__clean__');
    } else if (value === '__flagged__') {
      f.clear(); f.add('__flagged__');
    } else {
      f.delete('__clean__'); f.delete('__flagged__');
      if (f.has(value)) f.delete(value); else f.add(value);
    }
    this._irRenderFraudPills();
    this._irRefresh();
  },

  _irSwitchTab(idx) {
    App._irCurrentTab = idx;
    const tabCls = active => `px-4 py-2 text-sm font-medium border-b-2 transition ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;
    const t0 = document.getElementById('irTab0');
    const t1 = document.getElementById('irTab1');
    if (t0) t0.className = tabCls(idx === 0);
    if (t1) t1.className = tabCls(idx === 1);
    this._irRefresh();
  },

  _irRefresh(reset = false) {
    if (reset) {
      ['ir_search','ir_brand','ir_retailer','ir_date_from','ir_date_to'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      App._irFraudFilters = new Set();
      this._irRenderFraudPills();
    }
    const tab = App._irCurrentTab ?? 0;
    if (tab === 0) this.filterGallery();
    else this._filterVisitView();
  },

  _irFilteredImgs() {
    const search   = document.getElementById('ir_search')?.value?.toLowerCase() || '';
    const brand    = document.getElementById('ir_brand')?.value    || '';
    const retailer = document.getElementById('ir_retailer')?.value || '';
    const dateFrom = document.getElementById('ir_date_from')?.value || '';
    const dateTo   = document.getElementById('ir_date_to')?.value   || '';
    const filters  = App._irFraudFilters || new Set();
    return Data.IMAGE_GALLERY.filter(i => {
      const ftMatch = filters.size === 0 ? true
        : filters.has('__clean__')   ? i.fraud_types.length === 0
        : filters.has('__flagged__') ? i.fraud_types.length > 0
        : [...filters].some(ft => i.fraud_types.includes(ft));
      return ftMatch &&
        (!search   || [i.retailer, i.brand, i.sku, i.asset_name, i.store_name, i.visit_id].some(v => String(v).toLowerCase().includes(search))) &&
        (!brand    || i.brand    === brand)    &&
        (!retailer || i.retailer === retailer) &&
        (!dateFrom || i.visit_date >= dateFrom) &&
        (!dateTo   || i.visit_date <= dateTo);
    });
  },

  _irCloseDetail() {
    document.getElementById('imgDetailOverlay')?.classList.add('hidden');
  },

  filterGallery(reset = false) {
    if (reset) {
      ['ir_search','ir_brand','ir_retailer','ir_date_from','ir_date_to'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      App._irFraudFilters = new Set();
      this._irRenderFraudPills();
    }
    const imgs = this._irFilteredImgs();
    const countEl = document.getElementById('ir_count');
    if (countEl) countEl.textContent = `${imgs.length} image${imgs.length !== 1 ? 's' : ''}`;

    const sc = s => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-400' : 'bg-red-400';
    const st = s => s >= 80 ? 'text-green-700' : s >= 60 ? 'text-amber-700' : 'text-red-600';

    const tc = document.getElementById('irTabContent');
    if (!tc) return;
    tc.innerHTML = imgs.length
      ? `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${
        imgs.map(i => `
        <div onclick="Pages.showImageDetail('${i.id}')"
          class="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200">
          <div class="relative h-48 flex flex-col items-center justify-center overflow-hidden"
            style="background:linear-gradient(135deg,#${i.color}18 0%,#${i.color}08 100%);">
            <div class="w-full px-4 space-y-1.5 opacity-65">
              ${[0,1,2,3].map(() => `
              <div class="flex gap-1 justify-center">
                ${Array.from({length:6},(_,ci) => `
                <div class="rounded-sm flex-1 h-8 flex items-end justify-center pb-1"
                  style="background:#${i.color}${['44','33','55','22','44','33'][ci]}">
                  <div class="w-0.5 h-2 rounded-full" style="background:#${i.color}99"></div>
                </div>`).join('')}
              </div>
              <div class="h-0.5 bg-gray-300 rounded mx-1 opacity-40"></div>`).join('')}
            </div>
            <div class="absolute top-2 left-2 bg-white/90 backdrop-blur rounded px-1.5 py-0.5 text-xs font-mono text-gray-500 shadow-sm">${i.id}</div>
            <div class="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur rounded px-1.5 py-0.5 shadow-sm">
              <div class="w-1.5 h-1.5 rounded-full ${sc(i.quality_score)}"></div>
              <span class="text-xs font-semibold ${st(i.quality_score)}">${i.quality_score.toFixed(0)}</span>
            </div>
            ${i.outside_fence ? `<div class="absolute bottom-8 left-2 bg-orange-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Outside Fence</div>` : ''}
            <button onclick="event.stopPropagation();Pages.downloadImage('${i.id}')" title="Download"
              class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1.5 shadow-sm hover:bg-blue-50 hover:text-blue-600 text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </button>
          </div>
          <div class="p-3 border-t border-gray-100">
            <p class="text-xs font-mono text-blue-600 mb-0.5">${i.visit_id}</p>
            <p class="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">${i.store_name}</p>
            <p class="text-xs text-gray-500 mt-0.5">${i.asset_name}</p>
            <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="${sc(i.quality_score)} h-1.5 rounded-full" style="width:${i.quality_score}%"></div>
            </div>
            ${i.fraud_types.length > 0
              ? `<div class="mt-1.5 flex flex-wrap gap-1">
                  ${i.fraud_types.slice(0,2).map(ft => `<span class="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">${ft}</span>`).join('')}
                  ${i.fraud_types.length > 2 ? `<span class="text-[10px] text-gray-400">+${i.fraud_types.length-2}</span>` : ''}
                </div>`
              : `<p class="mt-1 text-[10px] text-green-600">✓ Clean</p>`}
          </div>
        </div>`).join('')
      }</div>`
      : `<p class="text-center text-gray-400 py-16 text-sm">No images match your filters.</p>`;
  },

  _filterVisitView() {
    const imgs = this._irFilteredImgs();
    const countEl = document.getElementById('ir_count');
    if (countEl) countEl.textContent = `${imgs.length} image${imgs.length !== 1 ? 's' : ''}`;
    const tc = document.getElementById('irTabContent');
    if (!tc) return;

    if (imgs.length === 0) {
      tc.innerHTML = `<p class="text-center text-gray-400 py-16 text-sm">No images match your filters.</p>`;
      return;
    }

    const visitMap = new Map();
    imgs.forEach(img => {
      if (!visitMap.has(img.visit_id)) visitMap.set(img.visit_id, { date: img.visit_date, store: img.store_name, images: [] });
      visitMap.get(img.visit_id).images.push(img);
    });
    const sortedVisits = [...visitMap.entries()].sort((a, b) => b[1].date.localeCompare(a[1].date));
    const dateGroups = new Map();
    sortedVisits.forEach(([vid, v]) => {
      if (!dateGroups.has(v.date)) dateGroups.set(v.date, []);
      dateGroups.get(v.date).push([vid, v]);
    });

    const sc = s => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-400' : 'bg-red-400';
    const fmtDate = d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }); };

    tc.innerHTML = [...dateGroups.entries()].map(([date, visits]) => `
      <div class="mb-6">
        <div class="sticky top-0 bg-gray-50 py-2 px-3 rounded-lg mb-3 border border-gray-200 z-10">
          <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">${fmtDate(date)}</span>
          <span class="ml-2 text-xs text-gray-400">${visits.length} visit${visits.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="space-y-3">
          ${visits.map(([vid, v]) => {
            const allImgs = v.images;
            const flagged  = allImgs.filter(i => i.fraud_types.length > 0).length;
            const avgScore = allImgs.reduce((a, i) => a + i.quality_score, 0) / allImgs.length;
            const sCls = avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-600';
            return `<div class="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <span class="text-sm font-mono font-semibold text-blue-600">${vid}</span>
                  <p class="text-sm font-medium text-gray-800 mt-0.5">${v.store}</p>
                </div>
                <div class="text-right">
                  <span class="text-xs font-semibold ${sCls}">${avgScore.toFixed(0)}% avg quality</span>
                  ${flagged > 0 ? `<p class="text-xs text-red-500 mt-0.5">${flagged} flagged</p>` : `<p class="text-xs text-green-600 mt-0.5">✓ All clean</p>`}
                </div>
              </div>
              <div class="flex gap-2 overflow-x-auto pb-1">
                ${allImgs.map(img => `
                <div onclick="Pages.showImageDetail('${img.id}')"
                  class="flex-shrink-0 cursor-pointer group relative rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition"
                  style="width:88px;height:72px;background:linear-gradient(135deg,#${img.color}20,#${img.color}0a)">
                  <div class="absolute inset-0 flex flex-col justify-center px-1.5 space-y-0.5 opacity-55">
                    ${[0,1,2].map(() => `
                    <div class="flex gap-0.5">
                      ${Array.from({length:4},(_,ci)=>`<div class="flex-1 rounded-sm h-3" style="background:#${img.color}${['44','33','55','22'][ci]}"></div>`).join('')}
                    </div>
                    <div class="h-px bg-white/50"></div>`).join('')}
                  </div>
                  <div class="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition"></div>
                  <div class="absolute top-1 right-1 w-2 h-2 rounded-full ${sc(img.quality_score)}"></div>
                  ${img.fraud_types.length > 0 ? `<div class="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500"></div>` : ''}
                  <div class="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[8px] px-1 py-0.5 truncate">${img.asset_name}</div>
                </div>`).join('')}
              </div>
              <div class="flex flex-wrap gap-1.5 mt-2.5">
                <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">${allImgs.length} captures</span>
                ${allImgs[0]?.route ? `<span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">${allImgs[0].route}</span>` : ''}
                ${allImgs[0]?.outside_fence ? `<span class="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded">Outside Fence</span>` : ''}
                ${allImgs[0]?.user_name ? `<span class="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded">By ${allImgs[0].user_name}</span>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  },

  showImageDetail(id) {
    const img = Data.IMAGE_GALLERY.find(i => i.id === id);
    if (!img) return;
    const overlay = document.getElementById('imgDetailOverlay');
    if (!overlay) return;

    document.querySelector('#imgDetailHeader h3').textContent = `${img.id} · ${img.asset_name}`;
    const dlBtn = document.getElementById('imgDetailDownload');
    if (dlBtn) dlBtn.onclick = () => Pages.downloadImage(img.id);

    const scBar  = img.quality_score >= 80 ? 'bg-green-500' : img.quality_score >= 60 ? 'bg-amber-400' : 'bg-red-400';
    const scText = img.quality_score >= 80 ? 'text-green-600' : img.quality_score >= 60 ? 'text-amber-600' : 'text-red-600';

    document.getElementById('imgDetailBody').innerHTML = `
      <!-- Left panel: captured shelf image + metadata -->
      <div class="flex-1 flex flex-col border-r border-gray-100 overflow-y-auto min-w-0">
        <div class="relative flex-shrink-0"
          style="background:linear-gradient(135deg,#${img.color}22,#${img.color}0a);height:260px;display:flex;align-items:center;justify-content:center;">
          <div class="w-full px-6 space-y-2 opacity-70">
            ${[0,1,2,3].map(() => `
            <div class="flex gap-1.5 justify-center">
              ${Array.from({length:6},(_,ci) => `
              <div class="rounded-sm flex-1 h-11 flex flex-col items-center justify-end pb-1.5"
                style="background:#${img.color}${['44','33','55','22','44','33'][ci]}">
                <div class="w-1 h-3.5 rounded-full opacity-70" style="background:#${img.color}cc"></div>
              </div>`).join('')}
            </div>
            <div class="h-1 bg-white/40 rounded mx-2"></div>`).join('')}
          </div>
          ${img.outside_fence ? `<div class="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-md shadow">Outside Fence</div>` : ''}
          <div class="absolute top-2 right-2 bg-white/95 rounded-lg px-2 py-1 shadow-sm flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full ${scBar}"></div>
            <span class="text-xs font-semibold ${scText}">${img.quality_score.toFixed(0)}%</span>
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div class="grid grid-cols-2 gap-x-6 gap-y-2.5">
            ${[['Visit ID',img.visit_id],['Visit Date',img.visit_date],
               ['Store',img.store_name],['Retailer',img.retailer],
               ['Brand',img.brand],['SKU',img.sku],
               ['Asset',img.asset_name],['Route',img.route||'—'],
               ['Captured by',img.user_name||'—'],['Quality',img.quality_score.toFixed(1)+'%']]
              .map(([k,v]) => `<div><p class="text-xs text-gray-400">${k}</p><p class="font-medium text-gray-800 text-sm">${v}</p></div>`).join('')}
          </div>
          ${img.fraud_types.length > 0 ? `
          <div class="border-t pt-3">
            <p class="text-xs font-semibold text-red-600 mb-2">⚑ Fraud Flags Detected</p>
            <div class="flex flex-wrap gap-1.5">
              ${img.fraud_types.map(ft => `<span class="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg font-medium">${ft}</span>`).join('')}
            </div>
          </div>` : `
          <div class="border-t pt-3">
            <p class="text-xs font-semibold text-green-600">✓ No fraud flags — image is clean</p>
          </div>`}
        </div>
      </div>
      <!-- Right panel: realogram -->
      <div class="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div class="px-5 pt-4 pb-3 border-b flex-shrink-0">
          <p class="text-sm font-semibold text-gray-700">Realogram</p>
          <p class="text-xs text-gray-400 mt-0.5">Shelf detection · 4 rows · 6 slots per row</p>
        </div>
        <div class="p-4 flex-1">
          ${Pages._irRealogram(img)}
        </div>
      </div>`;
    overlay.classList.remove('hidden');
  },

  _irRealogram(img) {
    let seed = img.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
    const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
    const brands = [
      { name:"Lay's",      short:'LAY', bg:'#FEF3C7', border:'#FCD34D', text:'#92400E' },
      { name:'Doritos',    short:'DOR', bg:'#FEE2E2', border:'#FCA5A5', text:'#991B1B' },
      { name:'Cheetos',    short:'CHE', bg:'#FFEDD5', border:'#FDBA74', text:'#9A3412' },
      { name:'Ruffles',    short:'RUF', bg:'#F0FDF4', border:'#86EFAC', text:'#14532D' },
      { name:'Tostitos',   short:'TOS', bg:'#EFF6FF', border:'#93C5FD', text:'#1E3A8A' },
      { name:'Fritos',     short:'FRI', bg:'#F5F3FF', border:'#C4B5FD', text:'#4C1D95' },
      { name:'Pringles',   short:'PRI', bg:'#FDF4FF', border:'#E879F9', text:'#701A75' },
      { name:'Kettle',     short:'KET', bg:'#ECFDF5', border:'#6EE7B7', text:'#064E3B' },
      { name:"Stacy's",    short:'STA', bg:'#FFF7ED', border:'#FED7AA', text:'#7C2D12' },
      { name:'Smartfood',  short:'SMF', bg:'#F0F9FF', border:'#7DD3FC', text:'#0C4A6E' },
      { name:'SunChips',   short:'SUN', bg:'#FEFCE8', border:'#FDE047', text:'#713F12' },
      { name:'Popcorners', short:'POP', bg:'#FFF1F2', border:'#FDA4AF', text:'#881337' },
    ];
    const ROWS = 4, COLS = 6;
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const cells = [];
      for (let c = 0; c < COLS; c++) {
        if (rng() < 0.18) {
          cells.push(`<div class="flex flex-col items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50" style="height:64px;min-width:0">
            <span class="text-[10px] text-gray-300 font-mono select-none">VOID</span>
          </div>`);
        } else {
          const b = brands[Math.floor(rng() * brands.length)];
          const conf = Math.floor(rng() * 20 + 78);
          cells.push(`<div class="flex flex-col items-center justify-between rounded border px-1 py-1.5 cursor-default select-none"
            style="background:${b.bg};border-color:${b.border};height:64px;min-width:0"
            title="${b.name} · ${conf}% confidence">
            <span class="text-xs font-bold leading-none" style="color:${b.text}">${b.short}</span>
            <span class="text-[9px] leading-tight text-center w-full truncate" style="color:${b.text};opacity:0.75">${b.name}</span>
            <span class="text-[8px] font-mono" style="color:${b.text};opacity:0.6">${conf}%</span>
          </div>`);
        }
      }
      rows.push(`<div class="mb-2">
        <div class="text-[10px] text-gray-400 font-mono mb-1">Row ${r+1}</div>
        <div class="grid gap-1" style="grid-template-columns:repeat(${COLS},minmax(0,1fr))">${cells.join('')}</div>
        <div class="mt-1.5 h-1.5 rounded bg-gray-200"></div>
      </div>`);
    }
    return `<div>${rows.join('')}</div>
    <div class="mt-3 border-t pt-3">
      <p class="text-xs font-semibold text-gray-500 mb-2">Brand Legend</p>
      <div class="flex flex-wrap gap-1.5">
        ${brands.map(b => `<span class="text-xs px-2 py-0.5 rounded border font-medium" style="background:${b.bg};border-color:${b.border};color:${b.text}">${b.short} ${b.name}</span>`).join('')}
        <span class="text-xs px-2 py-0.5 rounded border border-dashed border-gray-200 bg-gray-50 text-gray-400">VOID Empty</span>
      </div>
    </div>`;
  },

  // ─── User Management ───────────────────────────────────────────────────────
  userManagement() {
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">User Management</h1>
        <button onclick="Utils.openModal('addUserModal')"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
          + Add User
        </button>
      </div>
      <div id="userTable">${Pages._renderUserTable()}</div>
    </div>
    ${Utils.modal('addUserModal','Add New User',`
      <div class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
          <input id="nu_name" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jane Smith" /></div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input id="nu_email" type="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="jane@corp.com" /></div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select id="nu_role" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option>Regular</option><option>Manager</option><option>Admin</option>
          </select></div>
      </div>
    `, `<button onclick="Utils.closeModal('addUserModal')" class="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onclick="Pages.addUser()" class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add User</button>`)}`;
  },

  _renderUserTable() {
    const roleBadge = r => r==='Admin' ? Utils.badge(r,'info') : Utils.badge(r,'default');
    const cols = [
      { label:'Name',       key:'name',      sortable:true },
      { label:'Email',      key:'email',     sortable:true },
      { label:'Role',       key:'role',      sortable:true },
      { label:'Status',     key:'status',    sortable:true },
      { label:'Last Login', key:'lastLogin', sortable:true },
      { label:'Actions',    key:null,        sortable:false },
    ];
    const rows = Auth.marketUsers().map(u => Utils.tr([
      u.name, u.email, roleBadge(u.role),
      Utils.badge(u.status, u.status==='Active'?'success':'inactive'),
      u.lastLogin,
      `<div class="flex gap-2">
         <button onclick="Pages.toggleUserStatus('${u.id}')" class="text-xs border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition">${u.status==='Active'?'Revoke':'Activate'}</button>
         <button onclick="Pages.changeRole('${u.id}')"       class="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition">Change Role</button>
       </div>`,
    ]));
    return Utils.table(cols, rows);
  },

  addUser() {
    const name  = document.getElementById('nu_name')?.value?.trim();
    const email = document.getElementById('nu_email')?.value?.trim();
    const role  = document.getElementById('nu_role')?.value;
    if (!name || !email) { Utils.toast('Please fill in all fields', 'error'); return; }
    Data.USERS.push({ id:`u${Date.now()}`, name, email, role, market:Auth.current().market.id, status:'Active', lastLogin:'—' });
    Utils.closeModal('addUserModal');
    document.getElementById('userTable').innerHTML = Pages._renderUserTable();
    Utils.toast(`${name} added successfully`, 'success');
  },

  toggleUserStatus(id) {
    const user = Data.USERS.find(u => u.id === id);
    if (!user) return;
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    document.getElementById('userTable').innerHTML = Pages._renderUserTable();
    Utils.toast(`${user.name} ${user.status === 'Active' ? 'activated' : 'revoked'}`, 'info');
  },

  changeRole(id) {
    const user = Data.USERS.find(u => u.id === id);
    if (!user) return;
    const roles = ['Regular', 'Admin'];
    user.role = roles[(roles.indexOf(user.role) + 1) % 3];
    document.getElementById('userTable').innerHTML = Pages._renderUserTable();
    Utils.toast(`${user.name} role changed to ${user.role}`, 'info');
  },

  // ─── Dashboard Configuration ───────────────────────────────────────────────
  configureDashboard() {
    Utils.openModal('dashConfigModal');
  },

  saveDashboardConfig() {
    const u       = Auth.current();
    const widgets = Data.DASHBOARD_WIDGETS
      .filter(w => document.getElementById(`dw_${w.id}`)?.checked)
      .map(w => w.id);
    if (widgets.length === 0) { Utils.toast('Select at least one widget', 'error'); return; }
    Data.DASHBOARD_CONFIG[u.market.id].widgets = widgets;
    Utils.closeModal('dashConfigModal');
    App.navigate('dashboard');
    Utils.toast('Dashboard updated', 'success');
  },

  // ─── Template-driven report helpers ────────────────────────────────────────

  // Color rule helpers
  _numericTypes: new Set(['score','pct','bar','number','oos']),
  _colorTextCls: { red:'text-red-700 font-semibold', amber:'text-amber-700 font-semibold', green:'text-green-700 font-semibold', blue:'text-blue-700 font-semibold', purple:'text-purple-700 font-semibold' },
  _colorBadge:   { red:'danger', amber:'warning', green:'success', blue:'info', purple:'default' },

  _applyColorRules(colorRules, type, val) {
    if (!colorRules?.length) return null;
    const isNum = Pages._numericTypes.has(type);
    for (const rule of colorRules) {
      if (!rule.color) continue;
      if (isNum && rule.from !== undefined && rule.to !== undefined) {
        const n = +val;
        if (!isNaN(n) && n >= rule.from && n <= rule.to) {
          const cls = Pages._colorTextCls[rule.color] || '';
          const formatted = (type === 'score' || type === 'pct' || type === 'oos') ? (+val).toFixed(1) + '%' : String(val);
          return `<span class="${cls}">${formatted}</span>`;
        }
      } else if (!isNum && rule.value !== undefined && String(val) === String(rule.value)) {
        return Utils.badge(String(val), Pages._colorBadge[rule.color] || 'default');
      }
    }
    return null;
  },

  // Format a single cell value based on column type + optional color rules
  _formatCell(type, val, row, colorRules) {
    if (val === undefined || val === null) return '<span class="text-gray-300">—</span>';
    const colored = Pages._applyColorRules(colorRules, type, val);
    if (colored !== null) return colored;
    switch (type) {
      case 'score':     return Utils.fmtScore(+val);
      case 'pct':       return `${(+val).toFixed(1)}%`;
      case 'bar':       return Utils.scoreBar(+val);
      case 'number':    return String(val);
      case 'date':      return String(val);
      case 'mono':      return `<span class="font-mono text-xs text-gray-500">${val}</span>`;
      case 'status':    return Utils.badge(String(val), val === 'Active' ? 'success' : 'inactive');
      case 'badge':     return Utils.badge(String(val), 'info');
      case 'condition': return Utils.badge(String(val), val==='Excellent'?'success':val==='Good'?'info':val==='Fair'?'warning':'danger');
      case 'oos':       return `<span class="${+val > 15 ? 'text-red-600 font-semibold' : 'text-gray-700'}">${(+val).toFixed(1)}%</span>`;
      case 'facings':   return `<span class="${row.facings_actual < row.facings_required ? 'text-red-600 font-semibold' : 'text-gray-700'}">${row.facings_actual} / ${row.facings_required}</span>`;
      default:          return `<span class="text-gray-700">${val}</span>`;
    }
  },

  // Render table rows dynamically from a template's column config
  _dynamicRows(data, cols, level) {
    const allCols = Data.AVAILABLE_COLUMNS[level] || [];
    const tpl     = App.currentTemplate;
    return data.map(row => Utils.tr(
      cols.map(col => {
        const def        = allCols.find(c => c.key === col.key);
        const colorRules = tpl?.columnConfig?.[col.key]?.colorRules || [];
        const base       = Pages._formatCell(def?.type || 'text', row[col.key], row, colorRules);
        // Make ID columns clickable to image repository
        if (col.key === 'store_id' && row.store_name)
          return `<button onclick="Pages._goToImageRepo('${row.store_name.replace(/'/g,"\\'")}');" class="font-mono text-xs text-blue-600 hover:underline">${row[col.key]}</button>`;
        if (col.key === 'asset_id' && row.asset_name)
          return `<button onclick="Pages._goToImageRepo('${row.asset_name.replace(/'/g,"\\'")}');" class="font-mono text-xs text-blue-600 hover:underline">${row[col.key]}</button>`;
        if (col.key === 'sku')
          return `<button onclick="Pages._goToImageRepo('${String(row[col.key]).replace(/'/g,"\\'")}');" class="font-mono text-xs text-blue-600 hover:underline">${row[col.key]}</button>`;
        return base;
      })
    ));
  },

  // Build a renderFilter function for any template
  _buildRenderFilter(tpl) {
    const sourceData = { store: Data.STORE_KPIS, asset: Data.ASSET_KPIS, sku: Data.SKU_KPIS }[tpl.level] || [];
    const kw         = document.getElementById('kw_search')?.value?.toLowerCase() || '';
    const dateField  = { store:'last_visit', asset:'last_capture', sku:'last_updated' }[tpl.level];
    const dtFrom     = document.getElementById('f_date_from')?.value || '';
    const dtTo       = document.getElementById('f_date_to')?.value   || '';
    const fieldMap   = { f_region:'region', f_status:'status', f_brand:'brand', f_cond:'condition', f_category:'category' };
    const allFilters = Data.AVAILABLE_FILTERS[tpl.level] || [];
    const selectFilters = allFilters.filter(f => tpl.filters.includes(f.id) && f.type === 'select');

    return sourceData.filter(row => {
      if (dtFrom && dateField && row[dateField] < dtFrom) return false;
      if (dtTo   && dateField && row[dateField] > dtTo)   return false;
      for (const f of selectFilters) {
        const val   = document.getElementById(f.id)?.value;
        const field = fieldMap[f.id];
        if (val && field && row[field] !== val) return false;
      }
      return Pages._kwMatch(row, kw);
    });
  },

  // Custom / template-driven report page
  customReport(tpl) {
    App.currentData    = [...{ store: Data.STORE_KPIS, asset: Data.ASSET_KPIS, sku: Data.SKU_KPIS }[tpl.level] || []];
    App.pageSize       = 100;
    App.page           = 1;
    App.currentFilters = (Data.AVAILABLE_FILTERS[tpl.level] || []).filter(f => tpl.filters.includes(f.id));
    App.renderFilter   = () => Pages._buildRenderFilter(tpl);
    const levelLabel   = { store:'store level', asset:'asset / display unit level', sku:'product / SKU level' }[tpl.level];
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">${tpl.name}</h1>
        <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">KPIs at ${levelLabel}</span>
      </div>
      ${Utils.keywordSearch()}
      ${App.currentFilters.length ? Utils.filterChips(App.currentFilters) : ''}
      <div id="reportTable"></div>
      <div id="reportPager"></div>
    </div>`;
  },

  afterCustomReport() { App.applyFilters(); },

  // Refresh the sidebar nav without re-rendering the entire shell
  _refreshNav() {
    const navEl = document.querySelector('nav.flex-1.overflow-y-auto');
    if (!navEl) return;
    navEl.innerHTML = App.navItems().map(n => `
    <button onclick="App.navigate('${n.id}')" id="nav_${n.id}"
      class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
      <span class="text-base">${n.icon}</span><span>${n.label}</span>
    </button>`).join('');
  },

  // ─── Report Template Management ────────────────────────────────────────────

  reportManagement() {
    const u          = Auth.current();
    const marketTpls = Data.REPORT_TEMPLATES?.[u.market.id]?.templates || [];
    const builtins   = marketTpls.filter(t => t.type === 'builtin');
    const customs    = marketTpls.filter(t => t.type === 'custom');
    const levelLabel = { store:'Store Level', asset:'Asset Level', sku:'SKU Level' };
    const levelIcon  = { store:'🏪', asset:'📦', sku:'🏷️' };

    const tplCard = (tpl, isCustom) => `
    <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${isCustom ? '📑' : (levelIcon[tpl.level] || '📊')}</span>
          <div>
            <p class="font-semibold text-gray-800">${tpl.name}</p>
            <p class="text-xs text-gray-400 mt-0.5">${levelLabel[tpl.level]} · ${tpl.columns.length} column${tpl.columns.length !== 1 ? 's' : ''} · ${tpl.filters.length} filter${tpl.filters.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          ${tpl.enabled ? Utils.badge('Enabled','success') : Utils.badge('Disabled','inactive')}
          ${isCustom ? `<button onclick="App.navigate('rpt-${tpl.id}')"
            class="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">View</button>` : ''}
          <button onclick="Pages._editTemplate('${tpl.id}')"
            class="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">Customize</button>
          <button onclick="Pages._toggleTemplateEnabled('${tpl.id}')"
            class="text-xs px-3 py-1.5 rounded-lg border transition ${tpl.enabled
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'}">
            ${tpl.enabled ? 'Disable' : 'Enable'}
          </button>
          ${isCustom ? `<button onclick="Pages._deleteTemplate('${tpl.id}')"
            class="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Delete</button>` : ''}
        </div>
      </div>
    </div>`;

    return `
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Report Template Management</h1>
          <p class="text-sm text-gray-500 mt-1">${u.market.name} market · configure which reports are available and what they show</p>
        </div>
        <button onclick="Pages._openNewReportBuilder()"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition flex-shrink-0">
          + Build New Report
        </button>
      </div>

      <div>
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Built-in Reports</h2>
        <div class="space-y-3">${builtins.map(t => tplCard(t, false)).join('')}</div>
      </div>

      <div>
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Custom Reports</h2>
        ${customs.length ? `<div class="space-y-3">${customs.map(t => tplCard(t, true)).join('')}</div>`
          : `<div class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
               <p class="text-3xl mb-3">📑</p>
               <p class="text-sm">No custom reports yet. Click <strong>Build New Report</strong> to create one.</p>
             </div>`}
      </div>
    </div>

    ${Utils.modal('tplEditorModal',
      `<span id="tplEditorTitle">Customize Template</span>`,
      `<div id="tplEditorBody" class="text-gray-400 text-sm">Loading…</div>`,
      `<button onclick="Utils.closeModal('tplEditorModal')" class="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
       <button onclick="Pages._saveTemplate()" class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save Changes</button>`
    )}

    ${Utils.modal('newReportModal', 'Build New Report',
      `<div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Report Name *</label>
          <input id="nr_name" type="text" placeholder="e.g. Brand Performance by Store"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Aggregation Level *</label>
          <select id="nr_level" onchange="Pages._onNewReportLevelChange()"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="store">Store Level</option>
            <option value="asset">Asset Level</option>
            <option value="sku">SKU / Product Level</option>
          </select>
        </div>
        <div id="nr_cols_section"></div>
        <div id="nr_filters_section"></div>
      </div>`,
      `<button onclick="Utils.closeModal('newReportModal')" class="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
       <button onclick="Pages._saveNewReport()" class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create Report</button>`
    )}`;
  },

  _toggleTemplateEnabled(tplId) {
    const u   = Auth.current();
    const tpl = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.id === tplId);
    if (!tpl) return;
    tpl.enabled = !tpl.enabled;
    Pages._refreshNav();
    App.navigate('report-management');
    Utils.toast(`"${tpl.name}" ${tpl.enabled ? 'enabled' : 'disabled'}`, tpl.enabled ? 'success' : 'info');
  },

  _editingTplId: null,

  _editTemplate(tplId) {
    const u   = Auth.current();
    const tpl = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.id === tplId);
    if (!tpl) return;
    Pages._editingTplId = tplId;

    const allCols  = Data.AVAILABLE_COLUMNS[tpl.level] || [];
    const allFilts = Data.AVAILABLE_FILTERS[tpl.level] || [];

    // Build ordered column list: enabled first (in order), then disabled
    const enabledKeys   = tpl.columns;
    const disabledCols  = allCols.filter(c => !enabledKeys.includes(c.key));
    const orderedCols   = [...enabledKeys.map(k => allCols.find(c => c.key === k)).filter(Boolean), ...disabledCols];

    const colItem = (col, checked) => `
    <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 ${checked ? '' : 'opacity-60'}">
      <input type="checkbox" id="tc_${col.key}" value="${col.key}" ${checked ? 'checked' : ''}
        class="rounded text-blue-600 cursor-pointer" />
      <label for="tc_${col.key}" class="text-sm text-gray-700 flex-1 cursor-pointer select-none">${col.label}</label>
      <button onclick="Pages._moveCol('${col.key}','up')"   title="Move up"   class="text-gray-300 hover:text-gray-600 text-xs px-1 transition">▲</button>
      <button onclick="Pages._moveCol('${col.key}','down')" title="Move down" class="text-gray-300 hover:text-gray-600 text-xs px-1 transition">▼</button>
    </div>`;

    const colorOpts = `<option value="">None</option><option value="green">Green</option><option value="amber">Amber</option><option value="red">Red</option><option value="blue">Blue</option><option value="purple">Purple</option>`;
    const selCls    = 'border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-400 outline-none';
    const inpCls    = 'w-16 border border-gray-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-400 outline-none';

    const colorRulesUI = col => {
      const isNum   = Pages._numericTypes.has(col.type);
      const saved   = tpl.columnConfig?.[col.key]?.colorRules || [];
      const getRule = i => saved[i] || {};

      if (isNum) {
        const defaults = [
          { from: 85, to: 100, color: 'green' },
          { from: 70, to: 84,  color: 'amber' },
          { from: 0,  to: 69,  color: 'red'   },
        ];
        const r = [0, 1, 2].map(i => ({ ...defaults[i], ...getRule(i) }));
        return `
        <div class="mt-2 pl-4 border-l-2 border-gray-200 space-y-1.5">
          <p class="text-xs text-gray-400">Color by range</p>
          ${r.map((rule, i) => `
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-gray-400 w-3">≥</span>
            <input type="number" id="cr_${col.key}_${i}_from" value="${rule.from}" class="${inpCls}" placeholder="from" />
            <span class="text-gray-400">–</span>
            <input type="number" id="cr_${col.key}_${i}_to"   value="${rule.to}"   class="${inpCls}" placeholder="to" />
            <select id="cr_${col.key}_${i}_color" class="${selCls}">
              ${colorOpts.replace(`value="${rule.color}"`, `value="${rule.color}" selected`)}
            </select>
          </div>`).join('')}
        </div>`;
      } else {
        const catDefaults = [
          { value:'Active',    color:'green'  },
          { value:'Inactive',  color:'red'    },
          { value:'Excellent', color:'green'  },
          { value:'Poor',      color:'red'    },
        ];
        const r = [0, 1, 2, 3].map(i => ({ ...catDefaults[i], ...getRule(i) }));
        return `
        <div class="mt-2 pl-4 border-l-2 border-gray-200 space-y-1.5">
          <p class="text-xs text-gray-400">Color by value</p>
          ${r.map((rule, i) => `
          <div class="flex items-center gap-1.5 text-xs">
            <input type="text" id="cr_${col.key}_${i}_val" value="${rule.value || ''}" placeholder='value…'
              class="flex-1 border border-gray-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-400 outline-none" />
            <select id="cr_${col.key}_${i}_color" class="${selCls}">
              ${colorOpts.replace(`value="${rule.color}"`, `value="${rule.color}" selected`)}
            </select>
          </div>`).join('')}
        </div>`;
      }
    };

    const colItemWithColor = (col, checked) => `
    <div class="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 ${checked ? '' : 'opacity-60'}">
      <div class="flex items-center gap-2">
        <input type="checkbox" id="tc_${col.key}" value="${col.key}" ${checked ? 'checked' : ''}
          class="rounded text-blue-600 cursor-pointer" />
        <label for="tc_${col.key}" class="text-sm text-gray-700 flex-1 cursor-pointer select-none">${col.label}</label>
        <button onclick="Pages._moveCol('${col.key}','up')"   title="Move up"   class="text-gray-300 hover:text-gray-600 text-xs px-1 transition">▲</button>
        <button onclick="Pages._moveCol('${col.key}','down')" title="Move down" class="text-gray-300 hover:text-gray-600 text-xs px-1 transition">▼</button>
        ${(col.type && col.type !== 'mono' && col.type !== 'date' && col.type !== 'facings') ? `
        <button onclick="Pages._toggleColorPanel('${col.key}')" title="Color rules"
          class="text-xs text-gray-400 hover:text-blue-600 px-1 transition">🎨</button>` : ''}
      </div>
      ${(col.type && col.type !== 'mono' && col.type !== 'date' && col.type !== 'facings') ? `
      <div id="crp_${col.key}" class="${tpl.columnConfig?.[col.key]?.colorRules?.length ? '' : 'hidden'}">
        ${colorRulesUI(col)}
      </div>` : ''}
    </div>`;

    const body = document.getElementById('tplEditorBody');
    if (!body) return;
    body.innerHTML = `
    <div class="space-y-5">
      ${tpl.type === 'custom' ? `
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Report Name</label>
        <input id="tpl_name" value="${tpl.name}"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>` : `
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-gray-800">${tpl.name}</span>
        ${Utils.badge('Built-in','info')}
      </div>`}
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Columns <span class="text-gray-400 font-normal">(check to show · ▲▼ reorder · 🎨 color rules)</span></label>
        <div class="space-y-1.5 max-h-72 overflow-y-auto" id="tplColList">
          ${orderedCols.map(col => colItemWithColor(col, enabledKeys.includes(col.key))).join('')}
        </div>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-2">Filters</label>
        <div class="space-y-1.5">
          ${allFilts.map(f => `
          <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <input type="checkbox" id="tf_${f.id}" value="${f.id}" ${tpl.filters.includes(f.id) ? 'checked' : ''}
              class="rounded text-blue-600 cursor-pointer" />
            <label for="tf_${f.id}" class="text-sm text-gray-700 cursor-pointer select-none">${f.label}
              <span class="text-xs text-gray-400">(${f.type})</span>
            </label>
          </div>`).join('')}
        </div>
      </div>
    </div>`;

    const title = document.getElementById('tplEditorTitle');
    if (title) title.textContent = `Customize: ${tpl.name}`;
    Utils.openModal('tplEditorModal');
  },

  _toggleColorPanel(key) {
    const panel = document.getElementById(`crp_${key}`);
    if (panel) panel.classList.toggle('hidden');
  },

  _moveCol(key, dir) {
    const list = document.getElementById('tplColList');
    if (!list) return;
    const items = [...list.children];
    const idx   = items.findIndex(el => el.querySelector(`input[value="${key}"]`));
    if (idx < 0) return;
    if (dir === 'up'   && idx > 0)              list.insertBefore(items[idx], items[idx - 1]);
    if (dir === 'down' && idx < items.length - 1) list.insertBefore(items[idx + 1], items[idx]);
  },

  _saveTemplate() {
    const u   = Auth.current();
    const tpl = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.id === Pages._editingTplId);
    if (!tpl) return;

    const list    = document.getElementById('tplColList');
    const newCols = [...list.querySelectorAll('input[type="checkbox"]:checked')]
      .filter(el => el.id.startsWith('tc_'))
      .map(el => el.value);
    if (newCols.length === 0) { Utils.toast('Select at least one column', 'error'); return; }

    const allFilts  = Data.AVAILABLE_FILTERS[tpl.level] || [];
    const newFilts  = allFilts.filter(f => document.getElementById(`tf_${f.id}`)?.checked).map(f => f.id);

    // Read color rules for each column
    const allCols = Data.AVAILABLE_COLUMNS[tpl.level] || [];
    const newCfg  = {};
    allCols.forEach(col => {
      if (col.type === 'mono' || col.type === 'date' || col.type === 'facings') return;
      const isNum = Pages._numericTypes.has(col.type);
      const rules = [];
      if (isNum) {
        [0, 1, 2].forEach(i => {
          const from  = parseFloat(document.getElementById(`cr_${col.key}_${i}_from`)?.value);
          const to    = parseFloat(document.getElementById(`cr_${col.key}_${i}_to`)?.value);
          const color = document.getElementById(`cr_${col.key}_${i}_color`)?.value;
          if (color && !isNaN(from) && !isNaN(to)) rules.push({ from, to, color });
        });
      } else {
        [0, 1, 2, 3].forEach(i => {
          const value = document.getElementById(`cr_${col.key}_${i}_val`)?.value?.trim();
          const color = document.getElementById(`cr_${col.key}_${i}_color`)?.value;
          if (color && value) rules.push({ value, color });
        });
      }
      if (rules.length) newCfg[col.key] = { colorRules: rules };
    });

    if (tpl.type === 'custom') {
      const nameEl = document.getElementById('tpl_name');
      if (nameEl?.value?.trim()) tpl.name = nameEl.value.trim();
    }
    tpl.columns      = newCols;
    tpl.filters      = newFilts;
    tpl.columnConfig = newCfg;

    Utils.closeModal('tplEditorModal');
    Pages._refreshNav();
    App.navigate('report-management');
    Utils.toast('Template saved', 'success');
  },

  _openNewReportBuilder() {
    const nameEl  = document.getElementById('nr_name');
    const levelEl = document.getElementById('nr_level');
    if (nameEl)  nameEl.value  = '';
    if (levelEl) levelEl.value = 'store';
    Utils.openModal('newReportModal');
    Pages._onNewReportLevelChange();
  },

  _onNewReportLevelChange() {
    const level    = document.getElementById('nr_level')?.value || 'store';
    const allCols  = Data.AVAILABLE_COLUMNS[level] || [];
    const allFilts = Data.AVAILABLE_FILTERS[level] || [];

    const colSec = document.getElementById('nr_cols_section');
    if (colSec) colSec.innerHTML = `
    <div>
      <label class="block text-xs font-semibold text-gray-600 mb-2">Columns <span class="text-gray-400 font-normal">(all selected by default)</span></label>
      <div class="space-y-1.5 max-h-44 overflow-y-auto">
        ${allCols.map(col => `
        <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <input type="checkbox" id="nc_${col.key}" value="${col.key}" checked class="rounded text-blue-600 cursor-pointer" />
          <label for="nc_${col.key}" class="text-sm text-gray-700 cursor-pointer select-none">${col.label}</label>
        </div>`).join('')}
      </div>
    </div>`;

    const filtSec = document.getElementById('nr_filters_section');
    if (filtSec) filtSec.innerHTML = `
    <div>
      <label class="block text-xs font-semibold text-gray-600 mb-2">Filters</label>
      <div class="space-y-1.5">
        ${allFilts.map(f => `
        <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <input type="checkbox" id="nf_${f.id}" value="${f.id}" checked class="rounded text-blue-600 cursor-pointer" />
          <label for="nf_${f.id}" class="text-sm text-gray-700 cursor-pointer select-none">${f.label}
            <span class="text-xs text-gray-400">(${f.type})</span>
          </label>
        </div>`).join('')}
      </div>
    </div>`;
  },

  _saveNewReport() {
    const name  = document.getElementById('nr_name')?.value?.trim();
    const level = document.getElementById('nr_level')?.value || 'store';
    if (!name) { Utils.toast('Please enter a report name', 'error'); return; }

    const allCols  = Data.AVAILABLE_COLUMNS[level] || [];
    const allFilts = Data.AVAILABLE_FILTERS[level] || [];
    const cols     = allCols.filter(c => document.getElementById(`nc_${c.key}`)?.checked).map(c => c.key);
    const filters  = allFilts.filter(f => document.getElementById(`nf_${f.id}`)?.checked).map(f => f.id);

    if (cols.length === 0) { Utils.toast('Select at least one column', 'error'); return; }

    const u      = Auth.current();
    const mktId  = u.market.id;
    const tplId  = `${mktId}_custom_${Date.now()}`;
    Data.REPORT_TEMPLATES[mktId].templates.push({
      id: tplId, name, type: 'custom', level, enabled: true, columns: cols, filters, columnConfig: {},
    });

    Utils.closeModal('newReportModal');
    Pages._refreshNav();
    App.navigate('report-management');
    Utils.toast(`"${name}" created`, 'success');
  },

  _deleteTemplate(tplId) {
    const u         = Auth.current();
    const templates = Data.REPORT_TEMPLATES?.[u.market.id]?.templates;
    if (!templates) return;
    const idx = templates.findIndex(t => t.id === tplId);
    if (idx >= 0) templates.splice(idx, 1);
    Pages._refreshNav();
    App.navigate('report-management');
    Utils.toast('Report deleted', 'info');
  },

  // ─── Model Accuracy ────────────────────────────────────────────────────────
  modelAccuracy() {
    const d   = Data.MODEL_LATEST;
    const latest = Data.MODEL_HISTORY[Data.MODEL_HISTORY.length - 1];
    const prev   = Data.MODEL_HISTORY[Data.MODEL_HISTORY.length - 2];
    const accDelta = latest.app_accuracy - prev.app_accuracy;

    const kpiCard = (value, label, color = 'text-gray-800') =>
      `<div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div class="text-3xl font-bold ${color}">${value}</div>
        <div class="text-sm text-gray-500 mt-1">${label}</div>
      </div>`;

    const skuRows = (Data.SKU_ACCURACY || []).slice(0, 5).map(s => `
      <tr class="border-b border-gray-50 last:border-0">
        <td class="py-2 pr-3">
          <div class="flex items-center gap-2">
            <img src="${s.packshot}" class="w-8 h-8 rounded object-cover" loading="lazy">
            <div>
              <div class="text-xs font-medium text-gray-700">${s.type}</div>
              <div class="text-xs text-gray-400">${s.brand}</div>
            </div>
          </div>
        </td>
        <td class="py-2 text-right text-sm font-bold ${s.accuracy < 60 ? 'text-red-500' : s.accuracy < 75 ? 'text-amber-500' : 'text-green-600'}">${s.accuracy}%</td>
      </tr>`).join('');

    const assetRows = (Data.ASSET_ACCURACY || []).slice(0, 5).map(a => `
      <tr class="border-b border-gray-50 last:border-0">
        <td class="py-2 pr-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">📦</div>
            <span class="text-xs font-medium text-gray-700">${a.name}</span>
          </div>
        </td>
        <td class="py-2 text-right text-sm font-bold ${a.accuracy < 60 ? 'text-red-500' : a.accuracy < 75 ? 'text-amber-500' : 'text-green-600'}">${a.accuracy}%</td>
      </tr>`).join('');

    const vsUpdateIndices = Data.MODEL_HISTORY.map((v,i) => v.val_set_updated ? i : -1).filter(i => i >= 0);

    const historyRows = [...Data.MODEL_HISTORY].reverse().map(v => `
      <tr class="border-b border-gray-50 last:border-0 ${v.val_set_updated ? 'bg-amber-50' : ''}">
        <td class="py-2.5 px-3">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-semibold text-gray-700">${v.version}</span>
            ${v.val_set_updated ? `<span class="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">VS Updated · ${v.val_set_version}</span>` : `<span class="text-xs text-gray-400">${v.val_set_version}</span>`}
          </div>
          ${v.val_set_updated && v.val_set_note ? `<div class="text-xs text-amber-600 mt-0.5 pl-0.5">${v.val_set_note}</div>` : ''}
        </td>
        <td class="py-2.5 px-3 text-xs text-gray-500">${v.month}</td>
        <td class="py-2.5 px-3 text-xs font-semibold text-rose-500">${v.app_accuracy}%</td>
        <td class="py-2.5 px-3 text-xs font-semibold text-emerald-600">${v.br_accuracy}%</td>
        <td class="py-2.5 px-3 text-xs text-gray-500">${v.training_images.toLocaleString()}</td>
        <td class="py-2.5 px-3 text-xs ${v.new_images > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}">+${v.new_images.toLocaleString()}</td>
      </tr>`).join('');

    return `
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Accuracy Reports</h1>
        <div class="flex items-center gap-2">
          <span class="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-semibold">${latest.version} — Latest</span>
          <span class="text-xs text-gray-400">${latest.month} · ${latest.training_images.toLocaleString()} training images</span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-4 gap-4">
        ${kpiCard(d.users.toLocaleString(), 'Users')}
        ${kpiCard(d.store_visits.toLocaleString(), 'Store Visits')}
        ${kpiCard(d.images_captured.toLocaleString(), 'Images Captured')}
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start justify-between">
          <div>
            <div class="text-3xl font-bold text-amber-500">${d.accuracy}%</div>
            <div class="text-sm text-gray-500 mt-1">Accuracy</div>
            <div class="text-xs mt-1 ${accDelta >= 0 ? 'text-green-600' : 'text-red-500'} font-medium">${accDelta >= 0 ? '▲' : '▼'} ${Math.abs(accDelta)}pp vs prev</div>
          </div>
          <div class="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 text-xs cursor-default" title="App Accuracy for current period">ⓘ</div>
        </div>
      </div>

      <!-- Middle row -->
      <div class="grid grid-cols-3 gap-4">
        <!-- SKUs -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700">SKUs (5/${Data.SKU_ACCURACY.length})</h2>
          </div>
          <table class="w-full">
            <thead><tr class="text-xs text-gray-400 border-b border-gray-100">
              <th class="pb-2 text-left font-medium">SKU TYPE</th>
              <th class="pb-2 text-right font-medium">ACCURACY ↓</th>
            </tr></thead>
            <tbody>${skuRows}</tbody>
          </table>
          <button onclick="Pages._maShowAll('sku')" class="text-xs text-blue-500 hover:underline mt-3">View All</button>
        </div>

        <!-- Assets -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700">Assets (5/${Data.ASSET_ACCURACY.length})</h2>
          </div>
          <table class="w-full">
            <thead><tr class="text-xs text-gray-400 border-b border-gray-100">
              <th class="pb-2 text-left font-medium">ASSET NAME</th>
              <th class="pb-2 text-right font-medium">ACCURACY ↓</th>
            </tr></thead>
            <tbody>${assetRows}</tbody>
          </table>
          <button onclick="Pages._maShowAll('asset')" class="text-xs text-blue-500 hover:underline mt-3">View All</button>
        </div>

        <!-- Accuracy Trends -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Accuracy Trends
            <span class="text-xs font-normal text-gray-400 ml-1">12 months</span>
          </h2>
          <div class="flex-1 relative" style="min-height:180px">
            <canvas id="chartAccTrend"></canvas>
          </div>
          <div class="flex gap-4 mt-3 text-xs text-gray-500">
            <span class="flex items-center gap-1.5"><span class="w-3 h-0.5 rounded bg-rose-400 inline-block"></span>App Accuracy</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-0.5 rounded bg-emerald-500 inline-block"></span>BR Accuracy</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-0.5 rounded bg-amber-400 inline-block border-dashed"></span>VS Updated</span>
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Other Details -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Other Details</h2>
          <div class="grid grid-cols-2 gap-5">
            <div>
              <div class="text-2xl font-bold text-gray-800">${d.merch_compliance}%</div>
              <div class="text-xs text-gray-400 mt-0.5">Merchandising Compliance Accuracy</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">${d.accuracy_poor_merch}%</div>
              <div class="text-xs text-gray-400 mt-0.5">Accuracy On Poor Merchandising</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">${d.accuracy_good_merch}%</div>
              <div class="text-xs text-gray-400 mt-0.5">Accuracy On Good Merchandising</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">${d.non_pepsi_accuracy}%</div>
              <div class="text-xs text-gray-400 mt-0.5">Non-Pepsi Accuracy</div>
            </div>
          </div>
        </div>

        <!-- Accuracy Components -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Accuracy Components</h2>
          <div class="flex items-center gap-8">
            <div class="relative flex-shrink-0" style="width:140px;height:140px">
              <canvas id="chartAccPie"></canvas>
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-xl font-bold text-gray-800">${d.accuracy}%</span>
              </div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold text-gray-700 mb-3">${100 - d.accuracy}% Inaccuracy Variables</div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                <div><div class="text-xl font-bold text-blue-600">${d.inaccuracy_npd}%</div><div class="text-xs text-gray-500">NPD</div></div>
                <div><div class="text-xl font-bold text-blue-600">${d.inaccuracy_low_training}%</div><div class="text-xs text-gray-500">SKU with low training data</div></div>
                <div><div class="text-xl font-bold text-blue-600">${d.inaccuracy_occlusion}%</div><div class="text-xs text-gray-500">Occlusion</div></div>
                <div><div class="text-xl font-bold text-blue-600">${d.inaccuracy_pack_placement}%</div><div class="text-xs text-gray-500">Pack placement</div></div>
              </div>
            </div>
          </div>
          <div class="flex gap-4 mt-4 text-xs text-gray-500">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>Accuracy</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>Inaccuracy</span>
          </div>
        </div>
      </div>

      <!-- Model Version History -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Model Version History</h2>
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block"></span>Validation set updated</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th class="px-3 py-2.5 text-left font-medium">Version</th>
              <th class="px-3 py-2.5 text-left font-medium">Month</th>
              <th class="px-3 py-2.5 text-left font-medium">App Accuracy</th>
              <th class="px-3 py-2.5 text-left font-medium">BR Accuracy</th>
              <th class="px-3 py-2.5 text-left font-medium">Training Images</th>
              <th class="px-3 py-2.5 text-left font-medium">New Images</th>
            </tr></thead>
            <tbody>${historyRows}</tbody>
          </table>
        </div>
      </div>

      <!-- View All modals -->
      <div id="maModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 id="maModalTitle" class="text-base font-semibold text-gray-800"></h2>
            <button onclick="document.getElementById('maModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="maModalBody" class="p-5 overflow-y-auto flex-1"></div>
        </div>
      </div>
    </div>`;
  },

  afterModelAccuracy() {
    const history = Data.MODEL_HISTORY;
    const labels  = history.map(v => v.version);
    const vsIdxs  = history.map((v,i) => v.val_set_updated ? i : -1).filter(i => i >= 0);

    const vsMarkerPlugin = {
      id: 'vsMarkers',
      afterDraw(chart) {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        vsIdxs.forEach(idx => {
          const x = xScale.getPixelForValue(idx);
          ctx.save();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(x, yScale.top);
          ctx.lineTo(x, yScale.bottom);
          ctx.stroke();
          ctx.restore();
        });
      },
    };

    const trendCtx = document.getElementById('chartAccTrend');
    if (trendCtx) {
      Chart.getChart(trendCtx)?.destroy();
      new Chart(trendCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label:'App Accuracy', data:history.map(v=>v.app_accuracy),
              borderColor:'#FB7185', backgroundColor:'rgba(251,113,133,0.08)',
              tension:0.4, fill:true, pointRadius:3, pointHoverRadius:5, borderWidth:2 },
            { label:'BR Accuracy',  data:history.map(v=>v.br_accuracy),
              borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.08)',
              tension:0.4, fill:true, pointRadius:3, pointHoverRadius:5, borderWidth:2 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend:{ display:false },
            tooltip:{ callbacks:{ afterTitle: (items) => {
              const idx = items[0]?.dataIndex;
              const v = history[idx];
              return v?.val_set_updated ? `⚠ ${v.val_set_note}` : '';
            }}}
          },
          scales: { y:{ min:50, max:100, ticks:{ callback: v => v+'%' } }, x:{ ticks:{ maxRotation:45 } } },
        },
        plugins: [vsMarkerPlugin],
      });
    }

    const pieCtx = document.getElementById('chartAccPie');
    if (pieCtx) {
      const acc = Data.MODEL_LATEST.accuracy;
      Chart.getChart(pieCtx)?.destroy();
      new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['Accuracy','Inaccuracy'],
          datasets: [{ data:[acc, 100-acc], backgroundColor:['#34D399','#FB7185'], borderWidth:0, hoverOffset:4 }],
        },
        options: { responsive:true, maintainAspectRatio:false, cutout:'72%', plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.parsed}%` } } } },
      });
    }
  },

  _maShowAll(type) {
    const modal     = document.getElementById('maModal');
    const titleEl   = document.getElementById('maModalTitle');
    const bodyEl    = document.getElementById('maModalBody');
    if (type === 'sku') {
      titleEl.textContent = `All SKUs (${Data.SKU_ACCURACY.length})`;
      bodyEl.innerHTML = `<table class="w-full text-sm">
        <thead><tr class="text-xs text-gray-400 border-b"><th class="pb-2 text-left">SKU Type</th><th class="pb-2 text-right">Accuracy</th></tr></thead>
        <tbody>${Data.SKU_ACCURACY.map(s => `<tr class="border-b border-gray-50">
          <td class="py-2 flex items-center gap-2"><img src="${s.packshot}" class="w-7 h-7 rounded"><div><div class="text-xs font-medium">${s.type}</div><div class="text-xs text-gray-400">${s.brand}</div></div></td>
          <td class="py-2 text-right text-xs font-bold ${s.accuracy < 60 ? 'text-red-500' : s.accuracy < 75 ? 'text-amber-500' : 'text-green-600'}">${s.accuracy}%</td>
        </tr>`).join('')}</tbody></table>`;
    } else {
      titleEl.textContent = `All Assets (${Data.ASSET_ACCURACY.length})`;
      bodyEl.innerHTML = `<table class="w-full text-sm">
        <thead><tr class="text-xs text-gray-400 border-b"><th class="pb-2 text-left">Asset Name</th><th class="pb-2 text-right">Accuracy</th></tr></thead>
        <tbody>${Data.ASSET_ACCURACY.map(a => `<tr class="border-b border-gray-50">
          <td class="py-2 text-xs font-medium text-gray-700">${a.name}</td>
          <td class="py-2 text-right text-xs font-bold ${a.accuracy < 60 ? 'text-red-500' : a.accuracy < 75 ? 'text-amber-500' : 'text-green-600'}">${a.accuracy}%</td>
        </tr>`).join('')}</tbody></table>`;
    }
    modal.classList.remove('hidden');
  },

  // ─── Logs ──────────────────────────────────────────────────────────────────
  logs() {
    const typeBadge = t => t==='Excel Download'?Utils.badge(t,'info'):t==='Competitor Product'?Utils.badge(t,'warning'):Utils.badge(t,'default');
    const statBadge = s => s==='Complete'||s==='Delivered'?Utils.badge(s,'success'):s==='Failed'?Utils.badge(s,'danger'):Utils.badge(s,'warning');
    const cols = [
      { label:'Type',      key:'type',   sortable:true },
      { label:'User',      key:'user',   sortable:true },
      { label:'Details',   key:'detail', sortable:false },
      { label:'Size',      key:'size',   sortable:true },
      { label:'Timestamp', key:'ts',     sortable:true },
      { label:'Status',    key:'status', sortable:true },
    ];
    const cpLogs  = JSON.parse(localStorage.getItem('cpLogs') || '[]');
    const allLogs = [...cpLogs, ...Data.LOGS].sort((a,b) => b.ts.localeCompare(a.ts));
    const rows = allLogs.map(l => Utils.tr([
      typeBadge(l.type), l.user, `<span class="text-gray-600 max-w-xs block truncate" title="${l.detail}">${l.detail}</span>`, l.size, l.ts, statBadge(l.status),
    ]));
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Logs Report</h1>
        <button onclick="Utils.toast('Logs exported to Excel','success')"
          class="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
      </div>
      ${Utils.table(cols, rows)}
    </div>`;
  },
};
