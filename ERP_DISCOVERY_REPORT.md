# TallyFlow ERP (SAPIENT ERP) — Technical & Functional Discovery Report

> **প্রস্তুতের প্রকৃতি:** Strictly Read-Only Codebase Inspection (`/app/applet`)  
> **কোডবেস সংস্করণ (Verified):** `v1.9.9.20` (`package.json`, `src/data/releaseNotes.ts`)  
> **সতর্কীকরণ:** এই রিপোর্টের প্রতিটি তথ্য সরাসরি সোর্স কোড যাচাই করে লেখা হয়েছে। যেসব বিষয় কেবল কোড পড়ে নিশ্চিত করা সম্ভব নয় (যেমন: Production Firebase Console-এর লাইভ অবস্থা, Deployed Rules, বা Live Server Env Vars), সেগুলো স্পষ্টভাবে **`Unknown / Not Verified`** হিসেবে চিহ্নিত করা হয়েছে। নিরাপত্তা নীতিমালা অনুযায়ী কোনো Secret Key, API Key বা App ID এতে অন্তর্ভুক্ত করা হয়নি।

---

## Executive Summary

**TallyFlow ERP** (অভ্যন্তরীণভাবে **SAPIENT ERP** ও প্রাসঙ্গিক স্থানে **Madina ERP** নামেও উল্লিখিত) একটি React 19 + TypeScript + Vite + Tailwind CSS v4 ভিত্তিক Multi-Tenant Cloud ERP ও Business Management Web Application, যার সাথে ঐচ্ছিক Express Backend (`server.ts`), Electron Desktop Wrapper (`electron/main.cjs`), এবং PWA (`public/manifest.json`, `public/sw.js`) সাপোর্ট রয়েছে। মূল ডাটাবেজ ও অথেনটিকেশন ইঞ্জিন হিসেবে **Firebase Auth** এবং **Cloud Firestore** ব্যবহৃত হয়েছে।

### মূল শক্তিশালী দিক (Strengths)
1. **বিস্তৃত Core ERP কভারেজ:** Double-Entry Accounting (8 ধরনের Voucher + Stock Journal/Physical Stock), Multi-Godown Inventory, Trial Balance, Balance Sheet, Profit & Loss, Payroll/Attendance/Salary Sheet, এবং Manufacturing Order ও Machine Management মডিউল সম্পূর্ণ কার্যকর রয়েছে।
2. **Quota Optimization আর্কিটেকচার:** Firestore read quota বাঁচাতে `erpService.ts`-এ 30-minute SWR + `localStorage` caching (`col_cache_*`, `swr_*`), Atomic Serial Counters (`voucher_counters`), Pre-aggregated Ledger/Item balances (`current_balance`, `current_stock`), এবং 10-second debounced `trackQuota` মেকানিজম যুক্ত করা হয়েছে।
3. **অত্যন্ত সমৃদ্ধ Founder Super-Admin Panel:** সিস্টেম ফাউন্ডার প্যানেলের (`FounderPanel.tsx`) মাধ্যমে Multi-company নিয়ন্ত্রণ, Subscription Plan ও Order অনুমোদন, Site Content CMS, Maintenance Mode, Remote Force-Refresh (`forceRefreshAt`), Error Logs থেকে 1-Click AI Fix Prompt তৈরি, এবং Hero/Dashboard/Theme/Notification/Loader/Skeleton/Sound কাস্টমাইজেশন করা যায়।
4. **ডাইনামিক UI ও Theme সিস্টেম:** একাধিক সিলেক্টেবল Landing Hero ডিজাইন (`PrecisionEnterpriseHero`, `EnterpriseSaaSHero`, `MonochromeParallaxHero`, `ThreeUiHeroDashboard`), 6টি Dashboard লেআউট, কাস্টম সাইডবার/টপবার এবং বাংলা-ইংরেজি (`LanguageContext.tsx`) ভাষা সাপোর্ট রয়েছে।

### চিহ্নিত মূল সীমাবদ্ধতা ও ঝুঁকি (Verified Gaps & Risks)
1. **Unwired / Static UI ও Mock ডেটা:** `Settings.tsx` (Backup/Restore, SMTP/WhatsApp/SMS Configure, Security/Alert toggles), `CashFlow.tsx` / `FundsFlow.tsx` / `NegativeReports.tsx` (Print/Export বাটন), `SubscriptionPage.tsx` (Support/Docs বাটন), `TaxManagement.tsx` (Delete বাটন)-এ বেশ কিছু বাটন ও টগল নিষ্ক্রিয়। `Dashboard.tsx`-এর Design 5 ও 6-এ হার্ডকোডেড ডেমো ডেটা (`1250000`, `'Office Rent Expense'`) রয়েছে; একইভাবে `AIInsights.tsx`, `CRM.tsx`, `InventoryAdvanced.tsx`, `PurchaseManagement.tsx`-এও অংশবিশেষ স্ট্যাটিক/মক ডেটা ব্যবহার করা হয়েছে।
2. **Client-Side Gemini API Key এক্সপোজার:** `vite.config.ts`-এ `define: { 'process.env.GEMINI_API_KEY': ... }` ব্যবহার করায় এবং `erpService.ts:8147`-এ সরাসরি ক্লায়েন্ট-সাইড থেকে `@google/genai` (`gemini-3.1-flash-lite`) কল করায় ব্রাউজার বান্ডেলে API Key উন্মুক্ত হওয়ার ঝুঁকি তৈরি হয়েছে।
3. **Permission সিস্টেমের দ্বৈত কাঠামো:** `FounderPanel.tsx` মাত্র ৯টি স্থূল (coarse) `AVAILABLE_PERMISSIONS` ব্যবহার করে, অথচ `UserManagement.tsx` এবং `<FeatureGuard>` বিস্তারিত `APP_FEATURES` ID (`acc_vouchers_create`, `inv_masters_view` ইত্যাদি) চেক করে—যার ফলে ফাউন্ডার প্যানেল থেকে সেট করা পারমিশন এবং কোম্পানি-লেভেল পারমিশনের মধ্যে সিঙ্ক গ্যাপ তৈরি হতে পারে।
4. **রিপোর্টগুলোতে ভারী Firestore স্ক্যান:** ভাউচার এন্ট্রি ও ড্যাশবোর্ড Zero-Deep-Scan মানলেও `StockSummary.tsx`, `ProfitAndLoss.tsx`, `BalanceSheet.tsx`, এবং `BusinessIntelligence.tsx` এখনো `5000`–`10000` ডকুমেন্ট পর্যন্ত লোড করে ক্লায়েন্ট-সাইডে ক্যালকুলেশন করে।
5. **Production vs Staging Security Rules পার্থক্য:** `/firestore.rules` (351 লাইন) এবং `/firestore.rules.staging` (437 লাইন) ভিন্ন; স্টেজিং রুলসে Firestore-এর 1000-expression limit এড়াতে `let` অপ্টিমাইজেশন ও সেফ ইমেইল গার্ড যোগ করা হলেও প্রোডাকশন রুলসে তা প্রয়োগ করা হয়েছে কি না তা `Unknown / Not Verified`।
6. **রিপোর্টিং গণনা ও বাটনের ত্রুটি:** `RatioAnalysis.tsx`-এ `Gross Profit %` ভুলবশত `netProfit` ব্যবহার করে এবং closing stock-এ `opening_qty`/Physical Stock বিবেচনা করে না; `LedgerStatement.tsx`-এর CSV ডাউনলোড বাটন `exportToPDF` কল করে।

---

## 1. Project Overview ও Technology Stack

| বিভাগ | বিস্তারিত (Codebase Verified) |
| :--- | :--- |
| **অ্যাপ্লিকেশন নাম** | `TallyFlow ERP` / `SAPIENT ERP` (`package.json`, `metadata.json`, `index.html`) |
| **সর্বশেষ সংস্করণ** | `v1.9.9.20` (`src/data/releaseNotes.ts` — `LATEST_VERSION`) |
| **Frontend Core** | React `^19.0.0`, React DOM `^19.0.0`, TypeScript `~5.8.2`, React Router DOM `^7.13.1` (`HashRouter`) |
| **Build Tool & Styling** | Vite `^6.2.0`, `@vitejs/plugin-react`, Tailwind CSS `^4.1.14`, `@tailwindcss/vite` |
| **Backend / Server** | Express `^4.21.2`, `tsx`, CORS, `better-sqlite3` (`db.ts`), `dotenv` |
| **Database & Auth** | Firebase JS SDK `^12.10.0` (Firestore + Auth), `firebase-admin` `^13.7.0` |
| **AI Integration** | `@google/genai` `^1.29.0` |
| **Charts, Animation & 3D** | `recharts`, `motion` (`motion/react`), `framer-motion`, `three` (`@types/three`), `lucide-react` |
| **Export & Printing** | `jspdf`, `jspdf-autotable`, `pdfkit`, `html2pdf.js`, `xlsx` |
| **UI Utilities** | `@hello-pangea/dnd` (Drag & Drop), `date-fns`, `clsx`, `tailwind-merge` |
| **Desktop & Deployment** | Electron `^34.3.0`, `electron-builder` `^26.1.3`, Vercel (`vercel.json`), PWA (`public/manifest.json`, `public/sw.js`) |
| **Lint & Test Scripts** | `"lint": "tsc --noEmit"` (`package.json`-এ কোনো `"test"` স্ক্রিপ্ট নেই; টেস্ট ফাইলগুলো `@firebase/rules-unit-testing` / Vitest-স্টাইলে `src/__tests__/`-এ রাখা) |

---

## 2. সম্পূর্ণ Folder ও File Structure

