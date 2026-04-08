
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

const getHeaderHtml = (settings: any, title: string, subtitle?: string) => {
  const logoHtml = settings.companyLogo ? `
    <div class="logo-container" style="width: 80px; height: 80px; margin-right: 20px; flex-shrink: 0;">
      <img src="${settings.companyLogo}" style="width: 100%; height: 100%; object-contain: contain;" referrerPolicy="no-referrer" />
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

export function printVoucher(voucher: any, settings: any = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Print Voucher - ${voucher.v_no}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .company-info { font-size: 12px; margin-top: 5px; }
          .voucher-title { font-size: 18px; margin-top: 10px; text-decoration: underline; font-weight: bold; }
          .print-header { font-size: 12px; margin-top: 5px; font-style: italic; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px; }
          th { background-color: #f2f2f2; font-size: 12px; }
          .amount { text-align: right; }
          .print-footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; color: #666; position: relative; }
          .dev-contact { position: absolute; right: 0; bottom: 0; text-align: right; font-size: 7px; color: #999; line-height: 1.2; }
          .signature { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${getHeaderHtml(settings, `${voucher.v_type.toUpperCase()} VOUCHER`)}
        
        <div class="meta">
          <div><strong>Voucher No:</strong> ${voucher.v_no}</div>
          <div><strong>Date:</strong> ${new Date(voucher.v_date).toLocaleDateString()}</div>
        </div>

        ${voucher.v_type === 'Sales' || voucher.v_type === 'Purchase' ? `
          <div><strong>Party:</strong> ${voucher.party_name || 'N/A'}</div>
          <br/>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${voucher.inventory.map((item: any) => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.qty} ${item.unit || ''}</td>
                  <td>${item.rate.toFixed(2)}</td>
                  <td class="amount">${(item.qty * item.rate).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <th colspan="3" class="amount">Total</th>
                <th class="amount">${voucher.total_amount.toFixed(2)}</th>
              </tr>
            </tfoot>
          </table>
        ` : `
          <table>
            <thead>
              <tr>
                <th>Particulars</th>
                <th class="amount">Debit</th>
                <th class="amount">Credit</th>
              </tr>
            </thead>
            <tbody>
              ${voucher.entries.map((entry: any) => `
                <tr>
                  <td>${entry.ledger_name}</td>
                  <td class="amount">${entry.debit > 0 ? entry.debit.toFixed(2) : ''}</td>
                  <td class="amount">${entry.credit > 0 ? entry.credit.toFixed(2) : ''}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th class="amount">${voucher.total_amount.toFixed(2)}</th>
                <th class="amount">${voucher.total_amount.toFixed(2)}</th>
              </tr>
            </tfoot>
          </table>
        `}

        <div><strong>Narration:</strong> ${voucher.narration || ''}</div>

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
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

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
          .dev-contact { position: absolute; right: 0; bottom: 0; text-align: right; font-size: 7px; color: #999; line-height: 1.2; }
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

export function printBalanceSheet(data: any, settings: any = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

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
          .dev-contact { position: absolute; right: 0; bottom: 0; text-align: right; font-size: 7px; color: #999; line-height: 1.2; }
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
              Software by TallyFlow<br/>
              +880 1234 567890
            </div>
          ` : ''}
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

export function printReport(title: string, data: any[], columns: string[], settings: any = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

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
          .dev-contact { position: absolute; right: 0; bottom: 0; text-align: right; font-size: 7px; color: #999; line-height: 1.2; }
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
              Software by TallyFlow<br/>
              +880 1234 567890
            </div>
          ` : ''}
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
