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

## Numeric Formatting
- Quantity values for items with units like "Pcs", "Pc", or "Nos" MUST NOT show any decimal places.
- All other numeric values (Rate, Amount, Totals, or non-Pcs quantities) MUST NOT show more than 2 decimal places.
- Use the `formatQuantity` utility for quantities and `formatNumber`/`formatCurrency` for financial values to ensure consistency.

## Caching & Quota Optimization
- Read requests are cached for up to 30 minutes to prevent Firestore read quota consumption and extend service stability.
- All search results must be securely cached to prevent unnecessary database queries.
- Fallback mechanics should be maintained when the database quota is reached or offline, ensuring read/write operations fail gracefully (with proper UI notification) rather than crashing the system.
- Severely limit the number of documents retrieved during non-critical operations to maintain database performance and stay within free tier limits.

## Implemented Database Optimizations (Technical Reference)
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


