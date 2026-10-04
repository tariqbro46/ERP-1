# SAPIENT ERP - Project System & Business Logic Notes

This file documents the core rules, business logic, report architectures, and UI/UX conventions implemented across the ERP application. Always review these notes before undertaking future tasks or refactoring.

---

## 1. Report Print & PDF Generation Architecture

### A. Page Margins & Geometry
- **Top Margin**: `0.5 in` (48px at 96 DPI)
- **Bottom Margin**: `1.2 in` (115px at 96 DPI)
- **Left Margin**: `0.3 in` (29px at 96 DPI)
- **Right Margin**: `0.3 in` (29px at 96 DPI)
- **Page Container**:
  `width: 794px; height: 1123px; box-sizing: border-box; padding: 48px 29px 115px 29px;`
- **Page Numbering**:
  Strictly single page number positioned at the **very top-right corner** of the page header (`position: absolute; top: 0; right: 0;`). NEVER put duplicate page numbers near or above table headers.

### B. Multi-Page Balanced Capacity & Filling
To prevent huge blank gaps at the bottom of pages before the 1.2 in footer margin:
- **Page 1 Capacity**: **34 items** (accommodates company header, report title, period, table header, and 34 data rows).
- **Subsequent Pages Capacity**: **38 items** (compact header, table header, and 38 data rows).
- Data fills cleanly down to the 1.2 in footer margin on every full page.

### C. Row Spacing & Text Vertical Centering
- **Row Height**: `24px` per row.
- **Vertical Alignment**: `vertical-align: middle;` on all `<td>` elements.
- **Cell Padding**: `padding: 4px 6px 5.5px 6px;` (with 5.5px bottom padding to lift font baselines and ensure content floats in the vertical center, with clear breathing room above the `1px solid #e2e8f0` underline).
- **Column Alignments**:
  1. `#` (Serial Number): Centered (`text-align: center; vertical-align: middle;`).
  2. `Customer / Debtor` or `Supplier / Creditor`: Left-aligned (`text-align: left; vertical-align: middle; font-weight: 700;`).
  3. `Address`: Left-aligned (`text-align: left; vertical-align: middle;`).
  4. `Phone Number`: Left-aligned, monospace font (`text-align: left; vertical-align: middle; font-family: monospace;`).
  5. `Email`: Left-aligned (`text-align: left; vertical-align: middle;`).
  6. `Closing Balance`: Right-aligned, bold monospace (`text-align: right; vertical-align: middle; font-weight: 700; font-family: monospace;`), with color coding:
     - Dr (Debit): Emerald Green (`#059669`).
     - Cr (Credit): Rose Red (`#dc2626`).
- **Group Column**: Omitted from detailed customer/supplier reports because the report title and header already explicitly declare the ledger group (e.g., "SUNDRY DEBTORS REPORT").
- **Summary / Total Bar at Table End**: Omitted as per user instructions (no separate `TOTAL (... LEDGERS) | DR: ... | CR: ... | NET: ...` row at the table end).

### D. Unified Save PDF and Print Actions
- Both **Save PDF** and **Print** buttons use the exact same jsPDF document generation pipeline.
- **Save PDF**: Directly invokes `pdf.save(fileName)`.
- **Print**: Generates a Blob (`pdf.output('blob')`), mounts a hidden iframe with the Blob URL, and triggers `iframe.contentWindow?.print()`. This guarantees the printed document is 100% identical to the downloaded PDF.

---

## 2. Ledger Address & Country Business Logic

### A. Street Address vs. Country vs. Mailing Name
In accounting and ERP databases (e.g., Tally, Sapient ERP), `mailing_name` is typically auto-populated with the **Ledger Name** (e.g., "M/S Setu Auto Rice Mills").
- **RULE**: NEVER use `l.mailing_name` as a fallback for the `address` column. Doing so causes the ledger's own name to show up in the address column.
- **RULE**: Only consider real location attributes: `[l.address, l.division, l.postal_code]`.
- Clean any trailing country name from the base street address string (e.g. removing `, Bangladesh`).

### B. Address Resolution Matrix
1. **If ledger has NO street address**:
   - `addressWithoutCountry`: Shows `"—"` (dash).
   - `addressWithCountry`: Still shows `"—"` (dash). Even if "With Country" is checked, a country by itself without a street address is NOT an address.
