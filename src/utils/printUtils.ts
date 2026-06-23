
const getSignatureHtml = (settings: any) => {
  const alignment = settings.signatureAlignment || 'spread';
  const justifyMap: Record<string, string> = {
    spread: 'space-between',
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
  };
  
  const gap = alignment === 'spread' ? '0' : '40px';
  
  return `
    <div class="footer-signatures" style="display: flex; justify-content: ${justifyMap[alignment]}; gap: ${gap}; margin-top: 60px;">
      ${settings.showSignature1 !== false ? `<div class="signature">${settings.printSignature1}</div>` : ''}
      ${settings.showSignature2 !== false ? `<div class="signature">${settings.printSignature2}</div>` : ''}
      ${settings.showSignature3 !== false ? `<div class="signature">${settings.printSignature3}</div>` : ''}
    </div>
  `;
};

const executePrint = (html: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  const doPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  const images = doc.getElementsByTagName('img');
  if (images.length > 0) {
    let loaded = 0;
    Array.from(images).forEach(img => {
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === images.length) doPrint();
      };
    });
    setTimeout(doPrint, 3000);
  } else {
    setTimeout(doPrint, 500);
  }
};

const getHeaderHtml = (settings: any, title: string, subtitle?: string) => {
  const logoHtml = settings.companyLogo ? `
    <div class="logo-container" style="width: 80px; height: 80px; margin-right: 20px; flex-shrink: 0;">
      <img src="${settings.companyLogo}" style="width: 100%; height: 100%; object-fit: contain;" referrerPolicy="no-referrer" />
    </div>
  ` : '';

  return `
    <div class="header" style="display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: left;">
      ${logoHtml}
      <div style="flex: 1; text-align: center;">
        <div class="company-name">${settings.companyName || 'SAPIENT ERP'}</div>
        <div class="company-info" style="white-space: pre-line;">${settings.companyAddress || ''}</div>
        <div class="company-info">
          ${settings.showPrintPhone !== false && settings.printPhone ? `Phone: ${settings.printPhone}` : ''}
          ${settings.showPrintEmail !== false && settings.printEmail ? ` | Email: ${settings.printEmail}` : ''}
          ${settings.showPrintWebsite !== false && settings.printWebsite ? ` | Web: ${settings.printWebsite}` : ''}
        </div>
        ${settings.showPrintHeader !== false ? `<div class="print-header">${settings.printHeader || ''}</div>` : ''}
        <div class="report-title">${title.toUpperCase()}</div>
        ${subtitle ? `<div>${subtitle}</div>` : ''}
      </div>
    </div>
  `;
};