```text
/app/applet (Workspace Root: /)
├── package.json                  # Dependencies, scripts (dev, build, start, lint, electron:*)
├── metadata.json                 # AI Studio applet metadata (TallyFlow ERP)
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build, Tailwind plugin, process.env.GEMINI_API_KEY define
├── vercel.json                   # Vercel SPA rewrite & build configuration
├── index.html                    # Root HTML entry point
├── server.ts                     # Express backend (609 lines): health, GitHub sync/push, SQLite/Vite middleware
├── db.ts                         # better-sqlite3 local DB initialization
├── firebase-applet-config.json   # Firebase project config (projectId: tallyflow-erp-1, named firestoreDatabaseId)
├── firebase-blueprint.json       # Firestore collection schema blueprint
├── firestore.rules               # Current Firestore security rules (351 lines)
├── firestore.rules.staging       # Optimized & rule-hardened staging security rules (437 lines)
├── AGENTS.md / PROJECT_NOTES.md / security_spec.md  # Project engineering & security specs
├── public/
│   ├── manifest.json             # PWA Web App Manifest
│   └── sw.js                     # Service Worker (offline caching strategy)
├── electron/
│   ├── main.cjs                  # Electron main process (BrowserWindow, IPC handlers)
│   └── preload.cjs               # Electron contextBridge preload API
└── src/
    ├── main.tsx                  # React root mount
    ├── App.tsx                   # App shell, Layout, Providers, FeatureGuard, Route definitions (3,089 lines)
    ├── index.css                 # Tailwind v4 entry + global CSS / print / table middle-align styles
    ├── types.ts                  # Shared TypeScript interfaces & types
    ├── firebase.ts               # Firebase app, auth, db initialization
    ├── constants/
    │   ├── features.ts           # APP_FEATURES granular catalog
    │   └── navigation.ts         # NAV_ITEMS, DASHBOARD_ITEM, PAGE_TITLES
    ├── contexts/
    │   ├── AuthContext.tsx       # Firebase Auth state, UserProfile, Company state, Role flags
    │   ├── SettingsContext.tsx   # System & Company settings, UI/Hero/Sound/Loader/Skeleton configs
    │   ├── ThemeContext.tsx      # Dark/Light/Theme switching & CSS variables
    │   ├── LanguageContext.tsx   # EN / BN localization dictionary & t() helper
    │   ├── NotificationContext.tsx # Toast/Popup notifications & styles
    │   └── LoaderContext.tsx     # Global adaptive loading overlay control
    ├── hooks/
    │   ├── useSubscription.ts    # Plan tier, module limits, expiry checks
    │   └── useSiteContent.ts     # Dynamic landing CMS content loader from Firestore
    ├── services/
    │   ├── erpService.ts         # Monolithic Firestore CRUD, SWR Cache, Quota Buffer, AI call (9,309 lines)
    │   ├── errorService.ts       # Runtime error logger -> Firestore `error_logs`
    │   ├── securityAuditService.ts # Security/audit logging helpers
    │   ├── desktopService.ts     # Electron IPC bridge wrapper
    │   ├── soundService.ts       # Web Audio API / sound scheme feedback
    │   ├── exportService.ts      # CSV / Excel (xlsx) export helpers
    │   └── pdfService.ts         # jsPDF / AutoTable PDF generation
    ├── lib/ & utils/             # Formatting (formatNumber, formatQuantity, formatCurrency), printUtils, accounting helpers
    ├── data/
    │   └── releaseNotes.ts       # Version changelog (`LATEST_VERSION = "v1.9.9.20"`)
    ├── pages/
    │   ├── AIInsights.tsx        # AI financial narrative & insights
    │   ├── CRM.tsx               # Customer relationship workspace
    │   ├── DataCenter.tsx        # Data export & shared link views
    │   ├── InventoryAdvanced.tsx # Batch/Serial/Advanced inventory tools
    │   ├── PurchaseManagement.tsx# Purchase order & supplier workflows
    │   ├── TaxManagement.tsx     # VAT/Tax compliance dashboard
    │   └── landing/              # Home.tsx, Features.tsx, About.tsx, Contact.tsx, Pricing.tsx
    ├── components/               # 98 feature/UI/report components + subfolders
    │   ├── auth/                 # AuthLayouts.tsx
    │   ├── landing/              # Navbar.tsx, Footer.tsx, ErpModuleHighlights.tsx, PrecisionEnterpriseHero.tsx,
    │   │                         # EnterpriseSaaSHero.tsx, MonochromeParallaxHero.tsx, ThreeUiHeroDashboard.tsx
    │   └── (Core ERP, Reports, Admin, Modals...)
    └── __tests__/
        ├── accountingMath.test.ts
        ├── quotaClientService.test.ts
        ├── quotaConcurrency.test.ts
        └── quotaSecurityRules.test.ts
```

---

## 3. Application Architecture ও Data Flow

অ্যাপ্লিকেশনটি একটি **Client-Heavy React SPA** আর্কিটেকচারে নির্মিত যেখানে অধিকাংশ বিজনেস লজিক, লেজার সামেশন, স্টক ভ্যালুয়েশন এবং রিপোর্ট জেনারেশন ব্রাউজারে সম্পন্ন হয় এবং সরাসরি Firebase SDK-এর মাধ্যমে Cloud Firestore-এ পঠন/লিখন ঘটে।

```text
+-------------------------------------------------------------------------------+
|                                React Entry (main.tsx)                         |
|  LanguageProvider -> AuthProvider -> SettingsProvider -> ThemeProvider ->     |
|  LoaderProvider -> NotificationProvider -> HashRouter (App.tsx)               |
+---------------------------------------+---------------------------------------+
                                        |
         +------------------------------+------------------------------+
         |                                                             |
         v                                                             v
+-------------------------+                                  +--------------------+
| Public Landing Routes   |                                  | Protected ERP Shell|
| (Home, Features, About, |                                  | (Layout + Sidebar  |
|  Contact, Pricing, Auth)|                                  |  + FeatureGuard)   |
+-------------------------+                                  +---------+----------+
                                                                       |
                                                                       v
                                                        +-----------------------------+
                                                        | UI Components / Pages (100+)|
                                                        +--------------+--------------+
                                                                       |
              +--------------------------------------------------------+------------------------+
              |                                                        |                        |
              v                                                        v                        v
+---------------------------+                           +----------------------------+  +---------------+
| erpService.ts (9,309 LOC) |                           | server.ts (Express API)    |  | Gemini SDK    |
| - In-Memory Maps          |                           | - /api/health              |  | Direct Client |
| - localStorage SWR (30m)  |                           | - GitHub Status/Push       |  | Call (vite    |
| - trackQuota Buffer (10s) |                           | - SQLite (db.ts)           |  | define key)   |
+-------------+-------------+                           +----------------------------+  +---------------+
              |
              v
+-------------------------------------------------------+
| Cloud Firestore (Named DB in projectId:tallyflow-erp-1)|
| Auth Rules: firestore.rules / firestore.rules.staging |
+-------------------------------------------------------+
```

### Data Flow ও Caching কৌশল
1. **SWR & LocalStorage Cache:** `erpService.ts`-এ রিড কোটা কমাতে প্রতিটি কালেকশনের জন্য `col_cache_<collection>_<companyId>` এবং সেটিংসের জন্য `swr_settings_<companyId>` ও ৩০ মিনিটের TTL ক্যাশ (`_ledgersCache`, `_itemsCache`, `_ordersCache`, `_collectionCountCache`) ব্যবহার করা হয়।
2. **Quota Buffering (`trackQuota`):** প্রতিটি রিড/রাইট/ডিলিট অপারেশন সাথে সাথে Firestore-এ না লিখে `_quotaBuffer`-এ জমা হয় এবং **প্রতি ১০ সেকেন্ডে**, `beforeunload` বা `visibilitychange`-এ ফ্ল্যাশ হয়। ব্যর্থ হলে `localStorage`-এর `unsaved_quota_<companyId>`-তে সংরক্ষিত থাকে এবং স্টার্টআপে `initQuotaTracking()` তা পুনরুদ্ধার করে।
3. **Real-Time Listeners:** সিস্টেম সেটিংস (`SettingsContext.tsx`), কোম্পানি কনফিগারেশন, নোটিফিকেশন, এবং Error Logs (`FounderPanel.tsx`) রিয়েল-টাইম `onSnapshot` লিসেনারের মাধ্যমে আপডেট হয়। কোম্পানির `forceRefreshAt` টাইমস্ট্যাম্প পরিবর্তন হলে ক্লায়েন্ট ব্রাউজার স্বয়ংক্রিয়ভাবে রিলোড হয়।

---

## 4. সব Module, Page ও Feature-এর তালিকা

### A. Public Landing ও Auth Routes (`src/App.tsx`)
- `/` (`Home.tsx`), `/features` (`Features.tsx`), `/about` (`About.tsx`), `/contact` (`Contact.tsx`), `/pricing` (`Pricing.tsx`)
- `/docs`, `/help`, `/instructions` (`HelpPage.tsx`)
- `/release-notes`, `/whats-new` (`ReleaseNotes.tsx`)
- `/login` (`Login`), `/register` (`Register`)

