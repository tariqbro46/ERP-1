import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Eye, 
  Pencil, 
  Printer, 
  Download, 
  Copy, 
  Hash, 
  MessageCircle, 
  Mail, 
  Trash2, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';
import { pdfService } from '../services/pdfService';
import { erpService } from '../services/erpService';
import { formatNumber, cn } from '../lib/utils';
import { formatDate as formatReportDate } from '../utils/dateUtils';

export interface ContextMenuItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

export interface TableContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  items: ContextMenuItem[];
}

export function TableContextMenu({
  isOpen,
  position,
  onClose,
  title,
  subtitle,
  badge,
  badgeColor = 'bg-primary/10 text-primary border-primary/20',
  items
}: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !position) return;

    const computePosition = () => {
      const menu = menuRef.current;
      const width = menu?.offsetWidth || 230;
      const height = menu?.offsetHeight || 300;

      const pad = 12;
      const maxX = window.innerWidth - width - pad;
      const maxY = window.innerHeight - height - pad;

      const x = Math.max(pad, Math.min(position.x, maxX));
      const y = Math.max(pad, Math.min(position.y, maxY));

      setCoords({ x, y });
    };

    computePosition();
    // Re-check after mount to ensure accurate dimensions
    const timer = setTimeout(computePosition, 10);
    return () => clearTimeout(timer);
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = (e: Event) => {
      // If scrolling outside the context menu itself, dismiss
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        zIndex: 9999
      }}
      className="bg-card/95 dark:bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-xl py-1 min-w-[220px] max-w-[280px] text-xs font-sans text-card-foreground animate-in fade-in zoom-in-95 duration-100 select-none ring-1 ring-black/5"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {(title || badge) && (
        <div className="px-3 py-2 border-b border-border/70 flex flex-col gap-0.5 bg-muted/40 rounded-t-xl">
          <div className="flex items-center justify-between gap-2">
            {badge && (
              <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border", badgeColor)}>
                {badge}
              </span>
            )}
            {title && (
              <span className="font-semibold text-foreground truncate flex-1 text-right text-[11px]">
                {title}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground truncate font-mono">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="py-1">
        {items.map((item, idx) => {
          if (item.divider) {
            return <div key={`div-${idx}`} className="my-1 border-t border-border/60" />;
          }

          const isDanger = item.variant === 'danger';
          const isPrimary = item.variant === 'primary';

          return (
            <button
              key={item.id || idx}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                onClose();
                item.onClick();
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left flex items-center justify-between gap-3 text-xs transition-colors rounded-md mx-auto max-w-[calc(100%-8px)] cursor-pointer group",
                isDanger
                  ? "text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  : isPrimary
                  ? "text-primary font-medium hover:bg-primary/10"
                  : "text-foreground hover:bg-muted/80 hover:text-foreground",
                item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={cn(
                  "w-4 h-4 flex items-center justify-center shrink-0",
                  isDanger ? "text-rose-500" : isPrimary ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-[9px] font-mono text-muted-foreground/80 shrink-0 uppercase px-1 py-0.5 bg-muted/60 rounded">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

export interface VoucherContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  voucher: any;
  particulars?: string;
  amount?: number;
  date?: string;
  onDeleted?: () => void;
  onRefresh?: () => void;
}

export function VoucherContextMenu({
  isOpen,
  position,
  onClose,
  voucher,
  particulars,
  amount,
  date,
  onDeleted,
  onRefresh
}: VoucherContextMenuProps) {
  const navigate = useNavigate();
  const settings = useSettings();
  const { hasPermission } = useAuth();
  const { language } = useLanguage();
  const { showNotification } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!voucher) return null;

  const voucherId = voucher.id || voucher.v_id;
  const vType = voucher.v_type || voucher.vouchers?.v_type || 'Voucher';
  const vNo = voucher.v_no || voucher.vouchers?.v_no || voucher.reference_no || voucher.vouchers?.reference_no || voucher.ref_no || '-';
  const serialNo = voucher.serial_no || voucher.auto_serial_no || voucher.vouchers?.serial_no || voucher.vouchers?.auto_serial_no || '';
  const resolvedDate = date || voucher.v_date || voucher.vouchers?.v_date || voucher.date || '';
  const resolvedParticulars = particulars || voucher.party_name || voucher.party_ledger_name || voucher.particulars || 'Transaction';
  const resolvedAmount = amount !== undefined ? amount : (voucher.total_amount ?? (voucher.debit || voucher.credit || 0));

  const canEdit = hasPermission('acc_vouchers_alter');
  const canDelete = hasPermission('acc_vouchers_delete');

  const getFullVoucher = async () => {
    // If voucher already has voucher_entries / inventory, use it
    if (voucher.voucher_entries && (voucher.v_type !== 'Sales' || voucher.inventory)) {
      return voucher;
    }
    // Otherwise fetch fresh from erpService to get clean printable format
    try {
      if (voucherId) {
        const full = await erpService.getVoucherById(voucherId);
        if (full) return full;
      }
    } catch (e) {
      console.warn('Could not fetch full voucher details:', e);
    }
    return voucher.vouchers || voucher;
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      const full = await getFullVoucher();
      printUtils.printVoucher(full, settings);
      showNotification(language === 'bn' ? 'প্রিন্ট প্রিভিউ প্রস্তুত করা হচ্ছে...' : 'Opening print preview...', 'success');
    } catch (e) {
      console.error('Failed to print voucher:', e);
      showNotification(language === 'bn' ? 'প্রিন্ট করতে ব্যর্থ হয়েছে' : 'Failed to print voucher', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const full = await getFullVoucher();
      exportUtils.exportVoucherToPDF(full, settings);
      showNotification(language === 'bn' ? 'পিডিএফ ডাউনলোড শুরু হয়েছে' : 'Downloading PDF...', 'success');
    } catch (e) {
      console.error('Failed to download PDF:', e);
      showNotification(language === 'bn' ? 'পিডিএফ ডাউনলোড করতে ব্যর্থ হয়েছে' : 'Failed to download PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyDetails = () => {
    const formatted = [
      `[${vType}] ${vNo !== '-' ? vNo : ''}`,
      resolvedDate ? `Date: ${formatReportDate(resolvedDate, settings.dateFormat)}` : '',
      `Particulars: ${resolvedParticulars}`,
      `Amount: ৳ ${formatNumber(resolvedAmount)}`,
      serialNo ? `Serial No: ${serialNo}` : '',
      voucher.narration ? `Narration: ${voucher.narration}` : ''
    ].filter(Boolean).join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
      showNotification(language === 'bn' ? 'বাউচারের বিবরণ কপি করা হয়েছে' : 'Voucher details copied to clipboard!', 'success');
    }
  };

  const handleCopyVoucherNo = () => {
    const textToCopy = vNo !== '-' ? vNo : serialNo;
    if (textToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      showNotification(
        language === 'bn' ? `কপি হয়েছে: ${textToCopy}` : `Copied: ${textToCopy}`,
        'success'
      );
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const full = await getFullVoucher();
      pdfService.shareViaWhatsApp(full, settings);
      showNotification('Opening WhatsApp...', 'success');
    } catch (e) {
      showNotification('Failed to share via WhatsApp', 'error');
    }
  };

  const handleShareEmail = async () => {
    try {
      const full = await getFullVoucher();
      pdfService.shareViaEmail(full, settings);
      showNotification('Opening Email Client...', 'success');
    } catch (e) {
      showNotification('Failed to share via Email', 'error');
    }
  };

  const handleDelete = async () => {
    if (!voucherId) return;
    const confirmMsg = language === 'bn'
      ? `আপনি কি নিশ্চিত যে আপনি ${vType} #${vNo} বাউচারটি মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।`
      : `Are you sure you want to delete ${vType} #${vNo}? This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await erpService.deleteVoucher(voucherId);
      showNotification(language === 'bn' ? 'বাউচার মুছে ফেলা হয়েছে' : 'Voucher deleted successfully', 'success');
      if (onDeleted) onDeleted();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting voucher:', err);
      showNotification(language === 'bn' ? 'বাউচার মুছতে সমস্যা হয়েছে' : 'Failed to delete voucher', 'error');
    }
  };

  const items: ContextMenuItem[] = [
    {
      id: 'view',
      label: language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        if (voucherId) navigate(`/vouchers/view/${voucherId}`);
      }
    },
    {
      id: 'edit',
      label: language === 'bn' ? 'বাউচার এডিট' : 'Edit Voucher',
      icon: <Pencil className="w-4 h-4" />,
      disabled: !canEdit,
      onClick: () => {
        if (voucherId) navigate(`/vouchers/edit/${voucherId}`);
      }
    },
    {
      id: 'print',
      label: language === 'bn' ? 'প্রিন্ট করুন' : 'Print Voucher',
      icon: isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Printer className="w-4 h-4" />,
      onClick: handlePrint
    },
    {
      id: 'pdf',
      label: language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF',
      icon: <Download className="w-4 h-4" />,
      onClick: handleDownloadPDF
    },
    {
      id: 'div-1',
      label: '',
      icon: null,
      onClick: () => {},
      divider: true
    },
    {
      id: 'copy-details',
      label: language === 'bn' ? 'বিবরণ কপি করুন' : 'Copy Details',
      icon: <Copy className="w-4 h-4" />,
      onClick: handleCopyDetails
    },
    {
      id: 'copy-vno',
      label: language === 'bn' ? 'বাউচার নং কপি' : 'Copy Voucher No',
      icon: <Hash className="w-4 h-4" />,
      disabled: vNo === '-' && !serialNo,
      onClick: handleCopyVoucherNo
    },
    {
      id: 'div-2',
      label: '',
      icon: null,
      onClick: () => {},
      divider: true
    },
    {
      id: 'share-whatsapp',
      label: language === 'bn' ? 'হোয়াটসঅ্যাপে শেয়ার' : 'Share on WhatsApp',
      icon: <MessageCircle className="w-4 h-4 text-emerald-500" />,
      onClick: handleShareWhatsApp
    },
    {
      id: 'share-email',
      label: language === 'bn' ? 'ইমেইল করুন' : 'Share via Email',
      icon: <Mail className="w-4 h-4 text-blue-500" />,
      onClick: handleShareEmail
    }
  ];

  if (canDelete) {
    items.push(
      {
        id: 'div-delete',
        label: '',
        icon: null,
        onClick: () => {},
        divider: true
      },
      {
        id: 'delete',
        label: language === 'bn' ? 'বাউচার মুছুন' : 'Delete Voucher',
        icon: <Trash2 className="w-4 h-4 text-rose-500" />,
        variant: 'danger',
        onClick: handleDelete
      }
    );
  }

  // Type badge styling
  let badgeColor = 'bg-primary/10 text-primary border-primary/20';
  if (vType === 'Sales') badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  else if (vType === 'Purchase') badgeColor = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  else if (vType === 'Payment') badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  else if (vType === 'Receipt') badgeColor = 'bg-teal-500/10 text-teal-600 border-teal-500/20';
  else if (vType === 'Journal') badgeColor = 'bg-purple-500/10 text-purple-600 border-purple-500/20';

  const subtitle = [
    resolvedDate ? formatReportDate(resolvedDate, settings.dateFormat) : '',
    `৳ ${formatNumber(resolvedAmount)}`
  ].filter(Boolean).join(' • ');

  return (
    <TableContextMenu
      isOpen={isOpen}
      position={position}
      onClose={onClose}
      title={vNo !== '-' ? vNo : (serialNo || vType)}
      subtitle={subtitle}
      badge={vType}
      badgeColor={badgeColor}
      items={items}
    />
  );
}