export function convertNumberToWords(num: number): string {
  if (num === 0) return 'Zero Taka Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  };

  const convert = (n: number): string => {
    if (n === 0) return '';
    let result = '';
    
    // Crore (10,000,000)
    if (n >= 10000000) {
      result += convert(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    // Lakh (100,000)
    if (n >= 100000) {
      result += convertLessThanOneThousand(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    // Thousand (1,000)
    if (n >= 1000) {
      result += convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    // Hundreds, Tens, Ones
    if (n > 0) {
      result += convertLessThanOneThousand(n) + ' ';
    }
    
    return result.trim();
  };

  const parts = Math.abs(num).toString().split('.');
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = parts[1] ? parseInt(parts[1].substring(0, 2).padEnd(2, '0')) : 0;
  
  let words = convert(integerPart) + ' Taka';
  if (decimalPart > 0) {
    words += ' and ' + convertLessThanOneThousand(decimalPart) + ' Paisa';
  }
  words += ' Only';
  return words.replace(/\s+/g, ' ');
}

export function formatPrintedQuantity(qty: number, unit: string = ''): string {
  const normUnit = unit.toLowerCase();
  if (normUnit === 'pcs' || normUnit === 'pc' || normUnit === 'nos') {
    return Math.round(qty).toString();
  }
  return Number(qty.toFixed(2)).toString();
}

export function formatPrintedAmount(amt: number): string {
  return amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Separate print layout storage as requested by user for easy future editing
export function getVoucherMetaHtml(voucher: any, partyLabel: string = 'Party Name:') {
  const partyNameStr = voucher.party_ledger_name || voucher.ledger_name || '';
  const partyAddressStr = voucher.party_address || '';
  
  return `
    <div class="meta-table" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; font-size: 11px; width: 100%; box-sizing: border-box; font-family: 'Courier New', Courier, monospace;">
      <!-- Left side: Party & Address -->
      <div style="text-align: left; max-width: 60%; line-height: 1.4;">
        ${partyNameStr ? `
          <div style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 4px;">
            ${partyLabel} ${partyNameStr}
          </div>
        ` : ''}
        <div style="font-size: 12px; color: #000; margin-top: 2px;">
          <strong>Address:</strong> ${partyAddressStr || 'N/A'}
        </div>
      </div>
      
      <!-- Right side: Date, Serial, Voucher No, Ref No -->
      <div style="text-align: right; line-height: 1.4; font-size: 11px;">
        <div><strong>Date:</strong> ${new Date(voucher.v_date).toLocaleDateString()}</div>
        ${voucher.serial_no || voucher.auto_serial_no ? `<div style="margin-top: 3px;"><strong>Serial No:</strong> ${voucher.serial_no || voucher.auto_serial_no}</div>` : ''}
        <div style="margin-top: 3px;"><strong>Voucher No:</strong> ${voucher.v_no}</div>
        ${voucher.reference_no ? `<div style="margin-top: 3px;"><strong>Ref No:</strong> ${voucher.reference_no}</div>` : ''}
      </div>
    </div>
  `;
}

export function getSalesVoucherHtml(voucher: any, settings: any) {
  return `
    ${getVoucherMetaHtml(voucher, 'Party:')}
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="width: 15%;" class="text-right">Qty</th>
          <th style="width: 15%;" class="text-right">Rate</th>
          <th style="width: 20%;" class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(voucher.inventory || []).map((item: any) => `
          <tr>
            <td>
              <strong>${item.item_name}</strong>
            </td>
            <td class="text-right">${formatPrintedQuantity(item.qty, item.unit)} ${item.unit || ''}</td>
            <td class="text-right">${formatPrintedAmount(item.rate)}</td>
            <td class="text-right">${formatPrintedAmount(item.qty * item.rate)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold;">
          <td colspan="3" class="text-right" style="font-size: 12px; text-transform: uppercase;">Total:</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function getPurchaseVoucherHtml(voucher: any, settings: any) {
  return `
    ${getVoucherMetaHtml(voucher, 'Party:')}
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="width: 15%;" class="text-right">Qty</th>
          <th style="width: 15%;" class="text-right">Rate</th>
          <th style="width: 20%;" class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(voucher.inventory || []).map((item: any) => `
          <tr>
            <td>
              <strong>${item.item_name}</strong>
            </td>
            <td class="text-right">${formatPrintedQuantity(item.qty, item.unit)} ${item.unit || ''}</td>
            <td class="text-right">${formatPrintedAmount(item.rate)}</td>
            <td class="text-right">${formatPrintedAmount(item.qty * item.rate)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold;">
          <td colspan="3" class="text-right" style="font-size: 12px; text-transform: uppercase;">Total:</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function getPaymentVoucherHtml(voucher: any, settings: any) {
  return `
    ${getVoucherMetaHtml(voucher, 'Paid To (Party):')}
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Particulars</th>
          <th style="width: 25%;" class="text-right">Debit (৳)</th>
          <th style="width: 25%;" class="text-right">Credit (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${(voucher.entries || []).map((entry: any) => `
          <tr>
            <td>
              <strong>${entry.ledger_name}</strong>
              ${entry.narration ? `<div style="font-size: 9px; color: #555; margin-top: 2px; font-style: italic;">(${entry.narration})</div>` : ''}
            </td>
            <td class="text-right">${entry.debit > 0 ? formatPrintedAmount(entry.debit) : ''}</td>
            <td class="text-right">${entry.credit > 0 ? formatPrintedAmount(entry.credit) : ''}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold;">
          <td class="text-right" style="font-size: 12px; text-transform: uppercase;">Total:</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function getReceiptVoucherHtml(voucher: any, settings: any) {
  return `
    ${getVoucherMetaHtml(voucher, 'Received From (Party):')}
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Particulars</th>
          <th style="width: 25%;" class="text-right">Debit (৳)</th>
          <th style="width: 25%;" class="text-right">Credit (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${(voucher.entries || []).map((entry: any) => `
          <tr>
            <td>
              <strong>${entry.ledger_name}</strong>
              ${entry.narration ? `<div style="font-size: 9px; color: #555; margin-top: 2px; font-style: italic;">(${entry.narration})</div>` : ''}
            </td>
            <td class="text-right">${entry.debit > 0 ? formatPrintedAmount(entry.debit) : ''}</td>
            <td class="text-right">${entry.credit > 0 ? formatPrintedAmount(entry.credit) : ''}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold;">
          <td class="text-right" style="font-size: 12px; text-transform: uppercase;">Total:</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function getJournalVoucherHtml(voucher: any, settings: any) {
  return `
    ${getVoucherMetaHtml(voucher, 'Particulars / Note:')}
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Particulars</th>
          <th style="width: 25%;" class="text-right">Debit (৳)</th>
          <th style="width: 25%;" class="text-right">Credit (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${(voucher.entries || []).map((entry: any) => `
          <tr>
            <td>
              <strong>${entry.ledger_name}</strong>
              ${entry.narration ? `<div style="font-size: 9px; color: #555; margin-top: 2px; font-style: italic;">(${entry.narration})</div>` : ''}
            </td>
            <td class="text-right">${entry.debit > 0 ? formatPrintedAmount(entry.debit) : ''}</td>
            <td class="text-right">${entry.credit > 0 ? formatPrintedAmount(entry.credit) : ''}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold;">
          <td class="text-right" style="font-size: 12px; text-transform: uppercase;">Total:</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
          <td class="text-right" style="font-size: 12px;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function getStockJournalVoucherHtml(voucher: any, settings: any) {
  const consumption = (voucher.inventory || []).filter((i: any) => i.entry_type === 'Consumption');
  const production = (voucher.inventory || []).filter((i: any) => i.entry_type === 'Production');
  const totalConsumption = consumption.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0);
  const totalProduction = production.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0);

  return `
    ${getVoucherMetaHtml(voucher, 'Note:')}
    
    <div style="display: flex; gap: 20px; width: 100%;">
      <!-- Source Consumption Section -->
      <div style="width: 50%;">
        <div style="text-align: center; font-weight: bold; font-size: 12px; padding: 5px; border: 1px solid #000; background: #f2f2f2; margin-bottom: 10px; text-transform: uppercase;">
          Source (Consumption)
        </div>
        <table class="data-table" style="margin-bottom: 0;">
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="width: 25%;" class="text-right">Qty</th>
              <th style="width: 30%;" class="text-right">Rate / Amt</th>
            </tr>
          </thead>
          <tbody>
            ${consumption.length === 0 ? `<tr><td colspan="3" class="text-center" style="font-style: italic; color: #888; padding: 20px 0;">No items</td></tr>` : 
              consumption.map((item: any) => `
                <tr>
                  <td>
                    <strong>${item.item_name}</strong>
                    ${item.godown_name ? `<div style="font-size: 8px; color: #555; margin-top: 1px;">Loc: ${item.godown_name}</div>` : ''}
                  </td>
                  <td class="text-right">${formatPrintedQuantity(item.qty, item.unit)} ${item.unit || ''}</td>
                  <td class="text-right">
                    ${formatPrintedAmount(item.rate)}<br/>
                    <span style="font-size: 10px; font-weight: bold;">${formatPrintedAmount(item.qty * item.rate)}</span>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
          <tfoot>
            <tr style="font-weight: bold;">
              <td colspan="2" class="text-right">Total:</td>
              <td class="text-right">৳ ${formatPrintedAmount(totalConsumption)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Destination Production Section -->
      <div style="width: 50%;">
        <div style="text-align: center; font-weight: bold; font-size: 12px; padding: 5px; border: 1px solid #000; background: #f2f2f2; margin-bottom: 10px; text-transform: uppercase;">
          Destination (Production)
        </div>
        <table class="data-table" style="margin-bottom: 0;">
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="width: 25%;" class="text-right">Qty</th>
              <th style="width: 30%;" class="text-right">Rate / Amt</th>
            </tr>
          </thead>
          <tbody>
            ${production.length === 0 ? `<tr><td colspan="3" class="text-center" style="font-style: italic; color: #888; padding: 20px 0;">No items</td></tr>` : 
              production.map((item: any) => `
                <tr>
                  <td>
                    <strong>${item.item_name}</strong>
                    ${item.godown_name ? `<div style="font-size: 8px; color: #555; margin-top: 1px;">Loc: ${item.godown_name}</div>` : ''}
                  </td>
                  <td class="text-right">${formatPrintedQuantity(item.qty, item.unit)} ${item.unit || ''}</td>
                  <td class="text-right">
                    ${formatPrintedAmount(item.rate)}<br/>
                    <span style="font-size: 10px; font-weight: bold;">${formatPrintedAmount(item.qty * item.rate)}</span>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
          <tfoot>
            <tr style="font-weight: bold;">
              <td colspan="2" class="text-right">Total:</td>
              <td class="text-right">৳ ${formatPrintedAmount(totalProduction)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

export function printVoucher(voucher: any, settings: any = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const type = voucher.v_type;
  let voucherDetailsHtml = '';
  if (type === 'Sales') {
    voucherDetailsHtml = getSalesVoucherHtml(voucher, settings);
  } else if (type === 'Purchase') {
    voucherDetailsHtml = getPurchaseVoucherHtml(voucher, settings);
  } else if (type === 'Payment') {
    voucherDetailsHtml = getPaymentVoucherHtml(voucher, settings);
  } else if (type === 'Receipt') {
    voucherDetailsHtml = getReceiptVoucherHtml(voucher, settings);
  } else if (type === 'Journal') {
    voucherDetailsHtml = getJournalVoucherHtml(voucher, settings);
  } else if (type === 'Stock Journal') {
    voucherDetailsHtml = getStockJournalVoucherHtml(voucher, settings);
  } else {
    // Contra or other fallback
    voucherDetailsHtml = getJournalVoucherHtml(voucher, settings);
  }

  const logoHtml = settings.companyLogo ? `
    <div class="logo-absolute">
      <img src="${settings.companyLogo}" referrerPolicy="no-referrer" />
    </div>
  ` : '';

  const html = `
    <html>
      <head>
        <title>Print Voucher - ${voucher.v_no}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            padding: 0;
            margin: 0;
            color: #000;
            background-color: #fff;
          }
          .print-layout-wrapper {
            min-height: 98vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .content-area {
            flex-grow: 1;
            padding-bottom: 20px;
          }
          .header-container {
            position: relative;
            min-height: 80px;
            margin-bottom: 25px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .logo-absolute {
            position: absolute;
            left: 0;
            top: 0;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-absolute img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            padding-left: 90px;
            padding-right: 90px;
            box-sizing: border-box;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
          }
          .company-info {
            font-size: 11px;
            margin-top: 4px;
            line-height: 1.4;
          }
          .voucher-title-container {
            text-align: center;
            margin-top: 15px;
            margin-bottom: 25px;
          }
          .voucher-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border: 1px solid #000;
            padding: 4px 20px;
            display: inline-block;
            background-color: #fcfcfc;
          }
          .meta-table {
            width: 100%;
            margin-bottom: 20px;
            font-size: 12px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          table.data-table th, table.data-table td {
            border: 1px solid #000;
            padding: 8px 10px;
            font-size: 11px;
          }
          table.data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-transform: uppercase;
            text-align: left;
          }
          .text-right {
            text-align: right !important;
          }
          .text-center {
            text-align: center !important;
          }
          .amount-words-section {
            font-size: 12px;
            margin-top: 25px;
            margin-bottom: 12px;
            line-height: 1.5;
          }
          .narration-section {
            font-size: 12px;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .footer-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 40px;
            padding-bottom: 20px;
            box-sizing: border-box;
          }
          .signature-block {
            width: 180px;
            text-align: center;
          }
          .signature-line {
            border-top: 1.5px solid #000;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .print-footer {
            border-top: 1.5px solid #000;
            padding-top: 2px;
            color: #666;
            font-size: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 25px;
            box-sizing: border-box;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-layout-wrapper {
              min-height: 94vh;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-layout-wrapper">
          <div class="content-area">
            <!-- Header section ( centered with independent logo on left ) -->
            <div class="header-container">
              ${logoHtml}
              <div class="header-text">
                <h1 class="company-name">${settings.companyName || 'SAPIENT ERP'}</h1>
                <div class="company-info" style="white-space: pre-line;">${settings.companyAddress || ''}</div>
                <div class="company-info">
                  ${settings.showPrintPhone !== false && settings.printPhone ? `Phone: ${settings.printPhone}` : ''}
                  ${settings.showPrintEmail !== false && settings.printEmail ? ` | Email: ${settings.printEmail}` : ''}
                  ${settings.showPrintWebsite !== false && settings.printWebsite ? ` | Web: ${settings.printWebsite}` : ''}
                </div>
                ${settings.showPrintHeader !== false && settings.printHeader ? `<div class="print-header" style="font-style: italic; font-size: 11px; margin-top: 3px;">${settings.printHeader}</div>` : ''}
              </div>
            </div>

            <!-- Bold and padded Voucher Title centered and placed slightly below the header -->
            <div class="voucher-title-container">
              <span class="voucher-title">${voucher.v_type.toUpperCase()} VOUCHER</span>
            </div>

            <!-- Main voucher details layout for that specific type -->
            ${voucherDetailsHtml}

            <!-- Amount in words (above narration) -->
            <div class="amount-words-section">
              <strong>Amount in words:</strong> <span style="font-style: italic; text-transform: capitalize;">${convertNumberToWords(voucher.total_amount)}</span>
            </div>

            <!-- Narration section (below amount in words with some spacing) -->
            <div class="narration-section">
              <strong>Narration:</strong> <span style="font-style: italic;">${voucher.narration || 'N/A'}</span>
            </div>
          </div>

          <!-- Bottom elements pushed to down -->
          <div style="width: 100%;">
            <!-- Signature area spread out -->
            <div class="footer-signatures">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Prepared By</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized Signatory</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Receiver's Signature</div>
              </div>
            </div>

            <!-- Footers -->
            <div class="print-footer">
              <div style="text-align: left; margin: 0; padding: 0;">
                ${settings.showPrintFooter !== false ? (settings.printFooter || '') : ''}
              </div>
              ${settings.showDeveloperContact !== false ? `
                <div style="text-align: right; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace;">
                  ${settings.developerContactText || 'TallyFlow ERP | +880 1742 058246'}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function printProfitAndLoss(data: any, settings: any = {}) {
  const html = `
    <html>
      <head>
        <title>Profit & Loss A/c</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .company-info { font-size: 12px; margin-top: 5px; }
          .report-title { font-size: 18px; margin-top: 10px; text-decoration: underline; font-weight: bold; }
          .print-header { font-size: 12px; margin-top: 5px; font-style: italic; }
          .container { display: flex; border: 1px solid #000; }
          .side { flex: 1; border-right: 1px solid #000; }
          .side:last-child { border-right: none; }
          .side-header { background: #f2f2f2; padding: 8px; font-weight: bold; border-bottom: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px; }
          .row { padding: 4px 8px; display: flex; justify-content: space-between; font-size: 11px; }
          .total-row { border-top: 1px solid #000; font-weight: bold; padding: 8px; display: flex; justify-content: space-between; font-size: 12px; }
          .signature { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .print-footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; color: #666; position: relative; }
          .dev-contact {
            position: absolute;
            ${settings.developerContactAlignment === 'left' ? 'left: 0; text-align: left;' : settings.developerContactAlignment === 'right' ? 'right: 0; text-align: right;' : 'left: 0; right: 0; text-align: center;'}
            bottom: -8px;
            font-size: 7px;
            color: #999;
            line-height: 1.2;
            white-space: pre-line;
          }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        ${getHeaderHtml(settings, 'PROFIT & LOSS A/C', `For the period ended ${new Date().toLocaleDateString()}`)}
        
        <div class="container">
          <div class="side">
            <div class="side-header"><span>Particulars</span><span>Amount</span></div>
            <div class="row"><span>Opening Stock</span><span>${data.trading.openingStock.toFixed(2)}</span></div>
            ${data.trading.purchaseGroups.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            ${data.trading.directExpenseGroups.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            ${data.grossProfit > 0 ? `<div class="row profit"><span>Gross Profit c/o</span><span>${data.grossProfit.toFixed(2)}</span></div>` : ''}
            
            <div style="height: 20px;"></div>
            <div class="side-header"><span>Indirect Expenses</span><span></span></div>
            ${data.pl.indirectExpenseGroups.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            ${data.netProfit > 0 ? `<div class="row profit"><span>Net Profit</span><span>${data.netProfit.toFixed(2)}</span></div>` : ''}
          </div>
          
          <div class="side">
            <div class="side-header"><span>Particulars</span><span>Amount</span></div>
            ${data.trading.salesGroups.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            ${data.trading.directIncomeGroups.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            <div class="row"><span>Closing Stock</span><span>${data.trading.closingStock.toFixed(2)}</span></div>
            ${data.grossProfit < 0 ? `<div class="row loss"><span>Gross Loss c/o</span><span>${Math.abs(data.grossProfit).toFixed(2)}</span></div>` : ''}
 
            <div style="height: 20px;"></div>
            <div class="side-header"><span>Indirect Incomes</span><span></span></div>
            <div class="row"><span>Gross Profit b/f</span><span>${data.grossProfit > 0 ? data.grossProfit.toFixed(2) : '0.00'}</span></div>
            ${data.pl.indirectIncomeGroups.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            ${data.netProfit < 0 ? `<div class="row loss"><span>Net Loss</span><span>${Math.abs(data.netProfit).toFixed(2)}</span></div>` : ''}
          </div>
        </div>
 
        ${getSignatureHtml(settings)}
 
        <div class="print-footer">
          ${settings.showPrintFooter !== false ? (settings.printFooter || '') : ''}
          ${settings.showDeveloperContact ? `
            <div class="dev-contact">
              Software by TallyFlow<br/>
              +880 1234 567890
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  executePrint(html);
}

export function printBalanceSheet(data: any, settings: any = {}) {
  const html = `
    <html>
      <head>
        <title>Balance Sheet</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .company-info { font-size: 12px; margin-top: 5px; }
          .report-title { font-size: 18px; margin-top: 10px; text-decoration: underline; font-weight: bold; }
          .print-header { font-size: 12px; margin-top: 5px; font-style: italic; }
          .container { display: flex; border: 1px solid #000; }
          .side { flex: 1; border-right: 1px solid #000; }
          .side:last-child { border-right: none; }
          .side-header { background: #f2f2f2; padding: 8px; font-weight: bold; border-bottom: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px; }
          .row { padding: 4px 8px; display: flex; justify-content: space-between; font-size: 11px; }
          .total-row { border-top: 1px solid #000; font-weight: bold; padding: 8px; display: flex; justify-content: space-between; font-size: 12px; }
          .signature { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .print-footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; color: #666; position: relative; }
          .dev-contact {
            position: absolute;
            ${settings.developerContactAlignment === 'left' ? 'left: 0; text-align: left;' : settings.developerContactAlignment === 'right' ? 'right: 0; text-align: right;' : 'left: 0; right: 0; text-align: center;'}
            bottom: -8px;
            font-size: 7px;
            color: #999;
            line-height: 1.2;
            white-space: pre-line;
          }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        ${getHeaderHtml(settings, 'BALANCE SHEET', `As on ${new Date().toLocaleDateString()}`)}
        
        <div class="container">
          <div class="side">
            <div class="side-header"><span>Liabilities</span><span>Amount</span></div>
            ${data.liabilities.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            ${data.netProfit > 0 ? `<div class="row"><span>Profit & Loss A/c (Net Profit)</span><span>${data.netProfit.toFixed(2)}</span></div>` : ''}
            <div class="total-row"><span>Total</span><span>${data.totalLiabilities.toFixed(2)}</span></div>
          </div>
          
          <div class="side">
            <div class="side-header"><span>Assets</span><span>Amount</span></div>
            ${data.assets.map((g: any) => `<div class="row"><span>${g.name}</span><span>${Math.abs(g.balance).toFixed(2)}</span></div>`).join('')}
            <div class="row"><span>Closing Stock</span><span>${data.closingStock.toFixed(2)}</span></div>
            ${data.netProfit < 0 ? `<div class="row"><span>Profit & Loss A/c (Net Loss)</span><span>${Math.abs(data.netProfit).toFixed(2)}</span></div>` : ''}
            <div class="total-row"><span>Total</span><span>${data.totalAssets.toFixed(2)}</span></div>
          </div>
        </div>
 
        ${getSignatureHtml(settings)}
 
        <div class="print-footer">
          ${settings.showPrintFooter !== false ? (settings.printFooter || '') : ''}
          ${settings.showDeveloperContact ? `
            <div class="dev-contact">
              ${settings.developerContactText || 'Powered by TallyFlow ERP | Developer Contact: +880 1700 000000'}
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  executePrint(html);
}

export function printReport(title: string, data: any[], columns: string[], settings: any = {}) {
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .company-info { font-size: 12px; margin-top: 5px; }
          .report-title { font-size: 18px; margin-top: 10px; text-decoration: underline; font-weight: bold; }
          .print-header { font-size: 12px; margin-top: 5px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px; }
          th { background-color: #f2f2f2; font-size: 12px; }
          .amount { text-align: right; }
          .signature { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .print-footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; color: #666; position: relative; }
          .dev-contact {
            position: absolute;
            ${settings.developerContactAlignment === 'left' ? 'left: 0; text-align: left;' : settings.developerContactAlignment === 'right' ? 'right: 0; text-align: right;' : 'left: 0; right: 0; text-align: center;'}
            bottom: -8px;
            font-size: 7px;
            color: #999;
            line-height: 1.2;
            white-space: pre-line;
          }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        ${getHeaderHtml(settings, title, `<div style="text-align: right; font-size: 10px; margin-top: 5px;">Date of Print: ${new Date().toLocaleDateString()}</div>`)}
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => {
                  const key = col.toLowerCase().replace(/ /g, '_');
                  const val = row[key];
                  const isNum = typeof val === 'number';
                  return `<td class="${isNum ? 'amount' : ''}">${isNum ? val.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (val || '')}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${getSignatureHtml(settings)}

        <div class="print-footer">
          ${settings.showPrintFooter !== false ? (settings.printFooter || '') : ''}
          ${settings.showDeveloperContact ? `
            <div class="dev-contact">
              ${settings.developerContactText || 'Powered by TallyFlow ERP | Developer Contact: +880 1700 000000'}
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  executePrint(html);
}

export function printElement(elementId: string, title: string, settings: any = {}) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          body { font-family: 'JetBrains Mono', Courier, monospace; padding: 20px; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 10px; }
          th { background-color: #f2f2f2; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .tracking-widest { letter-spacing: 0.1em; }
          .bg-gray-50 { background-color: #f9fafb; }
          .text-primary { color: #000; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @media print {
            .no-print { display: none; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        ${getHeaderHtml(settings, title)}
        ${element.innerHTML}
        ${getSignatureHtml(settings)}
      </body>
    </html>
  `;

  executePrint(html);
}

export const printUtils = {
  printVoucher,
  printProfitAndLoss,
  printBalanceSheet,
  printReport,
  printElement
};