### B. Core Authenticated ERP Routes (`ProtectedRoute` + `<FeatureGuard>`)
- **Dashboard:** `/dashboard` (`Dashboard.tsx`)
- **Vouchers & Accounting:** `/vouchers/new`, `/vouchers/edit/:id` (`VoucherEntry.tsx`), `/vouchers/view/:id` (`VoucherDetail.tsx`), `/accounts` (`ChartOfAccounts.tsx`), `/accounts/ledgers/new`, `/accounts/ledgers/edit/:id` (`LedgerCreation.tsx`), `/alter` (`AlterMaster.tsx`), `/group/:groupId` (`GroupDashboard.tsx`)
- **Inventory & Warehouse:** `/inventory`, `/inventory/items`, `/inventory/items/new`, `/inventory/items/edit/:id` (`ItemMaster.tsx`, `ItemCreation.tsx`), `/inventory/godowns` (`GodownMaster.tsx`), `/inventory/units` (`UnitMaster.tsx`)
- **Payroll & HR:** `/employees` (`EmployeeMaster.tsx`), `/payroll` (`PayrollManagement.tsx`), এবং রিপোর্ট রুট: `/reports/pay-slip`, `/reports/pay-sheet`, `/reports/attendance-sheet`, `/reports/payment-advice`, `/reports/payroll-statement`, `/reports/payroll-register`, `/reports/attendance-register`, `/reports/employee-profile`, `/reports/employee-head-count` (`PayrollReports.tsx`)
- **Production, Orders & Machines:** `/production/orders` (`OrderManagement.tsx`), `/production/orders/new`, `/production/orders/edit/:id` (`OrderEntry.tsx`), `/production/machines` (`MachineManagement.tsx`), `/production/reports` (`OrderReports.tsx`)
- **Financial, Inventory & Analytical Reports (`/reports`):**
  - `Daybook.tsx`, `StockSummary.tsx`, `BalanceSheet.tsx`, `ProfitAndLoss.tsx`, `TrialBalance.tsx`, `LedgerStatement.tsx`, `DuePaymentAlerts.tsx`, `AuditTrail.tsx`
  - `CashBankBooks.tsx`, `StockItemReport.tsx`, `LocationStockReport.tsx`, `StockGroupSummary.tsx`, `StockCategorySummary.tsx`
  - `RegisterReport.tsx` (Stock Transfer, Physical Stock, Contra, Payment, Receipt, Sales, Purchase, Journal Registers)
  - `NegativeReports.tsx` (Negative Ledger / Negative Stock), `CashFlow.tsx`, `FundsFlow.tsx`, `RatioAnalysis.tsx`, `FinancialInsights.tsx`, `BusinessIntelligence.tsx` (`/business-intelligence` ও `/reports/business-intelligence`), `AgeingAnalysis.tsx`, `MovementAnalysis.tsx`, `StockQuery.tsx`, `GroupSummary.tsx`, `GroupVoucher.tsx`, `SalespersonReport.tsx`, `Statistics.tsx`, `InventoryBooks.tsx`, `AccountBooks.tsx`
- **Extended Enterprise Pages (`src/pages/`):** `/tax-management` (`TaxManagement.tsx`), `/crm` (`CRM.tsx`), `/supply-chain` (`PurchaseManagement.tsx`), `/inventory-advanced` (`InventoryAdvanced.tsx`), `/data-center` (`DataCenter.tsx`), `/ai-insights` (`AIInsights.tsx`)
- **System, Workspace & Admin:** `/settings` ও `/settings/{company,ui,vouchers,print,features,security,notifications,whatsapp}` (`Settings.tsx`), `/companies` (`CompanyManagement.tsx`), `/users` (`UserManagement.tsx`), `/subscription` (`SubscriptionPage.tsx`), `/notes` (`Notes.tsx`), `/notifications` (`NotificationPage.tsx`), `/search` (`SearchPage.tsx`), `/profile` (`UserProfile.tsx`), `/founder` (`FounderPanel.tsx` — Founder-only)

---

## 5. প্রতিটি Module-এর বর্তমান Functionality

| Module | বর্তমান প্রকৃত অবস্থা (Code Verified) | সীমাবদ্ধতা / Partial / Bug (যদি থাকে) |
| :--- | :--- | :--- |
| **Landing Pages (`src/pages/landing/`)** | CMS-ভিত্তিক (`useSiteContent`), ৪টি সিলেক্টেবল Hero ডিজাইন, ইন্টারেক্টিভ ফিন্যান্সিয়াল/স্টক/প্রোডাকশন/পেরোল প্লেগ্রাউন্ড (`Features.tsx`), `inquiries` কালেকশনে ফর্ম সাবমিশন (`Contact.tsx`), এবং লাইভ প্ল্যান প্রদর্শন (`Pricing.tsx`)। | `Home.tsx:123` সাইট কনটেন্টের কালার জোরপূর্বক হালকা থিমে নরমালাইজ করে; `Pricing.tsx` ডায়নামিকভাবে `Platinum` প্ল্যান না থাকলে অটো-ক্রিয়েট করে। |
| **Dashboard (`Dashboard.tsx`)** | ৬টি ডিজাইন (`Design 1`–`Design 6`) ও `splashSubDesign` (`grid`, `neon`, `editorial`)। রিয়াল রিসেন্ট ভাউচার ও ক্যাশ/ব্যাংক সামারি লোড করে। | **Design 5 ও Design 6**-এ হার্ডকোডেড ডামি ডেটা (`revenue: 1250000`, `'Office Rent Expense'`) প্রদর্শিত হয়। |
| **Voucher Entry (`VoucherEntry.tsx`)** | Double-entry ও Single-entry মোড, ইনভেন্টরি রো, Stock Journal (Source/Destination), Physical Stock, Auto Serial Counter, কাস্টম ওয়ার্নিং মেসেজ, PDF/Print/WhatsApp/Email শেয়ার সম্পূর্ণ কাজ করে। | বড় ফাইল ও জটিল স্টেট ম্যানেজমেন্ট; সেভ করার সময় `QuotaExceeded` চেক করে লক করে। |
| **Masters & Alter (`ChartOfAccounts`, `LedgerCreation`, `ItemCreation`, `GodownMaster`, `UnitMaster`, `AlterMaster`)** | অ্যাকাউন্ট গ্রুপ ও লেজার, স্টক আইটেম/গ্রুপ/ক্যাটাগরি/ইউনিট/গোডাউন CRUD সম্পূর্ণ কার্যকর। `current_balance` ও `current_stock` মেইনটেইন করে। | নেই (কোর ফাংশনালিটি স্টেবল)। |
| **Financial Reports (`BalanceSheet`, `ProfitAndLoss`, `TrialBalance`, `LedgerStatement`, `Daybook`)** | পিরিয়ড ফিল্টারিং, ড্রিল-ডাউন নেভিগেশন, প্রিন্ট/PDF ফরম্যাটিং (`AGENTS.md` অনুযায়ী নির্দিষ্ট মার্জিন ও পেজিনেশন), মোবাইল কার্ড ভিউ (`Daybook`) কার্যকর। | `StockSummary`, `P&L`, `BalanceSheet`-এ `5000`–`10000` ডকুমেন্ট স্ক্যান হয়। `LedgerStatement.tsx`-এ CSV বাটন ক্লিক করলে `handleDownload()` ভুলবশত `exportToPDF` চালায়। |
| **CashFlow, FundsFlow, Ratios, NegativeReports** | পিরিয়ড-ভিত্তিক ট্রানজ্যাকশন গণনা করে স্ক্রিনে টেবিল দেখায়। | `CashFlow.tsx` ও `FundsFlow.tsx`-এর Print/PDF বাটনে কোনো `onClick` হ্যান্ডলার নেই; `CashFlow` প্রারম্ভিক ব্যালেন্সে পূর্বের মুভমেন্ট যোগ না করেই সরাসরি `opening_balance` নেয়। `NegativeReports.tsx`-এর Export/Print বাটন Unwired। `RatioAnalysis.tsx`-এ `Gross Profit %` `netProfit` ব্যবহার করে এবং closing stock-এ `opening_qty`/Physical Stock বাদ দেয়। |
| **Due Payment Alerts & Audit Trail** | `DuePaymentAlerts.tsx` লেজার ক্যাশ + লিমিটেড (100) ভাউচার দিয়ে ডিউ ট্র্যাক করে; `AuditTrail.tsx` পরিবর্তন লগ দেখায় ও ফাউন্ডারের জন্য বিস্তারিত ডিফ দেয়। | দুটিতেই `window.open` ব্যবহৃত হয় (iFrame সীমাবদ্ধতার সাথে সাংঘর্ষিক)। |
| **Business Intelligence (`BusinessIntelligence.tsx`)** | ৪,৪৭৫ লাইনের অ্যাডভান্সড অ্যানালিটিক্স, কস্ট সেন্টার ও এক্সপেন্স ডিস্ট্রিবিউশন চার্ট, `verifyTargetedLedgerBalances` বাটন। | কিছু কোয়েরিতে `5000`/`10000` ডকুমেন্ট লোড হয়। |
| **Payroll & HR (`EmployeeMaster`, `PayrollManagement`, `PayrollReports`)** | কর্মচারী মাস্টার, অ্যাটেনডেন্স, স্যালারি শিট প্রসেসিং, এবং ৯ ধরনের পেরোল রিপোর্ট (Payslip, Paysheet, Attendance Sheet, Payment Advice ইত্যাদি) সম্পূর্ণ কার্যকর। | কোনোটিই নয় (সম্পূর্ণ কার্যকরী, তবে `PayrollManagement.tsx` 3,680 লাইনের বড় কম্পোনেন্ট)। |
| **Production (`OrderManagement`, `OrderEntry`, `MachineManagement`, `OrderReports`)** | ম্যানুফ্যাকচারিং অর্ডার, মেশিন অ্যালোকেশন ও প্রোডাকশন রিপোর্ট কাজ করে। | Plan Tier ৩ (Gold)+ না থাকলে `<FeatureGuard>` দ্বারা ব্লক হতে পারে। |
| **Extended Pages (`src/pages/*`)** | `AIInsights.tsx`: Gemini API দিয়ে ফিন্যান্সিয়াল সামারি জেনারেট করে। `DataCenter.tsx`: বাউন্ডেড ডেটা এক্সপোর্ট দেয়। | `AIInsights`: হার্ডকোডেড সাইডবার স্কোর ও ৭ দিনের পূর্বাভাস + ক্লায়েন্ট-সাইডে API Key ব্যবহার। `CRM`: হার্ডকোডেড স্যাম্পল Timeline। `DataCenter`: ডামি শেয়ার URL (`/#/share/balancesheet`)। `InventoryAdvanced`: Movement Ledger-এ Serials ডুপ্লিকেট ও হার্ডকোডেড compliance কার্ড। `PurchaseManagement`: PO/Supply Intelligence স্ট্যাটিক। `TaxManagement`: Delete বাটন Unwired। |
| **Settings (`Settings.tsx`)** | Company profile, UI, Voucher, Print, Features ফ্ল্যাগ সেভ এবং GitHub Status/Push (`server.ts`) কার্যকর। | **Unwired UI:** `backup` ট্যাবের Manual Backup শুধু ফেক `setTimeout` টোস্ট দেখায়, Restore বাটনে `onClick` নেই, Export History হার্ডকোডেড `2024-03-14`। `integrations` ট্যাবের WhatsApp/SMTP Configure বাটন নিষ্ক্রিয়, Drive/SMS স্ট্যাটিক। `security` ট্যাবের `TallyVault`/`Security Control` ও `notifications` ট্যাবের `System Alerts` টগলগুলো নন-ইন্টার‍্যাক্টিভ স্ট্যাটিক UI। |

