import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DEFAULT_APP_BRANDING,
  resolveCompanyLegalIdentity,
} from '../constants/appIdentity';

/**
 * Prevents spreadsheet formula injection (=, +, -, @, tab, CR) on string cells
 * while preserving genuine JavaScript numbers as numeric Excel values.
 */
export function sanitizeSpreadsheetCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'boolean') return value;
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function computeColumnWidths(aoa: Array<Array<string | number | boolean>>): Array<{ wch: number }> {
  const maxCols = aoa.reduce((max, row) => Math.max(max, row.length), 0);
  const widths: Array<{ wch: number }> = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLen = 10;
    for (let r = 0; r < aoa.length; r++) {
      // Skip company/title banner rows (rows 0..4) when sizing table columns
      if (r < 4 && aoa[r].length <= 1) continue;
      const cell = aoa[r][c];
      if (cell !== undefined && cell !== null) {
        const len = String(cell).length;
        if (len > maxLen) maxLen = len;
      }
    }
    widths.push({ wch: Math.min(Math.max(maxLen + 3, 12), 46) });
  }
  return widths;
}

export interface StructuredExcelOptions {
  fileName: string;
  sheetName?: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Array<any[] | Record<string, any>>;
  settings?: any;
  company?: any;
  footerRow?: any[] | Record<string, any>;
  extraRows?: Array<any[] | Record<string, any>>;
}

