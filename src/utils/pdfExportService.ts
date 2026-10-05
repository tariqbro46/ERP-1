import { jsPDF } from 'jspdf';
import { formatPrintedAmount, formatPrintedQuantity, convertNumberToWords } from './printUtils';
import { formatDate as formatReportDate } from './dateUtils';

export interface PrintToPdfOptions {
  title: string;
  subtitle?: string;
  fileName?: string;
  htmlContent?: string;
  elementId?: string;
  element?: HTMLElement;
  settings?: any;
  orientation?: 'portrait' | 'landscape';
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Show a sleek non-intrusive bottom-right progress toast while generating PDF
 */
function showPdfToast(initialMessage = 'Generating PDF... Please wait') {
  const existing = document.getElementById('global-pdf-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'global-pdf-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.backgroundColor = '#0f172a';
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.4)';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '99999999';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  toast.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation:pdfSpin 0.8s linear infinite;"></span> <span>${initialMessage}</span>`;

  if (!document.getElementById('pdf-toast-style')) {
    const style = document.createElement('style');
    style.id = 'pdf-toast-style';
    style.textContent = `@keyframes pdfSpin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
  document.body.appendChild(toast);

  return {
    success: (msg = '✓ PDF saved offline successfully!') => {
      toast.style.backgroundColor = '#16a34a';
      toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
      setTimeout(() => {
        if (document.body.contains(toast)) toast.remove();
      }, 2500);
    },
    error: (msg = '✕ Failed to generate PDF') => {
      toast.style.backgroundColor = '#dc2626';
      toast.innerHTML = `<span>✕</span> <span>${msg}</span>`;
      setTimeout(() => {
        if (document.body.contains(toast)) toast.remove();
      }, 3500);
    }
  };
}

/**
 * Returns formal company header HTML conforming strictly to RULE[AGENTS_md]:
 * - Single top-right page numbering ONLY in the top header area.
 * - Never place duplicate "Page 1" above table headers or column headers.
 * - Formal company header with logo, uppercase name, address, contact info.
 */
export function getPdfHeaderHtml(settings: any = {}, title: string, subtitle?: string): string {
  const logoHtml = settings.companyLogo ? `
    <div style="width: 70px; height: 70px; margin-right: 18px; flex-shrink: 0;">
      <img src="${settings.companyLogo}" style="width: 100%; height: 100%; object-fit: contain;" />
    </div>
  ` : '';

  const companyName = (settings.companyName || 'SAPIENT ERP').toUpperCase();
  const address = settings.companyAddress || '';

  const contactItems: string[] = [];
  if (settings.showPrintPhone !== false && settings.printPhone) contactItems.push(`Tel: ${settings.printPhone}`);
  if (settings.showPrintEmail !== false && settings.printEmail) contactItems.push(`Email: ${settings.printEmail}`);
  if (settings.showPrintWebsite !== false && settings.printWebsite) contactItems.push(`Web: ${settings.printWebsite}`);

  return `
    <div style="position: relative; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px;">
      <!-- Single Page Number strictly at top-right corner as per persistent instructions -->
      <div style="position: absolute; top: 0; right: 0; font-size: 10px; font-weight: 700; color: #4b5563; font-family: monospace;">
        Page 1
      </div>

      <div style="display: flex; align-items: center; justify-content: center;">
        ${logoHtml}
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #000000; text-transform: uppercase;">
            ${companyName}
          </div>
          ${address ? `<div style="font-size: 10px; color: #374151; margin-top: 2px; white-space: pre-line;">${address}</div>` : ''}
          ${contactItems.length > 0 ? `<div style="font-size: 9px; color: #4b5563; margin-top: 2px;">${contactItems.join(' | ')}</div>` : ''}
          ${settings.showPrintHeader !== false && settings.printHeader ? `<div style="font-size: 10px; font-style: italic; color: #4b5563; margin-top: 3px;">${settings.printHeader}</div>` : ''}
          
          <div style="margin-top: 8px;">
            <span style="display: inline-block; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #111827; border-bottom: 1.5px solid #111827; padding-bottom: 1px;">
              ${title.toUpperCase()}
            </span>
          </div>
          ${subtitle ? `<div style="font-size: 10px; font-weight: 600; color: #4b5563; margin-top: 3px;">${subtitle}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns formal signatures section HTML
 */
export function getPdfSignaturesHtml(settings: any = {}): string {
  const alignment = settings.signatureAlignment || 'spread';
  const justifyMap: Record<string, string> = {
    spread: 'space-between',
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
  };

  const sig1 = settings.printSignature1 || 'Prepared By';
  const sig2 = settings.printSignature2 || 'Checked By';
  const sig3 = settings.printSignature3 || 'Authorised Signatory';

  return `
    <div style="display: flex; justify-content: ${justifyMap[alignment] || 'space-between'}; gap: 24px; margin-top: 48px; padding-top: 10px; page-break-inside: avoid;">
      ${settings.showSignature1 !== false ? `
        <div style="border-top: 1px solid #111827; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #111827;">
          ${sig1}
        </div>
      ` : ''}
      ${settings.showSignature2 !== false ? `
        <div style="border-top: 1px solid #111827; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #111827;">
          ${sig2}
        </div>
      ` : ''}
      ${settings.showSignature3 !== false ? `
        <div style="border-top: 1px solid #111827; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #111827;">
          ${sig3}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Returns formal footer section HTML
 */
export function getPdfFooterHtml(settings: any = {}): string {
  const footerText = settings.showPrintFooter !== false ? (settings.printFooter || 'This is a computer generated document.') : '';
  const devText = settings.showDeveloperContact !== false ? (settings.developerContactText || 'Powered by TallyFlow ERP') : '';

  return `
    <div style="margin-top: 24px; border-top: 1px solid #d1d5db; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #6b7280; page-break-inside: avoid;">
      <div>${footerText}</div>
      <div>Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      ${devText ? `<div>${devText}</div>` : ''}
    </div>
  `;
}

/**
 * Master PDF Export Engine:
 * Takes complete HTML content or DOM element, renders in standard A4 portrait or landscape,
 * and saves as an offline professional PDF.
 */
export async function printToPDF(options: PrintToPdfOptions): Promise<void> {
  const {
    title,
    subtitle,
    fileName = `${title.toLowerCase().replace(/[\s&/]+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    htmlContent,
    elementId,
    element,
    settings = {},
    orientation = 'portrait',
    onStart,
    onSuccess,
    onError
  } = options;

  const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const toast = showPdfToast(`Generating ${title} PDF...`);
  if (onStart) onStart();

  try {
    let finalHtml = '';

    if (htmlContent) {
      finalHtml = htmlContent;
    } else {
      let targetElement: HTMLElement | null = element || null;
      if (!targetElement && elementId) {
        targetElement = document.getElementById(elementId);
      }

      if (!targetElement) {
        throw new Error(`Target element ${elementId || ''} not found for PDF generation.`);
      }

      // Clone element and clean up non-printable elements
      const clone = targetElement.cloneNode(true) as HTMLElement;

      // Remove buttons, inputs, icons, dropdowns, and interactive controls
      const removeSelectors = [
        'button',
        'input',
        'select',
        'textarea',
        '[data-non-printable]',
        '.no-print',
        '.non-printable',
        '[title="Actions"]',
        '[title*="Right-click"]',
        '[id$="-btn"]'
      ];
      removeSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      // Wrap inside formal company report template
      finalHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: 'JetBrains Mono', Courier, monospace;
                color: #000000;
                background-color: #ffffff;
                margin: 0;
                padding: 16px;
                font-size: 10px;
                line-height: 1.4;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
              }
              th, td {
                border: 1px solid #111827;
                padding: 5px 7px;
                font-size: 9.5px;
                vertical-align: middle;
              }
              th {
                background-color: #f3f4f6;
                font-weight: 700;
                text-transform: uppercase;
                color: #111827;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: 700; }
              .grand-total {
                border-top: 2px solid #000000;
                border-bottom: 3px double #000000;
                font-weight: 800;
                background-color: #f9fafb;
              }
            </style>
          </head>
          <body>
            ${getPdfHeaderHtml(settings, title, subtitle)}
            <div class="report-body">
              ${clone.innerHTML}
            </div>
            ${getPdfSignaturesHtml(settings)}
            ${getPdfFooterHtml(settings)}
          </body>
        </html>
      `;
    }

    // Direct high-fidelity iframe + html2canvas + jsPDF engine
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = orientation === 'landscape' ? '1123px' : '794px';
    iframe.style.height = '1200px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Could not access iframe document');

    iframeDoc.open();
    iframeDoc.write(finalHtml);
    iframeDoc.close();

    // Wait briefly for layout, fonts, and images to settle
    await new Promise(r => setTimeout(r, 350));

    const html2canvasModule: any = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(cleanFileName);
    iframe.remove();

    toast.success(`${title} saved as PDF!`);
    if (onSuccess) onSuccess();
  } catch (err: any) {
    console.error('Print to PDF error:', err);
    toast.error('Failed to save PDF');
    if (onError) onError(err);
  }
}

/**
 * 1. Balance Sheet: Professional Two-Column Financial Statement PDF
 */
export async function printBalanceSheetToPDF(
  data: {
    liabilityGroups: any[];
    assetGroups: any[];
    totalLiabilities: number;
    totalAssets: number;
    openingBalanceDiff?: number;
    asOnDate: string;
  },
  settings: any = {}
): Promise<void> {
  const { liabilityGroups, assetGroups, totalLiabilities, totalAssets, openingBalanceDiff = 0, asOnDate } = data;
  const absLiabilities = Math.abs(totalLiabilities) + (openingBalanceDiff < 0 ? Math.abs(openingBalanceDiff) : 0);
  const finalGrandTotal = Math.max(Math.abs(totalAssets), absLiabilities);

  const liabilitiesHtml = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; width: 65%; border: 1px solid #111; background-color: #f3f4f6; padding: 6px 8px;">LIABILITIES</th>
          <th style="text-align: right; width: 35%; border: 1px solid #111; background-color: #f3f4f6; padding: 6px 8px;">AMOUNT (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${liabilityGroups.map(group => `
          <tr style="font-weight: 700;">
            <td style="border: 1px solid #111; padding: 5px 8px; text-transform: uppercase;">${group.name}</td>
            <td style="border: 1px solid #111; padding: 5px 8px; text-align: right;">${formatPrintedAmount(Math.abs(group.total))}</td>
          </tr>
          ${(group.subItems || []).map((sub: any) => `
            <tr style="color: #374151;">
              <td style="border: 1px solid #e5e7eb; padding: 3px 8px 3px 20px; font-size: 8.5px;">• ${sub.name}</td>
              <td style="border: 1px solid #e5e7eb; padding: 3px 8px; text-align: right; font-size: 8.5px;">${formatPrintedAmount(Math.abs(sub.balance))}</td>
            </tr>
          `).join('')}
        `).join('')}
        ${openingBalanceDiff < 0 ? `
          <tr style="color: #dc2626; font-style: italic;">
            <td style="border: 1px solid #111; padding: 5px 8px;">Difference in opening balances</td>
            <td style="border: 1px solid #111; padding: 5px 8px; text-align: right;">${formatPrintedAmount(Math.abs(openingBalanceDiff))}</td>
          </tr>
        ` : ''}
      </tbody>
      <tfoot>
        <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
          <td style="border: 1px solid #111; padding: 7px 8px; text-transform: uppercase;">TOTAL LIABILITIES</td>
          <td style="border: 1px solid #111; padding: 7px 8px; text-align: right;">৳ ${formatPrintedAmount(finalGrandTotal)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  const assetsHtml = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; width: 65%; border: 1px solid #111; background-color: #f3f4f6; padding: 6px 8px;">ASSETS</th>
          <th style="text-align: right; width: 35%; border: 1px solid #111; background-color: #f3f4f6; padding: 6px 8px;">AMOUNT (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${assetGroups.map(group => `
          <tr style="font-weight: 700;">
            <td style="border: 1px solid #111; padding: 5px 8px; text-transform: uppercase;">${group.name}</td>
            <td style="border: 1px solid #111; padding: 5px 8px; text-align: right;">${formatPrintedAmount(Math.abs(group.total))}</td>
          </tr>
          ${(group.subItems || []).map((sub: any) => `
            <tr style="color: #374151;">
              <td style="border: 1px solid #e5e7eb; padding: 3px 8px 3px 20px; font-size: 8.5px;">• ${sub.name}</td>
              <td style="border: 1px solid #e5e7eb; padding: 3px 8px; text-align: right; font-size: 8.5px;">${formatPrintedAmount(Math.abs(sub.balance))}</td>
            </tr>
          `).join('')}
        `).join('')}
        ${openingBalanceDiff > 0 ? `
          <tr style="color: #dc2626; font-style: italic;">
            <td style="border: 1px solid #111; padding: 5px 8px;">Difference in opening balances</td>
            <td style="border: 1px solid #111; padding: 5px 8px; text-align: right;">${formatPrintedAmount(Math.abs(openingBalanceDiff))}</td>
          </tr>
        ` : ''}
      </tbody>
      <tfoot>
        <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
          <td style="border: 1px solid #111; padding: 7px 8px; text-transform: uppercase;">TOTAL ASSETS</td>
          <td style="border: 1px solid #111; padding: 7px 8px; text-align: right;">৳ ${formatPrintedAmount(finalGrandTotal)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Balance Sheet</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', Courier, monospace; color: #000; padding: 16px; margin: 0; }
        </style>
      </head>
      <body>
        ${getPdfHeaderHtml(settings, 'BALANCE SHEET', `As on ${formatReportDate(asOnDate, settings.dateFormat)}`)}
        
        <div style="display: flex; gap: 12px; width: 100%;">
          <div style="flex: 1;">${liabilitiesHtml}</div>
          <div style="flex: 1;">${assetsHtml}</div>
        </div>

        ${getPdfSignaturesHtml(settings)}
        ${getPdfFooterHtml(settings)}
      </body>
    </html>
  `;

  return printToPDF({
    title: 'Balance Sheet',
    subtitle: `As on ${formatReportDate(asOnDate, settings.dateFormat)}`,
    fileName: `Balance_Sheet_${asOnDate}`,
    htmlContent: contentHtml,
    settings
  });
}

/**
 * 2. Profit & Loss: Professional Trading & P&L Statement PDF
 */
export async function printProfitAndLossToPDF(
  data: {
    tradingData: any;
    plData: any;
    startDate: string;
    endDate: string;
  },
  settings: any = {}
): Promise<void> {
  const { tradingData, plData, startDate, endDate } = data;

  const totalPurchases = (tradingData.purchaseGroups || []).reduce((s: number, g: any) => s + g.balance, 0);
  const totalDirectExp = (tradingData.directExpenseGroups || []).reduce((s: number, g: any) => s + g.balance, 0);
  const totalSales = (tradingData.salesGroups || []).reduce((s: number, g: any) => s + Math.abs(g.balance), 0);
  const totalIndirectExp = (plData.indirectExpenseGroups || []).reduce((s: number, g: any) => s + g.balance, 0);
  const totalIndirectInc = (plData.indirectIncomeGroups || []).reduce((s: number, g: any) => s + Math.abs(g.balance), 0);

  const debitTotal = (tradingData.openingStock || 0) + totalPurchases + totalDirectExp + totalIndirectExp;
  const creditTotal = totalSales + (tradingData.closingStock || 0) + totalIndirectInc;
  const netProfit = creditTotal - debitTotal;
  const grandTotal = Math.max(debitTotal + (netProfit > 0 ? netProfit : 0), creditTotal + (netProfit < 0 ? Math.abs(netProfit) : 0));

  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Profit & Loss Account</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', Courier, monospace; color: #000; padding: 16px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { border: 1px solid #111; padding: 5px 8px; font-size: 9.5px; vertical-align: middle; }
          th { background-color: #f3f4f6; text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPdfHeaderHtml(settings, 'PROFIT & LOSS A/C', `For the Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`)}
        
        <div style="display: flex; gap: 12px; width: 100%;">
          <!-- Dr Side: Expenses -->
          <div style="flex: 1;">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left; width: 65%;">PARTICULARS (EXPENSES)</th>
                  <th style="text-align: right; width: 35%;">AMOUNT (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Opening Stock</td>
                  <td style="text-align: right;">${formatPrintedAmount(tradingData.openingStock || 0)}</td>
                </tr>
                ${(tradingData.purchaseGroups || []).map((g: any) => `
                  <tr>
                    <td>${g.name}</td>
                    <td style="text-align: right;">${formatPrintedAmount(Math.abs(g.balance))}</td>
                  </tr>
                `).join('')}
                ${(tradingData.directExpenseGroups || []).map((g: any) => `
                  <tr>
                    <td>${g.name}</td>
                    <td style="text-align: right;">${formatPrintedAmount(Math.abs(g.balance))}</td>
                  </tr>
                `).join('')}
                ${(plData.indirectExpenseGroups || []).map((g: any) => `
                  <tr>
                    <td>${g.name}</td>
                    <td style="text-align: right;">${formatPrintedAmount(Math.abs(g.balance))}</td>
                  </tr>
                `).join('')}
                ${netProfit > 0 ? `
                  <tr style="font-weight: 700; color: #16a34a; background-color: #f0fdf4;">
                    <td>Nett Profit (Transferred to Capital)</td>
                    <td style="text-align: right;">${formatPrintedAmount(netProfit)}</td>
                  </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
                  <td>TOTAL</td>
                  <td style="text-align: right;">৳ ${formatPrintedAmount(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Cr Side: Incomes -->
          <div style="flex: 1;">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left; width: 65%;">PARTICULARS (INCOMES)</th>
                  <th style="text-align: right; width: 35%;">AMOUNT (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${(tradingData.salesGroups || []).map((g: any) => `
                  <tr>
                    <td>${g.name}</td>
                    <td style="text-align: right;">${formatPrintedAmount(Math.abs(g.balance))}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td>Closing Stock</td>
                  <td style="text-align: right;">${formatPrintedAmount(tradingData.closingStock || 0)}</td>
                </tr>
                ${(plData.indirectIncomeGroups || []).map((g: any) => `
                  <tr>
                    <td>${g.name}</td>
                    <td style="text-align: right;">${formatPrintedAmount(Math.abs(g.balance))}</td>
                  </tr>
                `).join('')}
                ${netProfit < 0 ? `
                  <tr style="font-weight: 700; color: #dc2626; background-color: #fef2f2;">
                    <td>Nett Loss (Transferred to Capital)</td>
                    <td style="text-align: right;">${formatPrintedAmount(Math.abs(netProfit))}</td>
                  </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
                  <td>TOTAL</td>
                  <td style="text-align: right;">৳ ${formatPrintedAmount(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        ${getPdfSignaturesHtml(settings)}
        ${getPdfFooterHtml(settings)}
      </body>
    </html>
  `;

  return printToPDF({
    title: 'Profit & Loss Account',
    subtitle: `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`,
    fileName: `Profit_And_Loss_${startDate}_to_${endDate}`,
    htmlContent: contentHtml,
    settings
  });
}

/**
 * 3. Daybook: Professional Daily Journal / Transaction Statement PDF
 */
export async function printDaybookToPDF(
  vouchers: any[],
  settings: any = {},
  startDate: string,
  endDate: string,
  getLedgerNameFn?: (v: any) => string
): Promise<void> {
  const totalDebit = vouchers.reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0);

  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Daybook</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', Courier, monospace; color: #000; padding: 16px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #111; padding: 5px 8px; font-size: 9.5px; vertical-align: middle; }
          th { background-color: #f3f4f6; text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPdfHeaderHtml(settings, 'DAYBOOK', `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`)}
        
        <table>
          <thead>
            <tr>
              <th style="width: 14%; text-align: left;">DATE</th>
              <th style="width: 44%; text-align: left;">PARTICULARS</th>
              <th style="width: 14%; text-align: left;">VCH TYPE</th>
              <th style="width: 12%; text-align: left;">VCH NO</th>
              <th style="width: 16%; text-align: right;">AMOUNT (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${vouchers.map(v => {
              const pName = getLedgerNameFn ? getLedgerNameFn(v) : (v.party_ledger_name || v.ledger_name || 'General');
              return `
                <tr>
                  <td>${formatReportDate(v.v_date, settings.dateFormat)}</td>
                  <td>
                    <strong>${pName}</strong>
                    ${v.narration ? `<div style="font-size: 8px; color: #4b5563; font-style: italic; margin-top: 1px;">(${v.narration})</div>` : ''}
                  </td>
                  <td style="text-transform: uppercase;">${v.v_type}</td>
                  <td>${v.v_no}</td>
                  <td style="text-align: right; font-weight: 700;">${formatPrintedAmount(v.total_amount)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
              <td colspan="4" style="text-align: right; text-transform: uppercase;">TOTAL:</td>
              <td style="text-align: right;">৳ ${formatPrintedAmount(totalDebit)}</td>
            </tr>
          </tfoot>
        </table>

        ${getPdfSignaturesHtml(settings)}
        ${getPdfFooterHtml(settings)}
      </body>
    </html>
  `;

  return printToPDF({
    title: 'Daybook',
    subtitle: `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`,
    fileName: `Daybook_${startDate}_to_${endDate}`,
    htmlContent: contentHtml,
    settings
  });
}

/**
 * 4. Voucher: Professional Offline Invoice / Voucher PDF
 */
export async function printVoucherToPDF(voucher: any, settings: any = {}): Promise<void> {
  const isInventory = (voucher.inventory && voucher.inventory.length > 0);
  const amountInWords = convertNumberToWords(voucher.total_amount || 0);

  const tableRowsHtml = isInventory ? `
    <thead>
      <tr>
        <th style="width: 5%; text-align: center;">SL</th>
        <th style="width: 45%; text-align: left;">ITEM DESCRIPTION</th>
        <th style="width: 15%; text-align: right;">QUANTITY</th>
        <th style="width: 15%; text-align: right;">RATE (৳)</th>
        <th style="width: 20%; text-align: right;">AMOUNT (৳)</th>
      </tr>
    </thead>
    <tbody>
      ${voucher.inventory.map((item: any, idx: number) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>
            <strong>${item.item_name}</strong>
            ${item.godown_name ? `<div style="font-size: 8px; color: #555;">Location: ${item.godown_name}</div>` : ''}
          </td>
          <td style="text-align: right;">${formatPrintedQuantity(item.qty, item.unit)} ${item.unit || ''}</td>
          <td style="text-align: right;">${formatPrintedAmount(item.rate)}</td>
          <td style="text-align: right; font-weight: 700;">${formatPrintedAmount(item.qty * item.rate)}</td>
        </tr>
      `).join('')}
    </tbody>
  ` : `
    <thead>
      <tr>
        <th style="width: 50%; text-align: left;">PARTICULARS</th>
        <th style="width: 25%; text-align: right;">DEBIT (৳)</th>
        <th style="width: 25%; text-align: right;">CREDIT (৳)</th>
      </tr>
    </thead>
    <tbody>
      ${(voucher.entries || []).map((e: any) => `
        <tr>
          <td>
            <strong>${e.ledger_name}</strong>
            ${e.narration ? `<div style="font-size: 8px; color: #555; font-style: italic;">(${e.narration})</div>` : ''}
          </td>
          <td style="text-align: right;">${e.debit > 0 ? formatPrintedAmount(e.debit) : ''}</td>
          <td style="text-align: right;">${e.credit > 0 ? formatPrintedAmount(e.credit) : ''}</td>
        </tr>
      `).join('')}
    </tbody>
  `;

  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${voucher.v_type} Voucher ${voucher.v_no}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', Courier, monospace; color: #000; padding: 16px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #111; padding: 6px 8px; font-size: 9.5px; vertical-align: middle; }
          th { background-color: #f3f4f6; text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPdfHeaderHtml(settings, `${voucher.v_type} VOUCHER`, `No: ${voucher.v_no} | Date: ${formatReportDate(voucher.v_date, settings.dateFormat)}`)}
        
        <!-- Metadata & Party Box -->
        <div style="display: flex; justify-content: space-between; border: 1px solid #111; padding: 8px 12px; margin-bottom: 12px; background-color: #fafafa;">
          <div>
            <div style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Party Details</div>
            <div style="font-size: 12px; font-weight: 700;">${voucher.party_ledger_name || voucher.ledger_name || 'Cash in Hand'}</div>
            ${voucher.party_address ? `<div style="font-size: 9px; color: #374151; margin-top: 2px;">${voucher.party_address}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9px;"><strong>Voucher No:</strong> ${voucher.v_no}</div>
            <div style="font-size: 9px;"><strong>Date:</strong> ${formatReportDate(voucher.v_date, settings.dateFormat)}</div>
            ${voucher.ref_no ? `<div style="font-size: 9px;"><strong>Ref No:</strong> ${voucher.ref_no}</div>` : ''}
          </div>
        </div>

        <table>
          ${tableRowsHtml}
          <tfoot>
            <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
              <td colspan="${isInventory ? 4 : 2}" style="text-align: right; text-transform: uppercase;">GRAND TOTAL:</td>
              <td style="text-align: right;">৳ ${formatPrintedAmount(voucher.total_amount)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount in Words -->
        <div style="border: 1px solid #e5e7eb; padding: 6px 10px; margin-bottom: 12px; font-size: 9.5px; background-color: #f9fafb;">
          <strong>Amount (in words):</strong> ${amountInWords}
        </div>

        ${voucher.narration ? `
          <div style="border: 1px solid #e5e7eb; padding: 6px 10px; margin-bottom: 12px; font-size: 9px; font-style: italic;">
            <strong>Narration / Remarks:</strong> ${voucher.narration}
          </div>
        ` : ''}

        ${getPdfSignaturesHtml(settings)}
        ${getPdfFooterHtml(settings)}
      </body>
    </html>
  `;

  return printToPDF({
    title: `${voucher.v_type} Voucher`,
    subtitle: `No: ${voucher.v_no}`,
    fileName: `Voucher_${voucher.v_type}_${voucher.v_no}`,
    htmlContent: contentHtml,
    settings
  });
}

/**
 * 5. Ledger Statement: Professional Account Statement PDF
 */
export async function printLedgerStatementToPDF(
  ledger: any,
  entries: any[],
  settings: any = {},
  startDate: string,
  endDate: string
): Promise<void> {
  const openingBalance = Number(ledger?.opening_balance || 0);
  let runningBal = openingBalance;

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = entries.map(e => {
    const dr = Number(e.debit || 0);
    const cr = Number(e.credit || 0);
    totalDebit += dr;
    totalCredit += cr;
    runningBal += (dr - cr);

    return `
      <tr>
        <td>${formatReportDate(e.vouchers?.v_date, settings.dateFormat)}</td>
        <td>
          <strong>${e.particulars}</strong>
          ${e.narration ? `<div style="font-size: 8px; color: #555; font-style: italic;">(${e.narration})</div>` : ''}
        </td>
        <td style="text-transform: uppercase;">${e.vouchers?.v_type || ''}</td>
        <td>${e.vouchers?.v_no || ''}</td>
        <td style="text-align: right;">${dr > 0 ? formatPrintedAmount(dr) : ''}</td>
        <td style="text-align: right;">${cr > 0 ? formatPrintedAmount(cr) : ''}</td>
        <td style="text-align: right; font-weight: 700;">${formatPrintedAmount(Math.abs(runningBal))} ${runningBal >= 0 ? 'Dr' : 'Cr'}</td>
      </tr>
    `;
  }).join('');

  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ledger Statement: ${ledger?.name}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', Courier, monospace; color: #000; padding: 16px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #111; padding: 5px 7px; font-size: 9px; vertical-align: middle; }
          th { background-color: #f3f4f6; text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPdfHeaderHtml(settings, `LEDGER STATEMENT: ${(ledger?.name || '').toUpperCase()}`, `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`)}
        
        <table>
          <thead>
            <tr>
              <th style="width: 12%; text-align: left;">DATE</th>
              <th style="width: 38%; text-align: left;">PARTICULARS</th>
              <th style="width: 12%; text-align: left;">VCH TYPE</th>
              <th style="width: 10%; text-align: left;">VCH NO</th>
              <th style="width: 14%; text-align: right;">DEBIT (৳)</th>
              <th style="width: 14%; text-align: right;">CREDIT (৳)</th>
              <th style="width: 16%; text-align: right;">BALANCE (৳)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #f9fafb; font-weight: 700;">
              <td>${formatReportDate(startDate, settings.dateFormat)}</td>
              <td colspan="5">Opening Balance</td>
              <td style="text-align: right;">${formatPrintedAmount(Math.abs(openingBalance))} ${openingBalance >= 0 ? 'Dr' : 'Cr'}</td>
            </tr>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="font-weight: 800; border-top: 2px solid #000; background-color: #f9fafb;">
              <td colspan="4" style="text-align: right; text-transform: uppercase;">PERIOD TOTALS:</td>
              <td style="text-align: right;">৳ ${formatPrintedAmount(totalDebit)}</td>
              <td style="text-align: right;">৳ ${formatPrintedAmount(totalCredit)}</td>
              <td></td>
            </tr>
            <tr style="font-weight: 800; border-bottom: 3px double #000; background-color: #f3f4f6;">
              <td colspan="4" style="text-align: right; text-transform: uppercase;">CLOSING BALANCE:</td>
              <td colspan="3" style="text-align: right;">৳ ${formatPrintedAmount(Math.abs(runningBal))} ${runningBal >= 0 ? 'Dr' : 'Cr'}</td>
            </tr>
          </tfoot>
        </table>

        ${getPdfSignaturesHtml(settings)}
        ${getPdfFooterHtml(settings)}
      </body>
    </html>
  `;

  return printToPDF({
    title: `Ledger Statement: ${ledger?.name}`,
    subtitle: `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`,
    fileName: `Ledger_${(ledger?.name || 'statement').replace(/\s+/g, '_')}_${startDate}_to_${endDate}`,
    htmlContent: contentHtml,
    settings
  });
}

/**
 * 6. Trial Balance: Professional Trial Balance PDF
 */
export async function printTrialBalanceToPDF(
  ledgers: any[],
  settings: any = {},
  asOnDate?: string
): Promise<void> {
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = ledgers.map(l => {
    const bal = Number(l.current_balance ?? l.closingBalance ?? 0);
    const dr = bal > 0 ? bal : 0;
    const cr = bal < 0 ? Math.abs(bal) : 0;
    totalDebit += dr;
    totalCredit += cr;

    return `
      <tr>
        <td><strong>${l.name}</strong></td>
        <td>${l.ledger_groups?.name || l.group_name || ''}</td>
        <td style="text-align: right;">${dr > 0 ? formatPrintedAmount(dr) : ''}</td>
        <td style="text-align: right;">${cr > 0 ? formatPrintedAmount(cr) : ''}</td>
      </tr>
    `;
  }).join('');

  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Trial Balance</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', Courier, monospace; color: #000; padding: 16px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #111; padding: 5px 8px; font-size: 9.5px; vertical-align: middle; }
          th { background-color: #f3f4f6; text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPdfHeaderHtml(settings, 'TRIAL BALANCE', asOnDate ? `As on ${formatReportDate(asOnDate, settings.dateFormat)}` : undefined)}
        
        <table>
          <thead>
            <tr>
              <th style="width: 45%; text-align: left;">PARTICULARS</th>
              <th style="width: 25%; text-align: left;">GROUP</th>
              <th style="width: 15%; text-align: right;">DEBIT (৳)</th>
              <th style="width: 15%; text-align: right;">CREDIT (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #f9fafb;">
              <td colspan="2" style="text-align: right; text-transform: uppercase;">TOTAL:</td>
              <td style="text-align: right;">৳ ${formatPrintedAmount(totalDebit)}</td>
              <td style="text-align: right;">৳ ${formatPrintedAmount(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>

        ${getPdfSignaturesHtml(settings)}
        ${getPdfFooterHtml(settings)}
      </body>
    </html>
  `;

  return printToPDF({
    title: 'Trial Balance',
    subtitle: asOnDate ? `As on ${formatReportDate(asOnDate, settings.dateFormat)}` : undefined,
    fileName: `Trial_Balance_${asOnDate || new Date().toISOString().split('T')[0]}`,
    htmlContent: contentHtml,
    settings
  });
}

/**
 * 7. Universal Page PDF: Captures the active main content container of EVERY page in the application.
 */
export async function printCurrentPageToPDF(settings: any = {}): Promise<void> {
  // Strategy: Find candidate report or main scrollable container
  const candidates = [
    '#balance-sheet-report',
    '#pl-report',
    '#daybook-report',
    '#ledger-statement-report',
    '#trial-balance-report',
    '#voucher-print-area',
    '#register-report',
    'main [data-report-container]',
    'main .overflow-y-auto',
    'main'
  ];

  let targetEl: HTMLElement | null = null;
  for (const selector of candidates) {
    const el = document.querySelector(selector) as HTMLElement;
    if (el && el.offsetHeight > 100) {
      targetEl = el;
      break;
    }
  }

  if (!targetEl) {
    targetEl = document.querySelector('main') as HTMLElement || document.body;
  }

  // Derive a neat page title from document or top header
  const titleEl = document.querySelector('header h2') || document.querySelector('h1') || document.querySelector('h2');
  const pageTitle = titleEl ? titleEl.textContent?.trim() || 'Report' : 'Financial Statement';

  return printToPDF({
    title: pageTitle,
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    fileName: `${pageTitle.toLowerCase().replace(/[\s&/]+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    element: targetEl,
    settings
  });
}

export const pdfExportService = {
  printToPDF,
  printBalanceSheetToPDF,
  printProfitAndLossToPDF,
  printDaybookToPDF,
  printVoucherToPDF,
  printLedgerStatementToPDF,
  printTrialBalanceToPDF,
  printCurrentPageToPDF,
  getPdfHeaderHtml,
  getPdfSignaturesHtml,
  getPdfFooterHtml
};
