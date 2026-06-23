// ── Mock Data ─────────────────────────────────────────────────────────────────

const MARKETS = [
  { id: 'm1', name: 'United States',  code: 'US' },
  { id: 'm2', name: 'United Kingdom', code: 'UK' },
  { id: 'm3', name: 'Germany',        code: 'DE' },
  { id: 'm4', name: 'France',         code: 'FR' },
];

const USERS = [
  { id:'u1',  name:'Alice Morgan',    email:'alice@corp.com',   role:'Admin',   market:'m1', status:'Active',   lastLogin:'2026-05-16 09:14' },
  { id:'u2',  name:'Ben Clarke',      email:'ben@corp.com',     role:'Regular', market:'m1', status:'Active',   lastLogin:'2026-05-16 10:22' },
  { id:'u3',  name:'Chloe Davis',     email:'chloe@corp.com',   role:'Regular', market:'m1', status:'Active',   lastLogin:'2026-05-15 14:05' },
  { id:'u4',  name:'Daniel Evans',    email:'daniel@corp.com',  role:'Regular', market:'m1', status:'Active',   lastLogin:'2026-05-14 08:30' },
  { id:'u5',  name:'Emma Foster',     email:'emma@corp.com',    role:'Regular', market:'m1', status:'Inactive', lastLogin:'2026-05-10 11:00' },
  { id:'u6',  name:'Frank Green',     email:'frank@corp.com',   role:'Admin',   market:'m2', status:'Active',   lastLogin:'2026-05-16 08:55' },
  { id:'u7',  name:'Grace Hall',      email:'grace@corp.com',   role:'Regular', market:'m2', status:'Active',   lastLogin:'2026-05-16 09:40' },
  { id:'u8',  name:'Henry King',      email:'henry@corp.com',   role:'Regular', market:'m2', status:'Active',   lastLogin:'2026-05-15 16:20' },
  { id:'u9',  name:'Isla Lee',        email:'isla@corp.com',    role:'Admin',   market:'m3', status:'Active',   lastLogin:'2026-05-16 07:30' },
  { id:'u10', name:'James Mann',      email:'james@corp.com',   role:'Regular', market:'m3', status:'Active',   lastLogin:'2026-05-16 11:15' },
  { id:'u11', name:'Karen Nash',      email:'karen@corp.com',   role:'Regular', market:'m3', status:'Active',   lastLogin:'2026-05-15 13:45' },
  { id:'u12', name:'Leo Owen',        email:'leo@corp.com',     role:'Admin',   market:'m4', status:'Active',   lastLogin:'2026-05-16 10:05' },
];

const STORES = [
  { id:'s1',  name:'Walmart Supercenter',   region:'Southeast',   city:'Atlanta',       status:'Active',   market:'m1' },
  { id:'s2',  name:'Kroger Marketplace',    region:'Midwest',     city:'Cincinnati',    status:'Active',   market:'m1' },
  { id:'s3',  name:'Target',                region:'Midwest',     city:'Minneapolis',   status:'Active',   market:'m1' },
  { id:'s4',  name:'Whole Foods Market',    region:'Northeast',   city:'Boston',        status:'Active',   market:'m1' },
  { id:'s5',  name:'Costco Wholesale',      region:'Pacific NW',  city:'Seattle',       status:'Active',   market:'m1' },
  { id:'s6',  name:'H-E-B Plus',            region:'South',       city:'San Antonio',   status:'Active',   market:'m1' },
  { id:'s7',  name:'Publix Super Market',   region:'Southeast',   city:'Orlando',       status:'Active',   market:'m1' },
  { id:'s8',  name:"Trader Joe's",          region:'West Coast',  city:'Los Angeles',   status:'Inactive', market:'m1' },
  { id:'s9',  name:'Albertsons',            region:'Southwest',   city:'Phoenix',       status:'Active',   market:'m1' },
  { id:'s10', name:'Meijer Supercenter',    region:'Midwest',     city:'Grand Rapids',  status:'Active',   market:'m1' },
  { id:'s11', name:'Tesco Extra',           region:'London',      city:'London',        status:'Active',   market:'m2' },
  { id:'s12', name:"Sainsbury's Local",     region:'South East',  city:'Brighton',      status:'Active',   market:'m2' },
  { id:'s13', name:'ASDA Superstore',       region:'North West',  city:'Manchester',    status:'Active',   market:'m2' },
  { id:'s14', name:"Morrison's",            region:'Yorkshire',   city:'Leeds',         status:'Active',   market:'m2' },
  { id:'s15', name:'Berlin Mitte',          region:'Berlin',      city:'Berlin',        status:'Active',   market:'m3' },
  { id:'s16', name:'München Marienplatz',   region:'Bavaria',     city:'Munich',        status:'Active',   market:'m3' },
  { id:'s17', name:'Paris Haussmann',       region:'Île-de-France',city:'Paris',        status:'Active',   market:'m4' },
  { id:'s18', name:'Lyon Part-Dieu',        region:'Rhône-Alpes', city:'Lyon',          status:'Active',   market:'m4' },
];

