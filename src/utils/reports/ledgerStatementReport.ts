import { formatDate } from '../dateUtils';
import { formatNumber, formatQuantity, compareLedgerVouchers, formatVoucherNo } from '../../lib/utils';
import { DEFAULT_APP_BRANDING, escapeHtml, sanitizeAssetUrl } from '../../constants/appIdentity';

export interface LedgerReportData {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite?: string;
  companyLogo?: string;
  vatBinTin?: string;
  printHeader?: string;
  printFooter?: string;
  softwareFooterText?: string;
  showDeveloperContact?: boolean;
  reportLayout?: 'Layout 1' | 'Layout 2' | string;
  ledgerName: string;
  ledgerAddress?: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  entries: any[];
  items?: any[];
  users?: any[];
  config?: {
    format?: 'Detailed' | 'Condensed';
    showNarration?: boolean;
    showEnteredBy?: boolean;
    showRunningBalance?: boolean;
    enableStripeView?: boolean;
    showStockDescriptions?: boolean;
  };
}

export function generateLedgerStatementHtml(data: LedgerReportData): string {
  const {
    companyName = '',
    companyAddress = '',
    companyEmail = '',
    companyPhone = '',
    companyWebsite = '',
    companyLogo = '',
    vatBinTin = '',
    printHeader = '',
    printFooter = '',
    softwareFooterText = DEFAULT_APP_BRANDING.softwareFooterText,
    showDeveloperContact = true,
    reportLayout = 'Layout 2',
    ledgerName = '',
    ledgerAddress = '',
    startDate,
    endDate,
    openingBalance = 0,
    entries = [],
    items = [],
    users = [],
    config = {
      format: 'Detailed',
      showNarration: true,
      showEnteredBy: false,
      showRunningBalance: true,
      enableStripeView: false,
      showStockDescriptions: false
    }
  } = data;

  const showRunningBalance = config.showRunningBalance !== false;
  const isLayout1 = reportLayout === 'Layout 1';
  const safeLogoUrl = sanitizeAssetUrl(companyLogo || '');

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  const periodText = `${formattedStartDate} to ${formattedEndDate}`;
  const safeCompanyName = escapeHtml(companyName);
  const safeCompanyAddress = escapeHtml(companyAddress);
  const safeCompanyEmail = escapeHtml(companyEmail);
  const safeCompanyPhone = escapeHtml(companyPhone);
  const safeCompanyWebsite = escapeHtml(companyWebsite);
  const safeVatBinTin = escapeHtml(vatBinTin);
  const safePrintHeader = escapeHtml(printHeader);
  const safeLedgerName = escapeHtml(ledgerName);
  const safeLedgerAddress = escapeHtml(ledgerAddress);
  const safeFormattedStartDate = escapeHtml(formattedStartDate);
  const safePeriodText = escapeHtml(periodText);

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  let rowCounter = 1;

  // Process transaction rows sorted: same date -> Sales/Purchase first, then Receipt/Payment
  const sortedEntries = [...entries].sort(compareLedgerVouchers);
  const trailingColCount = showRunningBalance ? 5 : 4;

  const rowsHtml = sortedEntries.map((entry) => {
    const debitVal = Number(entry.debit) || 0;
    const creditVal = Number(entry.credit) || 0;
    totalDebit += debitVal;
    totalCredit += creditVal;

    runningBalance += (debitVal - creditVal);
    const balanceAbsStr = formatNumber(Math.abs(runningBalance));
    const balanceSign = runningBalance >= 0 ? 'Dr' : 'Cr';

    const voucherDate = escapeHtml(formatDate(entry.vouchers?.v_date || entry.v_date || startDate));
    const voucherType = escapeHtml(entry.vouchers?.v_type || entry.v_type || '');
    const voucherNo = escapeHtml(formatVoucherNo(entry.vouchers?.v_no || entry.v_no || entry.vouchers?.reference_no || ''));
    const particulars = entry.particulars || '';

    const prefix = debitVal > 0 ? 'Dr' : (creditVal > 0 ? 'Cr' : 'Dr');
    const particularsDisplay = escapeHtml(`${prefix} ${particulars}`);
    const rowBg = config.enableStripeView && rowCounter % 2 !== 0 ? 'background-color: #f3f4f6;' : '';
    rowCounter++;

    // Inventory items formatting (if Detailed)
    let inventoryHtml = '';
    if (config.format === 'Detailed' && entry.vouchers?.inventory && entry.vouchers.inventory.length > 0) {
      const invItems = entry.vouchers.inventory.map((inv: any) => {
        const itemName = escapeHtml(items.find((i: any) => i.id === inv.item_id)?.name || inv.item_name || 'Item');
        const unitLabel = inv.unit || 'Pcs';
        const qtyStr = escapeHtml(`${formatQuantity(inv.qty, unitLabel)} ${unitLabel}`);
        const rateStr = escapeHtml(`${formatNumber(inv.rate)}/${unitLabel}`);
        const amountStr = escapeHtml(formatNumber(inv.amount ?? (Number(inv.qty || 0) * Number(inv.rate || 0))));
        const descHtml = config.showStockDescriptions && inv.description
          ? `<div style="font-size: 9px; font-style: italic; color: #555555; padding-left: 20px;">${escapeHtml(inv.description)}</div>`
          : '';

        return `
          <div style="display: flex; justify-content: space-between; font-size: 10px; line-height: 1.4; color: #000000; padding-left: 20px;">
            <div style="width: 42%; text-align: left;">${itemName}</div>
            <div style="width: 22%; text-align: right;">${qtyStr}</div>
            <div style="width: 18%; text-align: right;">${rateStr}</div>
            <div style="width: 18%; text-align: right;">${amountStr}</div>
          </div>
          ${descHtml}
        `;
      }).join('');

      inventoryHtml = `
        <tr>
          <td></td>
          <td colspan="${trailingColCount + 1}" style="padding: 1px 0 3px 0; vertical-align: middle;">
            ${invItems}
          </td>
        </tr>
      `;
    }

    // Narration
    let narrationHtml = '';
    if (config.showNarration && entry.vouchers?.narration) {
      narrationHtml = `
        <tr>
          <td></td>
          <td colspan="${trailingColCount + 1}" style="padding: 1px 0 2px 20px; font-size: 9.5px; font-style: italic; color: #333333; vertical-align: middle;">
            ${escapeHtml(entry.vouchers.narration)}
          </td>
        </tr>
      `;
    }

    // Entered By
    let enteredByHtml = '';
    if (config.showEnteredBy) {
      const creatorName = users.find((u: any) => u.uid === entry.vouchers?.createdBy)?.displayName || 'System';
      enteredByHtml = `
        <tr>
          <td></td>
          <td colspan="${trailingColCount + 1}" style="padding: 1px 0 2px 20px; font-size: 8.5px; text-transform: uppercase; color: #6b7280; vertical-align: middle;">
            By: ${escapeHtml(creatorName)}
          </td>
        </tr>
      `;
    }

    return `
      <tbody style="page-break-inside: avoid; break-inside: avoid;">
        <tr style="${rowBg}">
          <td style="padding: 3px 4px; vertical-align: middle; white-space: nowrap;">${voucherDate}</td>
          <td style="padding: 3px 4px; vertical-align: middle; font-weight: bold;">${particularsDisplay}</td>
          <td style="padding: 3px 4px; vertical-align: middle; text-align: center;">${voucherType}</td>
          <td style="padding: 3px 4px; vertical-align: middle; text-align: center;">${voucherNo}</td>
          <td style="padding: 3px 4px; vertical-align: middle; text-align: right;">${debitVal > 0 ? formatNumber(debitVal) : ''}</td>
          <td style="padding: 3px 4px; vertical-align: middle; text-align: right;">${creditVal > 0 ? formatNumber(creditVal) : ''}</td>
          ${showRunningBalance ? `<td style="padding: 3px 4px; vertical-align: middle; text-align: right; white-space: nowrap;">${balanceAbsStr} ${balanceSign}</td>` : ''}
        </tr>
        ${inventoryHtml}
        ${narrationHtml}
        ${enteredByHtml}
      </tbody>
    `;
  }).join('');

  // Closing calculations (Positive = Dr, Negative = Cr)
  const isOpeningDr = openingBalance >= 0;
  const openingDrVal = isOpeningDr ? Math.abs(openingBalance) : 0;
  const openingCrVal = !isOpeningDr ? Math.abs(openingBalance) : 0;

  const totalDebitWithOpening = totalDebit + openingDrVal;
  const totalCreditWithOpening = totalCredit + openingCrVal;
  const finalBalance = runningBalance;
  const isFinalDr = finalBalance >= 0;

  const grandTotal = Math.max(totalDebitWithOpening, totalCreditWithOpening);

  // Balancing closing entry sits on the opposite side of its net balance
  const closingBalanceDebit = !isFinalDr ? formatNumber(Math.abs(finalBalance)) : '';
  const closingBalanceCredit = isFinalDr ? formatNumber(Math.abs(finalBalance)) : '';

  const contactItems: string[] = [];
  if (safeCompanyPhone) contactItems.push(`Phone: ${safeCompanyPhone}`);
  if (safeCompanyEmail) contactItems.push(`E-Mail: ${safeCompanyEmail}`);
  if (safeCompanyWebsite) contactItems.push(`Web: ${safeCompanyWebsite}`);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ledger Statement${safeLedgerName ? ` - ${safeLedgerName}` : ''}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
            @top-right {
              content: "Page " counter(page);
              font-family: ${isLayout1 ? "'JetBrains Mono', Courier, monospace" : 'Arial, Helvetica, sans-serif'};
              font-size: 10px;
              color: #000000;
            }
          }
          body {
            font-family: ${isLayout1 ? "'JetBrains Mono', Courier, monospace" : 'Arial, Helvetica, sans-serif'};
            margin: 0;
            padding: 12px;
            color: #000000;
            background-color: #ffffff;
            font-size: 11px;
            line-height: 1.35;
          }
          .header-container {
            text-align: center;
            margin-bottom: 8px;
            position: relative;
          }
          .top-page-num {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 10px;
            color: #000000;
            font-weight: 700;
          }
          .company-title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .company-sub {
            font-size: 10.5px;
            color: #111111;
            margin-bottom: 1px;
          }
          .header-line {
            border-bottom: ${isLayout1 ? '2px solid #000000' : '1px solid #000000'};
            margin: 6px 0 8px 0;
            width: 100%;
          }
          .ledger-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .ledger-subtitle {
            font-size: 11px;
            margin-bottom: 2px;
          }
          .period-title {
            font-size: 11px;
            font-weight: 600;
            margin-top: 4px;
            margin-bottom: 10px;
          }
          table.report-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.5px;
          }
          table.report-table th {
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
            ${isLayout1 ? 'border-left: 1px solid #000000; border-right: 1px solid #000000;' : ''}
            padding: 5px 4px;
            font-weight: bold;
            font-size: 10.5px;
            text-align: left;
            vertical-align: middle !important;
            background: ${isLayout1 ? '#f3f4f6' : 'transparent'} !important;
          }
          table.report-table td {
            ${isLayout1 ? 'border: 1px solid #cbd5e1;' : ''}
            padding: 3px 4px;
            font-size: 10.5px;
            vertical-align: middle !important;
          }
          .num-col {
            text-align: right !important;
          }
          .center-col {
            text-align: center !important;
          }
          .grand-total-row td {
            border-top: 1px solid #000000;
            border-bottom: 3px double #000000;
            font-weight: bold;
            padding: 5px 4px;
          }
          .report-footer {
            margin-top: 18px;
            padding-top: 6px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header-container">
          <div class="top-page-num">Page 1</div>
          <div style="display: flex; align-items: center; justify-content: center;">
            ${safeLogoUrl ? `<img src="${escapeHtml(safeLogoUrl)}" style="width: 56px; height: 56px; object-fit: contain; margin-right: 14px;" />` : ''}
            <div style="flex: 1; text-align: center;">
              ${safeCompanyName ? `<div class="company-title">${safeCompanyName}</div>` : ''}
              ${safeCompanyAddress ? `<div class="company-sub" style="white-space: pre-line;">${safeCompanyAddress}</div>` : ''}
              ${safeVatBinTin ? `<div class="company-sub">VAT/BIN/TIN: ${safeVatBinTin}</div>` : ''}
              ${contactItems.length > 0 ? `<div class="company-sub">${contactItems.join(' | ')}</div>` : ''}
              ${safePrintHeader ? `<div class="company-sub" style="font-style: italic;">${safePrintHeader}</div>` : ''}
            </div>
          </div>
          <div class="header-line"></div>

          <div class="ledger-title">${safeLedgerName || 'Ledger Account'}</div>
          <div class="ledger-subtitle">Ledger Account</div>
          ${safeLedgerAddress ? `<div class="ledger-subtitle">${safeLedgerAddress}</div>` : ''}
          <div class="period-title">${safePeriodText}</div>
        </div>

        <!-- Table -->
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 11%;">Date</th>
              <th style="width: ${showRunningBalance ? '39%' : '49%'};">Particulars</th>
              <th class="center-col" style="width: 12%;">Vch Type</th>
              <th class="center-col" style="width: 8%;">Vch No.</th>
              <th class="num-col" style="width: 10%;">Debit</th>
              <th class="num-col" style="width: 10%;">Credit</th>
              ${showRunningBalance ? `<th class="num-col" style="width: 10%;">Balance</th>` : ''}
            </tr>
          </thead>

          <!-- Opening Balance -->
          <tbody style="page-break-inside: avoid;">
            <tr>
              <td style="padding: 4px;">${safeFormattedStartDate}</td>
              <td style="padding: 4px; font-weight: bold;">${isOpeningDr ? 'Dr' : 'Cr'} Opening Balance</td>
              <td></td>
              <td></td>
              <td class="num-col" style="padding: 4px; font-weight: bold;">${openingDrVal > 0 ? formatNumber(openingDrVal) : ''}</td>
              <td class="num-col" style="padding: 4px; font-weight: bold;">${openingCrVal > 0 ? formatNumber(openingCrVal) : ''}</td>
              ${showRunningBalance ? `<td class="num-col" style="padding: 4px; font-weight: bold;">${formatNumber(Math.abs(openingBalance))} ${isOpeningDr ? 'Dr' : 'Cr'}</td>` : ''}
            </tr>
          </tbody>

          <!-- Transactions -->
          ${rowsHtml}

          <!-- Closing Balance / Totals -->
          <tbody style="page-break-inside: avoid; break-inside: avoid;">
            <!-- Column Totals -->
            <tr style="font-weight: bold;">
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td class="num-col" style="padding: 4px;">${formatNumber(totalDebitWithOpening)}</td>
              <td class="num-col" style="padding: 4px;">${formatNumber(totalCreditWithOpening)}</td>
              ${showRunningBalance ? '<td></td>' : ''}
            </tr>

            <!-- Closing Balance Row -->
            <tr style="font-weight: bold;">
              <td></td>
              <td style="padding: 4px;">${isFinalDr ? 'Dr' : 'Cr'} Closing Balance</td>
              <td></td>
              <td></td>
              <td class="num-col" style="padding: 4px;">${closingBalanceDebit}</td>
              <td class="num-col" style="padding: 4px;">${closingBalanceCredit}</td>
              ${showRunningBalance ? `<td class="num-col" style="padding: 4px;">${formatNumber(Math.abs(finalBalance))} ${isFinalDr ? 'Dr' : 'Cr'}</td>` : ''}
            </tr>

            <!-- Grand Totals with Double Underline -->
            <tr class="grand-total-row">
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td class="num-col">${formatNumber(grandTotal)}</td>
              <td class="num-col">${formatNumber(grandTotal)}</td>
              ${showRunningBalance ? '<td></td>' : ''}
            </tr>
          </tbody>
        </table>

        ${(printFooter || (showDeveloperContact && softwareFooterText)) ? `
          <div class="report-footer">
            <div>${escapeHtml(printFooter)}</div>
            <div>${showDeveloperContact ? escapeHtml(softwareFooterText) : ''}</div>
          </div>
        ` : ''}
      </body>
    </html>
  `;
}

