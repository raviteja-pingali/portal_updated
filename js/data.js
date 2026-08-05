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
  // Beverages
  { id:'p1',  sku:'PEP-B001', name:'Pepsi Cola 12oz Can',            brand:'Pepsi',       category:'Cola',          packshot:'https://placehold.co/56x56/003087/FFFFFF?text=Pepsi',     market:'m1' },
  { id:'p2',  sku:'PEP-B002', name:'Pepsi Zero Sugar 12oz Can',      brand:'Pepsi',       category:'Cola',          packshot:'https://placehold.co/56x56/1a1a2e/FFFFFF?text=Pepsi+0',   market:'m1' },
  { id:'p3',  sku:'PEP-B003', name:'Mountain Dew 12oz Can',          brand:'Mountain Dew',category:'Citrus Soda',   packshot:'https://placehold.co/56x56/009900/FFFFFF?text=Mtn+Dew',   market:'m1' },
  { id:'p4',  sku:'PEP-B004', name:'Mountain Dew Code Red 12oz Can', brand:'Mountain Dew',category:'Citrus Soda',   packshot:'https://placehold.co/56x56/CC0000/FFFFFF?text=Code+Red',  market:'m1' },
  { id:'p5',  sku:'PEP-B005', name:'Gatorade Fruit Punch 28oz',      brand:'Gatorade',    category:'Sports Drink',  packshot:'https://placehold.co/56x56/E8000D/FFFFFF?text=Gatorade',  market:'m1' },
  { id:'p6',  sku:'PEP-B006', name:'Gatorade Lemon-Lime 28oz',       brand:'Gatorade',    category:'Sports Drink',  packshot:'https://placehold.co/56x56/78BE20/FFFFFF?text=Gatorade',  market:'m1' },
  { id:'p7',  sku:'PEP-B007', name:'Tropicana Pure Premium OJ 52oz', brand:'Tropicana',   category:'Juice',         packshot:'https://placehold.co/56x56/FF6600/FFFFFF?text=Tropicana', market:'m1' },
  { id:'p8',  sku:'PEP-B008', name:'Lipton Iced Tea Lemon 18.5oz',   brand:'Lipton',      category:'Tea',           packshot:'https://placehold.co/56x56/BBAA00/000000?text=Lipton',    market:'m1' },
  { id:'p9',  sku:'PEP-B009', name:'Aquafina Purified Water 20oz',   brand:'Aquafina',    category:'Water',         packshot:'https://placehold.co/56x56/00AACC/FFFFFF?text=Aquafina',  market:'m1' },
  { id:'p10', sku:'PEP-B010', name:'ROCKSTAR Original Energy 16oz',  brand:'ROCKSTAR',    category:'Energy Drink',  packshot:'https://placehold.co/56x56/FFD700/000000?text=ROCKSTAR',  market:'m1' },
  // Frito-Lay Snacks
  { id:'p11', sku:'PEP-S001', name:"Lay's Classic Potato Chips 2.63oz", brand:"Lay's",   category:'Chips',         packshot:'https://placehold.co/56x56/FFD700/000000?text=Lays',      market:'m1' },
  { id:'p12', sku:'PEP-S002', name:'Doritos Nacho Cheese 2.875oz',   brand:'Doritos',     category:'Tortilla Chips',packshot:'https://placehold.co/56x56/FF4500/FFFFFF?text=Doritos',   market:'m1' },
  { id:'p13', sku:'PEP-S003', name:'Cheetos Crunchy 3.25oz',         brand:'Cheetos',     category:'Cheese Snacks', packshot:'https://placehold.co/56x56/FF8C00/FFFFFF?text=Cheetos',   market:'m1' },
  { id:'p14', sku:'PEP-S004', name:'Ruffles Original 2.5oz',         brand:'Ruffles',     category:'Chips',         packshot:'https://placehold.co/56x56/C8102E/FFFFFF?text=Ruffles',   market:'m1' },
  { id:'p15', sku:'PEP-S005', name:'Tostitos Scoops! Original 10oz', brand:'Tostitos',    category:'Tortilla Chips',packshot:'https://placehold.co/56x56/D4A017/000000?text=Tostitos',  market:'m1' },
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

// ── Model Accuracy Data ────────────────────────────────────────────────────────
const MODEL_LATEST = {
  users: 181, store_visits: 2204, images_captured: 6363,
  accuracy: 88, merch_compliance: 75,
  accuracy_poor_merch: 64, accuracy_good_merch: 30, non_pepsi_accuracy: 89,
  inaccuracy_npd: 20, inaccuracy_low_training: 40, inaccuracy_occlusion: 30, inaccuracy_pack_placement: 30,
};