const PRODUCTS = [
  { id:'p1',  sku:'CC-001',  name:'Coca-Cola Classic 12oz Can',  brand:'Coca-Cola', category:'Cola',         market:'m1' },
  { id:'p2',  sku:'CC-002',  name:'Diet Coke 12oz Can',          brand:'Coca-Cola', category:'Cola',         market:'m1' },
  { id:'p3',  sku:'CC-003',  name:'Sprite 12oz Can',             brand:'Coca-Cola', category:'Lemon-Lime',   market:'m1' },
  { id:'p4',  sku:'CC-004',  name:'Fanta Orange 12oz Can',       brand:'Coca-Cola', category:'Fruit Soda',   market:'m1' },
  { id:'p5',  sku:'CC-005',  name:'Powerade Mountain Berry 20oz',brand:'Coca-Cola', category:'Sports Drink', market:'m1' },
  { id:'p6',  sku:'PEP-001', name:'Pepsi Cola 12oz Can',         brand:'PepsiCo',   category:'Cola',         market:'m1' },
  { id:'p7',  sku:'PEP-002', name:'Mountain Dew 12oz Can',       brand:'PepsiCo',   category:'Citrus Soda',  market:'m1' },
  { id:'p8',  sku:'PEP-003', name:'Diet Pepsi 12oz Can',         brand:'PepsiCo',   category:'Cola',         market:'m1' },
  { id:'p9',  sku:'PEP-004', name:'Gatorade Fruit Punch 20oz',   brand:'PepsiCo',   category:'Sports Drink', market:'m1' },
  { id:'p10', sku:'PEP-005', name:'Lipton Iced Tea 18.5oz',      brand:'PepsiCo',   category:'Tea',          market:'m1' },
  { id:'p11', sku:'DRP-001', name:'Dr Pepper 12oz Can',          brand:'Dr Pepper', category:'Cola',         market:'m1' },
  { id:'p12', sku:'DRP-002', name:'7UP 12oz Can',                brand:'Dr Pepper', category:'Lemon-Lime',   market:'m1' },
  { id:'p13', sku:'DRP-003', name:'Snapple Peach Tea 16oz',      brand:'Dr Pepper', category:'Tea',          market:'m1' },
  { id:'p14', sku:'MON-001', name:'Monster Energy Green 16oz',   brand:'Monster',   category:'Energy Drink', market:'m1' },
  { id:'p15', sku:'RB-001',  name:'Red Bull Energy 8.4oz',       brand:'Red Bull',  category:'Energy Drink', market:'m1' },
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pct(min, max)  { return +(Math.random() * (max - min) + min).toFixed(1); }

// Store KPI data
const STORE_KPIS = STORES.filter(s=>s.market==='m1').map((s, i) => ({
  store_id: `US-${String(i+1).padStart(3,'0')}`,
  store_name: s.name,
  region: s.region,
  city: s.city,
  status: s.status,
  compliance_pct: pct(55, 98),
  share_of_shelf: pct(12, 35),
  num_visits: rand(8, 45),
  images_captured: rand(20, 120),
  avg_quality_score: pct(62, 95),
  oos_rate: pct(2, 18),
  last_visit: `2026-05-${String(rand(10,17)).padStart(2,'0')}`,
}));

// Asset KPI data
const BRANDS   = ['Coca-Cola','PepsiCo','Dr Pepper','Monster','Red Bull'];
const ASSETS   = ['Cold Vault Door','End Cap Display','Gondola Shelf','Floor Stand','Checkout Cooler','Freestanding Cooler'];
const CONDITIONS = ['Excellent','Good','Fair','Poor'];
const ASSET_KPIS = Array.from({length:30}, (_,i) => {
  const store = STORES.filter(s=>s.market==='m1')[rand(0,9)];
  return {
    asset_id: `AST-${String(i+1).padStart(3,'0')}`,
    asset_name: ASSETS[rand(0,5)],
    store_name: store.name,
    region: store.region,
    brand: BRANDS[rand(0,4)],
    condition: CONDITIONS[rand(0,3)],
    compliance_score: pct(50, 99),
    facings_required: rand(4, 12),
    facings_actual: rand(2, 12),
    last_capture: `2026-05-${String(rand(10,17)).padStart(2,'0')}`,
    planogram_compliance: pct(45, 98),
  };
});

// SKU KPI data
const SKU_KPIS = PRODUCTS.map(p => {
  const store = STORES.filter(s=>s.market==='m1')[rand(0,9)];
  return {
    sku: p.sku,
    product_name: p.name,
    brand: p.brand,
    category: p.category,
    store_name: store.name,
    region: store.region,
    facings: rand(2, 8),
    oos_rate: pct(0, 25),
    planogram_compliance: pct(50, 100),
    weighted_distribution: pct(60, 100),
    numeric_distribution: pct(55, 100),
    last_updated: `2026-05-${String(rand(10,17)).padStart(2,'0')}`,
  };
});

// Fraud / Image Quality data
const FRAUD_TYPES = ['Bad Angle','Blur','Glare','High Brightness','High Contrast','Low Brightness','Low Contrast','No SKU Image','Photo of Photo','Tilted','Duplicate'];

function randomFraudTypes() {
  const r = Math.random();
  if (r < 0.40) return [];
  const count = r < 0.75 ? 1 : r < 0.92 ? 2 : 3;
  return [...FRAUD_TYPES].sort(() => Math.random() - 0.5).slice(0, count);
}

const IMAGE_QUALITY = Array.from({length:25}, (_,i) => {
  const store      = STORES.filter(s=>s.market==='m1')[rand(0,9)];
  const user       = USERS.filter(u=>u.market==='m1' && u.role==='Regular')[rand(0,2)];
  const fraudTypes = randomFraudTypes();
  return {
    id:           `IMG-${String(i+1).padStart(4,'0')}`,
    visit_id:     `VIS-${rand(1000,9999)}`,
    store_name:   store.name,
    region:       store.region,
    user_name:    user ? user.name : 'Unknown',
    brand:        BRANDS[rand(0,4)],
    capture_date: `2026-05-${String(rand(10,17)).padStart(2,'0')}`,
    quality_score: fraudTypes.length > 0 ? pct(5, 55) : pct(60, 95),
    fraud_types:  fraudTypes,
    status:       fraudTypes.length > 0 ? 'Flagged' : 'Clean',
  };
});

// Image repository data (gallery)
const IMAGE_GALLERY = Array.from({length:40}, (_,i) => {
  const store      = STORES.filter(s=>s.market==='m1')[rand(0,9)];
  const brand      = BRANDS[rand(0,4)];
  const colors     = ['3B82F6','10B981','F59E0B','8B5CF6','EF4444','06B6D4','84CC16'];
  const fraudTypes = randomFraudTypes();
  return {
    id:           `IMG-${String(i+1).padStart(4,'0')}`,
    visit_id:     `VIS-${rand(1000,9999)}`,
    visit_date:   `2026-05-${String(rand(8,17)).padStart(2,'0')}`,
    store_name:   store.name,
    retailer:     ['Walmart','Kroger','Target','Costco','Publix','H-E-B','Whole Foods','Albertsons'][rand(0,7)],
    brand,
    sku:          PRODUCTS[rand(0,14)].sku,
    asset_name:   ASSETS[rand(0,5)],
    quality_score: fraudTypes.length > 0 ? pct(35, 65) : pct(65, 99),
    fraud_types:  fraudTypes,
    color:        colors[rand(0,6)],
  };
});

const LOGS = [
  { id:'lg1',  type:'Excel Download', user:'Alice Morgan',  detail:'Store Report – All regions, May 2026', size:'2.1 MB', ts:'2026-05-17 09:02', status:'Complete' },
  { id:'lg2',  type:'Excel Download', user:'Ben Clarke',    detail:'SKU Report – Coca-Cola, May 2026',      size:'850 KB',ts:'2026-05-17 08:44', status:'Complete' },
  { id:'lg3',  type:'Survey Push',    user:'Ben Clarke',    detail:'Q2 Shelf Compliance – 2 users',          size:'—',     ts:'2026-05-16 14:30', status:'Delivered' },
  { id:'lg4',  type:'Excel Download', user:'Alice Morgan',  detail:'Image Quality Report – May 2026',        size:'—',     ts:'2026-05-16 11:15', status:'Failed' },
  { id:'lg5',  type:'Excel Download', user:'Ben Clarke',    detail:'Asset Report – PepsiCo, May 2026',       size:'1.4 MB',ts:'2026-05-15 16:55', status:'Complete' },
  { id:'lg6',  type:'Survey Push',    user:'Ben Clarke',    detail:'Merchandising Feedback – 3 users',       size:'—',     ts:'2026-05-15 09:10', status:'Delivered' },
  { id:'lg7',  type:'Excel Download', user:'Chloe Davis',   detail:'My Store Report – Oxford Street',        size:'320 KB',ts:'2026-05-14 13:22', status:'Complete' },
  { id:'lg8',  type:'Excel Download', user:'Alice Morgan',  detail:'Store Report – US regions',              size:'1.1 MB',ts:'2026-05-13 10:45', status:'Complete' },
  { id:'lg9',  type:'Other',          user:'System',        detail:'Market data sync – 18 stores refreshed', size:'—',    ts:'2026-05-13 06:00', status:'Complete' },
  { id:'lg10', type:'Excel Download', user:'Ben Clarke',    detail:'Logs Report export',                     size:'95 KB', ts:'2026-05-12 15:30', status:'Complete' },
];

// Dashboard KPI trend (last 14 days)
const TREND_DATES = Array.from({length:14},(_,i)=>{
  const d=new Date('2026-05-17'); d.setDate(d.getDate()-13+i);
  return `${d.getDate()}/${d.getMonth()+1}`;
});
const TREND_COMPLIANCE = TREND_DATES.map(()=>pct(72,92));
const TREND_IMAGES     = TREND_DATES.map(()=>rand(80,200));

// Dynamic trend generator — used by dashboard when period changes
function trendData(days) {
  const dates = Array.from({length: days}, (_, i) => {
    const d = new Date('2026-05-17');
    d.setDate(d.getDate() - days + 1 + i);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  return {
    dates,
    compliance: dates.map(() => pct(72, 92)),
    images:     dates.map(() => rand(60, 220)),
    visits:     dates.map(() => rand(12, 45)),
    fraud:      dates.map(() => rand(2, 18)),
    users:      dates.map(() => rand(3, 14)),
  };
}

// ── Report Template System ─────────────────────────────────────────────────────

// All columns available per aggregation level
const AVAILABLE_COLUMNS = {
  store: [
    { key:'store_id',             label:'Store ID',        type:'mono',      sortable:true },
    { key:'store_name',           label:'Store',           type:'text',      sortable:true },
    { key:'region',               label:'Region',          type:'text',      sortable:true },
    { key:'city',                 label:'City',            type:'text',      sortable:true },
    { key:'status',               label:'Status',          type:'status',    sortable:true },
    { key:'compliance_pct',       label:'Compliance %',    type:'score',     sortable:true },
    { key:'share_of_shelf',       label:'Share of Shelf',  type:'pct',       sortable:true },
    { key:'num_visits',           label:'Visits',          type:'number',    sortable:true },
    { key:'images_captured',      label:'Images',          type:'number',    sortable:true },
    { key:'avg_quality_score',    label:'Avg Quality',     type:'score',     sortable:true },
    { key:'oos_rate',             label:'OOS Rate',        type:'pct',       sortable:true },
    { key:'last_visit',           label:'Date Range',      type:'date',      sortable:true },
  ],
  asset: [
    { key:'asset_id',             label:'Asset ID',        type:'mono',      sortable:true },
    { key:'asset_name',           label:'Asset Name',      type:'text',      sortable:true },
    { key:'store_name',           label:'Store',           type:'text',      sortable:true },
    { key:'brand',                label:'Brand',           type:'text',      sortable:true },
    { key:'condition',            label:'Condition',       type:'condition', sortable:true },
    { key:'compliance_score',     label:'Compliance',      type:'bar',       sortable:true },
    { key:'facings_actual',       label:'Facings (A/R)',   type:'facings',   sortable:true },
    { key:'planogram_compliance', label:'Planogram %',     type:'score',     sortable:true },
    { key:'last_capture',         label:'Date Range',      type:'date',      sortable:true },
  ],
  sku: [
    { key:'sku',                  label:'SKU',             type:'mono',      sortable:true },
    { key:'product_name',         label:'Product',         type:'text',      sortable:true },
    { key:'brand',                label:'Brand',           type:'text',      sortable:true },
    { key:'category',             label:'Category',        type:'badge',     sortable:true },
    { key:'store_name',           label:'Store',           type:'text',      sortable:true },
    { key:'facings',              label:'Facings',         type:'number',    sortable:true },
    { key:'planogram_compliance', label:'Planogram %',     type:'score',     sortable:true },
    { key:'weighted_distribution',label:'Wtd Dist.',       type:'score',     sortable:true },
    { key:'oos_rate',             label:'OOS Rate',        type:'oos',       sortable:true },
    { key:'last_updated',         label:'Date Range',      type:'date',      sortable:true },
  ],
};

// All filters available per aggregation level
const AVAILABLE_FILTERS = {
  store: [
    { id:'f_region', type:'select', label:'Region',       options:[...new Set(STORE_KPIS.map(k => k.region))] },
    { id:'f_status', type:'select', label:'Status',       options:['Active','Inactive'] },
    { id:'f_date',   type:'date',   label:'Date Range' },
  ],
  asset: [
    { id:'f_brand',  type:'select', label:'Brand',        options:['Coca-Cola','PepsiCo','Dr Pepper','Monster','Red Bull'] },
    { id:'f_cond',   type:'select', label:'Condition',    options:['Excellent','Good','Fair','Poor'] },
    { id:'f_date',   type:'date',   label:'Date Range' },
  ],
  sku: [
    { id:'f_brand',    type:'select', label:'Brand',      options:['Coca-Cola','PepsiCo','Dr Pepper','Monster','Red Bull'] },
    { id:'f_category', type:'select', label:'Category',   options:['Cola','Lemon-Lime','Citrus Soda','Fruit Soda','Sports Drink','Tea','Energy Drink'] },
    { id:'f_date',     type:'date',   label:'Date Range' },
  ],
};

// Per-market report templates — mutated at runtime by admins
const REPORT_TEMPLATES = {};
MARKETS.forEach(m => {
  REPORT_TEMPLATES[m.id] = {
    templates: [
      {
        id: `${m.id}_store`, name: 'Store Report', type: 'builtin', level: 'store', enabled: true,
        columns: AVAILABLE_COLUMNS.store.map(c => c.key),
        filters: ['f_region','f_status','f_date'],
        columnConfig: {},
      },
      {
        id: `${m.id}_asset`, name: 'Asset Report', type: 'builtin', level: 'asset', enabled: true,
        columns: AVAILABLE_COLUMNS.asset.map(c => c.key),
        filters: ['f_brand','f_cond','f_date'],
        columnConfig: {},
      },
      {
        id: `${m.id}_sku`, name: 'SKU Report', type: 'builtin', level: 'sku', enabled: true,
        columns: AVAILABLE_COLUMNS.sku.map(c => c.key),
        filters: ['f_brand','f_category','f_date'],
        columnConfig: {},
      },
    ],
  };
});

// Dashboard widget registry
const DASHBOARD_WIDGETS = [
  { id:'kpi_cards',       label:'KPI Summary Cards',     desc:'Active stores, compliance %, images, fraud flags' },
  { id:'chart_visits',    label:'Stores Visited Chart',   desc:'Daily stores visited trend — replaces or combines with Active Users chart' },
  { id:'chart_users',     label:'Active Users Chart',     desc:'Daily active field users trend — use instead of or alongside Stores Visited' },
  { id:'chart_images',    label:'Images Captured Chart',  desc:'Daily image capture (clean vs fraud) stacked bar chart' },
  { id:'top_stores',      label:'Top & Bottom Stores',    desc:'Compliance ranking panels (top 5 / bottom 5)' },
  { id:'fraud_breakdown', label:'Image Quality Summary',   desc:'Fraud type breakdown — click a type to view flagged images in repository' },
  { id:'focus_panel',     label:'Role Focus Panel',       desc:'Team overview / personal missions' },
  { id:'ai_insights',     label:'AI Insights',            desc:'Auto-generated insights from live data' },
];

// Per-market dashboard widget config — mutated at runtime by admins
// Default: chart_visits on, chart_users off (admin can swap/enable)
const DASHBOARD_CONFIG = {};
MARKETS.forEach(m => {
  DASHBOARD_CONFIG[m.id] = {
    widgets: DASHBOARD_WIDGETS.map(w => w.id).filter(id => id !== 'chart_users'),
  };
});

const Data = {
  MARKETS, USERS, STORES, PRODUCTS,
  STORE_KPIS, ASSET_KPIS, SKU_KPIS,
  IMAGE_QUALITY, IMAGE_GALLERY, LOGS,
  TREND_DATES, TREND_COMPLIANCE, TREND_IMAGES,
  trendData,
  AVAILABLE_COLUMNS, AVAILABLE_FILTERS, REPORT_TEMPLATES,
  DASHBOARD_WIDGETS, DASHBOARD_CONFIG,
  FRAUD_TYPES,
};
