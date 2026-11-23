// ============================================================
// Config.gs — Konstanta, skema sheet, dan data bawaan Jejak
// ============================================================

var APP = { name: 'Jejak', version: '2.0.0' };

var SHEET = {
  TX: 'Transactions',
  ACCOUNTS: 'Accounts',
  CATEGORIES: 'Categories',
  MERCHANTS: 'Merchants',
  GOALS: 'Goals',
  DEPOSITS: 'GoalDeposits',
  SETTINGS: 'Settings',
  PROCESSED: 'ProcessedEmails',
  PARSER_LOGS: 'ParserLogs',
  SYNC_LOGS: 'GmailSyncLogs'
};

// Kolom per sheet. Kolom lama tetap dipakai; kolom baru ditambahkan di kanan.
var HEADERS = {
  Transactions: ['ID', 'Date', 'Description', 'Amount', 'Type', 'Account', 'ToAccount', 'Category', 'Merchant', 'Note', 'EmailID', 'CreatedAt', 'Status', 'Source'],
  Accounts: ['Name', 'InitialBalance', 'Color', 'Icon', 'Active', 'Mode'],
  Categories: ['Name', 'Icon', 'Color', 'Keywords', 'Active', 'FinancialGroup', 'Key', 'Budget'],
  Merchants: ['Name', 'Category', 'Count', 'LastSeen', 'Locked'],
  Goals: ['ID', 'Name', 'Target', 'Current', 'Deadline', 'Description', 'Color', 'Icon', 'CreatedAt', 'LinkedAccount', 'Status'],
  GoalDeposits: ['ID', 'GoalID', 'Date', 'Amount', 'Source', 'TxnID', 'Note'],
  Settings: ['Key', 'Value'],
  ProcessedEmails: ['EmailID', 'ProcessedAt', 'Subject', 'From', 'EmailDate', 'Parser', 'Status', 'TransactionCount', 'Message'],
  ParserLogs: ['Timestamp', 'Parser', 'EmailID', 'Status', 'Message', 'Amount', 'Account'],
  GmailSyncLogs: ['Timestamp', 'Status', 'Message', 'ThreadsScanned', 'MessagesScanned', 'MessagesParsed', 'MessagesSkipped', 'TransactionsSaved', 'Errors']
};

var TYPE = { IN: 'Income', OUT: 'Expense', TR: 'Transfer' };
var STATUS = { OK: 'ok', REVIEW: 'review' };
var GROUP = { NEED: 'Need', WANT: 'Want', SAVE: 'Saving', TRANSFER: 'Transfer', INCOME: 'Income', REVIEW: 'Review' };

