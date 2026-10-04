# Persistent Project Instructions

## Layout and Scrolling
- Every page header (including buttons, cards, search boxes, date pickers, export buttons) MUST remain fixed/permanent on the screen.
- Only the data section or table below the header should scroll.
- Table headers MUST be sticky so they remain visible while scrolling through table data.
- This applies to EVERY single page in the application.

## Subscription & Permissions
- Gold Plan (Tier 3) and above should have access to all major modules (Payroll, Order Management, Manufacturing, Analytics) by default.
- The "Marketing Manager" role must be available in the Permissions tab for all companies.
- When checking features, use both granular IDs and broad module IDs.

## Report Print & PDF Layout Rules
- Page numbers MUST ONLY appear at the very top right corner of the page (in the top header area).
- DO NOT place duplicate "Page 1" or page numbers right above table headers or above column headers.
- Maintain consistent formal company header formatting with single top-right page numbering across all report layouts.
- Margins: Top 0.5 in (48px), Bottom 1.2 in (115px), Left 0.3 in (29px), Right 0.3 in (29px).
- Multi-page pagination capacity: Page 1 = 34 items; Subsequent pages = 38 items to prevent large empty spaces at the bottom.
- Table rows: Height 24px, vertical-align middle, padding (4px top, 5.5px bottom) so text is vertically centered and floats clearly above the bottom underline.
- Column alignments: # is center/middle; names, address, phone, email are left/middle; closing balance is right/middle with Dr (green) and Cr (red).
- Omit redundant "Group" column when report header already states the title (e.g. Sundry Debtors Report).
- Omit summary total bar at table bottom.
- Save PDF and Print button use the identical PDF blob generator.

## Ledger Address & Country Logic
- NEVER use `mailing_name` as fallback for address (since in ERP it defaults to the ledger's name).
- Only consider real street/city/division fields (`address`, `division`, `postal_code`).
- If a ledger has NO street address:
  - Always display `"—"` (dash).
  - Even if "With Country" is checked, if there is no street address, display `"—"` (do not show just the country).
- If a ledger HAS a street address:
  - Without Country (default): street address without country.
  - With Country: `street address, country`.

## Dashboard Charts & Interaction Rules
- All charts have `select-none` / `user-select: none` to prevent native browser text selection or blue highlighting on click.
- Hovering shows the report tooltip beside the pointer.
- Clicking on graphs does NOT trigger any abnormal popup, crash, or pinned state. Standard, smooth chart interaction is preserved.

## Ledger Balance & Stock Calculations Truth
- In SAPIENT ERP: `opening_balance` is positive for Dr and negative for Cr.
- Debits add (`+ debit`), credits subtract (`- credit`).
- Point-in-time balance: `opening_balance + sum(debit) - sum(credit)`.
- For Sundry Debtors: `balance = Math.abs(netBalance)` (never fall back to turnover!). `isDr = netBalance >= 0`. Dr is Green, Cr is Red.
- For Sundry Creditors: `balance = Math.abs(netBalance)` (never fall back to turnover!). `isDr = netBalance > 0`. Cr (`netBalance <= 0`) is Red, Dr (`netBalance > 0`) is Green.
- Stock quantities and valuations use exact `getMovementType` and timestamp sorting from `StockSummary.tsx`.
- Never use fake/mock sine waves (`Math.sin`), fake multipliers, or random synthetic fallbacks. All data must come directly from real records.

## Numeric Formatting
- Quantity values for items with units like "Pcs", "Pc", or "Nos" MUST NOT show any decimal places.
- All other numeric values (Rate, Amount, Totals, or non-Pcs quantities) MUST NOT show more than 2 decimal places.
- Use the `formatQuantity` utility for quantities and `formatNumber`/`formatCurrency` for financial values to ensure consistency.

## Caching & Quota Optimization
- Read requests are cached for up to 30 minutes to prevent Firestore read quota consumption and extend service stability.
- All search results must be securely cached to prevent unnecessary database queries.
- Fallback mechanics should be maintained when the database quota is reached or offline, ensuring read/write operations fail gracefully (with proper UI notification) rather than crashing the system.
- Severely limit the number of documents retrieved during non-critical operations to maintain database performance and stay within free tier limits.

## Business Intelligence & Analytics Period Discipline
- Cost Centre Allocation, Expense Distribution, and Trends MUST strictly and exclusively reflect only transactions occurring within the user-selected date period (`periodStart` to `periodEnd`).
- NEVER fall back to all-time cumulative ledger totals or full historical data for period-specific charts. If no expenses exist in the selected period, display 0 / "No expense heads recorded in selected period".
- Verification functions (`verifyTargetedLedgerBalances`) must NEVER run automatically in background `useEffect` hooks on page load or render; they must strictly only execute when the user explicitly clicks the manual "Verify Balances" button.
- Expense accounts (Indirect Expenses, Direct Expenses, etc.) must NEVER be classified as Sundry Debtors or Sundry Creditors under any circumstances.
To drastically reduce Google Cloud console read quota consumption while preserving speed and UI layouts, the following systems have been implemented inside `/src/services/erpService.ts`:

### 1. Targeted Indexed Range Queries
Instead of loading entire collections (e.g., `vouchers`, `voucher_entries`, `inventory_entries`) into memory and filtering client-side, the system uses Firestore's native indexed queries with strict filters:
- **Functions optimized**: `getVouchersByType`, `getVouchersByGroup`, and `getVouchersByDateRange`.
- **Filters applied**: Range queries on `v_date`/`date`, matching `companyId`, and specific voucher types where applicable.
- **Quota Impact**: Reads only the matched records instead of scanning thousands of documents.
- **Fail-safe Fallback**: In case of index-creation delays or errors, queries gracefully fall back to the safe full-collection client-side filter model.

### 2. Pre-Aggregated Ledger Balances
- **Optimized Function**: `getLedgerBalance`.
- **Logic**: No longer queries and scans the entire `voucher_entries` collection to calculate sums of debit and credit. It directly reads the `current_balance` attribute on the ledger record, falling back to `opening_balance` if needed.
- **Quota Impact**: Reduced thousands of reads to **1 single document read** (or **0 reads** if retrieved from the local in-memory ledger cache).

### 3. Client-Side Memory Quota Buffering & Throttling
To prevent continuous, real-time Firestore write operations during tracking:
- **Mechanism**: The `trackQuota` method accumulates quota consumption metrics (reads, writes, deletes) in an in-memory buffer (`_quotaBuffer`) and debounces the database updates.
- **Flushing**: Automatically flushes/batches accumulated metrics to Firebase every **10 seconds**, on page unload (`beforeunload`), or when the browser tab goes to background/inactive (`visibilitychange`).
- **Resilience & Storage Backing**: Writes pending tracking updates to `localStorage` (as `unsaved_quota_<companyId>`). On application startup, `initQuotaTracking()` recovers and flushes any unsaved metrics, ensuring no quota metrics are lost even if the user reloads or closes the tab.


