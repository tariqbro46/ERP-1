import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, FileSpreadsheet, ArrowRight, MessageCircle, Mail, Settings as SettingsIcon, ArrowLeft, Eye, MoreVertical, ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatNumber, formatQuantity, formatVoucherNo, parseEntryDate } from '../lib/utils';
import { erpService } from '../services/erpService';
import { pdfService } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { executePrint } from '../utils/printUtils';
import { printToPDF } from '../utils/pdfExportService';
import { exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import {
  DEFAULT_APP_BRANDING,
  escapeHtml,
  resolveCompanyLegalIdentity,
  sanitizeAssetUrl
} from '../constants/appIdentity';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
import { ReportConfigModal } from './ReportConfigModal';
import { ReportConfig } from '../types';
import { VoucherContextMenu } from './TableContextMenu';

const DEFAULT_CONFIG: ReportConfig = {
  showNarration: false,
  format: 'Condensed',
  showInventoryDetails: false,
  showStockDescriptions: false,
  showPaymentMode: false,
  showBankDetails: false,
  showCostCentre: false,
  showEnteredBy: false,
  showRunningBalance: true,
  ledgerDisplayName: 'Name Only',
  sortingMethod: 'Default',
  enableStripeView: false,
};

export function Daybook() {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const { showNotification } = useNotification();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA');
  });
  const [highlightDates, setHighlightDates] = useState(false);
  const [fullPageHtml, setFullPageHtml] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number } | null;
    voucher: any;
    particulars?: string;
    amount?: number;
    date?: string;
  }>({
    isOpen: false,
    position: null,
    voucher: null
  });

  useEffect(() => {
    if (company && company.enableDaybookDateHighlight !== false) {
      setHighlightDates(true);
      const timer = setTimeout(() => {
        setHighlightDates(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [company?.id, company?.enableDaybookDateHighlight]);

  const fetchVouchers = async (forceRefresh = false) => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [vData, iData, gData, uData, lData, sData] = await Promise.all([
        config.format === 'Detailed'
          ? erpService.getVouchersDetailedByDateRange(user.companyId, startDate, endDate)
          : erpService.getVouchersByDateRange(user.companyId, startDate, endDate),
        erpService.getItems(user.companyId, forceRefresh),
        erpService.getGodowns(user.companyId, forceRefresh),
        erpService.getUsersByCompany(user.companyId),
        erpService.getLedgers(user.companyId, forceRefresh),
        erpService.getSettings(user.companyId)
      ]);

      setItems(iData);
      setGodowns(gData);
      setUsers(uData);
      setLedgers(lData);
      if (sData?.daybookConfig) setConfig(sData.daybookConfig);

      const processed = (vData || []).map(v => ({
        ...v,
        particulars: getLedgerName(v, lData)
      }));

      // Apply sorting
      const sorted = sortVouchers(processed);
      setVouchers(sorted);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortVouchers = (data: any[]) => {
    const sorted = [...data];
    switch (config.sortingMethod) {
      case 'Alphabetical (A to Z)':
        sorted.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || ''));
        break;
      case 'Alphabetical (Z to A)':
        sorted.sort((a, b) => (b.particulars || '').localeCompare(a.particulars || ''));
        break;
      case 'Amount (Decreasing)':
        sorted.sort((a, b) => b.total_amount - a.total_amount);
        break;
      case 'Amount (Increasing)':
        sorted.sort((a, b) => a.total_amount - b.total_amount);
        break;
      case 'Voucher Number (Ascending)':
        sorted.sort((a, b) => (a.v_no || '').localeCompare(b.v_no || '', undefined, { numeric: true }));
        break;
      case 'Voucher Number (Descending)':
        sorted.sort((a, b) => (b.v_no || '').localeCompare(a.v_no || '', undefined, { numeric: true }));
        break;
      case 'Auto Serial No':
        sorted.sort((a, b) => (a.serial_no || a.auto_serial_no || 0) - (b.serial_no || b.auto_serial_no || 0));
        break;
      case 'In Sequence of entry':
        sorted.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });
        break;
      default:
        // Default Sort: Type Order (Sales, Purchase, Credit Note, Debit Note, Receipt, Payment) then Voucher Number then Serial No
        const typeOrder: Record<string, number> = {
          'Sales': 1,
          'Purchase': 2,
          'Credit Note': 3,
          'Debit Note': 4,
          'Receipt': 5,
          'Payment': 6,
          'Contra': 7,
          'Journal': 8
        };
        sorted.sort((a, b) => {
          const dateA = parseEntryDate(a.v_date, a.createdAt).getTime();
          const dateB = parseEntryDate(b.v_date, b.createdAt).getTime();
          if (dateA !== dateB) return dateA - dateB;

          const orderA = typeOrder[a.v_type] || 99;
          const orderB = typeOrder[b.v_type] || 99;
          if (orderA !== orderB) return orderA - orderB;
          
          const vNoComp = (a.v_no || '').localeCompare(b.v_no || '', undefined, { numeric: true });
          if (vNoComp !== 0) return vNoComp;

          return (a.serial_no || a.auto_serial_no || 0) - (b.serial_no || b.auto_serial_no || 0);
        });
    }
    return sorted;
  };

  const totalPages = Math.max(1, Math.ceil(vouchers.length / pageSize));
  const paginatedVouchers = vouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    fetchVouchers();
  }, [startDate, endDate, config.format]);

  useEffect(() => {
    if (vouchers.length > 0) {
      setVouchers(prev => sortVouchers(prev));
    }
  }, [config.sortingMethod]);

  const handleSaveConfig = async (newConfig: ReportConfig) => {
    if (!user?.companyId) return;
    try {
      await erpService.updateSettings(user.companyId, { daybookConfig: newConfig });
      setConfig(newConfig);
      setIsConfigOpen(false);
      showNotification('Configuration saved', 'success');
    } catch (err) {
      showNotification('Failed to save configuration', 'error');
    }
  };

  const getOtherPartyName = (v: any, currentLedgers: any[]) => {
    if (!v.entries || v.entries.length === 0) return null;

    // For Receipt/Payment/Contra, find the ledger that isn't Cash/Bank
    if (['Receipt', 'Payment', 'Contra'].includes(v.v_type)) {
      const isBankCash = (l: any) => {
        const name = l.name?.toLowerCase() || '';
        const group = l.ledger_groups?.name?.toLowerCase() || l.group_name?.toLowerCase() || '';
        return name.includes('cash') || name.includes('bank') || 
               group.includes('cash') || group.includes('bank');
      };

      // First try to find entries that are NOT Cash/Bank
      const otherEntries = v.entries.filter((e: any) => {
        const ledger = currentLedgers.find(l => l.id === e.ledger_id);
        return ledger && !isBankCash(ledger);
      });

      if (otherEntries.length === 1) {
        return currentLedgers.find(l => l.id === otherEntries[0].ledger_id)?.name;
      } else if (otherEntries.length > 1) {
        return otherEntries.map((e: any) => currentLedgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean).join(', ');
      }
    }

    // For Sales/Purchase, usually the party is the one that's NOT the Sales/Purchase account
    if (['Sales', 'Purchase'].includes(v.v_type)) {
      const isSalesPurchaseAccount = (l: any) => {
        const name = l.name?.toLowerCase() || '';
        const group = l.ledger_groups?.name?.toLowerCase() || l.group_name?.toLowerCase() || '';
        return group.includes('sales account') || group.includes('purchase account') ||
               name === 'sales' || name === 'purchase' || name === 'sales account' || name === 'purchase account';
      };

      const otherEntries = v.entries.filter((e: any) => {
        const ledger = currentLedgers.find(l => l.id === e.ledger_id);
        return ledger && !isSalesPurchaseAccount(ledger);
      });
      if (otherEntries.length > 0) {
        return currentLedgers.find(l => l.id === otherEntries[0].ledger_id)?.name;
      }
    }

    return null;
  };

  const getLedgerName = (v: any, currentLedgers: any[] = ledgers) => {
    // Try the calculated other party first (especially for detailed mode)
    const otherParty = getOtherPartyName(v, currentLedgers);
    if (otherParty) return otherParty;

    const name = v.party_ledger_name || v.ledger_name || v.ledgers || (['Sales', 'Purchase'].includes(v.particulars) ? '' : v.particulars) || v.v_type || 'Voucher';
    const alias = v.alias || ''; 
    
    switch (config.ledgerDisplayName) {
      case 'Alias (Name)':
        return alias ? `${alias} (${name})` : name;
      case 'Alias Only':
        return alias || name;
      case 'Name (Alias)':
        return alias ? `${name} (${alias})` : name;
      default:
        return name;
    }
  };

  const generateDaybookReportHtml = () => {
    const legal = resolveCompanyLegalIdentity(settings, company);
    const isLayout2 = settings?.reportLayout === 'Layout 2';
    const safeLogoUrl = sanitizeAssetUrl(legal.companyLogo || '');
    const logoHtml = safeLogoUrl
      ? `<div style="width: 64px; height: 64px; margin-right: 14px; flex-shrink: 0;"><img src="${escapeHtml(safeLogoUrl)}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`
      : '';

    const contactParts: string[] = [];
    if (settings?.showPrintPhone !== false && legal.printPhone) contactParts.push(`Phone: ${escapeHtml(legal.printPhone)}`);
    if (settings?.showPrintEmail !== false && legal.printEmail) contactParts.push(`E-Mail: ${escapeHtml(legal.printEmail)}`);
    if (settings?.showPrintWebsite !== false && legal.printWebsite) contactParts.push(`Web: ${escapeHtml(legal.printWebsite)}`);

    const softwareFooter =
      settings?.showDeveloperContact !== false
        ? (settings?.appIdentity?.softwareFooterText ||
          settings?.developerContactText ||
          DEFAULT_APP_BRANDING.softwareFooterText)
        : '';

    const formatDt = (dStr: string) => formatReportDate(dStr, settings.dateFormat || 'DD-MMM-YY');
    const periodText = startDate === endDate
      ? `For ${formatDt(startDate)}`
      : `For ${formatDt(startDate)} to ${formatDt(endDate)}`;

    let totalDebit = 0;
    let totalCredit = 0;
    let totalInwardsQty = 0;
    let totalOutwardsQty = 0;

    const rowsHtml = vouchers.map((v, idx) => {
      const isDebit = ['Sales', 'Payment', 'Debit Note'].includes(v.v_type);
      const isCredit = ['Purchase', 'Receipt', 'Credit Note'].includes(v.v_type);

      let debitVal = 0;
      let creditVal = 0;

      if (isDebit) {
        debitVal = v.total_amount || 0;
      } else if (isCredit) {
        creditVal = v.total_amount || 0;
      } else {
        debitVal = v.debit || v.total_amount || 0;
      }

      totalDebit += debitVal;
      totalCredit += creditVal;

      let subDetailsHtml = '';
      let rowInwardsQty = 0;
      let rowOutwardsQty = 0;
      let rowUnit = 'Pcs';

      if (v.inventory && v.inventory.length > 0) {
        const itemsList = v.inventory.map((inv: any) => {
          const itemObj = items.find(i => i.id === inv.item_id);
          const name = itemObj?.name || inv.item_name || 'Item';
          const invUnit = inv.unit || itemObj?.unit || itemObj?.units?.name || 'Pcs';
          rowUnit = invUnit;
          const qty = Number(inv.qty || 0);
          if (v.v_type === 'Purchase') rowInwardsQty += qty;
          if (v.v_type === 'Sales') rowOutwardsQty += qty;
          if (config.format === 'Detailed') {
            return `${inv.batch ? `${inv.batch} ` : ''}${name} (${formatQuantity(qty, invUnit)} ${invUnit} @ ${formatNumber(Number(inv.rate || 0))})`.trim();
          }
          return `${inv.batch || ''} ${name}`.trim();
        }).join(', ');

        if (itemsList) {
          subDetailsHtml += `<div style="padding-left: 12px; font-size: 9.5px; color: #222; font-style: italic; margin-top: 2px;">${escapeHtml(itemsList)}</div>`;
        }
      } else if (v.item_names) {
        subDetailsHtml += `<div style="padding-left: 12px; font-size: 9.5px; color: #222; font-style: italic; margin-top: 2px;">${escapeHtml(v.item_names)}</div>`;
      }

      if (config.showNarration && v.narration) {
        subDetailsHtml += `<div style="padding-left: 12px; font-size: 9.5px; color: #444; font-style: italic;">(${escapeHtml(v.narration)})</div>`;
      }

      totalInwardsQty += rowInwardsQty;
      totalOutwardsQty += rowOutwardsQty;

      const isStripe = config.enableStripeView && idx % 2 === 1;

      return `
        <tr style="border-bottom: 1px solid #E5E7EB; ${isStripe ? 'background-color: #F9FAFB;' : ''}">
          <td style="padding: 5px 6px; vertical-align: middle; white-space: nowrap;">${escapeHtml(formatDt(v.v_date))}</td>
          <td style="padding: 5px 6px; vertical-align: middle;">
            <div style="font-weight: bold; color: #000;">${escapeHtml(getLedgerName(v))}</div>
            ${subDetailsHtml}
          </td>
          <td style="padding: 5px 6px; vertical-align: middle; font-weight: 500;">${escapeHtml(v.v_type)}</td>
          <td style="padding: 5px 6px; vertical-align: middle;">${escapeHtml(formatVoucherNo(v.v_no || v.reference_no))}</td>
          <td style="padding: 5px 6px; vertical-align: middle; text-align: right; font-weight: bold;">
            ${debitVal > 0 ? formatNumber(debitVal) : ''}
            ${rowInwardsQty > 0 ? `<div style="font-size: 9px; color: #555; font-weight: normal;">${escapeHtml(formatQuantity(rowInwardsQty, rowUnit))}</div>` : ''}
          </td>
          <td style="padding: 5px 6px; vertical-align: middle; text-align: right; font-weight: bold;">
            ${creditVal > 0 ? formatNumber(creditVal) : ''}
            ${rowOutwardsQty > 0 ? `<div style="font-size: 9px; color: #555; font-weight: normal;">${escapeHtml(formatQuantity(rowOutwardsQty, rowUnit))}</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    const sigAlignment = settings?.signatureAlignment || 'spread';
    const justifyMap: Record<string, string> = {
      spread: 'space-between',
      left: 'flex-start',
      center: 'center',
      right: 'flex-end'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(legal.companyName ? `Day Book - ${legal.companyName}` : 'Day Book')}</title>
          <style>
            * { box-sizing: border-box; }
            @page {
              size: A4 portrait;
              margin: 1.2cm 1cm;
            }
            body {
              font-family: ${isLayout2 ? 'Arial, Helvetica, sans-serif' : "'JetBrains Mono', Courier, monospace"};
              color: #000;
              margin: 0;
              padding: 16px;
              font-size: 10.5px;
              background: #fff;
            }
            .header-container {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .company-title {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .company-sub {
              font-size: 10px;
              color: #222;
              margin-bottom: 2px;
              white-space: pre-line;
            }
            .report-title {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              text-decoration: underline;
              margin-top: 6px;
              margin-bottom: 2px;
            }
            .period-title {
              font-size: 10.5px;
              font-style: italic;
              margin-bottom: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
            }
            th, td {
              vertical-align: middle !important;
            }
            th {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 6px;
              text-align: left;
              font-weight: bold;
              background-color: ${isLayout2 ? '#fff' : '#f3f4f6'};
            }
            th.num-col {
              text-align: right;
            }
            .sub-th {
              font-size: 9px;
              font-weight: normal;
              color: #333;
            }
            .total-row td {
              border-top: 1px solid #000;
              border-bottom: 3px double #000;
              font-weight: bold;
              padding: 6px;
              background-color: ${isLayout2 ? '#fff' : '#f9fafb'};
            }
            .print-footer {
              margin-top: 24px;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #4b5563;
            }
            @media print {
              .no-print { display: none !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div style="position: absolute; right: 0; top: 0; font-size: 10px; font-weight: bold; font-family: monospace;">Page 1</div>
            ${logoHtml}
            <div style="flex: 1; text-align: center;">
              ${legal.companyName ? `<div class="company-title">${escapeHtml(legal.companyName)}</div>` : ''}
              ${legal.companyAddress ? `<div class="company-sub">${escapeHtml(legal.companyAddress)}</div>` : ''}
              ${legal.vatBinTin ? `<div class="company-sub">VAT/BIN/TIN: ${escapeHtml(legal.vatBinTin)}</div>` : ''}
              ${contactParts.length > 0 ? `<div class="company-sub">${contactParts.join(' | ')}</div>` : ''}
              ${settings?.showPrintHeader !== false && legal.printHeader ? `<div class="company-sub" style="font-style: italic;">${escapeHtml(legal.printHeader)}</div>` : ''}
              <div class="report-title">Day Book</div>
              <div class="period-title">${escapeHtml(periodText)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 11%;">Date</th>
                <th style="width: 39%;">Particulars</th>
                <th style="width: 12%;">Vch Type</th>
                <th style="width: 8%;">Vch No.</th>
                <th style="width: 15%;" class="num-col">
                  Debit Amount
                  <div class="sub-th">Inwards Qty</div>
                </th>
                <th style="width: 15%;" class="num-col">
                  Credit Amount
                  <div class="sub-th">Outwards Qty</div>
                </th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Total :</td>
                <td style="text-align: right;">
                  ${formatNumber(totalDebit)}
                  ${totalInwardsQty > 0 ? `<div style="font-size: 9px; font-weight: normal;">${escapeHtml(formatQuantity(totalInwardsQty, 'Pcs'))}</div>` : ''}
                </td>
                <td style="text-align: right;">
                  ${formatNumber(totalCredit)}
                  ${totalOutwardsQty > 0 ? `<div style="font-size: 9px; font-weight: normal;">${escapeHtml(formatQuantity(totalOutwardsQty, 'Pcs'))}</div>` : ''}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="display: flex; justify-content: ${justifyMap[sigAlignment] || 'space-between'}; gap: 24px; margin-top: 48px;">
            ${settings?.showSignature1 !== false ? `<div style="border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${escapeHtml(settings?.printSignature1 || 'Prepared By')}</div>` : ''}
            ${settings?.showSignature2 !== false ? `<div style="border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${escapeHtml(settings?.printSignature2 || 'Checked By')}</div>` : ''}
            ${settings?.showSignature3 !== false ? `<div style="border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${escapeHtml(settings?.printSignature3 || 'Authorised Signatory')}</div>` : ''}
          </div>

          <div class="print-footer">
            <div>${settings?.showPrintFooter !== false ? escapeHtml(legal.printFooter || settings?.printFooter || '') : ''}</div>
            <div>${escapeHtml(softwareFooter)}</div>
          </div>
        </body>
      </html>
    `;
  };

  const daybookPeriodSubtitle = `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`;

  const handleFullPageView = () => {
    setFullPageHtml(generateDaybookReportHtml());
  };

  const handlePrint = () => {
    executePrint(generateDaybookReportHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: 'Daybook',
      subtitle: daybookPeriodSubtitle,
      fileName: `Daybook_Report_${startDate}_to_${endDate}`,
      htmlContent: generateDaybookReportHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    const exportData = vouchers.flatMap(v => {
      const rows: Record<string, any>[] = [{
        'Date': formatReportDate(v.v_date, settings.dateFormat),
        'Particulars': getLedgerName(v) + (config.format !== 'Detailed' && config.showInventoryDetails && v.item_names ? ` (${v.item_names})` : ''),
        'Vch Type': v.v_type || '',
        'Vch No': formatVoucherNo(v.v_no || v.reference_no),
        'Serial No': v.serial_no || v.auto_serial_no || '',
        'Amount': Number((Number(v.total_amount) || 0).toFixed(2))
      }];

      if (config.showNarration && v.narration) {
        rows.push({
          'Date': '',
          'Particulars': `(${v.narration})`,
          'Vch Type': '',
          'Vch No': '',
          'Serial No': '',
          'Amount': ''
        });
      }

      if (config.format === 'Detailed' && v.inventory && v.inventory.length > 0) {
        v.inventory.forEach((item: any) => {
          const itemObj = items.find(i => i.id === item.item_id);
          const itemName = itemObj?.name || item.item_name || 'Unknown';
          const itemUnit = item.unit || itemObj?.unit || itemObj?.units?.name || 'Pcs';
          rows.push({
            'Date': '',
            'Particulars': `  > ${itemName} (${formatQuantity(item.qty || 0, itemUnit)} ${itemUnit} @ ${formatNumber(Number(item.rate || 0))})`,
            'Vch Type': '',
            'Vch No': '',
            'Serial No': '',
            'Amount': item.amount !== undefined && item.amount !== null ? Number(Number(item.amount).toFixed(2)) : ''
          });
        });
      }
      return rows;
    });

    const totalAmount = vouchers.reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0);
    const headers = ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Serial No', 'Amount'];
    exportStructuredExcel({
      fileName: `Daybook_${startDate}_to_${endDate}`,
      sheetName: 'Daybook',
      title: 'Daybook Report',
      subtitle: daybookPeriodSubtitle,
      headers,
      rows: exportData,
      footerRow: {
        'Date': '',
        'Particulars': 'TOTAL',
        'Vch Type': '',
        'Vch No': '',
        'Serial No': '',
        'Amount': Number(totalAmount.toFixed(2))
      },
      settings,
      company
    });
  };

  const handleEmailReport = () => {
    const totalAmount = vouchers.reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0);
    shareReportViaEmail({
      title: 'Daybook Report',
      subtitle: daybookPeriodSubtitle,
      settings,
      company,
      summaryLines: [
        `Total Vouchers: ${vouchers.length}`,
        `Total Voucher Amount: ${formatNumber(totalAmount)}`,
        '',
        ...vouchers.slice(0, 15).map(v => `- ${formatReportDate(v.v_date, settings.dateFormat)} | ${v.v_type} #${formatVoucherNo(v.v_no || v.reference_no)} | ${getLedgerName(v)}: ${formatNumber(v.total_amount || 0)}`),
        ...(vouchers.length > 15 ? [`... and ${vouchers.length - 15} more vouchers`] : [])
      ]
    });
  };

  const handleShareWhatsApp = (v: any) => {
    pdfService.shareViaWhatsApp(v, settings);
    showNotification('Opening WhatsApp...', 'success');
  };

  const handleShareEmail = (v: any) => {
    pdfService.shareViaEmail(v, settings);
    showNotification('Opening Email Client...', 'success');
  };

  return (
    <div className={cn(
      "flex flex-col h-screen transition-colors overflow-hidden",
      settings.reportsPageUiStyle === 'modern' ? "bg-slate-50/50" : "bg-background"
    )}>
      {/* Fixed Header Section */}
      <div className={cn(
        "flex-none border-b shadow-sm px-4 lg:px-6 py-4 space-y-6 sticky top-0 z-30",
        settings.reportsPageUiStyle === 'modern'
          ? "bg-white/95 backdrop-blur-md border-slate-200/60"
          : "bg-background border-border"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateInput
                  label={t('common.from')}
                  value={startDate}
                  onChange={setStartDate}
                  className="w-full"
                  highlighted={highlightDates}
                />
              </div>
              <div className="flex-1">
                <DateInput
                  label={t('common.to')}
                  value={endDate}
                  onChange={setEndDate}
                  className="w-full"
                  highlighted={highlightDates}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button 
              type="button"
              onClick={() => {
                fetchVouchers(true);
                showNotification('Daybook data refreshed', 'success');
              }}
              disabled={loading}
              className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase whitespace-nowrap cursor-pointer"
              title="Refresh Daybook (Clear cache & fetch fresh)"
            >
              <RotateCw className={cn("w-3 h-3", loading && "animate-spin")} /> REFRESH
            </button>
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase whitespace-nowrap"
              title={t('daybook.configureReport')}
            >
              <SettingsIcon className="w-3 h-3" /> {t('common.f12Configure')}
            </button>
            <button 
              onClick={handleFullPageView}
              disabled={vouchers.length === 0}
              className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center items-center gap-2 text-[10px] font-bold uppercase whitespace-nowrap disabled:opacity-50"
              title="Full Page Print Layout Preview"
            >
              <Eye className="w-3 h-3" /> FULL PAGE VIEW
            </button>
            <button 
              onClick={handlePrint}
              disabled={vouchers.length === 0}
              className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center items-center gap-2 text-[10px] font-bold uppercase whitespace-nowrap disabled:opacity-50"
            >
              <Printer className="w-3 h-3" /> PRINT
            </button>
            <button 
              onClick={handleDownloadExcel}
              disabled={vouchers.length === 0}
              className="px-3 py-2 border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase whitespace-nowrap"
              title="Export Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> {t('common.excel')}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={vouchers.length === 0}
              className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase whitespace-nowrap"
              title="Print to PDF (Save professional financial statement offline)"
            >
              <Download className="w-3 h-3" /> PRINT TO PDF
            </button>
            <button
              onClick={handleEmailReport}
              disabled={vouchers.length === 0}
              className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase whitespace-nowrap"
              title="Share Summary via Email"
            >
              <Mail className="w-3.5 h-3.5" /> EMAIL
            </button>
          </div>
        </div>
      </div>

      <ReportConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        title="Daybook"
      />

      {/* Report Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div id="daybook-report" className="min-h-full flex flex-col bg-white">
          <div className="p-4 lg:p-6 flex-1 flex flex-col">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50 flex-none">
            {loading ? (
              <div className="p-10 text-center text-gray-500">{t('daybook.loading')}</div>
            ) : vouchers.length === 0 ? (
              <div className="p-10 text-center text-gray-500">{t('daybook.noTransactions')}</div>
            ) : paginatedVouchers.map((v, idx) => (
              <div 
                key={v.id} 
                className={cn(
                  "p-4 space-y-3 hover:bg-muted/80 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary",
                  config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                )}
                onClick={() => navigate(`/vouchers/view/${v.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    isOpen: true,
                    position: { x: e.clientX, y: e.clientY },
                    voucher: v,
                    particulars: getLedgerName(v),
                    amount: v.total_amount,
                    date: v.v_date
                  });
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 uppercase">{v.v_date}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">{v.v_type}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          isOpen: true,
                          position: { x: rect.left - 180, y: rect.bottom + 4 },
                          voucher: v,
                          particulars: getLedgerName(v),
                          amount: v.total_amount,
                          date: v.v_date
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-foreground rounded"
                      title="Actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      {v.party_ledger_name || v.ledger_name || v.ledgers || (['Sales', 'Purchase'].includes(v.particulars) ? '' : v.particulars) || v.v_type}
                    </span>
                    {config.showInventoryDetails && v.item_names && (
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{v.item_names}</span>
                    )}
                    {config.showNarration && v.narration && (
                      <span className="text-[9px] text-gray-500 italic">({v.narration})</span>
                    )}
                    {config.showEnteredBy && (
                      <span className="text-[8px] text-gray-400 uppercase">{t('common.providedBy')}: {users.find(u => u.uid === v.createdBy)?.displayName || 'System'}</span>
                    )}
                    <span className="text-[10px] text-gray-500">{formatVoucherNo(v.v_no || v.reference_no)}{(v.serial_no || v.auto_serial_no) ? ` / SN:${v.serial_no || v.auto_serial_no}` : ''}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">৳ {formatNumber(v.total_amount)}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                    className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> {t('common.whatsapp')}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                    className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> {t('common.email')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block relative flex-1">
            <table className="w-full text-left text-xs min-w-[700px] lg:min-w-0 border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm ring-1 ring-border">
                <tr className="text-gray-500 uppercase text-[9px] font-bold tracking-widest">
                  <th className="px-4 lg:px-6 py-4 font-medium border-b border-border sticky top-0 align-middle">{t('common.date')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium border-b border-border sticky top-0 align-middle">{t('common.particulars')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase border-b border-border sticky top-0 align-middle">{t('common.vchType')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase border-b border-border sticky top-0 align-middle">Ref No</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase border-b border-border sticky top-0 align-middle">Serial No</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right border-b border-border sticky top-0 align-middle">{t('common.amount')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right border-b border-border sticky top-0 align-middle">{t('common.share')}</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500 align-middle">{t('daybook.loading')}</td></tr>
                ) : vouchers.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500 align-middle">{t('daybook.noTransactionsPeriod')}</td></tr>
                ) : paginatedVouchers.map((v, idx) => (
                  <React.Fragment key={v.id}>
                    <tr 
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/80 cursor-pointer group transition-colors border-l-4 border-transparent hover:border-primary",
                        config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                      )}
                      onClick={() => navigate(`/vouchers/view/${v.id}`)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          isOpen: true,
                          position: { x: e.clientX, y: e.clientY },
                          voucher: v,
                          particulars: getLedgerName(v),
                          amount: v.total_amount,
                          date: v.v_date
                        });
                      }}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap align-middle">{formatReportDate(v.v_date, settings.dateFormat)}</td>
                      <td className="px-4 lg:px-6 py-4 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold">
                              {getLedgerName(v)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {config.showInventoryDetails && v.item_names && (
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                              {v.item_names}
                            </span>
                          )}
                          {config.showNarration && v.narration && (
                            <span className="text-[9px] text-gray-500 italic">({v.narration})</span>
                          )}
                          {config.showEnteredBy && (
                            <span className="text-[8px] text-gray-400 uppercase">{t('common.providedBy')}: {users.find(u => u.uid === v.createdBy)?.displayName || 'System'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 uppercase text-[10px] text-gray-500 align-middle">{v.v_type}</td>
                      <td className="px-4 lg:px-6 py-4 align-middle">{formatVoucherNo(v.v_no || v.reference_no)}</td>
                      <td className="px-4 lg:px-6 py-4 font-mono text-[10px] text-emerald-600 align-middle">
                        {v.serial_no || v.auto_serial_no || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right text-foreground font-bold align-middle">৳ {formatNumber(v.total_amount)}</td>
                      <td className="px-4 lg:px-6 py-4 text-right align-middle">
                        <div className="flex justify-end items-center gap-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Share via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                            title="Share via Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const rect = e.currentTarget.getBoundingClientRect();
                              setContextMenu({
                                isOpen: true,
                                position: { x: rect.left - 180, y: rect.bottom + 4 },
                                voucher: v,
                                particulars: getLedgerName(v),
                                amount: v.total_amount,
                                date: v.v_date
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-foreground hover:bg-muted rounded transition-colors"
                            title="More Actions (Right-click)"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {config.format === 'Detailed' && v.inventory && v.inventory.length > 0 && (
                      <tr className="bg-foreground/[0.02] border-b border-border/30">
                        <td colSpan={7} className="px-4 lg:px-12 py-2 align-middle">
                          <table className="w-full text-[10px] text-gray-500">
                            <thead>
                              <tr className="border-b border-border/20 uppercase text-[8px]">
                                <th className="py-1 text-left align-middle">{t('common.nameOfItem')}</th>
                                <th className="py-1 text-left align-middle">{t('common.godown')}</th>
                                <th className="py-1 text-right align-middle">{t('common.quantity')}</th>
                                <th className="py-1 text-right align-middle">{t('common.free')}</th>
                                <th className="py-1 text-right align-middle">{t('common.rate')}</th>
                                <th className="py-1 text-center align-middle">{t('common.per')}</th>
                                <th className="py-1 text-right align-middle">{t('common.discPercent')}</th>
                                <th className="py-1 text-right align-middle">{t('common.taxPercent')}</th>
                                <th className="py-1 text-right align-middle">{t('common.amount')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.inventory.map((item: any, iIdx: number) => (
                                <tr key={iIdx} className="border-b border-border/10 last:border-0">
                                  <td className="py-1 align-middle">
                                    <div className="flex flex-col">
                                      <span>{items.find(i => i.id === item.item_id)?.name || 'Unknown Item'}</span>
                                      {config.showStockDescriptions && item.description && (
                                        <span className="text-[9px] italic text-gray-400">{item.description}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-1 align-middle">{godowns.find(g => g.id === item.godown_id)?.name || '-'}</td>
                                  <td className="py-1 text-right align-middle">{formatQuantity(item.qty, item.unit)}</td>
                                  <td className="py-1 text-right align-middle">{formatQuantity(item.free_qty || 0, item.unit)}</td>
                                  <td className="py-1 text-right align-middle">{formatNumber(item.rate)}</td>
                                  <td className="py-1 text-center align-middle">{item.unit || 'pcs'}</td>
                                  <td className="py-1 text-right align-middle">{item.disc_percent || 0}%</td>
                                  <td className="py-1 text-right align-middle">{item.tax_percent || 0}%</td>
                                  <td className="py-1 text-right font-bold text-foreground/70 align-middle">{formatNumber(item.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Smart Pagination Controls (30 records per page) */}
          {vouchers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-t border-border mt-auto rounded-b-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>
                  Showing <strong className="text-foreground">{Math.min((currentPage - 1) * pageSize + 1, vouchers.length)}</strong> to <strong className="text-foreground">{Math.min(currentPage * pageSize, vouchers.length)}</strong> of <strong className="text-foreground">{vouchers.length}</strong> vouchers
                </span>
                <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-3">
                  <span className="text-[10px] uppercase font-sans">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-0.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-hidden cursor-pointer"
                  >
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    document.getElementById('daybook-report')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-border bg-background hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc: (number | string)[], p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, pIdx) => (
                      typeof p === 'number' ? (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setCurrentPage(p);
                            document.getElementById('daybook-report')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={cn(
                            "w-7 h-7 text-xs font-bold rounded flex items-center justify-center transition-colors cursor-pointer",
                            currentPage === p
                              ? "bg-foreground text-background shadow-xs"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={pIdx} className="px-1 text-xs text-muted-foreground">...</span>
                      )
                    ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    document.getElementById('daybook-report')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-border bg-background hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <VoucherContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false, position: null }))}
        voucher={contextMenu.voucher}
        particulars={contextMenu.particulars}
        amount={contextMenu.amount}
        date={contextMenu.date}
        onRefresh={fetchVouchers}
        onDeleted={fetchVouchers}
      />

      {fullPageHtml && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="font-bold text-sm text-gray-900">
                Full Page Preview — Daybook ({daybookPeriodSubtitle})
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-xs font-bold uppercase border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> {t('common.print')}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 text-xs font-bold uppercase bg-gray-900 text-white hover:opacity-90 rounded flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => setFullPageHtml(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe
              title="Daybook Full Page Preview"
              srcDoc={fullPageHtml}
              className="flex-1 w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  </div>
);
}