// Kategori bawaan untuk pemasangan baru. `key` dipakai kode; `name` boleh diganti pengguna.
var DEFAULT_CATEGORIES = [
  { key: 'food', name: 'Makan', color: '#D9652B', group: 'Need', keywords: 'makan,makanan,nasi,warteg,warung,ayam,bakso,soto,mie,padang,sate,resto,restoran,restaurant,rumah makan,kedai,gofood,grabfood,shopeefood,food,pecel,geprek,seblak,martabak' },
  { key: 'coffee', name: 'Kopi & Jajan', color: '#9A5A22', group: 'Want', keywords: 'kopi,coffee,cafe,kafe,boba,chatime,jajan,snack,roti,es teh,starbucks,kopi kenangan,janji jiwa,point coffee,fore,tomoro,mixue,tea,teh' },
  { key: 'groceries', name: 'Belanja Harian', color: '#1F7A52', group: 'Need', keywords: 'indomaret,alfamart,alfamidi,superindo,hypermart,transmart,lotte mart,sayur,beras,pasar,minimarket,idm,giant,hero' },
  { key: 'transport', name: 'Transportasi', color: '#2F64B8', group: 'Need', keywords: 'gojek,goride,gocar,grab,ojek,taxi,krl,mrt,lrt,transjakarta,busway,kai,kereta,bensin,pertamina,shell,parkir,tol,bbm,tiket.com,traveloka,garuda,citilink' },
  { key: 'shopping', name: 'Belanja Online', color: '#A93F75', group: 'Want', keywords: 'tokopedia,shopee,lazada,blibli,tiktok shop,zalora,bukalapak' },
  { key: 'bills', name: 'Tagihan', color: '#4E40B8', group: 'Need', keywords: 'pln,listrik,pdam,wifi,indihome,internet,telkomsel,simpati,xl,axis,smartfren,pulsa,kuota,cicilan,angsuran,kos,kontrakan,bpjs,asuransi,iuran,laundry,paylater,gopay later,tagihan' },
  { key: 'health', name: 'Kesehatan', color: '#1E8A8A', group: 'Need', keywords: 'apotek,apotik,klinik,rumah sakit,dokter,obat,farmasi,vitamin,halodoc,k24,kimia farma' },
  { key: 'fun', name: 'Hiburan', color: '#8C6608', group: 'Want', keywords: 'netflix,spotify,youtube,disney,vidio,bioskop,cinema,xxi,cgv,game,steam' },
  { key: 'edu', name: 'Pendidikan', color: '#4C7A2A', group: 'Need', keywords: 'buku,gramedia,kursus,kuliah,sekolah,udemy,coursera,bimbel' },
  { key: 'fee', name: 'Biaya Admin', color: '#5F6B7D', group: 'Need', keywords: 'biaya admin,biaya transaksi,admin fee' },
  { key: 'transfer', name: 'Transfer', color: '#3A4E78', group: 'Transfer', keywords: '' },
  { key: 'salary', name: 'Gaji', color: '#17643F', group: 'Income', keywords: 'gaji,payroll,salary,thr' },
  { key: 'income_other', name: 'Pemasukan Lain', color: '#2E8B57', group: 'Income', keywords: '' },
  { key: 'other', name: 'Lainnya', color: '#5F646C', group: 'Want', keywords: '' }
];

// Nama kategori lama (versi sebelumnya) yang dipetakan ke key baru.
var CATEGORY_ALIASES = {
  food: ['food & drink', 'food', 'makan', 'eating out'],
  coffee: ['coffee & cafe', 'kopi & jajan', 'snack & treats'],
  groceries: ['belanja harian', 'groceries'],
  transport: ['transport', 'transportasi'],
  shopping: ['shopping', 'belanja online'],
  bills: ['bills', 'tagihan'],
  health: ['health', 'kesehatan'],
  fun: ['entertainment', 'hiburan'],
  edu: ['education', 'pendidikan'],
  fee: ['admin fee', 'biaya admin'],
  transfer: ['transfer'],
  salary: ['gaji', 'salary'],
  income_other: ['pemasukan lain', 'income'],
  other: ['other', 'lainnya']
};

var REQUIRED_CATEGORY_KEYS = ['other', 'transfer', 'fee', 'salary', 'income_other'];