2. **If ledger HAS a street address**:
   - `addressWithoutCountry` (default): Shows base street address (e.g. "Nayanagar, Chapai Nawabgonj").
   - `addressWithCountry` (when "With Country" is checked): Shows street address + country (e.g. "Nayanagar, Chapai Nawabgonj, Bangladesh").

---

## 3. BI Dashboard Charts & Interaction Rules

### A. Native Browser Selection & Focus Prevention
- SVG and canvas charts have `select-none` / `user-select: none; -webkit-user-select: none; outline: none;`.
- Clicking or dragging on any chart will NOT trigger browser text selection (blue highlighting over chart text or months).
- Clicking on graphs does NOT trigger disruptive popups, crashes, or pinned states. The user explicitly requested standard, smooth interaction without any abnormal behavior on click.

### B. Pointer Hover Tooltips
- As the pointer moves across data points/months, Recharts `<Tooltip>` dynamically and smoothly renders the metrics for that point right beside the pointer.
- Clean formatting: amounts with currency symbol, standard font family and high contrast.

---

## 4. UI Modal & Overlay Structure

### A. Top Bar Z-Index Protection
- The app fixed header and right controls use `z-[500]` and `z-[510]`.
- Modal backdrops use `z-[99999]` with `fixed inset-0 bg-black/75 backdrop-blur-md`. This ensures the app top bar never bleeds through or stays visible behind open modals.

### B. Modal Sizing & Scrolling
- Dialog container: `max-w-[1400px] w-[96vw] max-h-[92vh]`.
- Headers, search controls, limit toggles, and column checkboxes are fixed at the top of the modal.
- Only the table body scrolls (`overflow-y-auto flex-1`).
- Table headers are sticky (`sticky top-0`).

---

## 5. Numeric & Financial Formatting Standards
- **Item Quantities** with units `Pcs`, `Pc`, or `Nos`: Must show **0 decimal places** via `formatQuantity`.
- **Financial Balances, Amounts, Rates, Turnover**: Max **2 decimal places** via `formatNumber` and `formatCurrency`.
- **Currency Symbol**: Uses `currencySymbol` (e.g. `৳` / BDT or `$` / USD as configured in settings).

---

## 6. Ground-Truth Accounting & Inventory Telemetry

### A. Ledger Balances & Accounting Truth
- **Opening Balance Convention**:
  - `opening_balance` is stored as positive for Dr (Debit) and negative for Cr (Credit).
- **Transaction Flow**:
  - Every debit transaction ADDS (`+ debit`).
  - Every credit transaction SUBTRACTS (`- credit`).
- **Net Balance Calculation**:
  - `netBalance = (opening_balance || 0) + sum(debits) - sum(credits)`.
  - Point-in-time balance as of `periodEnd`: accounts for entries up to `periodEnd`.
  - Fallback: `current_balance` attribute on the ledger document.
- **Sundry Debtors (Receivables)**:
  - `balance = Math.abs(netBalance)`. NEVER fall back to turnover!
  - `isDr = netBalance >= 0`. Dr = Green (normal outstanding), Cr = Red (customer advance).
- **Sundry Creditors (Payables)**:
  - `balance = Math.abs(netBalance)`. NEVER fall back to turnover!
  - `isDr = netBalance > 0`. Cr (`netBalance <= 0`) = Red (normal payable to supplier), Dr (`netBalance > 0`) = Green (advance paid to supplier).

### B. Stock Items Quantity & Valuation Truth
- **Calculation Mechanism**:
  - Exactly matches `StockSummary.tsx` and `_executeRecalculateItemStats`.
  - Uses `getMovementType` and timestamp sorting from `parseEntryDate`.
  - Inward movements: Purchase, Receipt Note, Sales Return, Material In, Credit Note.
  - Outward movements: Sales, Delivery Note, Purchase Return, Material Out, Consumption, Debit Note.
  - Physical Stock: Overrides stock count.
  - Starting stock: `opening_qty`.
  - Fallback: `item.current_stock` if no inventory entries exist.
- **Valuation**:
  - `rate = item.avg_cost || item.opening_rate || item.standard_rate || item.standard_cost || 0`.
  - `closingStockValuation = stockAtEnd * rate`.
  - `openingStockValuation = stockAtStart * rate`.
- **No Fabricated / Mock Data**:
  - Monthly trends must be calculated directly from real voucher dates and actual inward/outward quantities.
  - NO random sine waves (`Math.sin`), no synthetic multipliers (`* 0.28`, `* 0.16`), and no fake fallbacks (`50000 * factor`). Zero transactions simply display as 0.