export function exportStructuredExcel(options: StructuredExcelOptions): void {
  const {
    fileName,
    sheetName = 'Report',
    title,
    subtitle,
    headers,
    rows,
    settings = {},
    company = null,
    footerRow,
    extraRows = [],
  } = options;

  const legal = resolveCompanyLegalIdentity(settings, company);
  const aoa: Array<Array<string | number | boolean>> = [];

  if (legal.companyName) {
    aoa.push([sanitizeSpreadsheetCell(legal.companyName.toUpperCase())]);
  }
  if (legal.companyAddress) {
    aoa.push([sanitizeSpreadsheetCell(legal.companyAddress.replace(/\n+/g, ', '))]);
  }
  const contactParts: string[] = [];
  if (settings?.showPrintPhone !== false && legal.printPhone) contactParts.push(`Phone: ${legal.printPhone}`);
  if (settings?.showPrintEmail !== false && legal.printEmail) contactParts.push(`Email: ${legal.printEmail}`);
  if (settings?.showPrintWebsite !== false && legal.printWebsite) contactParts.push(`Web: ${legal.printWebsite}`);
  if (legal.vatBinTin) contactParts.push(`VAT/BIN/TIN: ${legal.vatBinTin}`);
  if (contactParts.length > 0) {
    aoa.push([sanitizeSpreadsheetCell(contactParts.join(' | '))]);
  }
  if (settings?.showPrintHeader !== false && legal.printHeader) {
    aoa.push([sanitizeSpreadsheetCell(legal.printHeader)]);
  }

  aoa.push([sanitizeSpreadsheetCell(title.toUpperCase())]);
  if (subtitle) {
    aoa.push([sanitizeSpreadsheetCell(subtitle)]);
  }
  aoa.push([sanitizeSpreadsheetCell(`Generated on: ${new Date().toLocaleString()}`)]);
  aoa.push([]);

  aoa.push(headers.map((h) => sanitizeSpreadsheetCell(h)));

  const mapRowToAoa = (row: any[] | Record<string, any>) => {
    if (Array.isArray(row)) {
      return row.map((cell) => sanitizeSpreadsheetCell(cell));
    }
    return headers.map((header) => {
      if (Object.prototype.hasOwnProperty.call(row, header)) {
        return sanitizeSpreadsheetCell(row[header]);
      }
      const normalizedKey = header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const simpleKey = header.toLowerCase().replace(/ /g, '_');
      if (Object.prototype.hasOwnProperty.call(row, simpleKey)) {
        return sanitizeSpreadsheetCell(row[simpleKey]);
      }
      if (Object.prototype.hasOwnProperty.call(row, normalizedKey)) {
        return sanitizeSpreadsheetCell(row[normalizedKey]);
      }
      return '';
    });
  };

  for (const row of rows) {
    aoa.push(mapRowToAoa(row));
  }

  if (footerRow && (Array.isArray(footerRow) ? footerRow.length > 0 : Object.keys(footerRow).length > 0)) {
    aoa.push(mapRowToAoa(footerRow));
  }

  for (const extra of extraRows) {
    aoa.push(mapRowToAoa(extra));
  }

  const footerText = settings?.showPrintFooter !== false ? (legal.printFooter || settings?.printFooter || '') : '';
  const softwareFooter =
    settings?.showDeveloperContact !== false
      ? settings?.appIdentity?.softwareFooterText ||
        settings?.developerContactText ||
        DEFAULT_APP_BRANDING.softwareFooterText
      : '';

  if (footerText || softwareFooter) {
    aoa.push([]);
    if (footerText) aoa.push([sanitizeSpreadsheetCell(footerText)]);
    if (softwareFooter) aoa.push([sanitizeSpreadsheetCell(softwareFooter)]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = computeColumnWidths(aoa);

  const safeSheetName = sheetName.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Report';
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const cleanFileName = fileName.replace(/\.xlsx$/i, '');
  XLSX.writeFile(wb, `${cleanFileName}.xlsx`);
}

export interface EmailReportOptions {
  title: string;
  subtitle?: string;
  summaryLines: string[];
  settings?: any;
  company?: any;
  recipientEmail?: string;
}

export function shareReportViaEmail(options: EmailReportOptions): void {
  const {
    title,
    subtitle,
    summaryLines,
    settings = {},
    company = null,
    recipientEmail = '',
  } = options;

  const legal = resolveCompanyLegalIdentity(settings, company);
  const companyLabel = legal.companyName || 'ERP Report';
  const subject = `${companyLabel} - ${title}${subtitle ? ` (${subtitle})` : ''}`;

  const bodyLines: string[] = [
    companyLabel,
    legal.companyAddress ? legal.companyAddress.replace(/\n+/g, ', ') : '',
    '',
    title.toUpperCase(),
    subtitle ? `Period / Scope: ${subtitle}` : '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    ...summaryLines,
    '',
    legal.printFooter || settings?.printFooter || '',
  ].filter((line, idx, arr) => {
    if (line !== '') return true;
    return idx > 0 && arr[idx - 1] !== '';
  });

  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  window.location.href = mailtoUrl;
}

export const exportService = {
  sanitizeSpreadsheetCell,
  exportStructuredExcel,
  shareReportViaEmail,

  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
    const safeRows = (data || []).map((row) => {
      if (!row || typeof row !== 'object') return row;
      const sanitized: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        sanitized[k] = sanitizeSpreadsheetCell(v);
      });
      return sanitized;
    });
    const ws = XLSX.utils.json_to_sheet(safeRows);
    const keys = safeRows.length > 0 ? Object.keys(safeRows[0]) : [];
    if (keys.length > 0) {
      ws['!cols'] = keys.map((k) => {
        let maxLen = k.length;
        for (const r of safeRows) {
          const valLen = r[k] !== undefined && r[k] !== null ? String(r[k]).length : 0;
          if (valLen > maxLen) maxLen = valLen;
        }
        return { wch: Math.min(Math.max(maxLen + 3, 12), 46) };
      });
    }
    const safeSheetName = sheetName.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Sheet1';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    const cleanFileName = fileName.replace(/\.xlsx$/i, '');
    XLSX.writeFile(wb, `${cleanFileName}.xlsx`);
  },

  exportToPDF(headers: string[][], body: any[][], fileName: string, title: string, settings: any = {}, company: any = null) {
    const doc = new jsPDF();
    const legal = resolveCompanyLegalIdentity(settings, company);

    let currentY = 15;
    if (legal.companyName) {
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(legal.companyName, 105, currentY, { align: 'center' });
      currentY += 7;
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const address = legal.companyAddress || '';
    if (address) {
      const addressLines = doc.splitTextToSize(address, 180);
      doc.text(addressLines, 105, currentY, { align: 'center' });
      currentY += addressLines.length * 5;
    }

    const contactInfo: string[] = [];
    if (settings.showPrintPhone !== false && legal.printPhone) contactInfo.push(`Phone: ${legal.printPhone}`);
    if (settings.showPrintEmail !== false && legal.printEmail) contactInfo.push(`Email: ${legal.printEmail}`);
    if (settings.showPrintWebsite !== false && legal.printWebsite) contactInfo.push(`Web: ${legal.printWebsite}`);
    if (legal.vatBinTin) contactInfo.push(`VAT/BIN/TIN: ${legal.vatBinTin}`);

    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), 105, currentY, { align: 'center' });
      currentY += 7;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), 105, currentY + 5, { align: 'center' });

    autoTable(doc, {
      startY: currentY + 15,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], fontSize: 9, valign: 'middle' },
      bodyStyles: { fontSize: 8, valign: 'middle' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
      didDrawPage: (data) => {
        const str = `Page ${doc.getNumberOfPages()}`;
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
        doc.text(`Printed on: ${new Date().toLocaleString()}`, pageSize.width - data.settings.margin.right, pageHeight - 10, { align: 'right' });
      },
    });

    const cleanFileName = fileName.replace(/\.pdf$/i, '');
    doc.save(`${cleanFileName}.pdf`);
  },
};
