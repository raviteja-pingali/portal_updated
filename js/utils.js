// ── Utilities ─────────────────────────────────────────────────────────────────

const Utils = {
  badge(text, type = 'default') {
    const cls = {
      success:  'bg-green-100 text-green-800',
      danger:   'bg-red-100 text-red-800',
      warning:  'bg-amber-100 text-amber-800',
      info:     'bg-blue-100 text-blue-800',
      default:  'bg-gray-100 text-gray-700',
      inactive: 'bg-gray-100 text-gray-400',
    }[type] || 'bg-gray-100 text-gray-700';
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}">${text}</span>`;
  },

  scoreBar(score) {
    const pct   = Math.min(100, Math.max(0, score));
    const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
    return `<div class="flex items-center gap-2">
      <div class="flex-1 bg-gray-200 rounded-full h-1.5">
        <div class="${color} h-1.5 rounded-full" style="width:${pct}%"></div>
      </div>
      <span class="text-xs text-gray-600 w-8 text-right">${pct.toFixed(0)}%</span>
    </div>`;
  },

  kpiCard(icon, label, value, sub, color = 'blue') {
    const colors = {
      blue:   { bg:'bg-blue-50',   icon:'text-blue-600',   border:'border-blue-100' },
      green:  { bg:'bg-green-50',  icon:'text-green-600',  border:'border-green-100' },
      amber:  { bg:'bg-amber-50',  icon:'text-amber-600',  border:'border-amber-100' },
      red:    { bg:'bg-red-50',    icon:'text-red-600',    border:'border-red-100' },
      purple: { bg:'bg-purple-50', icon:'text-purple-600', border:'border-purple-100' },
    };
    const c = colors[color] || colors.blue;
    return `
    <div class="bg-white rounded-xl border ${c.border} p-5 flex items-start gap-4 shadow-sm">
      <div class="${c.bg} rounded-lg p-3 ${c.icon} text-2xl flex-shrink-0">${icon}</div>
      <div>
        <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">${label}</p>
        <p class="text-2xl font-bold text-gray-800 mt-0.5">${value}</p>
        ${sub ? `<p class="text-xs text-gray-400 mt-1">${sub}</p>` : ''}
      </div>
    </div>`;
  },

  // cols: string[]  OR  {label, key, sortable}[]
  // sortState: { key, dir } | null
  table(cols, rows, sortState = null) {
    const emptyRow = `<tr><td colspan="${cols.length}" class="px-4 py-10 text-center text-gray-400 text-sm">No data found</td></tr>`;

    const headers = cols.map(c => {
      const label    = typeof c === 'string' ? c : c.label;
      const key      = typeof c === 'string' ? null : c.key;
      const sortable = typeof c !== 'string' && c.sortable && key;

      let sortIcon = '';
      if (sortable) {
        if (sortState?.key === key) {
          sortIcon = sortState.dir === 'asc'
            ? `<span class="ml-1 text-blue-500 text-xs">▲</span>`
            : `<span class="ml-1 text-blue-500 text-xs">▼</span>`;
        } else {
          sortIcon = `<span class="ml-1 text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">⇅</span>`;
        }
      }

      const clickable = sortable
        ? `onclick="App.setSort('${key}')" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none group transition-colors"`
        : `class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"`;

      return `<th ${clickable}>${label}${sortIcon}</th>`;
    });

    return `
    <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>${headers.join('')}</tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          ${rows.length ? rows.join('') : emptyRow}
        </tbody>
      </table>
    </div>`;
  },

  tr(cells, cls = '') {
    return `<tr class="hover:bg-gray-50 transition-colors ${cls}">${cells.map(c => `<td class="px-4 py-3 whitespace-nowrap">${c}</td>`).join('')}</tr>`;
  },

  // Prominent keyword search bar for report pages
  keywordSearch() {
    return `
    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
        </svg>
      </span>
      <input id="kw_search" type="text" placeholder="Search across all columns…"
        oninput="App.applyFilters()"
        class="w-full pl-10 pr-10 py-3 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-sm bg-white outline-none transition shadow-sm" />
      <button onclick="App.clearSearch()" title="Clear search"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 text-xl leading-none transition">×</button>
    </div>`;
  },

  // Filter chips row (dropdowns + date range)
  filterChips(filters) {
    return `<div class="flex flex-wrap gap-2 items-center">
      ${filters.map(f => {
        if (f.type === 'select') {
          return `<select id="${f.id}" onchange="App.applyFilters()"
            class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-9">
            <option value="">${f.label}</option>
            ${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>`;
        }
        if (f.type === 'date') {
          return `<div class="flex items-center gap-1">
            <span class="text-xs text-gray-500">${f.label}</span>
            <input id="${f.id}_from" type="date" onchange="App.applyFilters()"
              class="text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none h-9" />
            <span class="text-xs text-gray-400">–</span>
            <input id="${f.id}_to" type="date" onchange="App.applyFilters()"
              class="text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none h-9" />
          </div>`;
        }
        return '';
      }).join('')}
      <button onclick="App.clearFilters()"
        class="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 h-9 hover:bg-gray-50 transition">
        Clear all
      </button>
      <div class="flex-1"></div>
      <button id="exportBtn" onclick="App.exportExcel()"
        class="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-9 rounded-lg flex items-center gap-2 transition shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export Excel
      </button>
    </div>`;
  },

  // Keep old filterBar for backward compat (logs page uses it indirectly)
  filterBar(filters) { return this.filterChips(filters); },

  pagerHtml(totalRows, pageSize, currentPage) {
    const pages = Math.ceil(totalRows / pageSize) || 1;
    const from  = Math.min((currentPage - 1) * pageSize + 1, totalRows);
    const to    = Math.min(currentPage * pageSize, totalRows);
    return `
    <div class="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Showing <strong>${from}–${to}</strong> of <strong>${totalRows}</strong> rows</span>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">Rows per page:</span>
        <select onchange="App.changePageSize(+this.value)"
          class="border border-gray-200 rounded px-2 py-1 text-xs bg-white">
          ${[100, 500, 1000].map(s => `<option ${s === pageSize ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button onclick="App.prevPage()" ${currentPage <= 1 ? 'disabled' : ''}
          class="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-base leading-none">‹</button>
        <span class="text-xs">${currentPage} / ${pages}</span>
        <button onclick="App.nextPage()" ${currentPage >= pages ? 'disabled' : ''}
          class="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-base leading-none">›</button>
      </div>
    </div>`;
  },

  modal(id, title, body, footer = '') {
    return `
    <div id="${id}" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden"
      onclick="if(event.target===this)Utils.closeModal('${id}')">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 class="font-semibold text-gray-800 text-lg">${title}</h3>
          <button onclick="Utils.closeModal('${id}')" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div class="px-6 py-4 overflow-y-auto flex-1">${body}</div>
        ${footer ? `<div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">${footer}</div>` : ''}
      </div>
    </div>`;
  },

  openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); },
  closeModal(id) { document.getElementById(id)?.classList.add('hidden'); },

  toast(msg, type = 'success') {
    const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
    const t = document.createElement('div');
    t.className = `fixed bottom-6 right-6 z-50 ${colors[type] || colors.info} text-white text-sm px-5 py-3 rounded-xl shadow-lg transition-all duration-300`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
  },

  fmtScore(v) {
    if (v >= 80) return `<span class="text-green-600 font-semibold">${v.toFixed(1)}%</span>`;
    if (v >= 60) return `<span class="text-amber-600 font-semibold">${v.toFixed(1)}%</span>`;
    return `<span class="text-red-600 font-semibold">${v.toFixed(1)}%</span>`;
  },

  // Horizontal bar for survey response summary
  hBar(label, count, total, color = 'bg-blue-500') {
    const pct = total ? Math.round(count / total * 100) : 0;
    return `
    <div class="flex items-center gap-2 text-sm">
      <span class="w-16 text-right text-xs text-gray-600 flex-shrink-0">${label}</span>
      <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div class="${color} h-5 rounded-full flex items-center justify-end pr-2 transition-all"
          style="width:${pct}%;min-width:${count?'1.5rem':'0'}">
          ${count ? `<span class="text-white text-xs font-medium">${count}</span>` : ''}
        </div>
      </div>
      <span class="text-xs text-gray-400 w-8 flex-shrink-0">${pct}%</span>
    </div>`;
  },
};
