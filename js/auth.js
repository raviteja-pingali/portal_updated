// ── Auth ──────────────────────────────────────────────────────────────────────

const Auth = {
  login(email, password, marketId, role) {
    // Demo: any non-empty password works; email matches user list or we use role
    const user = Data.USERS.find(u => u.email === email && u.market === marketId) ||
                 Data.USERS.find(u => u.role === role   && u.market === marketId);
    if (!user) return null;
    const session = { ...user, market: Data.MARKETS.find(m => m.id === marketId) };
    sessionStorage.setItem('ir_session', JSON.stringify(session));
    return session;
  },

  logout() {
    sessionStorage.removeItem('ir_session');
  },

  current() {
    try { return JSON.parse(sessionStorage.getItem('ir_session')); }
    catch { return null; }
  },

  can(action) {
    const u = this.current();
    if (!u) return false;
    const perms = {
      Admin:   ['kpi','kpi_manage','filters','filters_manage','images','users','master_data','logs','download'],
      Manager: ['kpi','filters','images','surveys_manage','master_data','logs','download'],
      Regular: ['kpi_limited','filters','surveys_respond','download_limited'],
    };
    return (perms[u.role] || []).includes(action);
  },

  marketUsers() {
    const u = this.current();
    return u ? Data.USERS.filter(x => x.market === u.market.id) : [];
  },

  marketStores() {
    const u = this.current();
    return u ? Data.STORES.filter(x => x.market === u.market.id) : [];
  },
};
