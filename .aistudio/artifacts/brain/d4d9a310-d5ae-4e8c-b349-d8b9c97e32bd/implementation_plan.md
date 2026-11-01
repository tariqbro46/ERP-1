# Executive Database Quota & Operations Intelligence Modal

Redesign the Database Quota Metrics popup into an authentic, informative, multi-tab executive dashboard featuring real-time telemetry, module-wise usage, cache efficiency analytics, and inline administrative controls for company and user quotas.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following architectural and visual choices:
> - **Highlighted Metrics**: Real-time breakdown, module usage, and cache efficiency.
> - **Visual Style & Layout**: Multi-tab executive dashboard with live charts and statistics.
> - **Administrative Controls**: Quick company limit adjuster, manual instant reset, and inline user quota management.

- **Confirmed Decision 1**: Authentic live tracking without synthetic/random mock numbers—reflecting genuine Firestore reads, writes, deletes, and true in-memory/localStorage cache savings.
- **Confirmed Decision 2**: Dhaka Standard Time (01:30 PM BST) auto-reset synchronization with persistent live countdown.
- **Confirmed Decision 3**: Full adherence to project table centering (`vertical-align: middle !important;`) and clean unboxed typography discipline (no pill enclosures for static metadata).

---

## 1. Overview & Core Concept

### What It Does
Upgrades the simple quota dialog into a high-density, informative **Database Quota & Operations Intelligence Center**. It provides business owners, system administrators, and staff with deep transparency into how ERP actions consume database operations, how intelligent client caching prevents unnecessary cloud costs, and enables instant control over company and user-level daily limits.

### Target Audience & Persona
- **Founders & System Admins**: Need granular insight into database operation burn rates, caching health, and the power to adjust user/company limits or trigger manual resets instantly.
- **Accountants & Operators**: Need clear status awareness of remaining daily operations before reaching quota thresholds, without disruption.

### Key Value
- **Zero Hallucination / 100% Authentic**: Reflects actual database read/write/delete operations and authentic cache hit efficiency.
- **Cost & Quota Visibility**: Clear visualization of read-to-write ratios, module consumption, and cloud quota safety.
- **Empowered Admin Governance**: Direct in-modal editing of individual user quotas and company ceiling limits.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Modal Entry**: User clicks the Quota widget in the sidebar or top bar. The executive modal appears with a smooth backdrop blur and four structured tabs:
   - **Tab 1: Live Overview (লাইভ ওভারভিউ)**: Quota progress meter (with Unlimited mode handling), BST 01:30 PM countdown, Reads/Writes/Deletes traffic ratio, and Cache Efficiency rate.
   - **Tab 2: Module Breakdown (মডিউল অ্যানালিটিক্স)**: Operational distribution across Vouchers, Inventory, Ledgers, and System Masters.
   - **Tab 3: Team & Users (টিম ও ইউজার কোটা)**: Table of company team members showing real-time usage, individual limits, and inline quick-edit controls.
   - **Tab 4: Admin Controls (কোটা কন্ট্রোল ও অ্যাডমিন)**: Preset buttons (5k, 10k, 25k, 50k, 100k, Unlimited), custom numeric input, and immediate Reset Quota with safe confirmation.
2. **Switching Tabs**: Zero-delay tab navigation with subtle active indicators.
3. **Adjusting Quota**: Admin modifies user quota or company quota; saves instantly to Firestore and updates state without full page reload.

### Visual Identity & Theme
- **Aesthetic Direction**: Executive Dark Slate (`#0B0F19` / `#111827`) with precision hairline borders (`border-white/10` and `border-slate-800`), avoiding garish gradients or decorative AI pill badges.
- **Palette**: Deep slate canvas (60%), slate-800/900 cards and table containers (30%), with purposeful semantic status indicators (Emerald for safe/active, Amber for warning/pending, Rose for critical, Indigo for administrative actions).
- **Typography**: Clean hierarchy with tabular figures (`font-mono tabular-nums`) for all operation counts, timestamps, and percentages.
- **Zero-Pill Discipline**: All status labels, timestamps, and metadata display as clean, unboxed text separated by typographic middots (`·`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Multi-Tab Executive Architecture vs. Single Cluttered Card
- **Chosen Approach**: Segment into 4 focused tabs (Live Overview, Module Breakdown, Team Quotas, Admin Controls).
- **Why**: Allows in-depth data (module analytics and team member tables) without forcing the user to scroll through a cramped vertical modal.
- **Alternatives Considered**: A single vertical scrollable view—rejected because it quickly becomes overwhelming when listing users and multiple metric charts.

### Decision 2: Authentic In-Memory & Local Cache Metrics
- **Chosen Approach**: Derive cache efficiency from actual `_quotaBuffer`, localStorage read timestamps, and tracked Firestore queries vs avoided queries.
- **Why**: Adheres strictly to the persistent project rule: *"Never use fake/mock sine waves, fake multipliers, or random synthetic fallbacks. All data must come directly from real records."*

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│               QuotaDashboardModal (React)              │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Header: Title · BST Dhaka 1:30 PM Sync · Company   │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Tab Bar: [Overview] [Modules] [Team] [Admin Hub]   │ │
│ └────────────────────────────────────────────────────┘ │
│                            │                           │
│     ┌──────────────────────┼─────────────────────┐     │
│     ▼                      ▼                     ▼     │
│ [Tab 1: Overview]   [Tab 2: Modules]      [Tab 3: Team]│
│ - Live Ops Meter    - Vouchers & Invoices - User list  │
│ - Reads/Writes Bar  - Stock & Inventory   - Usage bars │
│ - Cache Efficiency  - Ledgers & Reports   - Inline edit│
│                            │                           │
│                            ▼                           │
│                   [Tab 4: Admin Hub]                   │
│                   - Preset limits & Custom             │
│                   - Instant Quota Reset                │
│                   - Reset request history              │
└────────────────────────────┬───────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│                erpService.ts & AuthContext             │
│  - trackQuota() & _quotaBuffer memory analytics        │
│  - updateCompanyQuotaLimit() / updateUserQuotaLimit()  │
│  - resetQuotaNow() / getCompanyUsers()                 │
│  - Real-time Firestore sync & localStorage fallback    │
└────────────────────────────────────────────────────────┘
```

### Component Hierarchy & Handlers
- **`QuotaDashboardModal.tsx`**:
  - `activeTab`: `'overview' | 'modules' | 'users' | 'admin'`
  - `users`: Fetched via `erpService.getCompanyUsers(company.id)` with real `quotaUsed` and `quotaLimit`.
  - `handleUpdateUserLimit(userId, limit)`: Saves via `erpService.updateUserQuotaLimit`.
  - `handleUpdateCompanyLimit(limit)`: Saves via `erpService.updateCompanyQuotaLimit`.
  - `handleResetQuotaNow()`: Executes `erpService.resetQuotaNow(company.id)`.
  - `cacheStats`: Computes authenticated session metrics (total operations executed, estimated Firestore reads prevented via SWR cache).

### Strict Guidelines Compliance
- Table cells adhere to `vertical-align: middle !important;` per persistent instructions.
- All numbers use `tabular-nums` / `font-mono`.
- Language in chat: Bangla.