// Katalog sumber transaksi. mode: full = parser khusus, smart = parser universal, manual = dicatat sendiri.
var SOURCES = [
  { name: 'Mandiri', abbr: 'MD', color: '#1C3F8C', mode: 'full', kind: 'Bank', aliases: ['mandiri', 'livin'], domains: ['bankmandiri.co.id'] },
  { name: 'Jago', abbr: 'JG', color: '#C9741A', mode: 'full', kind: 'Bank', aliases: ['bank jago', 'jago'], domains: ['jago.com'] },
  { name: 'BSI', abbr: 'BS', color: '#13806E', mode: 'full', kind: 'Bank', aliases: ['bank syariah indonesia', 'bsi', 'byond'], domains: ['bankbsi.co.id'] },
  { name: 'Superbank', abbr: 'SB', color: '#5B3FD6', mode: 'full', kind: 'Bank', aliases: ['superbank', 'super bank'], domains: ['superbank.id'] },
  { name: 'BCA', abbr: 'BC', color: '#1E5AA8', mode: 'smart', kind: 'Bank', aliases: ['bca', 'bank central asia', 'klikbca', 'mybca'], domains: ['bca.co.id', 'klikbca.com'] },
  { name: 'BRI', abbr: 'BR', color: '#1B4F9C', mode: 'smart', kind: 'Bank', aliases: ['bri', 'brimo', 'bank rakyat indonesia'], domains: ['bri.co.id'] },
  { name: 'BNI', abbr: 'BN', color: '#C9551F', mode: 'smart', kind: 'Bank', aliases: ['bni', 'wondr', 'bank negara indonesia'], domains: ['bni.co.id'] },
  { name: 'SeaBank', abbr: 'SE', color: '#D2491F', mode: 'smart', kind: 'Bank', aliases: ['seabank', 'sea bank'], domains: ['seabank.co.id'] },
  { name: 'blu', abbr: 'BL', color: '#1D7DB5', mode: 'smart', kind: 'Bank', aliases: ['blu by bca', 'blu'], domains: ['blubybcadigital.id', 'bcadigital.co.id'] },
  { name: 'CIMB Niaga', abbr: 'CN', color: '#8E1B1B', mode: 'smart', kind: 'Bank', aliases: ['cimb niaga', 'octo'], domains: ['cimbniaga.co.id'] },
  { name: 'Permata', abbr: 'PM', color: '#2B7A3F', mode: 'smart', kind: 'Bank', aliases: ['permata', 'permatabank'], domains: ['permatabank.co.id'] },
  { name: 'GoPay', abbr: 'GP', color: '#0F86A0', mode: 'full', kind: 'E-wallet', aliases: ['gopay', 'go pay', 'gojek'], domains: ['gojek.com', 'gopay.co.id', 'go-pay.co.id'] },
  { name: 'OVO', abbr: 'OV', color: '#5A35B5', mode: 'full', kind: 'E-wallet', aliases: ['ovo'], domains: ['ovo.co.id', 'ovo.id'] },
  { name: 'DANA', abbr: 'DA', color: '#1F6FD0', mode: 'smart', kind: 'E-wallet', aliases: ['dana'], domains: ['dana.id'] },
  { name: 'ShopeePay', abbr: 'SP', color: '#D2491F', mode: 'smart', kind: 'E-wallet', aliases: ['shopeepay', 'shopee pay'], domains: ['shopeepay.co.id', 'shopee.co.id'] },
  { name: 'Tunai', abbr: 'Rp', color: '#4E6660', mode: 'manual', kind: 'Tunai', aliases: ['tunai', 'cash'], domains: [] }
];

var DEFAULT_SETTINGS = {
  nickname: '',
  ownerNames: '',
  onboarded: false,
  trackIncome: true,
  expectedIncome: 0,
  allocNeed: 50,
  allocWant: 20,
  allocSave: 30,
  monthlyBudget: 0,
  weeklyReviewEnabled: true,
  weeklyReviewHour: 16,
  initialDaysBack: 30,
  autoCategorize: true
};

var SYNC_CONFIG = {
  maxMessagesPerRun: 200,
  searchBatch: 50,
  triggerMinutes: 15,
  keepProcessedRows: 6000,
  keepParserLogRows: 2000,
  keepSyncLogRows: 500,
  lastSyncProp: 'GMAIL_ENGINE_LAST_SYNC_AT'
};

// Nama fungsi pemicu lama yang dibersihkan saat setup.
var LEGACY_TRIGGER_HANDLERS = [
  'triggerAutoSync', 'autoContinueSyncJanuary', 'autoContinueGmailSync',
  'syncGmailTransactions', 'runWeeklyReviewJob', 'jejakSyncTrigger', 'jejakWeeklyReview'
];
