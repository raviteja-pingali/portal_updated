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
      const s = document.getElementById('ir_search');
      if (s) { s.value = searchTerm; Pages.filterGallery(); }
    }, 100);
  },

  _goToImageRepoFraud(fraudType) {
    App.navigate('image-repo');
    setTimeout(() => {
      const el = document.getElementById('ir_fraudtype');
      if (el) { el.value = fraudType; Pages.filterGallery(); }
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
        ${['Stores', 'Users', 'Products'].map((t, i) => `
        <button onclick="Pages.switchMasterTab(${i})" id="mdTab${i}"
          class="px-4 py-2 text-sm font-medium border-b-2 transition ${i === 0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">${t}</button>`).join('')}
      </div>
      <div id="mdTabContent">${this._mdExportBar(0)}${this._storesTable(Auth.marketStores())}</div>
    </div>`;
  },

  switchMasterTab(idx) {
    [0, 1, 2].forEach(i => {
      document.getElementById(`mdTab${i}`).className =
        `px-4 py-2 text-sm font-medium border-b-2 transition ${i === idx ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;
    });
    const content = {
      0: Pages._storesTable(Auth.marketStores()),
      1: Pages._usersTable(Auth.marketUsers()),
      2: Pages._productsTable(Data.PRODUCTS),
    };
    document.getElementById('mdTabContent').innerHTML = this._mdExportBar(idx) + content[idx];
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
    const cols = [
      { label:'SKU', key:'sku', sortable:true },
      { label:'Product Name', key:'name', sortable:true },
      { label:'Brand', key:'brand', sortable:true },
      { label:'Category', key:'category', sortable:true },
    ];
    const rows = products.map(p => Utils.tr([
      `<span class="font-mono text-xs text-gray-500">${p.sku}</span>`, p.name, p.brand, p.category,
    ]));
    return Utils.table(cols, rows);
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
    return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Image Repository</h1>
        <span id="ir_count" class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full"></span>
      </div>
      <!-- Compact quality summary -->
      <div class="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quality</span>
        <span class="flex items-center gap-1.5 text-xs text-gray-600"><span class="w-2 h-2 rounded-full bg-green-400"></span>${cleanG} Clean</span>
        <span class="flex items-center gap-1.5 text-xs text-gray-600"><span class="w-2 h-2 rounded-full bg-red-400"></span>${flaggedG} Flagged</span>
        <span class="text-gray-200">|</span>
        ${Data.FRAUD_TYPES.map(ft => {
          const ct = Data.IMAGE_GALLERY.filter(i => i.fraud_types.includes(ft)).length;
          if (ct === 0) return '';
          return `<button onclick="Pages._setGalleryFraudFilter('${ft}')"
            class="text-xs border border-gray-200 rounded-md px-2 py-0.5 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition flex items-center gap-1">
            <span class="font-semibold text-gray-700">${ct}</span> <span class="text-gray-500">${ft}</span>
          </button>`;
        }).join('')}
      </div>
      <!-- Search & filters -->
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
          </svg>
        </span>
        <input id="ir_search" type="text" placeholder="Search by store, retailer, brand, SKU, asset name…"
          oninput="Pages.filterGallery()"
          class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-sm bg-white outline-none transition shadow-sm" />
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <select id="ir_fraudtype" onchange="Pages.filterGallery()"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Images</option>
          <option value="__clean__">Clean only</option>
          ${Data.FRAUD_TYPES.map(ft => `<option value="${ft}">${ft}</option>`).join('')}
        </select>
        <select id="ir_brand" onchange="Pages.filterGallery()"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Brands</option>
          ${['Coca-Cola','PepsiCo','Dr Pepper','Monster','Red Bull'].map(b => `<option>${b}</option>`).join('')}
        </select>
        <select id="ir_retailer" onchange="Pages.filterGallery()"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Retailers</option>
          ${['Walmart','Kroger','Target','Costco','Publix','H-E-B','Whole Foods','Albertsons'].map(r => `<option>${r}</option>`).join('')}
        </select>
        <div class="flex items-center gap-1">
          <span class="text-xs text-gray-500">Visit date</span>
          <input id="ir_date_from" type="date" onchange="Pages.filterGallery()"
            class="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none" />
          <span class="text-xs text-gray-400">–</span>
          <input id="ir_date_to" type="date" onchange="Pages.filterGallery()"
            class="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white h-9 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onclick="Pages.filterGallery(true)"
          class="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 h-9 hover:bg-gray-50 transition">Clear</button>
      </div>
      <!-- Gallery grid -->
      <div id="galleryGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
    </div>
    ${Utils.modal('imgDetailModal', 'Image Detail', `<div id="imgDetailContent"></div>`, '&nbsp;')}`;
  },

  afterImageRepository() { Pages.filterGallery(); },

  _setGalleryFraudFilter(fraudType) {
    const el = document.getElementById('ir_fraudtype');
    if (el) { el.value = fraudType; this.filterGallery(); }
  },

  filterGallery(reset = false) {
    if (reset) {
      ['ir_search','ir_fraudtype','ir_brand','ir_retailer','ir_date_from','ir_date_to'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
    }
    const search    = document.getElementById('ir_search')?.value?.toLowerCase()   || '';
    const fraudType = document.getElementById('ir_fraudtype')?.value || '';
    const brand     = document.getElementById('ir_brand')?.value     || '';
    const retailer  = document.getElementById('ir_retailer')?.value  || '';
    const dateFrom  = document.getElementById('ir_date_from')?.value || '';
    const dateTo    = document.getElementById('ir_date_to')?.value   || '';

    const imgs = Data.IMAGE_GALLERY.filter(i => {
      const ftMatch = !fraudType
        ? true
        : fraudType === '__clean__'
          ? i.fraud_types.length === 0
          : i.fraud_types.includes(fraudType);
      return ftMatch &&
        (!search   || [i.retailer, i.brand, i.sku, i.asset_name, i.store_name].some(v => String(v).toLowerCase().includes(search))) &&
        (!brand    || i.brand    === brand)    &&
        (!retailer || i.retailer === retailer) &&
        (!dateFrom || i.visit_date >= dateFrom) &&
        (!dateTo   || i.visit_date <= dateTo);
    });

    const countEl = document.getElementById('ir_count');
    if (countEl) countEl.textContent = `${imgs.length} image${imgs.length !== 1 ? 's' : ''}`;

    const scoreColor = s => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-400' : 'bg-red-400';
    const scoreText  = s => s >= 80 ? 'text-green-700' : s >= 60 ? 'text-amber-700' : 'text-red-600';

    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = imgs.length ? imgs.map(i => `
      <div onclick="Pages.showImageDetail('${i.id}')"
        class="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200">
        <!-- Image placeholder — bigger & more realistic -->
        <div class="relative h-52 flex flex-col items-center justify-center overflow-hidden"
          style="background: linear-gradient(135deg, #${i.color}18 0%, #${i.color}08 100%);">
          <!-- Shelf illustration -->
          <div class="w-full px-4 space-y-2.5 opacity-60">
            ${[0,1,2].map(row => `
            <div class="flex gap-1.5 justify-center">
              ${Array.from({length:5},(_,ci)=>`
              <div class="rounded h-10 flex-1 flex items-end justify-center pb-1"
                style="background:#${i.color}${['44','33','55','22','44'][ci]}">
                <div class="w-1 h-3 rounded-full" style="background:#${i.color}99"></div>
              </div>`).join('')}
            </div>
            <div class="h-1 bg-gray-300 rounded mx-1 opacity-50"></div>`).join('')}
          </div>
          <!-- ID badge -->
          <div class="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 text-xs font-mono text-gray-500 shadow-sm">
            ${i.id}
          </div>
          <!-- Quality badge -->
          <div class="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 shadow-sm">
            <div class="w-1.5 h-1.5 rounded-full ${scoreColor(i.quality_score)}"></div>
            <span class="text-xs font-semibold ${scoreText(i.quality_score)}">${i.quality_score.toFixed(0)}</span>
          </div>
          <!-- Download button (visible on hover) -->
          <button onclick="event.stopPropagation(); Pages.downloadImage('${i.id}')"
            title="Download image"
            class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1.5 shadow-sm hover:bg-blue-50 hover:text-blue-600 text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </button>
        </div>
        <!-- Card metadata -->
        <div class="p-3 border-t border-gray-100">
          <p class="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">${i.store_name}</p>
          <p class="text-xs text-gray-500 mt-0.5">${i.retailer} · ${i.brand}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-gray-400">${i.visit_date}</span>
            <span class="text-xs text-gray-400 font-mono">${i.sku}</span>
          </div>
          <!-- Quality bar -->
          <div class="mt-2 flex items-center gap-1.5">
            <div class="flex-1 bg-gray-100 rounded-full h-1.5">
              <div class="${scoreColor(i.quality_score)} h-1.5 rounded-full transition-all" style="width:${i.quality_score}%"></div>
            </div>
            <span class="text-xs ${scoreText(i.quality_score)} font-medium">${i.quality_score.toFixed(0)}%</span>
          </div>
          ${i.fraud_types.length > 0 ? `<div class="mt-2 flex flex-wrap gap-1">
            ${i.fraud_types.map(ft => `<span class="text-xs bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">${ft}</span>`).join('')}
          </div>` : ''}
        </div>
      </div>`).join('')
      : `<p class="col-span-full text-center text-gray-400 py-16 text-sm">No images match your filters.</p>`;
  },

  showImageDetail(id) {
    const img = Data.IMAGE_GALLERY.find(i => i.id === id);
    if (!img) return;
    const scoreColor = img.quality_score >= 80 ? 'text-green-600' : img.quality_score >= 60 ? 'text-amber-600' : 'text-red-600';
    document.getElementById('imgDetailContent').innerHTML = `
    <div class="space-y-4">
      <div class="rounded-xl overflow-hidden border border-gray-100 relative"
        style="background:linear-gradient(135deg,#${img.color}18,#${img.color}08); height:200px; display:flex; align-items:center; justify-content:center;">
        <div class="w-full px-8 space-y-3 opacity-70">
          ${[0,1,2].map(() => `
          <div class="flex gap-2 justify-center">
            ${Array.from({length:5},(_,ci)=>`
            <div class="rounded h-12 flex-1" style="background:#${img.color}${['44','33','55','22','44'][ci]}"></div>`).join('')}
          </div>
          <div class="h-1 bg-gray-300 rounded mx-2"></div>`).join('')}
        </div>
        <div class="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-xs font-semibold ${scoreColor}">
          Quality: ${img.quality_score.toFixed(1)}%
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        ${[['Visit ID',img.visit_id],['Visit Date',img.visit_date],['Store',img.store_name],
           ['Retailer',img.retailer],['Brand',img.brand],['SKU',img.sku],
           ['Asset',img.asset_name],['Quality Score',img.quality_score.toFixed(1)+'%']]
          .map(([k,v]) => `<div><p class="text-xs text-gray-400">${k}</p><p class="font-medium text-gray-800">${v}</p></div>`).join('')}
      </div>
      <div class="border-t pt-3">
        <p class="text-xs font-semibold text-gray-600 mb-1">Realo-gram Detection</p>
        <p class="text-xs text-gray-400">Shelf recreation · ${Math.floor(Math.random()*8+3)} products detected · avg confidence ${(Math.random()*20+78).toFixed(0)}%</p>
      </div>
      ${img.fraud_types.length > 0 ? `
      <div class="border-t pt-3">
        <p class="text-xs font-semibold text-gray-600 mb-2">Fraud Flags</p>
        <div class="flex flex-wrap gap-1.5">
          ${img.fraud_types.map(ft => `<span class="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg font-medium">⚑ ${ft}</span>`).join('')}
        </div>
      </div>` : `
      <div class="border-t pt-3">
        <p class="text-xs font-semibold text-green-600">✓ No fraud flags — image is clean</p>
      </div>`}
      <div class="border-t pt-3">
        <p class="text-xs font-semibold text-gray-600 mb-1">Planogram Detection</p>
        <p class="text-xs text-gray-400">Shelf recreation · ${Math.floor(Math.random()*8+3)} products detected · avg confidence ${(Math.random()*20+78).toFixed(0)}%</p>
      </div>
    </div>`;
    // Update modal footer with a download button for this specific image
    const footer = document.querySelector('#imgDetailModal .border-t.bg-gray-50');
    if (footer) footer.innerHTML = `
      <button onclick="Pages.downloadImage('${img.id}'); Utils.closeModal('imgDetailModal')"
        class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Download Image
      </button>
      <button onclick="Utils.closeModal('imgDetailModal')"
        class="text-sm border border-gray-200 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition">Close</button>`;
    Utils.openModal('imgDetailModal');
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

  // ─── Logs ──────────────────────────────────────────────────────────────────
  logs() {
    const typeBadge = t => t==='Excel Download'?Utils.badge(t,'info'):t==='Survey Push'?Utils.badge(t,'warning'):Utils.badge(t,'default');
    const statBadge = s => s==='Complete'||s==='Delivered'?Utils.badge(s,'success'):s==='Failed'?Utils.badge(s,'danger'):Utils.badge(s,'warning');
    const cols = [
      { label:'Type',      key:'type',   sortable:true },
      { label:'User',      key:'user',   sortable:true },
      { label:'Details',   key:'detail', sortable:false },
      { label:'Size',      key:'size',   sortable:true },
      { label:'Timestamp', key:'ts',     sortable:true },
      { label:'Status',    key:'status', sortable:true },
    ];
    const rows = Data.LOGS.map(l => Utils.tr([
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