const MODEL_HISTORY = [
  { month:'Jun 2025', version:'v1.0', app_accuracy:72, br_accuracy:68, training_images:5000,  new_images:0,   val_set_version:'VS-1', val_set_updated:true,  val_set_note:'Initial validation set — 100 curated images across all SKU types' },
  { month:'Jul 2025', version:'v1.1', app_accuracy:75, br_accuracy:71, training_images:5800,  new_images:800, val_set_version:'VS-1', val_set_updated:false, val_set_note:'' },
  { month:'Aug 2025', version:'v1.2', app_accuracy:74, br_accuracy:73, training_images:6500,  new_images:700, val_set_version:'VS-1', val_set_updated:false, val_set_note:'' },
  { month:'Sep 2025', version:'v1.3', app_accuracy:77, br_accuracy:75, training_images:7200,  new_images:700, val_set_version:'VS-1', val_set_updated:false, val_set_note:'' },
  { month:'Oct 2025', version:'v1.4', app_accuracy:76, br_accuracy:77, training_images:7800,  new_images:600, val_set_version:'VS-2', val_set_updated:true,  val_set_note:'VS-2: Added 12 new Doritos variants, removed 8 discontinued products' },
  { month:'Nov 2025', version:'v2.0', app_accuracy:79, br_accuracy:80, training_images:8600,  new_images:800, val_set_version:'VS-2', val_set_updated:false, val_set_note:'' },
  { month:'Dec 2025', version:'v2.1', app_accuracy:81, br_accuracy:82, training_images:9400,  new_images:800, val_set_version:'VS-2', val_set_updated:false, val_set_note:'' },
  { month:'Jan 2026', version:'v2.2', app_accuracy:83, br_accuracy:85, training_images:10200, new_images:800, val_set_version:'VS-2', val_set_updated:false, val_set_note:'' },
  { month:'Feb 2026', version:'v2.3', app_accuracy:85, br_accuracy:87, training_images:11100, new_images:900, val_set_version:'VS-2', val_set_updated:false, val_set_note:'' },
  { month:'Mar 2026', version:'v2.4', app_accuracy:84, br_accuracy:88, training_images:11800, new_images:700, val_set_version:'VS-3', val_set_updated:true,  val_set_note:'VS-3: 2026 portfolio refresh — Ruffles variants added, Cheetos packaging update' },
  { month:'Apr 2026', version:'v2.5', app_accuracy:86, br_accuracy:90, training_images:12100, new_images:300, val_set_version:'VS-3', val_set_updated:false, val_set_note:'' },
  { month:'May 2026', version:'v2.6', app_accuracy:88, br_accuracy:91, training_images:12450, new_images:350, val_set_version:'VS-3', val_set_updated:false, val_set_note:'' },
];

const SKU_ACCURACY = [
  { type:'Heavy Solo', brand:'Doritos',    accuracy:52, packshot:'https://placehold.co/40x40/FF4500/FFFFFF?text=HS' },
  { type:'Sharing',    brand:"Lay's",      accuracy:58, packshot:'https://placehold.co/40x40/FFD700/000000?text=SH' },
  { type:'Single',     brand:'Cheetos',    accuracy:59, packshot:'https://placehold.co/40x40/FF8C00/FFFFFF?text=SI' },
  { type:'Non Pep',    brand:'Competitor', accuracy:60, packshot:'https://placehold.co/40x40/94A3B8/FFFFFF?text=NP' },
  { type:'Heavy Solo', brand:'Ruffles',    accuracy:61, packshot:'https://placehold.co/40x40/C8102E/FFFFFF?text=HS' },
  { type:'Sharing',    brand:'Doritos',    accuracy:64, packshot:'https://placehold.co/40x40/FF4500/FFFFFF?text=SH' },
  { type:'Single',     brand:"Lay's",      accuracy:66, packshot:'https://placehold.co/40x40/FFD700/000000?text=SI' },
  { type:'Multi Pack', brand:'Cheetos',    accuracy:70, packshot:'https://placehold.co/40x40/FF8C00/FFFFFF?text=MP' },
  { type:'Single',     brand:'Ruffles',    accuracy:73, packshot:'https://placehold.co/40x40/C8102E/FFFFFF?text=SI' },
  { type:'Sharing',    brand:'Tostitos',   accuracy:76, packshot:'https://placehold.co/40x40/D4A017/000000?text=SH' },
];

const ASSET_ACCURACY = [
  { name:'Aisle',               accuracy:49 },
  { name:'Gondola',             accuracy:55 },
  { name:'Rack 50 CM',          accuracy:57 },
  { name:'Rack 70 CM',          accuracy:58 },
  { name:'Rack 97 CM',          accuracy:59 },
  { name:'End Cap',             accuracy:63 },
  { name:'Floor Stand',         accuracy:67 },
  { name:'Cold Vault',          accuracy:71 },
  { name:'Checkout Cooler',     accuracy:74 },
  { name:'Freestanding Cooler', accuracy:78 },
];

const Data = {
  MARKETS, USERS, STORES, PRODUCTS,
  STORE_KPIS, ASSET_KPIS, SKU_KPIS,
  IMAGE_QUALITY, IMAGE_GALLERY, LOGS,
  TREND_DATES, TREND_COMPLIANCE, TREND_IMAGES,
  trendData,
  AVAILABLE_COLUMNS, AVAILABLE_FILTERS, REPORT_TEMPLATES,
  DASHBOARD_WIDGETS, DASHBOARD_CONFIG,
  FRAUD_TYPES,
  MODEL_LATEST, MODEL_HISTORY, SKU_ACCURACY, ASSET_ACCURACY,
};
