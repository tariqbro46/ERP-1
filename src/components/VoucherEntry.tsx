import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer, Loader2, PlusCircle, Trash, Share2, MessageSquare, Mail, X, Download, Scan, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchableSelect } from './SearchableSelect';
import { QuickLedgerModal } from './QuickLedgerModal';
import { QuickItemModal } from './QuickItemModal';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { printVoucher } from '../utils/printUtils';

import { pdfService } from '../services/pdfService';

export function VoucherEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = !!id;
  const { showNotification } = useNotification();
  const settings = useSettings();
  const { notifications, features = [], companyName, baseCurrencySymbol = '৳', refNoFormat, showFreeQty, showDiscPercent, showTaxPercent } = settings;
  const [vType, setVType] = useState('Sales');

  const isInventoryEnabled = features.find(f => f.id === 'inv')?.enabled ?? true;
  const isTaxEnabled = features.find(f => f.id === 'tax')?.enabled ?? true;
  const isMultiCurrencyEnabled = features.find(f => f.id === 'curr')?.enabled ?? true;
  const isBatchEnabled = features.find(f => f.id === 'batch')?.enabled ?? false;
  const isExpiryEnabled = features.find(f => f.id === 'expiry')?.enabled ?? false;
  const isBarcodeEnabled = features.find(f => f.id === 'barcode')?.enabled ?? false;

  useEffect(() => {
    if (!isInventoryEnabled && (vType === 'Sales' || vType === 'Purchase')) {
      setVType('Payment');
    }
  }, [isInventoryEnabled, vType]);
  const [loading, setLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [salespersonId, setSalespersonId] = useState('');
  
  // Quick Create State
  const [isQuickLedgerOpen, setIsQuickLedgerOpen] = useState(false);
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [quickLedgerHint, setQuickLedgerHint] = useState('');
  const [pendingRowIdx, setPendingRowIdx] = useState<number | null>(null);
  const [pendingField, setPendingField] = useState<'party' | 'sales' | 'account' | 'particulars' | null>(null);
  
  // Common Header Fields
  const [vDate, setVDate] = useState(new Date().toISOString().split('T')[0]);
  const [refNo, setRefNo] = useState('');
  const [partyLedgerId, setPartyLedgerId] = useState('');
  const [salesPurchaseLedgerId, setSalesPurchaseLedgerId] = useState('');
  const [bankCashLedgerId, setBankCashLedgerId] = useState('');
  const [narration, setNarration] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [currency, setCurrency] = useState(baseCurrencySymbol);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [itemStocks, setItemStocks] = useState<Record<string, number>>({});
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [barcodeInput, setBarcodeInput] = useState('');

  const fetchItemStock = async (itemId: string, godownId: string) => {
    if (!itemId || !user?.companyId) return;
    // We can use erpService.getItemStock or calculate from inventory entries
    // For now, let's just use the item's current_stock if no godown is selected,
    // or fetch inventory entries if godown is selected.
    const items = await erpService.getItems(user.companyId);
    const item = items.find(i => i.id === itemId);
    setItemStocks(prev => ({ ...prev, [`${itemId}-${godownId}`]: item?.current_stock || 0 }));
  };

  const fetchBalance = async (ledgerId: string) => {
    if (!ledgerId || !user?.companyId) return;
    const bal = await erpService.getLedgerBalance(ledgerId, user.companyId);
    setBalances(prev => ({ ...prev, [ledgerId]: bal }));
  };

  useEffect(() => {
    if (partyLedgerId) fetchBalance(partyLedgerId);
  }, [partyLedgerId]);

  useEffect(() => {
    if (salesPurchaseLedgerId) fetchBalance(salesPurchaseLedgerId);
  }, [salesPurchaseLedgerId]);

  useEffect(() => {
    if (bankCashLedgerId) fetchBalance(bankCashLedgerId);
  }, [bankCashLedgerId]);

  const formatBalance = (bal: number) => {
    const abs = Math.abs(bal);
    const type = bal >= 0 ? 'Dr' : 'Cr';
    return `৳ ${abs.toLocaleString()} ${type}`;
  };

  // Inventory Entries (Sales/Purchase)
  const [invEntries, setInvEntries] = useState([
    { item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }
  ]);

  // Accounting Entries (Journal/Payment/Receipt/Contra)
  const [accEntries, setAccEntries] = useState([
    { ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }
  ]);

  useEffect(() => {
    invEntries.forEach(e => {
      if (e.item_id) fetchItemStock(e.item_id, e.godown_id);
    });
  }, [invEntries]);

  useEffect(() => {
    accEntries.forEach(e => {
      if (e.ledger_id && !balances[e.ledger_id]) fetchBalance(e.ledger_id);
    });
  }, [accEntries]);

  useEffect(() => {
    fetchData();
    if (isEdit) {
      fetchVoucher();
    } else {
      fetchNextNo();
    }
  }, [id]);

  async function fetchNextNo() {
    if (!user?.companyId) return;
    try {
      const nextNo = await erpService.getNextVoucherNumber(user.companyId, vType, refNoFormat);
      setRefNo(nextNo);
    } catch (err) {
      console.error('Error fetching next no:', err);
    }
  }

  useEffect(() => {
    if (!isEdit) {
      fetchNextNo();
    }
  }, [vType]);

  async function fetchVoucher() {
    setLoading(true);
    try {
      const v = await erpService.getVoucherById(id!);
      setVType(v.v_type);
      setVDate(v.v_date);
      setRefNo(v.v_no);
      setNarration(v.narration);
      setGlobalDiscount(v.discount_amount || 0);
      setGlobalDiscountType(v.discount_type || 'fixed');
      setCurrency(v.currency || baseCurrencySymbol);
      setExchangeRate(v.exchange_rate || 1);
      setSalespersonId(v.salesperson_id || '');

      if (v.v_type === 'Sales' || v.v_type === 'Purchase') {
        // Identify party and sales/purchase ledger based on debit/credit
        // Sales: Party Dr (debit > 0), Sales Cr (credit > 0)
        // Purchase: Purchase Dr (debit > 0), Party Cr (credit > 0)
        let partyEntry, spEntry;
        if (v.v_type === 'Sales') {
          partyEntry = v.entries.find((e: any) => e.debit > 0);
          spEntry = v.entries.find((e: any) => e.credit > 0);
        } else {
          partyEntry = v.entries.find((e: any) => e.credit > 0);
          spEntry = v.entries.find((e: any) => e.debit > 0);
        }
        
        setPartyLedgerId(partyEntry?.ledger_id || '');
        setSalesPurchaseLedgerId(spEntry?.ledger_id || '');
        const inv = v.inventory.map((i: any) => ({
          item_id: i.item_id,
          godown_id: i.godown_id || '',
          qty: i.qty,
          free_qty: i.free_qty || 0,
          rate: i.rate,
          disc_percent: i.discount_percent || 0,
          tax_percent: i.tax_percent || 0,
          batch_no: i.batch_no || '',
          expiry_date: i.expiry_date || '',
          amount: i.amount,
          unit: i.unit_name || 'pcs'
        }));
        setInvEntries(inv.length > 0 ? inv : [{ item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]);
      } else if (v.v_type === 'Journal') {
        // For Journal, we might have a party tagged in the first entry if it's a specific type
        setPartyLedgerId(v.entries[0]?.ledger_id || '');
        setAccEntries(v.entries.map((e: any) => ({
          ledger_id: e.ledger_id,
          debit: e.debit,
          credit: e.credit,
          type: e.debit > 0 ? 'Dr' : 'Cr',
          amount: Math.max(e.debit, e.credit)
        })));
      } else if (v.v_type === 'Payment' || v.v_type === 'Receipt' || v.v_type === 'Contra') {
        // In our save logic: last entry is bank/cash
        const mainEntry = v.entries[v.entries.length - 1];
        setBankCashLedgerId(mainEntry?.ledger_id || '');
        setAccEntries(v.entries.slice(0, -1).map((e: any) => ({
          ledger_id: e.ledger_id,
          amount: Math.max(e.debit, e.credit),
          debit: e.debit,
          credit: e.credit,
          type: e.debit > 0 ? 'Dr' : 'Cr'
        })));
      } else {
        setAccEntries(v.entries.map((e: any) => ({
          ledger_id: e.ledger_id,
          debit: e.debit,
          credit: e.credit,
          type: e.debit > 0 ? 'Dr' : 'Cr',
          amount: Math.max(e.debit, e.credit)
        })));
      }
    } catch (err) {
      console.error('Error fetching voucher:', err);
      showNotification('Failed to load voucher data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ledgers.length > 0 && !isEdit) {
      if (vType === 'Sales') {
        const salesLedger = ledgers.find(l => l.name.toLowerCase() === 'sales a/c');
        if (salesLedger) setSalesPurchaseLedgerId(salesLedger.id);
      } else if (vType === 'Purchase') {
        const purchaseLedger = ledgers.find(l => l.name.toLowerCase() === 'purchase a/c');
        if (purchaseLedger) setSalesPurchaseLedgerId(purchaseLedger.id);
      }
    }
  }, [vType, ledgers]);

  async function fetchData() {
    if (!user?.companyId) return;
    const [lData, iData, gData, uData] = await Promise.all([
      erpService.getLedgers(user.companyId),
      erpService.getItems(user.companyId),
      erpService.getGodowns(user.companyId),
      erpService.getCompanyUsers(user.companyId)
    ]);
    setLedgers(lData);
    setItems(iData);
    setGodowns(gData);
    setUsers(uData);
  }

  const handleQuickLedgerSuccess = (newLedger: any) => {
    setLedgers(prev => [...prev, newLedger].sort((a, b) => a.name.localeCompare(b.name)));
    
    // Auto-select the new ledger based on where it was triggered
    if (pendingField === 'party') setPartyLedgerId(newLedger.id);
    if (pendingField === 'sales') setSalesPurchaseLedgerId(newLedger.id);
    if (pendingField === 'account') setBankCashLedgerId(newLedger.id);
    if (pendingField === 'particulars' && pendingRowIdx !== null) {
      const next = [...accEntries];
      next[pendingRowIdx].ledger_id = newLedger.id;
      setAccEntries(next);
    }
    showNotification('Ledger created successfully');
  };

  const handleQuickItemSuccess = (newItem: any) => {
    setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    if (pendingRowIdx !== null) {
      const next = [...invEntries];
      next[pendingRowIdx].item_id = newItem.id;
      next[pendingRowIdx].unit = newItem.unit_name || 'pcs';
      setInvEntries(next);
    }
    showNotification('Item created successfully');
  };

  const openQuickLedger = (hint: string, field: 'party' | 'sales' | 'account' | 'particulars', rowIdx: number | null = null) => {
    setQuickLedgerHint(hint);
    setPendingField(field);
    setPendingRowIdx(rowIdx);
    setIsQuickLedgerOpen(true);
  };

  const isInventory = vType === 'Sales' || vType === 'Purchase';
  const isSingleEntry = vType === 'Payment' || vType === 'Receipt' || vType === 'Contra';
  const isJournal = vType === 'Journal';

  const handleBarcodeScan = async (code: string) => {
    if (!code.trim() || !user?.companyId) return;
    try {
      const data = await erpService.getItemByBarcode(user.companyId, code);
      if (data) {
        const newItem = {
          item_id: data.id,
          godown_id: '',
          qty: 1,
          free_qty: 0,
          rate: vType === 'Sales' ? data.avg_cost || 0 : 0,
          disc_percent: 0,
          tax_percent: data.tax_percent || 0,
          amount: vType === 'Sales' ? data.avg_cost || 0 : 0,
          unit: data.unit_name || 'pcs',
          batch_no: '',
          expiry_date: ''
        };
        
        // Check if last entry is empty
        const last = invEntries[invEntries.length - 1];
        if (!last.item_id) {
          const next = [...invEntries];
          next[invEntries.length - 1] = newItem;
          setInvEntries(next);
        } else {
          setInvEntries([...invEntries, newItem]);
        }
        setBarcodeInput('');
        showNotification(`Added ${data.name}`);
      }
    } catch (err) {
      console.error('Barcode error:', err);
    }
  };
  const calculateRowAmount = (qty: number, rate: number, disc: number, tax: number) => {
    const gross = qty * rate;
    const discount = gross * (disc / 100);
    const afterDiscount = gross - discount;
    const taxAmount = afterDiscount * (tax / 100);
    return afterDiscount + taxAmount;
  };

  const totalInvAmount = invEntries.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalTaxAmount = invEntries.reduce((sum, i) => {
    const gross = i.qty * i.rate;
    const discount = gross * (i.disc_percent / 100);
    const afterDiscount = gross - discount;
    return sum + (afterDiscount * (i.tax_percent / 100));
  }, 0);
  const totalDebit = accEntries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
  const totalCredit = accEntries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
  const totalSingleAmount = accEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  const calculateFinalTotal = (baseTotal: number) => {
    if (globalDiscountType === 'percent') {
      return baseTotal - (baseTotal * (globalDiscount / 100));
    }
    return baseTotal - globalDiscount;
  };

  const finalTotal = calculateFinalTotal(isInventory ? totalInvAmount : (isSingleEntry ? totalSingleAmount : totalDebit));

  const isBalanced = () => {
    if (isInventory) return partyLedgerId && salesPurchaseLedgerId && invEntries.every(i => i.item_id && i.qty > 0);
    if (isSingleEntry) return bankCashLedgerId && accEntries.some(e => e.ledger_id && e.amount > 0);
    if (isJournal) return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    return false;
  };

  const handleSave = async () => {
    if (!isBalanced() || !user?.companyId) return;
    setLoading(true);
    try {
      const voucher = {
        v_no: refNo,
        v_type: vType,
        v_date: vDate,
        narration,
        total_amount: finalTotal,
        tax_amount: totalTaxAmount,
        discount_amount: globalDiscount,
        discount_type: globalDiscountType,
        currency,
        exchange_rate: exchangeRate,
        salesperson_id: salespersonId
      };
      
      let finalAccEntries = [];
      if (isInventory) {
        finalAccEntries = [
          {
            ledger_id: partyLedgerId,
            debit: vType === 'Sales' ? finalTotal : 0,
            credit: vType === 'Purchase' ? finalTotal : 0,
            entry_index: 0
          },
          {
            ledger_id: salesPurchaseLedgerId,
            debit: vType === 'Purchase' ? finalTotal : 0,
            credit: vType === 'Sales' ? finalTotal : 0,
            entry_index: 1
          }
        ];
      } else if (isSingleEntry) {
        const mainEntry = {
          ledger_id: bankCashLedgerId,
          debit: vType === 'Receipt' ? totalSingleAmount : 0,
          credit: vType === 'Payment' ? totalSingleAmount : 0,
          entry_index: accEntries.length
        };
        const subEntries = accEntries.filter(e => e.ledger_id && e.amount > 0).map((e, idx) => ({
          ledger_id: e.ledger_id,
          debit: vType === 'Payment' ? e.amount : 0,
          credit: vType === 'Receipt' ? e.amount : 0,
          entry_index: idx
        }));
        finalAccEntries = [...subEntries, mainEntry];
      } else if (isJournal) {
        finalAccEntries = accEntries.filter(e => e.ledger_id && (e.debit > 0 || e.credit > 0)).map((e, idx) => ({
          ...e,
          entry_index: idx
        }));
      }

      if (isEdit) {
        await erpService.updateVoucher(
          id!, 
          voucher, 
          finalAccEntries, 
          isInventory ? invEntries.map(i => ({ ...i, m_type: vType === 'Sales' ? 'Outward' : 'Inward' })) : []
        );
        showNotification('Voucher updated successfully');
      } else {
        await erpService.createVoucher(
          user.companyId,
          user.uid,
          voucher, 
          finalAccEntries, 
          isInventory ? invEntries.map(i => ({ ...i, m_type: vType === 'Sales' ? 'Outward' : 'Inward' })) : []
        );
        showNotification(notifications.voucherSaved);
      }
      navigate('/reports/daybook');
    } catch (err) {
      console.error('Error saving voucher:', err);
      showNotification('Failed to save voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.companyId) return;
    console.log('Deleting voucher with ID:', id);
    setLoading(true);
    try {
      if (!id) throw new Error('No voucher ID found');
      await erpService.deleteVoucher(id);
      showNotification('Voucher deleted successfully');
      navigate('/reports/daybook');
    } catch (err) {
      console.error('Error deleting voucher:', err);
      showNotification('Failed to delete voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!refNo) return;
    const doc = pdfService.generateVoucherPDF({
      v_no: refNo,
      v_date: vDate,
      v_type: vType,
      narration,
      total_amount: finalTotal,
      entries: isInventory ? [
        { ledger_name: ledgers.find(l => l.id === partyLedgerId)?.name || 'Party', debit: vType === 'Sales' ? finalTotal : 0, credit: vType === 'Purchase' ? finalTotal : 0 },
        { ledger_name: ledgers.find(l => l.id === salesPurchaseLedgerId)?.name || 'Sales/Purchase', debit: vType === 'Purchase' ? finalTotal : 0, credit: vType === 'Sales' ? finalTotal : 0 }
      ] : accEntries.map(e => ({
        ledger_name: ledgers.find(l => l.id === e.ledger_id)?.name || 'Unknown',
        debit: e.debit,
        credit: e.credit
      }))
    }, settings);
    doc.save(`Voucher_${refNo}.pdf`);
  };

  const handleShare = (platform: 'whatsapp' | 'email') => {
    const partyName = ledgers.find(l => l.id === partyLedgerId)?.name || 'Customer';
    const voucherData = {
      v_no: refNo,
      v_date: vDate,
      v_type: vType,
      party_name: partyName,
      items: invEntries.map(entry => ({
        name: items.find(i => i.id === entry.item_id)?.name || 'Unknown Item',
        quantity: entry.qty,
        rate: entry.rate,
        amount: entry.amount,
        tax_percent: entry.tax_percent,
        batch_no: entry.batch_no,
        expiry_date: entry.expiry_date
      })),
      total_amount: finalTotal,
      currency,
      exchange_rate: exchangeRate
    };

    if (platform === 'whatsapp') {
      pdfService.shareViaWhatsApp(voucherData, settings);
      showNotification('Opening WhatsApp...', 'success');
    } else {
      pdfService.shareViaEmail(voucherData, settings);
      showNotification('Opening Email Client...', 'success');
    }
    setShowShareMenu(false);
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="bg-card border border-border overflow-hidden">
        {/* Tally-style Top Bar */}
        <div className="flex bg-card border-b border-border overflow-x-auto no-scrollbar whitespace-nowrap">
          {['Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 'Journal']
            .filter(type => isInventoryEnabled || (type !== 'Sales' && type !== 'Purchase'))
            .map(type => (
            <button
              key={type}
              onClick={() => {
                setVType(type);
                setPartyLedgerId('');
                setSalesPurchaseLedgerId('');
                setBankCashLedgerId('');
                setAccEntries([{ ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }]);
                setInvEntries([{ item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]);
              }}
              className={cn(
                "px-4 lg:px-6 py-3 text-[10px] uppercase tracking-widest font-bold border-r border-border transition-all flex-shrink-0",
                vType === type ? "bg-foreground text-background" : "text-gray-500 hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Voucher Header Section */}
        <div className="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 border-b border-border bg-foreground/5">
          <div className="space-y-2">
            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Reference No.</label>
            <input 
              type="text" 
              value={refNo || ''}
              onChange={e => setRefNo(e.target.value)}
              placeholder="e.g. REF-001"
              tabIndex={1}
              className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Date</label>
            <input 
              type="date" 
              value={vDate || ''}
              onChange={e => setVDate(e.target.value)}
              tabIndex={2}
              className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Voucher Type</label>
              <button 
                onClick={() => {
                  const shortcuts = [
                    { key: 'F4', action: 'Contra' },
                    { key: 'F5', action: 'Payment' },
                    { key: 'F6', action: 'Receipt' },
                    { key: 'F7', action: 'Journal' },
                    { key: 'F8', action: 'Sales' },
                    { key: 'F9', action: 'Purchase' },
                    { key: 'Alt + C', action: 'Quick Create' },
                    { key: 'Alt + S', action: 'Save' },
                  ];
                  showNotification(
                    <div className="space-y-2 p-2">
                      <p className="font-bold border-b border-border pb-1">SHORTCUTS</p>
                      {shortcuts.map(s => (
                        <div key={s.key} className="flex justify-between gap-4 text-[10px]">
                          <span className="text-emerald-500 font-bold">{s.key}</span>
                          <span className="uppercase">{s.action}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
                className="text-[9px] text-emerald-500 hover:underline font-bold uppercase"
              >
                Shortcuts
              </button>
            </div>
            <div className="p-2 text-sm text-emerald-500 bg-background border border-border uppercase font-bold">
              {vType}
            </div>
          </div>

          {isMultiCurrencyEnabled && (
            <>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  tabIndex={3}
                  className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Ex. Rate</label>
                  <div className="group relative">
                    <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-foreground text-background text-[8px] uppercase tracking-widest rounded hidden group-hover:block z-50">
                      Exchange Rate: Multiplier to convert transaction currency to base currency ({baseCurrencySymbol}).
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(Number(e.target.value))}
                  tabIndex={4}
                  className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                />
              </div>
            </>
          )}

          {vType === 'Sales' && (
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Salesperson</label>
              <select
                value={salespersonId}
                onChange={e => setSalespersonId(e.target.value)}
                tabIndex={5}
                className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
              >
                <option value="">Select Salesperson...</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type Specific Header Fields */}
          {(isInventory || isJournal) && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Party A/c Name</label>
                  <button 
                    type="button" 
                    onClick={() => openQuickLedger('Sundry', 'party')}
                    className="text-[8px] text-gray-500 hover:text-foreground flex items-center gap-1"
                  >
                    <PlusCircle className="w-2 h-2" /> Quick
                  </button>
                </div>
                <SearchableSelect
                  options={ledgers}
                  value={partyLedgerId}
                  onChange={setPartyLedgerId}
                  placeholder="Select Party..."
                  onQuickCreate={() => openQuickLedger('Sundry', 'party')}
                  tabIndex={6}
                />
                {partyLedgerId && balances[partyLedgerId] !== undefined && (
                  <p className="text-[9px] text-gray-500 uppercase mt-1">
                    Current Balance: <span className="font-bold text-foreground">{formatBalance(balances[partyLedgerId])}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {isInventory && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{vType} Ledger</label>
                  <button 
                    type="button" 
                    onClick={() => openQuickLedger(vType, 'sales')}
                    className="text-[8px] text-gray-500 hover:text-foreground flex items-center gap-1"
                  >
                    <PlusCircle className="w-2 h-2" /> Quick
                  </button>
                </div>
                <SearchableSelect
                  options={ledgers.filter(l => l.ledger_groups?.name.includes(vType))}
                  value={salesPurchaseLedgerId}
                  onChange={setSalesPurchaseLedgerId}
                  placeholder={`Select ${vType} Ledger...`}
                  onQuickCreate={() => openQuickLedger(vType, 'sales')}
                  tabIndex={7}
                />
                {salesPurchaseLedgerId && balances[salesPurchaseLedgerId] !== undefined && (
                  <p className="text-[9px] text-gray-500 uppercase mt-1">
                    Current Balance: <span className="font-bold text-foreground">{formatBalance(balances[salesPurchaseLedgerId])}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {isSingleEntry && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Account (Bank/Cash)</label>
                <button 
                  type="button" 
                  onClick={() => openQuickLedger('Bank', 'account')}
                  className="text-[8px] text-gray-500 hover:text-foreground flex items-center gap-1"
                >
                  <PlusCircle className="w-2 h-2" /> Quick
                </button>
              </div>
              <SearchableSelect
                options={ledgers.filter(l => l.ledger_groups?.name.includes('Bank') || l.ledger_groups?.name.includes('Cash'))}
                value={bankCashLedgerId}
                onChange={setBankCashLedgerId}
                placeholder="Select Account..."
                onQuickCreate={() => openQuickLedger('Bank', 'account')}
                tabIndex={6}
              />
              {bankCashLedgerId && balances[bankCashLedgerId] !== undefined && (
                <p className="text-[9px] text-gray-500 uppercase mt-1">
                  Current Balance: <span className="font-bold text-foreground">{formatBalance(balances[bankCashLedgerId])}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main Entry Table */}
        <div className="min-h-[300px] overflow-x-auto no-scrollbar">
          {isInventory ? (
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-foreground/5 text-gray-500 uppercase text-[9px]">
                <tr>
                  <th className="px-4 lg:px-6 py-3 border-b border-border">
                    <div className="flex justify-between items-center">
                      <span>Name of Item</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setPendingRowIdx(invEntries.length - 1);
                          setIsQuickItemOpen(true);
                        }}
                        className="text-[8px] text-amber-600 hover:text-amber-500 font-bold uppercase flex items-center gap-1"
                      >
                        <PlusCircle className="w-2 h-2" /> Quick
                      </button>
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border">Godown</th>
                  {isBatchEnabled && (
                    <th className="px-4 lg:px-6 py-3 border-b border-border text-left w-32">Batch</th>
                  )}
                  {isExpiryEnabled && (
                    <th className="px-4 lg:px-6 py-3 border-b border-border text-left w-32">Expiry</th>
                  )}
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-24">Quantity</th>
                  {showFreeQty && (
                    <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-24">Free</th>
                  )}
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-32">Rate</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-center w-20">per</th>
                  {showDiscPercent && (
                    <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-24">Disc %</th>
                  )}
                  {isTaxEnabled && showTaxPercent && (
                    <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-24">Tax %</th>
                  )}
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-40">Amount</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invEntries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-foreground/5">
                    <td className="px-4 lg:px-6 py-2">
                      <div className="flex flex-col gap-1">
                        <SearchableSelect
                          options={items}
                          value={entry.item_id}
                          onChange={(val) => {
                            const next = [...invEntries];
                            const item = items.find(i => i.id === val);
                            next[idx].item_id = val;
                            next[idx].unit = item?.unit_name || 'pcs';
                            setInvEntries(next);
                            fetchItemStock(val, entry.godown_id);
                          }}
                          placeholder="Select Item..."
                          onQuickCreate={() => {
                            setPendingRowIdx(idx);
                            setIsQuickItemOpen(true);
                          }}
                          tabIndex={8 + idx * 10}
                        />
                        {entry.item_id && itemStocks[`${entry.item_id}-${entry.godown_id}`] !== undefined && (
                          <p className="text-[8px] text-gray-500 uppercase">
                            Stock: <span className="font-bold text-foreground">{itemStocks[`${entry.item_id}-${entry.godown_id}`]} {entry.unit}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-2">
                      <SearchableSelect
                        options={godowns}
                        value={entry.godown_id}
                        onChange={(val) => {
                          const next = [...invEntries];
                          next[idx].godown_id = val;
                          setInvEntries(next);
                        }}
                        placeholder="Select Godown..."
                        tabIndex={9 + idx * 10}
                      />
                    </td>
                    {isBatchEnabled && (
                      <td className="px-4 lg:px-6 py-2">
                        <input 
                          type="text" 
                          className="bg-transparent border border-border text-foreground outline-none w-full text-xs p-1 focus:border-foreground" 
                          placeholder="Batch"
                          value={entry.batch_no || ''} 
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].batch_no = e.target.value;
                            setInvEntries(next);
                          }} 
                        />
                      </td>
                    )}
                    {isExpiryEnabled && (
                      <td className="px-4 lg:px-6 py-2">
                        <input 
                          type="date" 
                          className="bg-transparent border border-border text-foreground outline-none w-full text-[10px] p-1 focus:border-foreground" 
                          value={entry.expiry_date || ''} 
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].expiry_date = e.target.value;
                            setInvEntries(next);
                          }} 
                        />
                      </td>
                    )}
                    <td className="px-4 lg:px-6 py-2">
                      <input 
                        type="number" 
                        tabIndex={10 + idx * 10}
                        className="bg-transparent border-none text-foreground outline-none w-full text-right" 
                        value={entry.qty ?? ''} 
                        onChange={e => {
                          const next = [...invEntries];
                          const val = Number(e.target.value);
                          next[idx].qty = val;
                          
                          // Auto-calculate free quantity based on scheme
                          const item = items.find(i => i.id === entry.item_id);
                          if (item && item.scheme_qty && item.scheme_free_qty && val >= item.scheme_qty) {
                            const multiplier = Math.floor(val / item.scheme_qty);
                            next[idx].free_qty = multiplier * item.scheme_free_qty;
                          }

                          next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                          setInvEntries(next);
                        }} 
                      />
                    </td>
                    {showFreeQty && (
                      <td className="px-4 lg:px-6 py-2">
                        <input 
                          type="number" 
                          tabIndex={11 + idx * 10}
                          className="bg-transparent border-none text-foreground outline-none w-full text-right text-emerald-500 font-bold" 
                          value={entry.free_qty ?? ''} 
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].free_qty = Number(e.target.value);
                            setInvEntries(next);
                          }} 
                        />
                      </td>
                    )}
                    <td className="px-4 lg:px-6 py-2">
                      <input 
                        type="number" 
                        tabIndex={12 + idx * 10}
                        className="bg-transparent border-none text-foreground outline-none w-full text-right" 
                        value={entry.rate ?? ''} 
                        onChange={e => {
                          const next = [...invEntries];
                          next[idx].rate = Number(e.target.value);
                          next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                          setInvEntries(next);
                        }} 
                      />
                    </td>
                    <td className="px-4 lg:px-6 py-2 text-center text-gray-500 uppercase text-[10px]">
                      <span 
                        tabIndex={13 + idx * 10}
                        className="outline-none focus:ring-1 focus:ring-foreground/20 px-1 rounded"
                      >
                        {entry.unit}
                      </span>
                    </td>
                    {showDiscPercent && (
                      <td className="px-4 lg:px-6 py-2">
                        <input 
                          type="number" 
                          tabIndex={14 + idx * 10}
                          className="bg-transparent border-none text-foreground outline-none w-full text-right" 
                          value={entry.disc_percent ?? ''} 
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].disc_percent = Number(e.target.value);
                            next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                            setInvEntries(next);
                          }} 
                        />
                      </td>
                    )}
                    {isTaxEnabled && showTaxPercent && (
                      <td className="px-4 lg:px-6 py-2">
                        <input 
                          type="number" 
                          tabIndex={15 + idx * 10}
                          className="bg-transparent border border-border text-foreground outline-none w-full text-right p-1 focus:border-foreground" 
                          value={entry.tax_percent ?? ''} 
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].tax_percent = Number(e.target.value);
                            next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                            setInvEntries(next);
                          }} 
                        />
                      </td>
                    )}
                    <td className="px-4 lg:px-6 py-2 text-right text-foreground font-bold">
                      <span 
                        tabIndex={16 + idx * 10}
                        className="outline-none focus:ring-1 focus:ring-foreground/20 px-1 rounded block"
                      >
                        {baseCurrencySymbol} {entry.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-2"><button onClick={() => setInvEntries(invEntries.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-rose-900 group-hover:text-rose-500" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : isSingleEntry ? (
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead className="bg-foreground/5 text-gray-500 uppercase text-[9px]">
                <tr>
                  <th className="px-4 lg:px-6 py-3 border-b border-border">Particulars</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-48">Amount</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accEntries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-foreground/5">
                    <td className="px-4 lg:px-6 py-2">
                      <div className="flex items-center gap-2">
                        <SearchableSelect
                          options={ledgers}
                          value={entry.ledger_id}
                          onChange={(val) => {
                            const next = [...accEntries];
                            next[idx].ledger_id = val;
                            setAccEntries(next);
                          }}
                          placeholder="Select Particulars..."
                          onQuickCreate={() => openQuickLedger('', 'particulars', idx)}
                        />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-2">
                      <input type="number" className="bg-transparent border-none text-foreground outline-none w-full text-right" value={entry.amount ?? ''} onChange={e => {
                        const next = [...accEntries];
                        next[idx].amount = Number(e.target.value);
                        setAccEntries(next);
                      }} />
                    </td>
                    <td className="px-4 lg:px-6 py-2"><button onClick={() => setAccEntries(accEntries.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-rose-900 group-hover:text-rose-500" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-foreground/5 text-gray-500 uppercase text-[9px]">
                <tr>
                  <th className="px-4 lg:px-6 py-3 border-b border-border w-20">Dr/Cr</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border">Particulars</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-48">Debit</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border text-right w-48">Credit</th>
                  <th className="px-4 lg:px-6 py-3 border-b border-border w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accEntries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-foreground/5">
                    <td className="px-4 lg:px-6 py-2">
                      <select 
                        value={entry.type}
                        onChange={e => {
                          const next = [...accEntries];
                          next[idx].type = e.target.value;
                          if (next[idx].type === 'Dr') next[idx].credit = 0;
                          else next[idx].debit = 0;
                          setAccEntries(next);
                        }}
                        className="bg-transparent border-none text-foreground outline-none w-full"
                      >
                        <option value="Dr">Dr</option>
                        <option value="Cr">Cr</option>
                      </select>
                    </td>
                    <td className="px-4 lg:px-6 py-2">
                      <div className="flex items-center gap-2">
                        <SearchableSelect
                          options={ledgers}
                          value={entry.ledger_id}
                          onChange={(val) => {
                            const next = [...accEntries];
                            next[idx].ledger_id = val;
                            setAccEntries(next);
                          }}
                          placeholder="Select Particulars..."
                          onQuickCreate={() => openQuickLedger('', 'particulars', idx)}
                        />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-2">
                      <input 
                        type="number" 
                        disabled={entry.type === 'Cr'}
                        className={cn(
                          "bg-transparent border-none text-foreground outline-none w-full text-right",
                          entry.type === 'Cr' && "opacity-20"
                        )} 
                        value={entry.debit ?? ''} 
                        onChange={e => {
                          const next = [...accEntries];
                          next[idx].debit = Number(e.target.value);
                          setAccEntries(next);
                        }} 
                      />
                    </td>
                    <td className="px-4 lg:px-6 py-2">
                      <input 
                        type="number" 
                        disabled={entry.type === 'Dr'}
                        className={cn(
                          "bg-transparent border-none text-foreground outline-none w-full text-right",
                          entry.type === 'Dr' && "opacity-20"
                        )} 
                        value={entry.credit ?? ''} 
                        onChange={e => {
                          const next = [...accEntries];
                          next[idx].credit = Number(e.target.value);
                          setAccEntries(next);
                        }} 
                      />
                    </td>
                    <td className="px-4 lg:px-6 py-2"><button onClick={() => setAccEntries(accEntries.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-rose-900 group-hover:text-rose-500" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div />

          {isInventory && isBarcodeEnabled && (
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-gray-500 uppercase font-bold">Barcode Scan</label>
              <input
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeScan(barcodeInput);
                  }
                }}
                placeholder="Scan barcode..."
                className="bg-background border border-border text-foreground p-1 text-[10px] outline-none focus:border-foreground w-40"
              />
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-4 lg:p-6 border-t border-border bg-foreground/5 space-y-6">
          <div className="flex justify-start mb-4">
            <button 
              onClick={() => isInventory ? setInvEntries([...invEntries, { item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]) : setAccEntries([...accEntries, { ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }])}
              tabIndex={500}
              className="px-6 py-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" /> Add Line Item
            </button>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-2 order-2 lg:order-1">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Narration</label>
              <textarea
                value={narration || ''}
                onChange={e => setNarration(e.target.value)}
                tabIndex={501}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-20 lg:h-24 resize-none"
                placeholder="Enter narration details..."
              />
            </div>
            <div className="flex flex-col justify-end items-start lg:items-end space-y-4 order-1 lg:order-2">
              <div className="flex items-center gap-4 bg-background border border-border p-2 rounded mb-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold">Disc</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={globalDiscount ?? ''} 
                    onChange={e => setGlobalDiscount(Number(e.target.value))}
                    tabIndex={502}
                    className="w-20 bg-transparent border-none text-right text-sm outline-none font-bold"
                    placeholder="0"
                  />
                  <select 
                    value={globalDiscountType}
                    onChange={e => setGlobalDiscountType(e.target.value as 'fixed' | 'percent')}
                    tabIndex={503}
                    className="bg-transparent border-none text-[10px] outline-none font-bold text-gray-500"
                  >
                    <option value="fixed">{baseCurrencySymbol}</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div className="text-left lg:text-right space-y-1">
                {totalTaxAmount > 0 && (
                  <p className="text-[10px] text-emerald-500 font-bold">
                    Tax: {currency} {totalTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-[9px] text-gray-500 uppercase">Total Amount</p>
                <p className="text-2xl lg:text-3xl text-foreground font-bold tracking-tighter">
                  {currency} {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                {isEdit && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 lg:flex-none px-6 lg:px-8 py-2 border border-rose-900/50 text-[10px] text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash className="w-3 h-3" /> Delete
                  </button>
                )}
                {(isEdit || isBalanced()) && (
                  <div className="relative flex-1 lg:flex-none">
                    <button 
                      type="button"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-full px-6 lg:px-8 py-2 border border-border text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                    {showShareMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border shadow-xl z-50">
                        <button 
                          onClick={() => handleShare('whatsapp')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-foreground/5 text-left"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          WhatsApp
                        </button>
                        <button 
                          onClick={() => handleShare('email')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-foreground/5 text-left"
                        >
                          <Mail className="w-4 h-4 text-blue-500" />
                          Email
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={loading || !isBalanced()}
                  tabIndex={504}
                  className="flex-1 lg:flex-none px-6 lg:px-8 py-2 border border-border text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Print
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isBalanced() || loading}
                  tabIndex={505}
                  className={cn(
                    "flex-1 lg:flex-none px-8 lg:px-12 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                    isBalanced() ? "bg-foreground text-background hover:opacity-90 shadow-lg" : "bg-border text-gray-600 cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (isEdit ? 'Update' : 'Accept')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error Bar */}
        {!isBalanced() && (totalDebit > 0 || totalInvAmount > 0 || totalSingleAmount > 0) && (
          <div className="bg-rose-950/30 border-t border-rose-900/50 px-6 py-2 text-[9px] text-rose-400 uppercase tracking-widest text-center">
            {isInventory ? 'Please select Party, Ledger and Items' : isSingleEntry ? 'Please select Account and Particulars' : `Voucher is not balanced. Difference: ৳ ${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
          </div>
        )}
      </div>

      <QuickLedgerModal
        isOpen={isQuickLedgerOpen}
        onClose={() => setIsQuickLedgerOpen(false)}
        onSuccess={handleQuickLedgerSuccess}
        initialGroup={quickLedgerHint}
      />

      <QuickItemModal
        isOpen={isQuickItemOpen}
        onClose={() => setIsQuickItemOpen(false)}
        onSuccess={handleQuickItemSuccess}
      />
    </div>
  );
}