---

## 6. Founder Panel-এর সম্পূর্ণ Structure, Settings ও Permissions

`src/components/FounderPanel.tsx` (৮,৯০৮ লাইন) হলো সিস্টেমের সর্বোচ্চ ক্ষমতাপ্রাপ্ত সুপার-অ্যাডমিন কন্ট্রোল সেন্টার। এটি কেবল `isFounder` (`role === 'Founder'` অথবা ইমেইল `sapientman46@gmail.com`) ব্যবহারকারীদের জন্য `/founder` রুটে অ্যাক্সেসযোগ্য।

### ১২টি প্রধান Navigation View (`viewMode`)
1. **`menu`**: দ্রুত নেভিগেশন ও স্ট্যাটাস ওভারভিউ হাব।
2. **`companies`**: সব টেন্যান্ট কোম্পানির তালিকা, সার্চ, কোম্পানি তৈরি/এডিট/সাসপেন্ড, সাবস্ক্রিপশন প্ল্যান ও মেয়াদ পরিবর্তন, কোটা লিমিট কাস্টমাইজেশন (`quotaLimit`, `-1` for Unlimited) ও তাৎক্ষণিক Quota Reset অনুমোদন (`quota_reset_requests`), এবং কোম্পানি-স্পেসিফিক পারমিশন মডাল (`AVAILABLE_PERMISSIONS`)।
3. **`users`**: সিস্টেমের সকল ইউজার ম্যানেজমেন্ট, রোল পরিবর্তন (`Founder`, `Super Admin`, `Admin`, `Manager`, `Marketing Manager`, `Staff`), অ্যাক্সেস/স্ট্যাটাস টগল।
4. **`notifications`**: গ্লোবাল বা টার্গেটেড সিস্টেম নোটিফিকেশন তৈরি, শিডিউল ও ডিলিট করা।
5. **`activity`**: সিস্টেম-ব্যাপী অ্যাক্টিভিটি ও অডিট লগ পর্যবেক্ষণ।
6. **`siteContent`**: ল্যান্ডিং পেজগুলোর (`home`, `features`, `about`, `contact`) টেক্সট, টাইটেল ও কনটেন্ট এডিট করার CMS (`site_content` কালেকশন)।
7. **`plans`**: `SubscriptionPlan` (Tier 1 Bronze থেকে Tier 4 Platinum) তৈরি, এডিট, ডিলিট, ডিসকাউন্ট, সাপোর্ট আওয়ার্স, এবং ফিচার লিমিট সেটআপ।
8. **`orders`**: ব্যবহারকারীদের সাবস্ক্রিপশন অর্ডার (`subscription_orders`) রিভিউ, অনুমোদন (Approve), কারণ উল্লেখসহ বাতিল (Reject) ও ডিলিট।
9. **`features`**: `APP_FEATURES` ক্যাটালগের লেবেল ও ডেসক্রিপশন (টুলবক্স টেক্সট) কাস্টমাইজ করে সেভ করা।
10. **`errorLogs`**: `error_logs` কালেকশন থেকে রিয়েল-টাইম এরর মনিটরিং, স্ট্যাটাস পরিবর্তন (`new`, `investigating`, `resolved`, `ignored`), স্ট্যাক ট্রেস ভিউ এবং **"1-CLICK AI FIX"** বাটন (যা এরর ডিটেইলস ও স্ট্যাক ট্রেস দিয়ে একটি AI ডিবাগ প্রম্পট তৈরি ও কপি করে)।
11. **`inquiries`**: পাবলিক Contact ফর্ম থেকে আসা `inquiries` কালেকশনের মেসেজ দেখা ও ডিলিট করা।
12. **`settings`**: গ্লোবাল সিস্টেম কনফিগারেশন — যা ১০টি `systemSubTab`-এ বিভক্ত।

