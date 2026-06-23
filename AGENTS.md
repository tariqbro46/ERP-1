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

