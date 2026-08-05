import { formatDate } from '../dateUtils';
import { formatNumber, formatQuantity } from '../../lib/utils';

export interface LedgerReportData {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyLogo?: string;
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
    companyName = 'MODINA ENTERPRISE',
    companyAddress = 'Noyagola More, Chapai Nawabgonj',
    companyEmail = 'modinaenterprise29@gmail.com',
    companyPhone = '',
    ledgerName = 'M/S Johura Enterprise',
    ledgerAddress = 'Gulshan 1, Dhaka-1212',
    startDate,
    endDate,
    openingBalance = 0,
    entries = [],
    items = [],
    users = [],
    config = { format: 'Detailed', showNarration: true, showEnteredBy: false, showRunningBalance: true, enableStripeView: false }
  } = data;

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  const periodText = `${formattedStartDate} to ${formattedEndDate}`;

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  // Process transaction rows
  const rowsHtml = entries.map((entry, index) => {
    const debitVal = entry.debit || 0;
    const creditVal = entry.credit || 0;
    totalDebit += debitVal;
    totalCredit += creditVal;

    runningBalance += (debitVal - creditVal);
    const balanceAbsStr = formatNumber(Math.abs(runningBalance));
    const balanceSign = runningBalance >= 0 ? 'Cr' : 'Dr'; // Tally convention: positive balance is Cr for liability/creditor or Dr for asset

    const voucherDate = formatDate(entry.vouchers?.v_date || entry.v_date || startDate);
    const voucherType = entry.vouchers?.v_type || entry.v_type || '';
    const voucherNo = entry.vouchers?.v_no || entry.v_no || entry.vouchers?.reference_no || '';
    const particulars = entry.particulars || '';
    
    // Prefix Dr or Cr
    const prefix = debitVal > 0 ? 'Dr' : (creditVal > 0 ? 'Cr' : 'Dr');
    const particularsDisplay = `${prefix} ${particulars}`;

    // Inventory items formatting (if Detailed)
    let inventoryHtml = '';
    if (config.format === 'Detailed' && entry.vouchers?.inventory && entry.vouchers.inventory.length > 0) {
      const invItems = entry.vouchers.inventory.map((inv: any) => {
        const itemName = items.find((i: any) => i.id === inv.item_id)?.name || inv.item_name || 'Item';
        const qtyStr = `${formatQuantity(inv.qty, inv.unit || 'Pcs')} ${inv.unit || 'Pcs'}`;
        const rateStr = `${formatNumber(inv.rate)}/${inv.unit || 'Pcs'}`;
        const amountStr = formatNumber(inv.amount);

        return `
          <div style="display: flex; justify-content: space-between; font-size: 10px; line-height: 1.4; color: #000000; padding-left: 20px;">
            <div style="width: 42%; text-align: left;">${itemName}</div>
            <div style="width: 22%; text-align: right;">${qtyStr}</div>
            <div style="width: 18%; text-align: right;">${rateStr}</div>
            <div style="width: 18%; text-align: right;">${amountStr}</div>
          </div>
        `;
      }).join('');

      inventoryHtml = `
        <tr>
          <td></td>
          <td colspan="6" style="padding: 1px 0 3px 0;">
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
          <td colspan="6" style="padding: 1px 0 2px 20px; font-size: 9.5px; font-style: italic; color: #333333;">
            ${entry.vouchers.narration}
          </td>
        </tr>
      `;
    }

    return `
      <tbody style="page-break-inside: avoid; break-inside: avoid;">
        <tr>
          <td style="padding: 3px 4px; vertical-align: top; white-space: nowrap;">${voucherDate}</td>
          <td style="padding: 3px 4px; vertical-align: top; font-weight: bold;">${particularsDisplay}</td>
          <td style="padding: 3px 4px; vertical-align: top; text-align: center;">${voucherType}</td>
          <td style="padding: 3px 4px; vertical-align: top; text-align: center;">${voucherNo}</td>
          <td style="padding: 3px 4px; vertical-align: top; text-align: right;">${debitVal > 0 ? formatNumber(debitVal) : ''}</td>
          <td style="padding: 3px 4px; vertical-align: top; text-align: right;">${creditVal > 0 ? formatNumber(creditVal) : ''}</td>
          <td style="padding: 3px 4px; vertical-align: top; text-align: right; white-space: nowrap;">${balanceAbsStr} ${balanceSign}</td>
        </tr>
        ${inventoryHtml}
        ${narrationHtml}
      </tbody>
    `;
  }).join('');

  // Closing calculations
  const isOpeningDr = openingBalance >= 0;
  const openingDrVal = isOpeningDr ? Math.abs(openingBalance) : 0;
  const openingCrVal = !isOpeningDr ? Math.abs(openingBalance) : 0;

  const totalDebitWithOpening = totalDebit + openingDrVal;
  const totalCreditWithOpening = totalCredit + openingCrVal;
  const finalBalance = runningBalance;
  const isFinalDr = finalBalance < 0; // Negative means Dr in running balance logic

  const grandTotal = Math.max(totalDebitWithOpening, totalCreditWithOpening);

  const closingBalanceDebit = isFinalDr ? formatNumber(Math.abs(finalBalance)) : '';
  const closingBalanceCredit = !isFinalDr ? formatNumber(Math.abs(finalBalance)) : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ledger Statement - ${ledgerName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
            @top-right {
              content: "Page " counter(page);
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              color: #000000;
            }
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
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
            font-weight: normal;
          }
          .company-title {
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .company-sub {
            font-size: 11px;
            color: #111111;
            margin-bottom: 1px;
          }
          .header-line {
            border-bottom: 1px solid #000000;
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
            margin-top: 6px;
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
            padding: 5px 4px;
            font-weight: bold;
            font-size: 11px;
            text-align: left;
            background: transparent !important;
          }
          table.report-table td {
            padding: 3px 4px;
            font-size: 10.5px;
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
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header-container">
          <div class="top-page-num">Page 1</div>
          <div class="company-title">${companyName}</div>
          <div class="company-sub">${companyAddress}</div>
          ${companyEmail ? `<div class="company-sub">E-Mail : ${companyEmail}</div>` : ''}
          <div class="header-line"></div>
          
          <div class="ledger-title">${ledgerName}</div>
          <div class="ledger-subtitle">Ledger Account</div>
          ${ledgerAddress ? `<div class="ledger-subtitle">${ledgerAddress}</div>` : ''}
          <div class="period-title">${periodText}</div>
        </div>

        <!-- Table -->
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 11%;">Date</th>
              <th style="width: 39%;">Particulars</th>
              <th class="center-col" style="width: 12%;">Vch Type</th>
              <th class="center-col" style="width: 8%;">Vch No.</th>
              <th class="num-col" style="width: 10%;">Debit</th>
              <th class="num-col" style="width: 10%;">Credit</th>
              <th class="num-col" style="width: 10%;">Balance</th>
            </tr>
          </thead>

          <!-- Opening Balance -->
          <tbody style="page-break-inside: avoid;">
            <tr>
              <td style="padding: 4px;">${formattedStartDate}</td>
              <td style="padding: 4px; font-weight: bold;">${isOpeningDr ? 'Dr' : 'Cr'} Opening Balance</td>
              <td></td>
              <td></td>
              <td class="num-col" style="padding: 4px; font-weight: bold;">${openingDrVal > 0 ? formatNumber(openingDrVal) : ''}</td>
              <td class="num-col" style="padding: 4px; font-weight: bold;">${openingCrVal > 0 ? formatNumber(openingCrVal) : ''}</td>
              <td class="num-col" style="padding: 4px; font-weight: bold;">${formatNumber(Math.abs(openingBalance))} ${isOpeningDr ? 'Dr' : 'Cr'}</td>
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
              <td class="num-col" style="padding: 4px;">${formatNumber(totalDebit)}</td>
              <td class="num-col" style="padding: 4px;">${formatNumber(totalCredit + openingCrVal)}</td>
              <td></td>
            </tr>

            <!-- Closing Balance Row -->
            <tr style="font-weight: bold;">
              <td></td>
              <td style="padding: 4px;">${!isFinalDr ? 'Cr' : 'Dr'} Closing Balance</td>
              <td></td>
              <td></td>
              <td class="num-col" style="padding: 4px;">${closingBalanceDebit}</td>
              <td class="num-col" style="padding: 4px;">${closingBalanceCredit}</td>
              <td></td>
            </tr>

            <!-- Grand Totals with Double Underline -->
            <tr class="grand-total-row">
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td class="num-col">${formatNumber(grandTotal)}</td>
              <td class="num-col">${formatNumber(grandTotal)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
}
