// ── App – Router, Sort & Shell ────────────────────────────────────────────────

const App = {
  currentRoute:    null,
  currentData:     [],
  page:            1,
  pageSize:        100,
  sortKey:         null,
  sortDir:         'asc',
  dashPeriod:      '7D',
  dashComparison:  'prior',
  currentFilters:  [],
  renderFilter:    null,
  currentTemplate: null,
  selectedRows:    new Set(),

  // Column definitions per route (used by Utils.table for sortable headers)
  colConfigs: {
    'store-report': [
      { label:'Store',          key:'store_name',          sortable:true },
      { label:'Region',         key:'region',              sortable:true },
      { label:'City',           key:'city',                sortable:true },
      { label:'Status',         key:'status',              sortable:true },
      { label:'Compliance %',   key:'compliance_pct',      sortable:true },
      { label:'Share of Shelf', key:'share_of_shelf',      sortable:true },
      { label:'Visits',         key:'num_visits',          sortable:true },
      { label:'Images',         key:'images_captured',     sortable:true },
      { label:'Avg Quality',    key:'avg_quality_score',   sortable:true },
      { label:'OOS Rate',       key:'oos_rate',            sortable:true },
      { label:'Date Range',      key:'last_visit',          sortable:true },
    ],
    'asset-report': [
      { label:'Asset ID',       key:'asset_id',            sortable:true },
      { label:'Asset Name',     key:'asset_name',          sortable:true },
      { label:'Store',          key:'store_name',          sortable:true },
      { label:'Brand',          key:'brand',               sortable:true },
      { label:'Condition',      key:'condition',           sortable:true },
      { label:'Compliance',     key:'compliance_score',    sortable:true },
      { label:'Facings (A/R)',  key:'facings_actual',      sortable:true },
      { label:'Planogram %',    key:'planogram_compliance',sortable:true },
      { label:'Date Range',      key:'last_capture',        sortable:true },
    ],
    'sku-report': [
      { label:'SKU',            key:'sku',                 sortable:true },
      { label:'Product',        key:'product_name',        sortable:true },
      { label:'Brand',          key:'brand',               sortable:true },
      { label:'Category',       key:'category',            sortable:true },
      { label:'Store',          key:'store_name',          sortable:true },
      { label:'Facings',        key:'facings',             sortable:true },
      { label:'Planogram %',    key:'planogram_compliance',sortable:true },
      { label:'Wtd Dist.',      key:'weighted_distribution',sortable:true },
      { label:'OOS Rate',       key:'oos_rate',            sortable:true },
      { label:'Date Range',      key:'last_updated',        sortable:true },
    ],
    'image-quality': [
      { label:'Image ID',       key:'id',                  sortable:true },
      { label:'Store',          key:'store_name',          sortable:true },
      { label:'User',           key:'user_name',           sortable:true },
      { label:'Fraud Type',     key:'fraud_type',          sortable:true },
      { label:'Status',         key:'status',              sortable:true },
      { label:'Quality Score',  key:'quality_score',       sortable:true },
      { label:'Brand',          key:'brand',               sortable:true },
      { label:'Date Range',      key:'capture_date',        sortable:true },
      { label:'Action',         key:null,                  sortable:false },
    ],
  },

  // ─── Navigation ─────────────────────────────────────────────────────────────
  navItems() {
    const u = Auth.current();
    if (!u) return [];
    const marketTpls = Data.REPORT_TEMPLATES?.[u.market.id]?.templates || [];
    const builtinOn  = level => (marketTpls.find(t => t.type === 'builtin' && t.level === level)?.enabled ?? true);
    const customNav  = marketTpls
      .filter(t => t.type === 'custom' && t.enabled)
      .map(t => ({ id: `rpt-${t.id}`, label: t.name, icon: '📑', roles: ['Admin','Manager','Regular'] }));
    const all = [
      { id:'dashboard',          label:'Dashboard',        icon:'📊', roles:['Admin','Regular'] },
      { id:'master-data',        label:'Master Data',       icon:'🗃️',  roles:['Admin'] },
      ...(builtinOn('store') ? [{ id:'store-report', label:'Store Report', icon:'🏪', roles:['Admin','Regular'] }] : []),
      ...(builtinOn('asset') ? [{ id:'asset-report', label:'Asset Report', icon:'📦', roles:['Admin','Regular'] }] : []),
      ...(builtinOn('sku')   ? [{ id:'sku-report',   label:'SKU Report',   icon:'🏷️',  roles:['Admin','Regular'] }] : []),
      { id:'model-accuracy',      label:'Accuracy Reports',  icon:'🎯', roles:['Admin','Regular'] },
      { id:'image-repo',         label:'Image Repository',  icon:'🖼️',  roles:['Admin'] },
      { id:'users',              label:'User Management',    icon:'👥', roles:['Admin'] },
      { id:'logs',               label:'Logs',               icon:'📜', roles:['Admin'] },
      { id:'report-management',  label:'Report Templates',   icon:'⚙️',  roles:['Admin'] },
      ...customNav,
    ];
    return all.filter(n => n.roles.includes(u.role));
  },

  // ─── Shell ──────────────────────────────────────────────────────────────────
  renderShell() {
    const u = Auth.current();
    if (!u) { window.location.href = 'index.html'; return; }
    const roleBg = { Admin:'bg-blue-600', Regular:'bg-green-600' };
    document.getElementById('root').innerHTML = `
    <div class="flex h-screen overflow-hidden bg-gray-100">
      <aside class="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div class="px-5 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">IR</div>
            <span class="font-bold text-gray-800 text-sm">IR Portal</span>
          </div>
          <p class="text-xs text-gray-400 mt-1 truncate">${u.market.name}</p>
        </div>
        <nav class="flex-1 overflow-y-auto py-3">
          ${this.navItems().map(n => `
          <button onclick="App.navigate('${n.id}')" id="nav_${n.id}"
            class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">${n.icon}</span><span>${n.label}</span>
          </button>`).join('')}
        </nav>
        <div class="px-4 py-3 border-t border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full ${roleBg[u.role] || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              ${u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-800 truncate">${u.name}</p>
              <p class="text-xs text-gray-400">${u.role}</p>
            </div>
          </div>
          <button onclick="App.logout()" class="w-full mt-2 text-xs text-gray-400 hover:text-red-600 text-left py-1 transition">Sign out →</button>
        </div>
      </aside>
      <div class="flex-1 flex flex-col overflow-hidden">
        <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div id="breadcrumb" class="text-sm text-gray-500"></div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400 border border-gray-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>Live · 17 May 08:00
            </span>
            <span class="text-xs ${roleBg[u.role] || 'bg-gray-500'} text-white px-2 py-0.5 rounded-full">${u.role}</span>
            <span class="text-xs text-gray-400">${u.market.code}</span>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-6" id="content"></main>
      </div>
    </div>`;
    this.navigate('dashboard');
  },

  // ─── Route ──────────────────────────────────────────────────────────────────
  navigate(route) {
    this.currentRoute    = route;
    this.currentTemplate = null;
    this.sortKey         = null;
    this.sortDir         = 'asc';
    this.selectedRows    = new Set();

    this.navItems().forEach(n => {
      const el = document.getElementById(`nav_${n.id}`);
      if (!el) return;
      const active = n.id === route;
      el.className = `w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        active ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
               : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`;
    });

    const label = this.navItems().find(n => n.id === route)?.label || route;
    document.getElementById('breadcrumb').textContent = label;

    const content = document.getElementById('content');

    // Handle custom/template-driven report routes
    if (route.startsWith('rpt-')) {
      const tplId = route.slice(4);
      const u     = Auth.current();
      const tpl   = (Data.REPORT_TEMPLATES?.[u.market.id]?.templates || []).find(t => t.id === tplId);
      if (tpl) {
        this.currentTemplate = tpl;
        content.innerHTML    = Pages.customReport(tpl);
        setTimeout(() => Pages.afterCustomReport(tpl), 50);
        return;
      }
    }

    const renderers = {
      'dashboard':          () => Pages.dashboard(),
      'master-data':        () => Pages.masterData(),
      'store-report':       () => Pages.storeReport(),
      'asset-report':       () => Pages.assetReport(),
      'sku-report':         () => Pages.skuReport(),
      'model-accuracy':     () => Pages.modelAccuracy(),
      'image-repo':         () => Pages.imageRepository(),
      'users':              () => Pages.userManagement(),
      'logs':               () => Pages.logs(),
      'report-management':  () => Pages.reportManagement(),
    };
    content.innerHTML = renderers[route] ? renderers[route]() : '<p class="text-gray-400">Page not found.</p>';

    const afterHooks = {
      'dashboard':       () => Pages.afterDashboard(),
      'store-report':    () => Pages.afterStoreReport(),
      'asset-report':    () => Pages.afterAssetReport(),
      'sku-report':      () => Pages.afterSkuReport(),
      'model-accuracy':  () => Pages.afterModelAccuracy(),
      'image-repo':      () => Pages.afterImageRepository(),
    };
    if (afterHooks[route]) setTimeout(afterHooks[route], 50);
  },

  // ─── Dashboard period ───────────────────────────────────────────────────────
  setDashPeriod(key) {
    this.dashPeriod = key;
    this.navigate('dashboard');
  },

  setDashComparison(mode) {
    this.dashComparison = mode;
    this.navigate('dashboard');
  },

  // ─── Sort ───────────────────────────────────────────────────────────────────
  setSort(key) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this._renderTable();
  },

  // ─── Filter / Pager ─────────────────────────────────────────────────────────
  applyFilters() {
    if (!this.renderFilter) return;
    this.currentData = this.renderFilter();
    this.page = 1;
    this._renderTable();
  },

  clearSearch() {
    const el = document.getElementById('kw_search');
    if (el) { el.value = ''; this.applyFilters(); }
  },

  clearFilters() {
    ['kw_search'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    this.currentFilters.forEach(f => {
      ['', '_from', '_to'].forEach(suffix => {
        const el = document.getElementById(f.id + suffix);
        if (el) el.value = '';
      });
    });
    this.applyFilters();
  },

  _renderTable() {
    const rt = document.getElementById('reportTable');
    const rp = document.getElementById('reportPager');
    if (!rt) return;

    let data = [...this.currentData];
    if (this.sortKey) {
      data.sort((a, b) => {
        const va = a[this.sortKey] ?? '';
        const vb = b[this.sortKey] ?? '';
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true });
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }

    const start     = (this.page - 1) * this.pageSize;
    const slice     = data.slice(start, start + this.pageSize);
    const sortState = this.sortKey ? { key: this.sortKey, dir: this.sortDir } : null;

    if (this.currentTemplate) {
      // Template-driven rendering (builtin reports + custom reports)
      const tpl     = this.currentTemplate;
      const allCols = Data.AVAILABLE_COLUMNS[tpl.level] || [];
      const cols    = tpl.columns
        .map(key => allCols.find(c => c.key === key))
        .filter(Boolean)
        .map(c => ({ label: c.label, key: c.key, sortable: c.sortable }));
      rt.innerHTML = Utils.table(cols, Pages._dynamicRows(slice, cols, tpl.level), sortState);
    } else {
      // Legacy rendering for image-quality (not template-driven)
      const cols  = this.colConfigs[this.currentRoute] || [];
      const rowRenderers = {
        'image-quality': d => Pages._imgQualRows(d),
      };
      const rowFn = rowRenderers[this.currentRoute];
      rt.innerHTML = rowFn ? Utils.table(cols, rowFn(slice), sortState) : '';
    }

    this._injectRowCheckboxes(rt, start);
    this._updateExportBtn();
    if (rp) rp.innerHTML = Utils.pagerHtml(this.currentData.length, this.pageSize, this.page);
  },

  // ─── Row selection ──────────────────────────────────────────────────────────
  _injectRowCheckboxes(tableContainer, startIdx) {
    const thead = tableContainer.querySelector('thead tr');
    const tbody = tableContainer.querySelector('tbody');
    if (!thead || !tbody) return;

    // Select-all checkbox in header
    const allTh = document.createElement('th');
    allTh.className = 'px-3 py-3 w-10';
    allTh.innerHTML = `<input type="checkbox" id="selectAllCb" onclick="App.toggleAllRows()"
      class="rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-blue-500 focus:ring-offset-0">`;
    thead.insertBefore(allTh, thead.firstChild);

    // Per-row checkboxes (skip the empty "no data" colspan row)
    const dataRows = [...tbody.querySelectorAll('tr')].filter(tr => !tr.querySelector('[colspan]'));
    dataRows.forEach((tr, pageIdx) => {
      const globalIdx = startIdx + pageIdx;
      const td = document.createElement('td');
      td.className = 'px-3 py-3 w-10';
      td.innerHTML = `<input type="checkbox" id="rowCb_${globalIdx}"
        ${this.selectedRows.has(globalIdx) ? 'checked' : ''}
        onclick="event.stopPropagation(); App.toggleRow(${globalIdx})"
        class="rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-blue-500 focus:ring-offset-0">`;
      tr.insertBefore(td, tr.firstChild);
    });

    this._syncSelectAll();
  },

  toggleRow(idx) {
    if (this.selectedRows.has(idx)) this.selectedRows.delete(idx);
    else this.selectedRows.add(idx);
    this._syncSelectAll();
    this._updateExportBtn();
  },

  toggleAllRows() {
    const start = (this.page - 1) * this.pageSize;
    const end   = Math.min(start + this.pageSize, this.currentData.length);
    const idxs  = Array.from({ length: end - start }, (_, i) => start + i);
    const allOn = idxs.every(i => this.selectedRows.has(i));
    idxs.forEach(i => allOn ? this.selectedRows.delete(i) : this.selectedRows.add(i));
    this._renderTable();
  },

  _syncSelectAll() {
    const cb = document.getElementById('selectAllCb');
    if (!cb) return;
    const start  = (this.page - 1) * this.pageSize;
    const end    = Math.min(start + this.pageSize, this.currentData.length);
    const idxs   = Array.from({ length: end - start }, (_, i) => start + i);
    const selCt  = idxs.filter(i => this.selectedRows.has(i)).length;
    cb.checked       = idxs.length > 0 && selCt === idxs.length;
    cb.indeterminate = selCt > 0 && selCt < idxs.length;
  },

  _updateExportBtn() {
    const btn = document.getElementById('exportBtn');
    if (!btn) return;
    const n   = this.selectedRows.size;
    const svg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`;
    if (n > 0) {
      btn.innerHTML = `${svg} Export Selected (${n})`;
      btn.className = 'text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-9 rounded-lg flex items-center gap-2 transition shadow-sm';
    } else {
      btn.innerHTML = `${svg} Export Excel`;
      btn.className = 'text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-9 rounded-lg flex items-center gap-2 transition shadow-sm';
    }
  },

  prevPage()         { if (this.page > 1) { this.page--; this._renderTable(); } },
  nextPage()         { const p = Math.ceil(this.currentData.length / this.pageSize); if (this.page < p) { this.page++; this._renderTable(); } },
  changePageSize(n)  { this.pageSize = n; this.page = 1; this._renderTable(); },

  exportExcel() {
    const n     = this.selectedRows.size;
    const label = this.navItems().find(x => x.id === this.currentRoute)?.label || this.currentRoute;
    const detail = n > 0
      ? `${label} – ${n} selected row${n !== 1 ? 's' : ''}`
      : `${label} – filtered export`;
    Utils.toast(n > 0 ? `Exporting ${n} selected rows…` : 'Export queued — check Logs for status', 'info');
    Data.LOGS.unshift({
      id: `lg${Date.now()}`, type: 'Excel Download', user: Auth.current().name,
      detail, size: '—', ts: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Pending',
    });
  },

  exportMasterData(tabIdx) {
    const label = ['Stores', 'Users', 'Products'][tabIdx] || 'Master Data';
    Utils.toast(`Exporting ${label}…`, 'info');
    Data.LOGS.unshift({
      id: `lg${Date.now()}`, type: 'Excel Download', user: Auth.current().name,
      detail: `Master Data — ${label} export`,
      size: '—', ts: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Pending',
    });
  },

  logout() { Auth.logout(); window.location.href = 'index.html'; },
};