### System Configuration-এর ১০টি Sub-Tab (`systemSubTab`)
| Sub-Tab | নিয়ন্ত্রিত সেটিংসসমূহ (Verified) |
| :--- | :--- |
| **`general`** | App Version ম্যানেজমেন্ট (তাত্ক্ষণিক সেভ + What's New ট্রিগার), **Remote App Force-Refresh** (`forceRefreshAt` ব্রডকাস্ট), **Maintenance Break System** (লাইভ লকআউট, কাউন্টডাউন টাইমার, কারণ ও আপগ্রেড তথ্য), Connection Status টেক্সট (`Online`/`Offline`/`Error`), Topbar টগল (`Go To` শর্টকাট, Search, Notifications, Instructions), Developer Contact ফুটার। |
| **`hero`** | Landing Page চালু/বন্ধ (`landingPageEnabled`), `heroDesignStyle` নির্বাচন, `ThreeUI` 3D হলোগ্রাফিক থিম/গ্লো কালার/পার্সপেক্টিভ/পার্টিকেল/ফ্লোটিং ব্যাজ/টিল্ট টগল, **`heroShowExploreLiveDemo`** বাটন শো/হাইড টগল, `heroShowExperienceHubDemo`, `heroThreeUiShowSimulateVoucher`, এবং হিরো হেডলাইন/সাবটাইটেল/CTA/মেট্রিক টেক্সট কাস্টমাইজেশন। |
| **`theme`** | Global `uiStyle` (`UI/UX 1`, `UI/UX 2`, ইত্যাদি), `menuBarStyle`, `dashboardDesign`, `splashSubDesign`, `alterPageUiStyle`/`reportsPageUiStyle`/`searchPageUiStyle`, কলাম সংখ্যা, সাইডবার ব্যাকগ্রাউন্ড/টেক্সট কালার, Glass Background, Quick Calculator ও Pinned Bookmarks টগল, Voucher Layout ও Field Size। |
| **`notifications`** | Toast/Popup নোটিফিকেশনের Duration, Animation Style, Design Style ও Position। |
| **`branding`** | Default System Logo, System Favicon, এবং Logo Background Color। |
| **`search`** | Global Search Placeholder, Help Text, Keyboard Shortcut (`Alt+G`/Search) প্রদর্শন, Search Icon Color। |
| **`loader`** | Loading Screen আইকন স্টাইল, Blur স্টাইল, Loader Theme, Adaptive Loader টগল, ও কাস্টম লোডিং ফ্রেজ। |
| **`skeleton`** | Skeleton Shimmer অন/অফ, Dashboard-Only মোড, Bone Structure (`skeletonType`), স্পিড, থিম, স্কেলেটন রো সংখ্যা, ও ওয়েভ কালার। |
| **`warnings`** | `VoucherEntry`-এর ২২+ ভ্যালিডেশন ওয়ার্নিং মেসেজ (যেমন: `warningPartyName`, `warningJournalNotBalanced`, `warningItemsListEmpty` ইত্যাদি) কাস্টমাইজেশন। |
| **`sounds`** | Sound Effects এনাবল/ডিসাবল, Volume, Sound Scheme ও ইভেন্ট-ভিত্তিক সাউন্ড (`Success`, `Error`, `Warning`, `Delete`, `Click`, `Navigation`)। |

### Founder Panel Permissions কাঠামো ও সিঙ্ক গ্যাপ
- `FounderPanel.tsx` (লাইন ৭৫৪৯–৭৫৯৪)-এ কোম্পানি এডিট মোডালে **৯টি স্থূল পারমিশন** (`AVAILABLE_PERMISSIONS`) রয়েছে: `Dashboard`, `Ledgers`, `Vouchers`, `Items`, `Employees`, `Salary Sheets`, `Order Management`, `Machine Management`, `Settings`।
- অন্যদিকে `UserManagement.tsx` এবং `App.tsx`-এর `<FeatureGuard>` ব্যবহার করে `constants/features.ts`-এর গ্রানুলার ID (`ana_dashboard`, `acc_vouchers_create`, `inv_masters_view`, `pay_transactions` ইত্যাদি)।
- `AGENTS.md` অনুযায়ী ফিচার চেক করার সময় গ্রানুলার ও ব্রড উভয় ID চেক করার কথা থাকলেও, দুটি UI-তে ভিন্ন তালিকা থাকায় পারমিশন ম্যাপিংয়ের ক্ষেত্রে ডিসক্রিপেন্সি হতে পারে।

---

## 7. Authentication, User Roles ও Access Control

1. **Authentication প্রবাহ (`AuthContext.tsx`, `Auth.tsx`, `AuthLayouts.tsx`):**
   - Email/Password Sign-In ও Sign-Up Firebase Auth-এর মাধ্যমে সম্পন্ন হয়। রেজিস্ট্রেশনের সময় Firestore-এ `users/{uid}` ডকুমেন্ট তৈরি হয় এবং প্রথম ইউজারের জন্য কোম্পানি অ্যাসাইন/ক্রিয়েট ফ্লো (`CompanyManagement.tsx`) চালু হয়।
   - `AuthLayouts.tsx`-এ একটি `SSOButton` রয়েছে, তবে সেটি ক্লিক করলে কোনো OAuth প্রবাহ চালু না হয়ে শুধু *"Single Sign-On (SSO) is available for Enterprise workspaces..."* নোটিফিকেশন টোস্ট দেখায় (Placeholder)।
2. **User Roles (`src/types.ts`, `UserManagement.tsx`, `AuthContext.tsx`):**
   - **`Founder`**: হার্ডকোডেড ফাউন্ডার ইমেইল `sapientman46@gmail.com` অথবা `role === 'Founder'`। সম্পূর্ণ সিস্টেম ও `/founder` প্যানেলে আনরেস্ট্রিক্টেড অ্যাক্সেস।
   - **`Super Admin`**: উচ্চতর প্রশাসনিক ক্ষমতা, ফাউন্ডার-নির্ধারিত সীমার বাইরে সাধারণ সব কোম্পানিতে অ্যাক্সেস বা সাপোর্ট অ্যাক্সেস।
   - **`Admin`**: কোম্পানি-লেভেল পূর্ণ নিয়ন্ত্রণ (`APP_FEATURES`-এর সব ফিচার ডিফল্টভাবে পায়)।
   - **`Manager`**, **`Marketing Manager`** (`['acc_reports_view', 'inv_reports_view', 'inv_reports_stock', 'acc_reports_sales']`), এবং **`Staff`**: কোম্পানি অ্যাডমিন দ্বারা নির্ধারিত গ্রানুলার পারমিশনের ওপর নির্ভরশীল।
3. **Subscription & Feature Gating (`FeatureGuard.tsx`, `useSubscription.ts`):**
   - প্রতিটি প্রোটেক্টেড রুট `<FeatureGuard feature="..." permission="...">` দিয়ে মোড়ানো।
   - প্ল্যানের মেয়াদ শেষ হলে বা প্ল্যান বাতিল হলে `SubscriptionRequired.tsx` দেখায়।
   - Gold Plan (`tier >= 3`) বা তদূর্ধ্ব প্ল্যানগুলো ডিফল্টভাবে Payroll, Order Management, Manufacturing, এবং Analytics মডিউলে অ্যাক্সেস পায়।

---

## 8. Firebase, Firestore Collections ও Database Structure

- **Firebase Project Config:** `firebase-applet-config.json`-এ `projectId: "tallyflow-erp-1"` এবং একটি named `firestoreDatabaseId` কনফিগার করা আছে, যা `src/firebase.ts`-এ `getFirestore(app, firebaseConfig.firestoreDatabaseId)` দিয়ে ইনিশিয়ালাইজ হয়।
- **Firestore Collections (`firebase-blueprint.json`, `erpService.ts`, `firestore.rules`):**

| Collection Name | উদ্দেশ্য / সংরক্ষিত ডেটা | Scoping / Indexing নোট |
| :--- | :--- | :--- |
| **`companies`** | টেন্যান্ট কোম্পানি প্রোফাইল, `subscriptionPlanId`, `planExpiry`, `quotaLimit`, `quotaUsed`, `quotaReads`, `quotaWrites`, `quotaDeletes`, `quotaHourly`, `forceRefreshAt`, `search_config` | Root collection |
| **`users`** | ইউজার প্রোফাইল, `uid`, `email`, `role`, `companyId`, `companyIds`, `permissions`, `quotaLimit`, `quotaUsed`, `status` | Document ID = Auth `uid` |
| **`vouchers`** | মূল ভাউচার হেডার (`v_type`, `v_date`, `serial_no`, `total_amount`, `party_ledger_id`, `narration`) | `companyId` + `v_date` + `v_type` |
| **`voucher_entries`** | ভাউচারের ডাবল-এন্ট্রি লেজার লাইন (`voucher_id`, `ledger_id`, `debit`, `credit`, `cost_centre`) | `companyId` scoped |
| **`inventory_entries`** | ভাউচারের স্টক মুভমেন্ট লাইন (`voucher_id`, `item_id`, `godown_id`, `qty`, `rate`, `movement_type`) | `companyId` scoped |
| **`voucher_counters`** | Auto-serial কাউন্টার ডকুমেন্ট (`${companyId}_${vType}`) | Zero-deep-scan atomic counter |
| **`ledgers` & `ledger_groups`** | চার্ট অব অ্যাকাউন্টস গ্রুপ ও লেজার (`opening_balance`, `current_balance`, `address`, `division`, `postal_code`) | `companyId` scoped |
| **`items`, `item_groups`, `item_categories`, `godowns`, `units`** | স্টক আইটেম (`opening_qty`, `current_stock`, `rate`, `purchase_price`), গোডাউন ও একক | `companyId` scoped |
| **`employees`, `attendance`, `salary_sheets`** | কর্মচারী মাস্টার, উপস্থিতি ও মাসিক স্যালারি শিট | `companyId` scoped |
| **`orders` & `machines`** | প্রোডাকশন অর্ডার ও মেশিন মাস্টার | `companyId` scoped |
| **`settings`** | সিস্টেম গ্লোবাল সেটিংস (`system` doc) ও কোম্পানি-ভিত্তিক সেটিংস | System & Company level |
| **`site_content`** | ল্যান্ডিং পেজগুলোর ডাইনামিক কনটেন্ট (`home`, `features`, `about`, `contact`) | Public read, Founder write |
| **`subscription_plans`, `subscription_orders`** | সাবস্ক্রিপশন প্ল্যান ও ম্যানুয়াল পেমেন্ট অর্ডার (bKash/Nagad/Bank) | Plan public read; Orders scoped |
| **`quota_reset_requests`** | ইউজার/অ্যাডমিনদের দৈনিক কোটা রিসেটের পেন্ডিং রিকোয়েস্ট | Founder approval queue |
| **`error_logs`, `audit_logs`, `notifications`, `inquiries`, `notes`** | রানটাইম এরর লগ, অডিট ট্রেইল, নোটিফিকেশন, কন্টাক্ট ইনকোয়ারি ও মেমো নোট | Role/Company scoped |

- **Local SQLite (`db.ts`):** `server.ts` Express ব্যাকএন্ডে `better-sqlite3` ইনিশিয়ালাইজেশনের জন্য `db.ts` রয়েছে, তবে মূল ERP ডেটা ক্লায়েন্ট-সাইড থেকে সরাসরি Firestore-এই সংরক্ষিত হয়।

---

## 9. Firestore Security Rules এবং গুরুত্বপূর্ণ Security Mechanisms

প্রজেক্টে দুটি রুলস ফাইল রয়েছে: `/firestore.rules` (৩৫১ লাইন) এবং `/firestore.rules.staging` (৪৩৭ লাইন)।

1. **Multi-Tenant Company Isolation:** প্রায় সব বিজনেস কালেকশনে `isSameCompany(companyId)` হেল্পার ব্যবহার করে নিশ্চিত করা হয়েছে যে ইউজার কেবল তার নিজস্ব `companyId`-এর ডেটাই পড়তে বা লিখতে পারে।
2. **Role & Ownership Guards:**
   - `isFounder()` ও `isSuperAdminBasic()` ফাংশন Auth Token Email (`sapientman46@gmail.com`) এবং ইউজার ডকুমেন্টের `role` যাচাই করে।
   - ইউজার নিজ প্রোফাইলের সংবেদনশীল ফিল্ড (`role`, `companyId`, `quotaLimit`, `isFounder` ইত্যাদি) নিজে পরিবর্তন করতে পারে না।
3. **Quota Integrity Rules (`quotaUsed`, `quotaReads`, `quotaWrites`, `quotaDeletes`, `quotaHourly`):**
   - ক্লায়েন্ট যাতে কোটা কাউন্টার কমিয়ে জালিয়াতি করতে না পারে, সেজন্য রুলস কেবল নন-নেগেটিভ ইনক্রিমেন্ট অনুমোদন করে এবং আনঅথোরাইজড ফিল্ড মডিফিকেশন ব্লক করে; শুধুমাত্র Founder কোটা লিমিট পরিবর্তন বা রিসেট (`0`) করতে পারে।
4. **Staging Rules-এ চিহ্নিত ও সংশোধিত বাগ (`firestore.rules.staging`):**
   - টেস্ট স্যুট চালানোর সময় প্রোডাকশন-সমতুল্য রুলসে **1000-expression evaluation limit** (লাইন ১৮২ ও ৪০৬-এ) এবং `isSuperAdminBasic()`-এ missing `email` token claim (`request.auth.token.email` না থাকলে ত্রুটি) চিহ্নিত হয়েছিল।
   - `/firestore.rules.staging`-এ `let` বাইন্ডিং ব্যবহার করে বারবার ডকুমেন্ট এক্সপ্রেশন ইভালুয়েশন কমানো হয়েছে এবং `isFounder()` / `isSuperAdminBasic()`-এ `'email' in request.auth.token` সেফটি গার্ড যোগ করা হয়েছে।
   - **গুরুত্বপূর্ণ:** `/firestore.rules` (প্রোডাকশন ফাইল) ও Firebase Console-এ লাইভ ডিপ্লয়েড রুলসে এই স্টেজিং অপ্টিমাইজেশনগুলো প্রয়োগ করা হয়েছে কি না তা **`Unknown / Not Verified`**।

---

## 10. Existing UI/UX Architecture ও Shared Components

- **App Shell & Navigation (`App.tsx`, `constants/navigation.ts`):** ডাইনামিক কোলাপসিবল Sidebar, Topbar-এ Global Search ট্রিগার, Notification Bell (`NotificationCenter`), Profile Menu (`FacebookProfileMenu`), Company Switcher, Quota Meter/Badge (`QuotaDashboardModal` ট্রিগার), এবং ভাসমান `SystemGuideFloatingButton`।
- **Command & Search UX:** `GlobalSearch.tsx` (ভাউচার, লেজার, আইটেম, কর্মচারী খোঁজা—১০০ ডকুমেন্ট ক্যাপসহ) এবং Tally-অনুপ্রাণিত `GoToSearch.tsx` (`Alt+G` শর্টকাট)।
- **Quota Modals:** `QuotaDashboardModal.tsx` (৪ ট্যাব: Overview, Module Breakdown, Team Quota, Operation Controls; ০১:০০ PM BST কাউন্টডাউন; Founder 24h Timeline Graph টগল), `QuotaExceededModal.tsx`, এবং `QuotaResetRequestModal.tsx`।
- **Table & Report Formatting Conventions (`index.css`, `printUtils.ts`, `pdfService.ts`):**
  - সকল পেজের হেডার ফিক্সড এবং শুধুমাত্র ডেটা/টেবিল সেকশন স্ক্রলযোগ্য; টেবিল হেডার Sticky।
  - Microsoft Word-এর মতো সর্বত্র টেবিল সেলে (`td`, `th`) `vertical-align: middle` enforced।
  - `AGENTS.md` অনুযায়ী PDF ও Print রিপোর্টে একই PDF ব্লব জেনারেটর ব্যবহার, নির্দিষ্ট মার্জিন (`0.5in` top, `1.2in` bottom, `0.3in` L/R), প্রথম পাতায় ৩৪ সারি এবং পরবর্তী পাতায় ৩৮ সারি পেজিনেশন ও টপ-রাইটে সিঙ্গেল পেজ নম্বর।
- **Audio & Feedback:** `soundService.ts` সাফল্য, ত্রুটি, সতর্কতা, ডিলিট ও নেভিগেশন ক্লিকে অডিও ফিডব্যাক দেয়; `ErrorBoundary.tsx` ক্র্যাশ ধরার সাথে সাথে `errorService.ts`-এ লগ পাঠায়।

---

## 11. Responsive Design-এর বর্তমান অবস্থা

- **মূল লেআউট ও নেভিগেশন:** `App.tsx`-এ `sm:`, `md:`, `lg:`, `xl:` ব্রেকপয়েন্ট ব্যবহার করে ডেস্কটপে পার্মানেন্ট/কোলাপসিবল সাইডবার এবং ছোট স্ক্রিনে স্লাইড-ওভার মোবাইল নেভিগেশন ড্রয়ার রয়েছে। ল্যান্ডিং পেজগুলো (`Home`, `Features`, `Pricing`, `About`, `Contact`) সম্পূর্ণ রেসপনসিভ গ্রিড ব্যবহার করে।
- **ডেটা টেবিল ও রিপোর্ট:**
  - `Daybook.tsx`, `StockSummary.tsx`, এবং কিছু লেজার ভিউতে ছোট স্ক্রিনের জন্য ডেডিকেটেড **Mobile Card View** আছে।
  - তবে অধিকাংশ ভারী ফিন্যান্সিয়াল ও অ্যাডমিন টেবিলে (যেমন `TrialBalance`, `BusinessIntelligence`, `QuotaDashboardModal`, `FounderPanel`) `min-w-[600px]` থেকে `min-w-[1000px]` সহ `overflow-x-auto` হরিজন্টাল স্ক্রল ব্যবহার করা হয়েছে, যা মোবাইল স্ক্রিনে কার্যকর হলেও অনুভূমিক স্ক্রলিং দাবি করে।
- **মোডালসমূহ:** মোডালগুলোতে `max-h-[85vh]` / `max-h-[92vh]` এবং ভেতরে `overflow-y-auto` রয়েছে যাতে ছোট স্ক্রিনে কন্টেন্ট কেটে না যায়।

---

## 12. Design/Theme Selection System-এর Architecture

ডিজাইন ও থিম কনফিগারেশন দুটি কনটেক্সটের সমন্বয়ে পরিচালিত হয়: `ThemeContext.tsx` (CSS কালার/ড্রাইভ মোড) এবং `SettingsContext.tsx` (গ্লোবাল ও কোম্পানি-লেভেল UI প্রোপার্টি)।

1. **Multi-Layer Override Hierarchy:** `Founder System Settings` (`settings/system` ডকুমেন্ট) -> `Company Settings` (`settings` / `company` ডকুমেন্ট) -> `Local State / localStorage` (`swr_*`)।
2. **Hero Landing Selector (`Home.tsx`, `SettingsContext.tsx`):** `heroDesignStyle` অনুযায়ী ৪টি পৃথক হিরো রেন্ডার হয়:
   - `PrecisionEnterpriseHero.tsx`
   - `EnterpriseSaaSHero.tsx`
   - `MonochromeParallaxHero.tsx`
   - `ThreeUiHeroDashboard.tsx` (Three.js / 3D টিল্ট, পার্টিকেল ও ইন্টারেক্টিভ হাব ডেমোসহ; ফাউন্ডার প্যানেল থেকে `heroShowExploreLiveDemo`, `heroShowExperienceHubDemo` ইত্যাদি টগল করা যায়)।
3. **Dashboard Design Selector (`Dashboard.tsx`):** ৬টি লেআউট (`Design 1` থেকে `Design 6`) এবং `splashSubDesign` (`grid`, `neon`, `editorial`) সমর্থিত।
4. **UI Style, Sidebar & Feedback Schemes:** `uiStyle` (`UI/UX 1`, `UI/UX 2`), `menuBarStyle`, `SIDEBAR_BG_OPTIONS` ও `SIDEBAR_TEXT_OPTIONS`, পেজ-নির্দিষ্ট স্টাইল (`alterPageUiStyle`, `reportsPageUiStyle`, `searchPageUiStyle`), এবং Loader (`loaderIconStyle`, `loaderBlurStyle`), Skeleton Shimmer, Notification Position/Animation এবং Sound Schemes ডাইনামিকভাবে পরিবর্তিত হয়।

---

## 13. Accounting, Inventory, Voucher ও Reporting-এর Business Logic

1. **Double-Entry ও Ledger Balance গণনা (`utils`, `erpService.ts`, `LedgerStatement.tsx`):**
   - `opening_balance` ধনাত্মক হলে **Dr** এবং ঋণাত্মক হলে **Cr**।
   - Debit যোগ হয় (`+ debit`) এবং Credit বিয়োগ হয় (`- credit`)।
   - নির্দিষ্ট সময়ের ব্যালেন্স সূত্র: `netBalance = opening_balance + sum(debit) - sum(credit)`।
   - **Sundry Debtors:** `balance = Math.abs(netBalance)`, `isDr = netBalance >= 0` (Dr = সবুজ, Cr = লাল)।
   - **Sundry Creditors:** `balance = Math.abs(netBalance)`, `isDr = netBalance > 0` (`netBalance <= 0` হলে Cr এবং লাল, `> 0` হলে Dr এবং সবুজ)।
   - `Expense` অ্যাকাউন্ট (Indirect/Direct Expenses) কখনোই Sundry Debtors/Creditors হিসেবে গণ্য করা হয় না।
   - লেজারের ঠিকানা প্রদর্শনে `mailing_name` কখনো ফলব্যাক হিসেবে ব্যবহৃত হয় না; শুধু প্রকৃত `address`, `division`, `postal_code` না থাকলে `"—"` দেখানো হয়।
2. **Inventory & Stock Valuation (`StockSummary.tsx`, `VoucherEntry.tsx`):**
   - স্টক কোয়ান্টিটি ও ভ্যালুয়েশন `getMovementType` (Inward vs Outward vs Physical Stock) এবং টাইমস্ট্যাম্প সর্টিংয়ের মাধ্যমে নির্ধারিত হয়।
   - `VoucherEntry` সেভ হওয়ার সময় ট্রানজ্যাকশনাল ব্যাচে আইটেমের `current_stock` ও লেজারের `current_balance` অ্যাটমিকভাবে আপডেট ও লোকাল ক্যাশে প্যাচ হয় (প্রায়োগিকভাবে রিড বাঁচাতে ব্যাকগ্রাউন্ড `recalculateItemStats` স্ক্যান চালানো হয় না)।
3. **Numeric Formatting:** `Pcs`, `Pc`, `Nos` ইউনিটের ক্ষেত্রে `formatQuantity` কোনো দশমিক দেখায় না (পূর্ণসংখ্যা); বাকি সংখ্যা ও আর্থিক মান (`formatNumber`/`formatCurrency`) সর্বোচ্চ ২ দশমিক ঘর পর্যন্ত দেখায়।
4. **চিহ্নিত লজিক্যাল অসঙ্গতি (Verified Logic Bugs):**
   - `RatioAnalysis.tsx`: `Gross Profit %` হিসাব করতে গিয়ে Gross Profit-এর বদলে `netProfit` ব্যবহার করা হয়েছে; এবং `closingStockValue` গণনায় `opening_qty` ও Physical Stock ভাউচার উপেক্ষা করে শুধু `invEntries` যোগ করা হয়েছে।
   - `CashFlow.tsx`: প্রারম্ভিক ক্যাশ/ব্যাংক ব্যালেন্সে `dateRange.from`-এর আগের লেনদেন বিবেচনা না করে সরাসরি `opening_balance` নেওয়া হয়েছে।

---

## 14. API ও External Integrations

| Integration / API | ফাইল ও মেকানিজম | বর্তমান অবস্থা ও মন্তব্য |
| :--- | :--- | :--- |
| **Express Backend (`server.ts`)** | `/api/health`, GitHub Repository Status ও Push এন্ডপয়েন্ট, এবং Dev মোডে `vite.middlewares` সার্ভিং। | কার্যকর; তবে মূল ERP ডেটা Express-এর বদলে সরাসরি Firebase SDK দিয়ে চলে। |
| **Google Gemini AI (`@google/genai`)** | `erpService.ts` (লাইন ৮১৪৭)-এ `gemini-3.1-flash-lite` মডেল কল (`AIInsights.tsx`)। | **নিরাপত্তা ঝুঁকি:** `vite.config.ts` `process.env.GEMINI_API_KEY`-কে ক্লায়েন্ট বান্ডেলে ইনজেক্ট করে দেয় (সার্ভার-সাইড `/api/*` প্রক্সির পরিবর্তে)। |
| **WhatsApp / Email / SMS / Google Drive** | ভাউচার শেয়ার (`VoucherEntry.tsx` / `Daybook.tsx` ইত্যাদি) `wa.me` ও `mailto:` লিংক ওপেন করে। | `Settings.tsx`-এ SMTP, WhatsApp API Configure, SMS Gateway ও Google Drive ইন্টিগ্রেশনগুলো কেবল স্ট্যাটিক UI / নিষ্ক্রিয় বাটন। |
| **Manual Payment Gateways** | `SubscriptionPage.tsx`-এ bKash, Nagad, Bank Transfer অপশন রয়েছে। | কোনো অটোমেটেড পেমেন্ট গেটওয়ে API নেই; ব্যবহারকারীরা ম্যানুয়ালি TrxID সাবমিট করলে `subscription_orders`-এ জমা হয় ও Founder অনুমোদন করে। |
| **Electron Desktop IPC** | `electron/main.cjs`, `electron/preload.cjs`, `services/desktopService.ts`। | অফলাইন/ডেস্কটপ শেল ব্রিজ কোডে বিদ্যমান; নেটিভ বিল্ড প্যাকেজিং রানটাইমে যাচাইকৃত নয় (`Unknown / Not Verified`)। |

---

## 15. Performance, Database Usage ও Potential Bottlenecks

1. **অপ্টিমাইজড ক্ষেত্র (Zero-Deep-Scan):**
   - `getNextAutoSerialNo` কেবল ১টি `voucher_counters` ডকুমেন্ট পড়ে (বা ইন-মেমরি `_serialsCounterCache` থেকে ০ রিড)।
   - `getLedgerBalance` ও `VoucherEntry` আইটেম ফোকাস প্রি-অ্যাগ্রিগেটেড `current_balance` ও `current_stock` পড়ে—পুরো এন্ট্রি স্ক্যান করে না।
   - `searchCompanyData` ও `searchVouchers`-এ ১০০ ডকুমেন্টের হার্ড ক্যাপ এবং `col_cache_*` ব্যবহার করা হয়।
2. **চিহ্নিত Bottlenecks ও ঝুঁকি:**
   - **বড় রিপোর্টগুলোতে ভারী রিড:** `StockSummary.tsx`, `ProfitAndLoss.tsx`, `BalanceSheet.tsx`, এবং `BusinessIntelligence.tsx` এখনো `getCollection(..., 5000 | 10000)` কল করে, যা বড় কোম্পানিতে Firestore ফ্রি-টিয়ার কোটা দ্রুত শেষ করতে পারে।
   - **Monolithic Codebase & Bundle Size:** `erpService.ts` (৯,৩০৯ লাইন), `FounderPanel.tsx` (৮,৯০৮ লাইন), `BusinessIntelligence.tsx` (৪,৪৭৫ লাইন), `PayrollManagement.tsx` (৩,৬৮০ লাইন), ও `App.tsx` (৩,০৮৯ লাইন) অত্যন্ত বড়। `App.tsx`-এ কোনো `React.lazy()` / Route-level code splitting নেই, ফলে প্রথম লোডেই সম্পূর্ণ অ্যাপ (Three.js, jsPDF, XLSX, Recharts সহ) বান্ডেলে লোড হয়।
   - **Composite Index নির্ভরতা:** কিছু রেঞ্জ কোয়েরিতে কম্পোজিট ইনডেক্স না থাকলে `erpService.ts` সিঙ্গেল-ইনডেক্স ফলব্যাক চালায়, যা রেজাল্ট ফিল্টারিংয়ে ক্লায়েন্ট মেমরি ব্যবহার বাড়ায়।

---

## 16. Error Handling, Testing ও Backup ব্যবস্থা

- **Error Handling (`ErrorBoundary.tsx`, `errorService.ts`):**
  - আনকট React ক্র্যাশ `ErrorBoundary`-তে ধরা পড়ে এবং `errorService` তা Firestore-এর `error_logs` কালেকশনে (ইউজার, পাথ, ব্রাউজার, স্ট্যাক ট্রেস, সিভিয়ারিটি সহ) পাঠায়। Founder Panel থেকে তা দেখে **1-Click AI Fix** প্রম্পট জেনারেট করা যায়।
- **Testing (`src/__tests__/`):**
  - ৪টি টেস্ট ফাইল পাওয়া গেছে: `accountingMath.test.ts`, `quotaClientService.test.ts`, `quotaConcurrency.test.ts`, এবং `quotaSecurityRules.test.ts` (যা `@firebase/rules-unit-testing` ব্যবহার করে)।
  - **গুরুত্বপূর্ণ:** `package.json`-এ কোনো `"test"` স্ক্রিপ্ট বা `vitest`/`jest` ডিপেন্ডেন্সি ডিফাইন করা নেই। বর্তমান রিড-অবস্থায় টেস্টগুলো চালিয়ে যাচাই করা হয়নি (`Unknown / Not Verified`)।
- **Backup ও Data Export:**
  - `Settings.tsx`-এর **Backup & Restore** ট্যাবে Manual Backup বাটন কোনো আসল ব্যাকআপ তৈরি করে না (শুধু `setTimeout` দিয়ে সফল টোস্ট দেখায়), Restore বাটনে কোনো ইভেন্ট হ্যান্ডলার নেই, এবং Export History-তে `2024-03-14` হার্ডকোডেড।
  - তবে `DataCenter.tsx` থেকে বাউন্ডেড লিমিটে কালেকশন ডেটা এক্সপোর্ট (`exportService.ts`) করার ব্যবস্থা চালু আছে।

---

## 17. বর্তমান Technical Limitations ও Identified Risks

| ঝুঁকির ধরন | তীব্রতা | চিহ্নিত সমস্যা (File & Code Verified) |
| :--- | :---: | :--- |
| **Security (API Key Exposure)** | Critical | `vite.config.ts` ক্লায়েন্ট বান্ডেলে `GEMINI_API_KEY` ইনজেক্ট করে এবং `erpService.ts:8147` ব্রাউজার থেকে সরাসরি Gemini কল করে। |
| **Security Rules Divergence** | High | `/firestore.rules` (প্রোডাকশন কপি)-এর চেয়ে `/firestore.rules.staging` বেশি নিরাপদ ও অপ্টিমাইজড (1000-expression fix ও email claim guard)। প্রোডাকশনে কোনটি ডিপ্লয়েড তা `Unknown / Not Verified`। |
| **Hardcoded Founder Email** | Medium | অন্তত ২৫+ স্থানে সরাসরি `'sapientman46@gmail.com'` ও ফাউন্ডার ফোন নম্বর (`+8801742058246`) কোডে হার্ডকোড করা। |
| **Permission Sync Gap** | Medium | `FounderPanel.tsx` (৯টি ব্রড পারমিশন) ও `UserManagement.tsx` (গ্রানুলার `APP_FEATURES`)-এর মধ্যে পারমিশন মডেলের অমিল। |
| **iFrame Environment Violations** | Medium | `Daybook.tsx`, `DuePaymentAlerts.tsx`, `BusinessIntelligence.tsx`, `LedgerStatement.tsx`, `printUtils.ts`, ও `pdfService.ts`-এ `window.open(...)` এবং ~১৫+ ফাইলে `window.confirm(...)` / `prompt(...)` ব্যবহৃত হয়েছে যা এমবেডেড iFrame-এ ব্লক হতে পারে। |
| **Dead Controls & Fake Data** | Medium | `Settings` (Backup/Restore/Integrations/Security toggles), `CashFlow`/`FundsFlow`/`NegativeReports` (Print/Export), `SubscriptionPage`, `TaxManagement` (Delete)-এ নিষ্ক্রিয় বাটন; `Dashboard` Design 5/6, `AIInsights`, `CRM`, `PurchaseManagement`-এ মক ডেটা। |
| **Financial Report Accuracy Bugs** | Medium | `RatioAnalysis.tsx`-এ `Gross Profit %` ভুল সূত্র ও closing stock গণনা অসম্পূর্ণ; `CashFlow.tsx` প্রারম্ভিক ব্যালেন্সে পূর্বের লেনদেন বাদ দেয়; `LedgerStatement.tsx` CSV বাটনে PDF ডাউনলোড করে। |
| **Quota & Bundle Scalability** | Medium | কিছু রিপোর্টে `5000`–`10000` ডকুমেন্ট লোড; `App.tsx`-এ Code Splitting না থাকা এবং `erpService.ts` (9.3k LOC) / `FounderPanel.tsx` (8.9k LOC) অত্যন্ত ভারী। |

---

## 18. Extensibility: নতুন UI/UX Design ও Module যুক্ত করার গাইডলাইন

কোডবেসের বিদ্যমান প্যাটার্ন অনুসরণ করে নতুন ফিচার বা ডিজাইন যুক্ত করার জন্য সুনির্দিষ্ট এক্সটেনশন পয়েন্ট রয়েছে:
1. **নতুন Landing Hero Design যোগ করতে:** `src/components/landing/`-এ নতুন কম্পোনেন্ট তৈরি -> `src/contexts/SettingsContext.tsx`-এর `heroDesignStyle` টাইপ ও ডিফল্টে যুক্ত -> `src/pages/landing/Home.tsx`-এর রেন্ডার সুইচে ম্যাপ -> `src/components/FounderPanel.tsx` (`systemSubTab === 'hero'`)-এ অপশন কার্ড ও টগল যুক্ত।
2. **নতুন Dashboard Design যোগ করতে:** `src/contexts/SettingsContext.tsx`-এ নতুন `dashboardDesign` অপশন যোগ -> `src/components/Dashboard.tsx`-এ কন্ডিশনাল রেন্ডার ব্লক যুক্ত (লক্ষ্য রাখতে হবে যেন রিয়েল `erpService` ডেটা ব্যবহৃত হয়, হার্ডকোডেড ডেমো নয়) -> `FounderPanel.tsx` (`systemSubTab === 'theme'`)-এ সিলেক্টর যোগ।
3. **নতুন ERP Module / Route যোগ করতে:** `src/constants/features.ts`-এ নতুন ফিচার ID -> `src/constants/navigation.ts`-এ মেনু ও টাইটেল -> `src/App.tsx`-এ `<FeatureGuard>` সহ `<Route>` রেজিস্ট্রেশন (ভবিষ্যতে `React.lazy()` ব্যবহার বাঞ্ছনীয়) -> প্রয়োজনে নতুন Firestore কালেকশনের জন্য `firestore.rules` / `firestore.rules.staging`-এ `isSameCompany` রুল আপডেট।
4. **সুপারিশকৃত রিফ্যাক্টর (ভবিষ্যৎ কাজের জন্য):** `erpService.ts` ও `FounderPanel.tsx`-কে ডোমেইন-ভিত্তিক ছোট মডিউলে (যেমন `voucherService`, `quotaService`, `reportService`) বিভক্ত করা এবং Gemini API কলকে `server.ts`-এর `/api/ai/*` প্রক্সি রুটে সরিয়ে নেওয়া।

---

## 19. Important Items Not Yet Verified (`Unknown / Not Verified`)

রিড-অনলি কোড অ্যানালাইসিসের কারণে নিচের বিষয়গুলো নিশ্চিতভাবে যাচাই করা সম্ভব হয়নি:
1. **Production Firebase Console Deployed Rules:** লাইভ `tallyflow-erp-1` প্রজেক্টে বর্তমানে `/firestore.rules` নাকি `/firestore.rules.staging` ডিপ্লয়েড আছে তা **`Unknown / Not Verified`**।
2. **Production Firestore Indexes & Real Data Scale:** প্রোডাকশন ডাটাবেজে কী কী Composite Index তৈরি আছে এবং প্রকৃত কোম্পানিগুলোর ডকুমেন্ট সংখ্যা কত তা **`Unknown / Not Verified`**।
3. **Automated Daily Quota Reset Mechanism:** কোডে ০১:০০ PM BST কাউন্টডাউন (`QuotaDashboardModal.tsx`, `QuotaExceededModal.tsx`) এবং ম্যানুয়াল/ফাউন্ডার রিসেট থাকলেও, কোনো এক্সটার্নাল Cloud Function বা Cron Job ঠিক দুপুর ১:০০ টায় Firestore-এর `quotaUsed` রিসেট করে কি না তা কোডবেসে দেখা যায়নি (**`Unknown / Not Verified`**)।
4. **Live Server / Vercel / GitHub Secrets & Runtime Behavior:** `.env`-এ থাকা প্রকৃত API কী, GitHub push টোকেন, এবং `npm run build` বা `src/__tests__/*` টেস্টগুলো বর্তমান প্রজেক্টে রানটাইমে পাস করে কি না তা **`Unknown / Not Verified`**।
5. **Electron Native Packaging:** `electron-builder` দিয়ে `.exe`/`.dmg`/AppImage বিল্ড বর্তমানে সফলভাবে জেনারেট হয় কি না তা **`Unknown / Not Verified`**।

---

## Complete Feature Inventory (Status Matrix)

| Module / Sub-Feature | Status | Security / Guard | Verified Notes |
| :--- | :--- | :--- | :--- |
| **Auth (Login / Register / Profile)** | Working (Partial SSO) | Firebase Auth | Email/Pass কাজ করে; `SSOButton` কেবল টোস্ট দেখায়। |
| **Multi-Company Workspace & Switcher** | Working | `isSameCompany` | কোম্পানি তৈরি, ইউজার অ্যাসাইন, সুইচিং কার্যকর। |
| **Landing Site (Home, Features, About, Contact, Pricing)** | Working | Public / CMS | `Home` কালার নরমালাইজ করে; `Contact` Firestore `inquiries`-এ লেখে। |
| **Hero Design Switcher (4 Designs + 3D ThreeUI)** | Working | Founder Configurable | `FounderPanel` থেকে ডেমো ও CTA বাটন শো/হাইড করা যায়। |
| **Dashboard (Designs 1–4)** | Working | `ana_dashboard` | রিয়েল রিসেন্ট ভাউচার ও ক্যাশ/ব্যাংক ডেটা দেখায়। |
| **Dashboard (Designs 5 & 6)** | Partial / Mock Data | `ana_dashboard` | `revenue: 1250000` সহ কিছু হার্ডকোডেড মান দেখায়। |
| **Voucher Entry (8 Types + Stock Journal + Physical Stock)** | Working | `acc_vouchers_*`, Quota Lock | Atomic serial counter, balance & stock আপডেট। |
| **Chart of Accounts, Ledgers, Items, Godowns, Units, Alter** | Working | `acc_masters_*`, `inv_masters_*` | CRUD ও Address/Unit ফরম্যাটিং নিয়ম অনুযায়ী কাজ করে। |
| **Daybook, Trial Balance, Balance Sheet, P&L, Stock Summary** | Working (Heavy Reads) | `acc_reports_*`, `inv_reports_view` | কোর হিসাব ঠিক আছে; তবে বড় কালেকশন স্ক্যান (`5k-10k`) করে। |
| **Ledger Statement** | Partial (Bug in CSV) | `acc_reports_view` | ডিসপ্লে ও Print PDF ঠিক আছে; CSV বাটন `exportToPDF` কল করে। |
| **Ratio Analysis, Cash Flow, Funds Flow, Negative Reports** | Partial / Bugs & Unwired UI | `ana_ratio`, `ana_cashflow`, `acc_reports_view` | `CashFlow`/`FundsFlow`/`NegativeReports`-এ Print/Export unwired; `RatioAnalysis` GP% ও Closing Stock ফর্মুলা ত্রুটিপূর্ণ। |
| **Payroll, Attendance, Salary Sheets & 9 Payroll Reports** | Working | `pay`, `pay_masters`, `pay_transactions` | ফুল ওয়ার্কফ্লো কার্যকর; Gold+ প্ল্যান ও Permission-guarded। |
| **Production Orders, Order Entry, Machines & Reports** | Working | `ord`, `mac`, `ord_*`, `mac_manage` | সম্পূর্ণ কার্যকর; `<FeatureGuard>` সুরক্ষিত। |
| **Business Intelligence, Ageing, Movement, Stock Query** | Working (Heavy Reads) | `ana_dashboard`, `ana_ageing`, `inv` | চার্ট ও পিরিয়ড ফিল্টারিং কাজ করে; `BI` বড় ডকুমেন্ট লোড করে। |
| **AI Insights (`/ai-insights`)** | Partial / Security Risk | `enableAI` | Gemini লাইভ কল করে (ক্লায়েন্ট API Key ঝুঁকি), সাইডবার ফোরকাস্ট হার্ডকোডেড। |
| **CRM, Purchase, Tax, Inventory Adv, Data Center** | Partial / Static UI | `enableCRM`, `enableSupplyChain`, `enableTax`, `enableInventory`, `enableDataExport` | এক্সপোর্ট/বোর্ড থাকলেও নমুনা/স্ট্যাটিক ডেটা ও কিছু unwired বাটন রয়েছে। |
| **Settings (Company, UI, Voucher, Print, Features, GitHub)** | Working | Role / Admin | Firestore ও GitHub (`server.ts`) সেভ কার্যকর। |
| **Settings (Backup/Restore, SMTP, WhatsApp, SMS, TallyVault)** | UI-Only / Fake | Role / Admin | Fake `setTimeout` ব্যাকআপ, নিষ্ক্রিয় Restore/Configure/Alert টগল। |
| **Quota System (Tracking, SWR Cache, Modals, Reset Flow)** | Working | Company/User Quota + Founder Reset | ১০ সেকেন্ড বাফারিং ও স্ট্রিক্ট লকিং; অটো-রিসেট ক্রন `Unknown / Not Verified`। |
| **Founder Panel (All 12 Views & 10 System Sub-Tabs)** | Working (Perm Sync Gap) | `isFounder` (`sapientman46@gmail.com`) | Remote Force Refresh, Maintenance, CMS, Plan, Order, AI Fix Prompt সব কার্যকর; কেবল ৯-আইটেম পারমিশন মডাল গ্রানুলার লিস্ট থেকে ভিন্ন। |
