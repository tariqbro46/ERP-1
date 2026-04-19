import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer, Loader2, PlusCircle, Trash, Share2, MessageSquare, Mail, X, Download, Scan, Calendar as CalendarIcon, AlertCircle, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SearchableSelect } from './SearchableSelect';
import { QuickLedgerModal } from './QuickLedgerModal';
import { QuickItemModal } from './QuickItemModal';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printVoucher } from '../utils/printUtils';
import { pdfService } from '../services/pdfService';
import { BankDetails, VoucherType, UserRole, Company, Ledger, Voucher, UserProfile, VoucherEntry as VoucherEntryType, InventoryEntry, Item } from '../types';

function Toggle({ enabled, onChange, label }: { enabled: boolean, onChange: () => void, label: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">{label}</span>
      <button
        onClick={onChange}
        className={cn(
          "w-10 h-5 rounded-full transition-all relative",
          enabled ? "bg-foreground" : "bg-foreground/10"
        )}
      >
        <div className={cn(
          "absolute top-1 w-3 h-3 rounded-full transition-all",
          enabled ? "right-1 bg-background" : "left-1 bg-foreground/50"
        )} />
      </button>
    </div>
  );
}

const getVoucherColor = (type: string) => {
  switch (type) {
    case 'Sales': return 'text-emerald-500';
    case 'Purchase': return 'text-blue-500';
    case 'Payment': return 'text-rose-500';
    case 'Receipt': return 'text-amber-500';
    case 'Contra': return 'text-indigo-500';
    case 'Journal': return 'text-purple-500';
    default: return 'text-emerald-500';
  }
};

const getVoucherBgColor = (type: string) => {
  switch (type) {
    case 'Sales': return 'bg-emerald-500';
    case 'Purchase': return 'bg-blue-500';
    case 'Payment': return 'bg-rose-500';
    case 'Receipt': return 'bg-amber-500';
    case 'Contra': return 'bg-indigo-500';
    case 'Journal': return 'bg-purple-500';
    default: return 'bg-emerald-500';
  }
};

const getVoucherHoverBgColor = (type: string) => {
  switch (type) {
    case 'Sales': return 'hover:bg-emerald-600';
    case 'Purchase': return 'hover:bg-blue-600';
    case 'Payment': return 'hover:bg-rose-600';
    case 'Receipt': return 'hover:bg-amber-600';
    case 'Contra': return 'hover:bg-indigo-600';
    case 'Journal': return 'hover:bg-purple-600';
    default: return 'hover:bg-emerald-600';
  }
};

import { useSubscription } from '../hooks/useSubscription';

export function VoucherEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { checkLimit } = useSubscription();
  const isEdit = !!id;
  const { showNotification } = useNotification();
  const settings = useSettings();
  const { notifications, features = [], companyName, baseCurrencySymbol = '৳', refNoFormat, showFreeQty, showDiscPercent, showTaxPercent, updateSettings, voucherHeaderCompact, voucherTableCompact } = settings;
  const [vType, setVType] = useState('Sales');

  const toggleFeature = (id: string) => {
    const newFeatures = features.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    updateSettings({ features: newFeatures });
  };

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
  const [isVoucherSettingsOpen, setIsVoucherSettingsOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [quickLedgerHint, setQuickLedgerHint] = useState('');
  const [pendingRowIdx, setPendingRowIdx] = useState<number | null>(null);
  const [pendingField, setPendingField] = useState<'party' | 'sales' | 'account' | 'particulars' | null>(null);
  
  // Common Header Fields
  const [vDate, setVDate] = useState(new Date().toISOString().split('T')[0]);
  const [refNo, setRefNo] = useState('');
  const [partyLedgerId, setPartyLedgerId] = useState('');
  const [salesPurchaseLedgerId, setSalesPurchaseLedgerId] = useState('');
  const [bankCashLedgerId, setBankCashLedgerId] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    transaction_type: 'Cheque',
    instrument_no: '',
    instrument_date: new Date().toISOString().split('T')[0],
    bank_name: ''
  });
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
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemStocks(prev => ({ ...prev, [`${itemId}-${godownId}`]: item.current_stock || 0 }));
    }
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
    } else if (location.state?.orderData) {
      handleOrderConversion(location.state.orderData);
    } else {
      fetchNextNo();
    }
  }, [id, location.state]);

  const handleOrderConversion = (order: any) => {
    if (!isInventoryEnabled) {
      showNotification('Inventory features are disabled. Cannot convert order to Sales Voucher.', 'error');
      return;
    }
    setVType('Sales');
    setPartyLedgerId(order.clientId || '');
    
    if (order.items && order.items.length > 0) {
      const newInvEntries = order.items.map((item: any) => ({
        item_id: item.itemId || '',
        godown_id: '',
        qty: item.quantity || 0,
        free_qty: 0,
        rate: item.price || 0,
        disc_percent: 0,
        tax_percent: 0,
        amount: (item.quantity || 0) * (item.price || 0),
        unit: 'pcs',
        batch_no: '',
        expiry_date: ''
      }));
      setInvEntries(newInvEntries);
    } else {
      // Legacy order support
      setInvEntries([{
        item_id: order.itemId || '',
        godown_id: '',
        qty: order.quantity || 0,
        free_qty: 0,
        rate: order.price || 0,
        disc_percent: 0,
        tax_percent: 0,
        amount: (order.quantity || 0) * (order.price || 0),
        unit: 'pcs',
        batch_no: '',
        expiry_date: ''
      }]);
    }
    
    fetchNextNo();
  };

  const handleClearVoucher = () => {
    setVDate(new Date().toISOString().split('T')[0]);
    setRefNo('');
    setPartyLedgerId('');
    setSalesPurchaseLedgerId('');
    setBankCashLedgerId('');
    setNarration('');
    setGlobalDiscount(0);
    setGlobalDiscountType('fixed');
    setCurrency(baseCurrencySymbol);
    setExchangeRate(1);
    setSalespersonId('');
    setAccEntries([{ ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }]);
    setInvEntries([{ item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]);
    setIsClearModalOpen(false);
    showNotification('Voucher cleared successfully', 'success');
  };

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
      setVType(v.v_type || 'Sales');
      setVDate(v.v_date || new Date().toISOString().split('T')[0]);
      setRefNo(v.v_no || '');
      setNarration(v.narration || '');
      setGlobalDiscount(v.discount_amount || 0);
      setGlobalDiscountType(v.discount_type || 'fixed');
      setCurrency(v.currency || baseCurrencySymbol);
      setExchangeRate(v.exchange_rate || 1);
      setSalespersonId(v.salesperson_id || '');
      if (v.bank_details) {
        setBankDetails({
          transaction_type: v.bank_details.transaction_type || 'Cheque',
          instrument_no: v.bank_details.instrument_no || '',
          instrument_date: v.bank_details.instrument_date || new Date().toISOString().split('T')[0],
          bank_name: v.bank_details.bank_name || ''
        });
      }

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
          item_id: i.item_id || '',
          godown_id: i.godown_id || '',
          qty: i.qty || 0,
          free_qty: i.free_qty || 0,
          rate: i.rate || 0,
          disc_percent: i.discount_percent || 0,
          tax_percent: i.tax_percent || 0,
          batch_no: i.batch_no || '',
          expiry_date: i.expiry_date || '',
          amount: i.amount || 0,
          unit: i.unit_name || 'pcs'
        }));
        setInvEntries(inv.length > 0 ? inv : [{ item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]);
      } else if (v.v_type === 'Journal') {
        // For Journal, we might have a party tagged in the first entry if it's a specific type
        setPartyLedgerId(v.entries[0]?.ledger_id || '');
        setAccEntries(v.entries.map((e: any) => ({
          ledger_id: e.ledger_id || '',
          debit: e.debit || 0,
          credit: e.credit || 0,
          type: e.debit > 0 ? 'Dr' : 'Cr',
          amount: Math.max(e.debit || 0, e.credit || 0)
        })));
      } else if (v.v_type === 'Payment' || v.v_type === 'Receipt' || v.v_type === 'Contra') {
        // In our save logic: last entry is bank/cash
        const mainEntry = v.entries[v.entries.length - 1];
        setBankCashLedgerId(mainEntry?.ledger_id || '');
        setAccEntries(v.entries.slice(0, -1).map((e: any) => ({
          ledger_id: e.ledger_id || '',
          amount: Math.max(e.debit || 0, e.credit || 0),
          debit: e.debit || 0,
          credit: e.credit || 0,
          type: e.debit > 0 ? 'Dr' : 'Cr'
        })));
      } else {
        setAccEntries(v.entries.map((e: any) => ({
          ledger_id: e.ledger_id || '',
          debit: e.debit || 0,
          credit: e.credit || 0,
          type: e.debit > 0 ? 'Dr' : 'Cr',
          amount: Math.max(e.debit || 0, e.credit || 0)
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

  const isBankLedger = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    return ledger?.group_name?.toLowerCase().includes('bank') || 
           ledger?.ledger_groups?.name?.toLowerCase().includes('bank');
  };

  const showBankDetails = (isSingleEntry && isBankLedger(bankCashLedgerId)) || 
                         (isJournal && accEntries.some(e => isBankLedger(e.ledger_id))) ||
                         (vType === 'Contra' && (isBankLedger(bankCashLedgerId) || accEntries.some(e => isBankLedger(e.ledger_id))));

  const handleSave = async () => {
    if (!isBalanced() || !user?.companyId) return;
    setLoading(true);
    try {
      // Check subscription limits
      if (!isEdit) {
        const count = await erpService.getCollectionCount('vouchers', user.companyId);
        if (!checkLimit('vouchers', count)) {
          setLoading(false);
          return;
        }
      }

      if (exchangeRate !== 1) {
        if (!checkLimit('multiCurrency')) {
          setLoading(false);
          return;
        }
      }

      // Determine the primary "Party" or "Particulars" ledger name for reports
      let partyLedgerName = '';
      
      if (vType === 'Sales' || vType === 'Purchase') {
        partyLedgerName = ledgers.find(l => l.id === partyLedgerId)?.name || '';
      } else if (vType === 'Payment' || vType === 'Receipt' || vType === 'Contra') {
        // For Receipt/Payment/Contra, we ALWAYS prioritize the ledgers selected in the rows 
        // (the "Particulars" table) as the primary report party.
        const rowEntries = accEntries.filter(e => e.ledger_id && e.amount > 0);
        
        if (rowEntries.length === 1) {
          partyLedgerName = ledgers.find(l => l.id === rowEntries[0].ledger_id)?.name || '';
        } else if (rowEntries.length > 1) {
          const names = rowEntries.map(e => ledgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean);
          partyLedgerName = names.length > 0 ? names.join(', ') : 'Multiple Ledgers';
        } else {
          // Fallback only if no rows have ledgers yet
          partyLedgerName = vType;
        }
      } else if (vType === 'Journal') {
        const drEntries = accEntries.filter(e => e.type === 'Dr');
        const crEntries = accEntries.filter(e => e.type === 'Cr');
        if (drEntries.length === 1) {
          partyLedgerName = ledgers.find(l => l.id === drEntries[0].ledger_id)?.name || '';
        } else if (drEntries.length > 1) {
          const names = drEntries.map(e => ledgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean);
          partyLedgerName = names.length > 0 ? names.join(', ') : 'Multiple Ledgers';
        } else {
          partyLedgerName = 'Journal';
        }
      }
      
      // If still empty, try legacy logic to find Debtors/Creditors if applicable
      if (!partyLedgerName) {
        const isDebtorOrCreditor = (l: any) => 
          ['Sundry Debtors', 'Sundry Creditors', 'Sundry Debtor', 'Sundry Creditor', 'Debtors', 'Creditors'].includes(l.group_name);

        const partyLedger = ledgers.find(l => 
          (l.id === partyLedgerId || l.id === bankCashLedgerId || accEntries.some(e => e.ledger_id === l.id)) &&
          isDebtorOrCreditor(l)
        );
        partyLedgerName = partyLedger?.name || '';
      }

      const itemNames = isInventory ? invEntries.map(i => items.find(item => item.id === i.item_id)?.name).filter(Boolean).join(', ') : '';

      const voucher: any = {
        v_no: refNo,
        v_type: vType,
        v_date: vDate,
        narration,
        particulars: partyLedgerName || vType,
        party_ledger_name: partyLedgerName,
        ledger_name: partyLedgerName,
        item_names: itemNames,
        total_amount: finalTotal,
        tax_amount: totalTaxAmount,
        discount_amount: globalDiscount,
        discount_type: globalDiscountType,
        currency,
        exchange_rate: exchangeRate,
        salesperson_id: salespersonId
      };

      if (showBankDetails && bankDetails) {
        // Ensure no undefined fields in bankDetails
        const cleanBankDetails = {
          transaction_type: bankDetails.transaction_type || 'Others',
          instrument_no: bankDetails.instrument_no || '',
          instrument_date: bankDetails.instrument_date || '',
          bank_name: bankDetails.bank_name || ''
        };
        voucher.bank_details = cleanBankDetails;
      }
      
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
          isInventory ? invEntries.map(i => ({ 
            ...i, 
            item_name: items.find(item => item.id === i.item_id)?.name,
            m_type: vType === 'Sales' ? 'Outward' : 'Inward' 
          })) : []
        );
        showNotification('Voucher updated successfully');
      } else {
        await erpService.createVoucher(
          user.companyId,
          user.uid,
          voucher, 
          finalAccEntries, 
          isInventory ? invEntries.map(i => ({ 
            ...i, 
            item_name: items.find(item => item.id === i.item_id)?.name,
            m_type: vType === 'Sales' ? 'Outward' : 'Inward' 
          })) : []
        );
        showNotification(notifications.voucherSaved);
      }
      navigate(-1);
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
      <div className="bg-card border border-border overflow-hidden flex flex-col h-auto lg:h-[calc(100vh-2rem)]">
        {/* Voucher Header Section */}
        <div className={cn(
          "border-b border-border bg-foreground/5 shrink-0",
          voucherHeaderCompact ? "p-2 lg:p-3 space-y-3" : "p-2 lg:p-6 space-y-3 lg:space-y-6"
        )}>
          {/* Row 0: Voucher Type (Mobile only at top) */}
          <div className="lg:hidden grid grid-cols-1 gap-2">
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.voucherType')}</label>
                <button 
                  onClick={() => setIsVoucherSettingsOpen(true)}
                  className="text-[9px] text-blue-500 hover:underline font-bold uppercase"
                >
                  {t('nav.settings')}
                </button>
              </div>
              <select
                value={vType}
                onChange={e => {
                  setVType(e.target.value);
                  setPartyLedgerId('');
                  setSalesPurchaseLedgerId('');
                  setBankCashLedgerId('');
                  setAccEntries([{ ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }]);
                  setInvEntries([{ item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]);
                }}
                tabIndex={1}
                className={cn(
                  "w-full bg-background border border-border p-1.5 text-xs outline-none focus:border-foreground font-bold uppercase",
                  getVoucherColor(vType)
                )}
              >
                {['Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 'Journal']
                  .filter(type => isInventoryEnabled || (type !== 'Sales' && type !== 'Purchase'))
                  .map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 1: Reference No., Date, Currency, Ex. Rate, Voucher Type (Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-6">
            <div className="space-y-1 lg:space-y-2">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.referenceNo')}</label>
              <input 
                type="text" 
                value={refNo || ''}
                onChange={e => setRefNo(e.target.value)}
                placeholder="e.g. REF-001"
                tabIndex={2}
                className="w-full bg-background border border-border text-foreground p-1.5 lg:p-2 text-xs lg:text-sm outline-none focus:border-foreground" 
              />
            </div>
            <div className="space-y-1 lg:space-y-2">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.date')}</label>
              <input 
                type="date" 
                value={vDate || ''}
                onChange={e => setVDate(e.target.value)}
                tabIndex={3}
                className="w-full bg-background border border-border text-foreground p-1.5 lg:p-2 text-xs lg:text-sm outline-none focus:border-foreground" 
              />
            </div>

            {isMultiCurrencyEnabled ? (
              <>
                <div className="space-y-1 lg:space-y-2">
                  <div className="flex items-center h-4">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.currency')}</label>
                  </div>
                  <select
                    value={currency}
                    onChange={e => {
                      if (e.target.value !== baseCurrencySymbol) {
                        if (!checkLimit('multiCurrency')) return;
                      }
                      setCurrency(e.target.value);
                    }}
                    tabIndex={4}
                    className="w-full bg-background border border-border text-foreground p-1.5 lg:p-2 text-xs lg:text-sm outline-none focus:border-foreground"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="space-y-1 lg:space-y-2">
                  <div className="flex items-center gap-2 h-4">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.exchangeRate')}</label>
                    <div className="group relative">
                      <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-foreground text-background text-[8px] uppercase tracking-widest rounded hidden group-hover:block z-50">
                        {t('common.exchangeRateDesc')}
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val !== 1) {
                        if (!checkLimit('multiCurrency')) return;
                      }
                      setExchangeRate(val);
                    }}
                    onFocus={e => e.target.value === '0' && e.target.select()}
                    tabIndex={5}
                    className="w-full bg-background border border-border text-foreground p-1.5 lg:p-2 text-xs lg:text-sm outline-none focus:border-foreground"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="hidden lg:block"></div>
                <div className="hidden lg:block"></div>
              </>
            )}

            {/* Voucher Type for Desktop (Row 1, Col 5) */}
            <div className="hidden lg:block space-y-1 lg:space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.voucherType')}</label>
                <button 
                  onClick={() => setIsVoucherSettingsOpen(true)}
                  className="text-[9px] text-blue-500 hover:underline font-bold uppercase"
                >
                  {t('nav.settings')}
                </button>
              </div>
              <select
                value={vType}
                onChange={e => {
                  setVType(e.target.value);
                  setPartyLedgerId('');
                  setSalesPurchaseLedgerId('');
                  setBankCashLedgerId('');
                  setAccEntries([{ ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }]);
                  setInvEntries([{ item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }]);
                }}
                tabIndex={1}
                className={cn(
                  "w-full bg-background border border-border p-1.5 lg:p-2 text-xs lg:text-sm outline-none focus:border-foreground font-bold uppercase",
                  getVoucherColor(vType)
                )}
              >
                {['Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 'Journal']
                  .filter(type => isInventoryEnabled || (type !== 'Sales' && type !== 'Purchase'))
                  .map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 2: Party A/c Name, Sales Ledger, Salesperson/Received by/Provided by */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-6">
            {/* Slot 1: Party A/c Name or Account (Bank/Cash) */}
            {(isInventory || isJournal) ? (
              <div className="space-y-1 lg:space-y-2 col-span-2 lg:col-span-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.partyName')}</label>
                  <button 
                    type="button" 
                    onClick={() => openQuickLedger('Sundry', 'party')}
                    className="text-[8px] text-gray-500 hover:text-foreground flex items-center gap-1"
                  >
                    <PlusCircle className="w-2 h-2" /> {t('common.quick')}
                  </button>
                </div>
                <SearchableSelect
                  options={ledgers}
                  value={partyLedgerId}
                  onChange={setPartyLedgerId}
                  placeholder={t('voucher.selectParty')}
                  onQuickCreate={() => openQuickLedger('Sundry', 'party')}
                  tabIndex={6}
                />
                {partyLedgerId && balances[partyLedgerId] !== undefined && (
                  <p className="text-[9px] text-gray-500 uppercase mt-1">
                    {t('common.currentBalance')}: <span className="font-bold text-foreground">{formatBalance(balances[partyLedgerId])}</span>
                  </p>
                )}
              </div>
            ) : isSingleEntry ? (
              <div className="space-y-1 lg:space-y-2 col-span-2 lg:col-span-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.account')}</label>
                  <button 
                    type="button" 
                    onClick={() => openQuickLedger('Bank', 'account')}
                    className="text-[8px] text-gray-500 hover:text-foreground flex items-center gap-1"
                  >
                    <PlusCircle className="w-2 h-2" /> {t('common.quick')}
                  </button>
                </div>
                <SearchableSelect
                  options={ledgers.filter(l => l.ledger_groups?.name.includes('Bank') || l.ledger_groups?.name.includes('Cash'))}
                  value={bankCashLedgerId}
                  onChange={setBankCashLedgerId}
                  placeholder={t('voucher.selectAccount')}
                  onQuickCreate={() => openQuickLedger('Bank', 'account')}
                  tabIndex={6}
                />
                {bankCashLedgerId && balances[bankCashLedgerId] !== undefined && (
                  <p className="text-[9px] text-gray-500 uppercase mt-1">
                    {t('common.currentBalance')}: <span className="font-bold text-foreground">{formatBalance(balances[bankCashLedgerId])}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="hidden lg:block lg:col-span-3"></div>
            )}

            {/* Slot 2: Sales/Purchase Ledger */}
            {isInventory ? (
              <div className="space-y-1 lg:space-y-2 col-span-1 lg:col-span-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                    {vType === 'Sales' ? t('common.salesLedger') : t('common.purchaseLedger')}
                  </label>
                  <button 
                    type="button" 
                    onClick={() => openQuickLedger(vType, 'sales')}
                    className="text-[8px] text-gray-500 hover:text-foreground flex items-center gap-1"
                  >
                    <PlusCircle className="w-2 h-2" /> {t('common.quick')}
                  </button>
                </div>
                <SearchableSelect
                  options={ledgers.filter(l => l.ledger_groups?.name.includes(vType))}
                  value={salesPurchaseLedgerId}
                  onChange={setSalesPurchaseLedgerId}
                  placeholder={vType === 'Sales' ? t('common.salesLedger') : t('common.purchaseLedger')}
                  onQuickCreate={() => openQuickLedger(vType, 'sales')}
                  tabIndex={7}
                />
                {salesPurchaseLedgerId && balances[salesPurchaseLedgerId] !== undefined && (
                  <p className="text-[9px] text-gray-500 uppercase mt-1">
                    {t('common.currentBalance')}: <span className="font-bold text-foreground">{formatBalance(balances[salesPurchaseLedgerId])}</span>
                  </p>
                )}
              </div>
            ) : (vType !== 'Payment' && vType !== 'Receipt') ? (
              <div className="hidden lg:block lg:col-span-1"></div>
            ) : null}

            {/* Slot 3: Salesperson / Received by / Provided by */}
            {(vType === 'Sales' || vType === 'Purchase' || vType === 'Payment' || vType === 'Receipt') ? (
              <div className={cn("space-y-1 lg:space-y-2 col-span-1", (vType === 'Payment' || vType === 'Receipt') ? "lg:col-span-2" : "lg:col-span-1")}>
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                  {vType === 'Sales' ? t('common.salesperson') : (vType === 'Payment' ? t('common.providedBy') : t('common.receivedBy'))}
                </label>
                <select
                  value={salespersonId}
                  onChange={e => setSalespersonId(e.target.value)}
                  tabIndex={5}
                  className="w-full bg-background border border-border text-foreground p-1.5 lg:p-2 text-xs lg:text-sm outline-none focus:border-foreground"
                >
                  <option value="">{t('common.select')} {vType === 'Sales' ? t('common.salesperson') : (vType === 'Payment' ? t('common.providedBy') : t('common.receivedBy'))}...</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden lg:block lg:col-span-1"></div>
            )}
          </div>
        </div>

        {/* Main Entry Table */}
        <div className={cn("lg:flex-1 lg:overflow-y-auto overflow-x-auto no-scrollbar border-b border-border", voucherTableCompact && "p-0.5")}>
          {isInventory ? (
            <div className="min-w-full">
              {/* Desktop Table Header */}
              <table className="w-full text-left text-xs border-collapse hidden lg:table">
                <thead className="bg-foreground/5 text-gray-500 uppercase text-[9px]">
                  <tr>
                    <th className={cn("border-b border-border min-w-[35ch]", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>
                      <div className="flex justify-between items-center">
                        <span>{t('common.itemName')}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setPendingRowIdx(invEntries.length - 1);
                            setIsQuickItemOpen(true);
                          }}
                          className="text-[8px] text-amber-600 hover:text-amber-500 font-bold uppercase flex items-center gap-1"
                        >
                          <PlusCircle className="w-2 h-2" /> {t('common.quick')}
                        </button>
                      </div>
                    </th>
                    <th className={cn("border-b border-border w-[22ch]", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.godown')}</th>
                    {isBatchEnabled && (
                      <th className={cn("border-b border-border text-left w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.batch')}</th>
                    )}
                    {isExpiryEnabled && (
                      <th className={cn("border-b border-border text-left w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.expiry')}</th>
                    )}
                    <th className={cn("border-b border-border text-right w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.quantity')}</th>
                    {showFreeQty && (
                      <th className={cn("border-b border-border text-right w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.free')}</th>
                    )}
                    <th className={cn("border-b border-border text-right w-40", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.rate')}</th>
                    <th className={cn("border-b border-border text-center w-24", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.per')}</th>
                    {showDiscPercent && (
                      <th className={cn("border-b border-border text-right w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.discPercent')}</th>
                    )}
                    {isTaxEnabled && showTaxPercent && (
                      <th className={cn("border-b border-border text-right w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.taxPercent')}</th>
                    )}
                    <th className={cn("border-b border-border text-right w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.amount')}</th>
                    <th className={cn("border-b border-border w-10", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invEntries.map((entry, idx) => (
                    <tr key={idx} className="group hover:bg-foreground/5">
                      <td className={cn("min-w-[35ch]", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
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
                            placeholder={t('voucher.selectItem')}
                            onQuickCreate={() => {
                              setPendingRowIdx(idx);
                              setIsQuickItemOpen(true);
                            }}
                            tabIndex={8 + idx * 10}
                          />
                          {entry.item_id && itemStocks[`${entry.item_id}-${entry.godown_id}`] !== undefined && (
                            <p className="text-[8px] text-gray-500 uppercase">
                              {t('item.currentStock')}: <span className="font-bold text-foreground">{itemStocks[`${entry.item_id}-${entry.godown_id}`]} {entry.unit}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={cn("w-[22ch]", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                        <SearchableSelect
                          options={godowns}
                          value={entry.godown_id}
                          onChange={(val) => {
                            const next = [...invEntries];
                            next[idx].godown_id = val;
                            setInvEntries(next);
                          }}
                          placeholder={t('voucher.selectGodown')}
                          tabIndex={9 + idx * 10}
                        />
                      </td>
                      {isBatchEnabled && (
                        <td className={cn("w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                          <input 
                            type="text" 
                            className="bg-transparent border border-border text-foreground outline-none w-full text-xs p-1 focus:border-foreground" 
                            placeholder={t('common.batch')}
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
                        <td className={cn("w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
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
                      <td className={cn("w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                        <input 
                          type="number" 
                          tabIndex={10 + idx * 10}
                          className="bg-transparent border-none text-foreground outline-none w-full text-right" 
                          value={entry.qty ?? ''} 
                          onFocus={e => e.target.value === '0' && e.target.select()}
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
                        <td className={cn("w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                          <input 
                            type="number" 
                            tabIndex={11 + idx * 10}
                            className="bg-transparent border-none text-foreground outline-none w-full text-right text-emerald-500 font-bold" 
                            value={entry.free_qty ?? ''} 
                            onFocus={e => e.target.value === '0' && e.target.select()}
                            onChange={e => {
                              const next = [...invEntries];
                              next[idx].free_qty = Number(e.target.value);
                              setInvEntries(next);
                            }} 
                          />
                        </td>
                      )}
                      <td className={cn("w-40", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                        <input 
                          type="number" 
                          tabIndex={12 + idx * 10}
                          className="bg-transparent border-none text-foreground outline-none w-full text-right" 
                          value={entry.rate ?? ''} 
                          onFocus={e => e.target.value === '0' && e.target.select()}
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].rate = Number(e.target.value);
                            next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                            setInvEntries(next);
                          }} 
                        />
                      </td>
                      <td className={cn("text-center text-gray-500 uppercase text-[10px] w-24", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                        <span 
                          tabIndex={13 + idx * 10}
                          className="outline-none focus:ring-1 focus:ring-foreground/20 px-1 rounded"
                        >
                          {entry.unit}
                        </span>
                      </td>
                      {showDiscPercent && (
                        <td className={cn("w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                          <input 
                            type="number" 
                            tabIndex={14 + idx * 10}
                            className="bg-transparent border-none text-foreground outline-none w-full text-right" 
                            value={entry.disc_percent ?? ''} 
                            onFocus={e => e.target.value === '0' && e.target.select()}
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
                        <td className={cn("w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                          <input 
                            type="number" 
                            tabIndex={15 + idx * 10}
                            className="bg-transparent border border-border text-foreground outline-none w-full text-right p-1 focus:border-foreground" 
                            value={entry.tax_percent ?? ''} 
                            onFocus={e => e.target.value === '0' && e.target.select()}
                            onChange={e => {
                              const next = [...invEntries];
                              next[idx].tax_percent = Number(e.target.value);
                              next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                              setInvEntries(next);
                            }} 
                          />
                        </td>
                      )}
                      <td className={cn("text-right text-foreground font-bold w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                        <span 
                          tabIndex={16 + idx * 10}
                          className="outline-none focus:ring-1 focus:ring-foreground/20 px-1 rounded block"
                        >
                          {baseCurrencySymbol} {entry.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className={cn(voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}><button onClick={() => setInvEntries(invEntries.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-rose-900 group-hover:text-rose-500" /></button></td>
                    </tr>
                  ))}
                  {/* ADD ITEM Button Row */}
                  <tr className="border-t border-border/50">
                    <td colSpan={isTaxEnabled ? 10 : 9} className={cn(voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={() => setInvEntries([...invEntries, { item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }])}
                          tabIndex={500}
                          className={cn(
                            "px-4 py-1.5 text-black text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                            getVoucherBgColor(vType),
                            getVoucherHoverBgColor(vType)
                          )}
                        >
                          <PlusCircle className="w-3 h-3" /> {t('common.addItem')}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Mobile Stacked View */}
              <div className="lg:hidden divide-y divide-border">
                {invEntries.map((entry, idx) => (
                  <div key={idx} className="p-4 space-y-3 bg-card relative group">
                    <button 
                      onClick={() => setInvEntries(invEntries.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-4 p-1 text-rose-500 flex items-center gap-1 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[8px] font-bold uppercase tracking-widest">{t('common.deleteItem')}</span>
                    </button>

                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.nameOfItem')}</label>
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
                        placeholder={t('voucher.selectItem')}
                        onQuickCreate={() => {
                          setPendingRowIdx(idx);
                          setIsQuickItemOpen(true);
                        }}
                      />
                      {entry.item_id && itemStocks[`${entry.item_id}-${entry.godown_id}`] !== undefined && (
                        <p className="text-[8px] text-gray-500 uppercase">
                          {t('item.currentStock')}: <span className="font-bold text-foreground">{itemStocks[`${entry.item_id}-${entry.godown_id}`]} {entry.unit}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[140px] space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.godown')}</label>
                        <SearchableSelect
                          options={godowns}
                          value={entry.godown_id}
                          onChange={(val) => {
                            const next = [...invEntries];
                            next[idx].godown_id = val;
                            setInvEntries(next);
                          }}
                          placeholder={t('voucher.selectGodown')}
                        />
                      </div>
                      <div className="flex-1 min-w-[100px] space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.quantity')}</label>
                        <input 
                          type="number" 
                          className="w-full bg-background border border-border text-foreground p-1.5 text-xs outline-none focus:border-foreground" 
                          value={entry.qty ?? ''} 
                          onFocus={e => e.target.value === '0' && e.target.select()}
                          onChange={e => {
                            const next = [...invEntries];
                            const val = Number(e.target.value);
                            next[idx].qty = val;
                            const item = items.find(i => i.id === entry.item_id);
                            if (item && item.scheme_qty && item.scheme_free_qty && val >= item.scheme_qty) {
                              const multiplier = Math.floor(val / item.scheme_qty);
                              next[idx].free_qty = multiplier * item.scheme_free_qty;
                            }
                            next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                            setInvEntries(next);
                          }} 
                        />
                      </div>

                      {showFreeQty && (
                        <div className="flex-1 min-w-[80px] space-y-1">
                          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.free')}</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border text-emerald-500 font-bold p-1.5 text-xs outline-none focus:border-foreground" 
                            value={entry.free_qty ?? ''} 
                            onFocus={e => e.target.value === '0' && e.target.select()}
                            onChange={e => {
                              const next = [...invEntries];
                              next[idx].free_qty = Number(e.target.value);
                              setInvEntries(next);
                            }} 
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-[100px] space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.rate')}</label>
                        <input 
                          type="number" 
                          className="w-full bg-background border border-border text-foreground p-1.5 text-xs outline-none focus:border-foreground" 
                          value={entry.rate ?? ''} 
                          onFocus={e => e.target.value === '0' && e.target.select()}
                          onChange={e => {
                            const next = [...invEntries];
                            next[idx].rate = Number(e.target.value);
                            next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                            setInvEntries(next);
                          }} 
                        />
                      </div>

                      <div className="flex-1 min-w-[120px] space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.per')}</label>
                        <div className="w-full bg-background border border-border text-gray-500 p-1.5 text-xs uppercase text-center font-bold">
                          {entry.unit}
                        </div>
                      </div>

                      {showDiscPercent && (
                        <div className="flex-1 min-w-[80px] space-y-1">
                          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.discPercent')}</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border text-foreground p-1.5 text-xs outline-none focus:border-foreground" 
                            value={entry.disc_percent ?? ''} 
                            onFocus={e => e.target.value === '0' && e.target.select()}
                            onChange={e => {
                              const next = [...invEntries];
                              next[idx].disc_percent = Number(e.target.value);
                              next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                              setInvEntries(next);
                            }} 
                          />
                        </div>
                      )}

                      {isTaxEnabled && showTaxPercent && (
                        <div className="flex-1 min-w-[80px] space-y-1">
                          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.taxPercent')}</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border text-foreground p-1.5 text-xs outline-none focus:border-foreground" 
                            value={entry.tax_percent ?? ''} 
                            onFocus={e => e.target.value === '0' && e.target.select()}
                            onChange={e => {
                              const next = [...invEntries];
                              next[idx].tax_percent = Number(e.target.value);
                              next[idx].amount = calculateRowAmount(next[idx].qty, next[idx].rate, next[idx].disc_percent, next[idx].tax_percent);
                              setInvEntries(next);
                            }} 
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.amount')}</span>
                      <span className="text-sm text-foreground font-bold">{baseCurrencySymbol} {entry.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="p-4">
                  <button 
                    type="button"
                    onClick={() => setInvEntries([...invEntries, { item_id: '', godown_id: '', qty: 0, free_qty: 0, rate: 0, disc_percent: 0, tax_percent: 0, amount: 0, unit: 'pcs', batch_no: '', expiry_date: '' }])}
                    className={cn(
                      "w-full py-3 text-black text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm",
                      getVoucherBgColor(vType),
                      getVoucherHoverBgColor(vType)
                    )}
                  >
                    <PlusCircle className="w-4 h-4" /> {t('common.addItem')}
                  </button>
                </div>
              </div>
            </div>
          ) : isSingleEntry ? (
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead className="bg-foreground/5 text-gray-500 uppercase text-[9px]">
                <tr>
                  <th className={cn("border-b border-border font-bold tracking-widest", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.particulars')}</th>
                  <th className={cn("border-b border-border font-bold tracking-widest text-right w-32", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.amount')}</th>
                  <th className={cn("border-b border-border w-10", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accEntries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-foreground/5">
                    <td className={cn(voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                      <div className="flex items-center gap-2">
                        <SearchableSelect
                          options={ledgers}
                          value={entry.ledger_id}
                          onChange={(val) => {
                            const next = [...accEntries];
                            next[idx].ledger_id = val;
                            setAccEntries(next);
                          }}
                          placeholder={t('voucher.selectParticulars')}
                          onQuickCreate={() => openQuickLedger('', 'particulars', idx)}
                        />
                      </div>
                    </td>
                    <td className={cn("w-48", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                      <input type="number" className="bg-transparent border-none text-foreground outline-none w-full text-right" value={entry.amount ?? ''} onFocus={e => e.target.value === '0' && e.target.select()} onChange={e => {
                        const next = [...accEntries];
                        next[idx].amount = Number(e.target.value);
                        setAccEntries(next);
                      }} />
                    </td>
                    <td className={cn("w-10", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}><button onClick={() => setAccEntries(accEntries.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-rose-900 group-hover:text-rose-500" /></button></td>
                  </tr>
                ))}
                {/* ADD ITEM Button Row */}
                <tr className="border-t border-border/50">
                  <td colSpan={3} className={cn(voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setAccEntries([...accEntries, { ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }])}
                        tabIndex={500}
                        className={cn(
                          "px-4 py-1.5 text-black text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                          getVoucherBgColor(vType),
                          getVoucherHoverBgColor(vType)
                        )}
                      >
                        <PlusCircle className="w-3 h-3" /> {t('common.addItem')}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-foreground/5 text-gray-500 uppercase text-[9px]">
                <tr>
                  <th className={cn("border-b border-border w-20", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.drCr')}</th>
                  <th className={cn("border-b border-border font-bold tracking-widest", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.particulars')}</th>
                  <th className={cn("border-b border-border font-bold tracking-widest text-right w-48", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.debit')}</th>
                  <th className={cn("border-b border-border font-bold tracking-widest text-right w-48", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}>{t('common.credit')}</th>
                  <th className={cn("border-b border-border w-10", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-3")}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accEntries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-foreground/5">
                    <td className={cn("w-20", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
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
                    <td className={cn(voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
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
                    <td className={cn("w-48", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                      <input 
                        type="number" 
                        disabled={entry.type === 'Cr'}
                        className={cn(
                          "bg-transparent border-none text-foreground outline-none w-full text-right",
                          entry.type === 'Cr' && "opacity-20"
                        )} 
                        value={entry.debit ?? ''} 
                        onFocus={e => e.target.value === '0' && e.target.select()}
                        onChange={e => {
                          const next = [...accEntries];
                          next[idx].debit = Number(e.target.value);
                          setAccEntries(next);
                        }} 
                      />
                    </td>
                    <td className={cn("w-48", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                      <input 
                        type="number" 
                        disabled={entry.type === 'Dr'}
                        className={cn(
                          "bg-transparent border-none text-foreground outline-none w-full text-right",
                          entry.type === 'Dr' && "opacity-20"
                        )} 
                        value={entry.credit ?? ''} 
                        onFocus={e => e.target.value === '0' && e.target.select()}
                        onChange={e => {
                          const next = [...accEntries];
                          next[idx].credit = Number(e.target.value);
                          setAccEntries(next);
                        }} 
                      />
                    </td>
                    <td className={cn("w-10", voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}><button onClick={() => setAccEntries(accEntries.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-rose-900 group-hover:text-rose-500" /></button></td>
                  </tr>
                ))}
                {/* ADD ITEM Button Row */}
                <tr className="border-t border-border/50">
                  <td colSpan={5} className={cn(voucherTableCompact ? "px-2 py-1" : "px-4 lg:px-6 py-2")}>
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setAccEntries([...accEntries, { ledger_id: '', debit: 0, credit: 0, amount: 0, type: 'Dr' }])}
                        tabIndex={500}
                        className={cn(
                          "px-4 py-1.5 text-black text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                          getVoucherBgColor(vType),
                          getVoucherHoverBgColor(vType)
                        )}
                      >
                        <PlusCircle className="w-3 h-3" /> ADD ITEM
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {isInventory && isBarcodeEnabled && (
          <div className="p-4 border-b border-border flex justify-end items-center">
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-gray-500 uppercase font-bold">{t('common.barcodeScan')}</label>
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
                placeholder={t('common.barcodeScan')}
                className="bg-background border border-border text-foreground p-1 text-[10px] outline-none focus:border-foreground w-40"
              />
            </div>
          </div>
        )}
        {/* Bank Transaction Details */}
        {showBankDetails && (
          <div className="bg-foreground/5 p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3 bg-indigo-500 rounded-full" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('common.bankDetails')}</h4>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.transactionType')}</label>
                <select
                  value={bankDetails.transaction_type}
                  onChange={(e) => setBankDetails({ ...bankDetails, transaction_type: e.target.value as any })}
                  className="w-full bg-background border border-border p-1.5 lg:p-2 text-xs outline-none focus:border-foreground font-medium"
                >
                  <option value="Cheque">Cheque</option>
                  <option value="e-Fund Transfer">e-Fund Transfer</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.instNo')}</label>
                <input
                  type="text"
                  value={bankDetails.instrument_no}
                  onChange={(e) => setBankDetails({ ...bankDetails, instrument_no: e.target.value })}
                  placeholder={t('common.instNo')}
                  className="w-full bg-background border border-border p-1.5 lg:p-2 text-xs outline-none focus:border-foreground font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.instDate')}</label>
                <input
                  type="date"
                  value={bankDetails.instrument_date}
                  onChange={(e) => setBankDetails({ ...bankDetails, instrument_date: e.target.value })}
                  className="w-full bg-background border border-border p-1.5 lg:p-2 text-xs outline-none focus:border-foreground font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.bankName')}</label>
                <input
                  type="text"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  placeholder={t('common.bankName')}
                  className="w-full bg-background border border-border p-1.5 lg:p-2 text-xs outline-none focus:border-foreground font-medium"
                />
              </div>
            </div>
          </div>
        )}
        {/* Footer Section */}
        <div className={cn(
          "bg-foreground/5 shrink-0",
          voucherHeaderCompact ? "p-2 lg:p-3 space-y-3" : "p-4 lg:p-6 space-y-6"
        )}>
          <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-6">
            <div className="space-y-1 order-2 lg:order-1 lg:col-span-3">
              <label className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{t('common.narration')}</label>
              <textarea
                value={narration || ''}
                onChange={e => setNarration(e.target.value)}
                tabIndex={501}
                className="w-full bg-background border border-border text-foreground p-2 text-xs outline-none focus:border-foreground transition-colors h-16 lg:h-20 resize-none"
                placeholder={t('common.narration')}
              />
            </div>
            <div className="flex flex-col justify-end items-end space-y-2 order-1 lg:order-2 lg:col-span-2">
              <div className="flex items-center gap-4 bg-background border border-border p-3 rounded mb-1 w-full lg:w-auto justify-between lg:justify-end">
                <label htmlFor="globalDiscount" className="text-[10px] text-gray-500 uppercase font-bold cursor-pointer tracking-widest">{t('common.disc')}</label>
                <div className="flex items-center gap-2">
                  <input 
                    id="globalDiscount"
                    type="number" 
                    value={globalDiscount ?? ''} 
                    onFocus={e => e.target.value === '0' && e.target.select()}
                    onChange={e => setGlobalDiscount(Number(e.target.value))}
                    tabIndex={502}
                    className="w-24 bg-transparent border-none text-right text-lg outline-none font-bold"
                    placeholder="0"
                  />
                  <select 
                    value={globalDiscountType}
                    onChange={e => setGlobalDiscountType(e.target.value as 'fixed' | 'percent')}
                    tabIndex={503}
                    className="bg-transparent border-none text-xs outline-none font-bold text-gray-500"
                  >
                    <option value="fixed">{baseCurrencySymbol} {t('common.taka')}</option>
                    <option value="percent">% {t('common.percent')}</option>
                  </select>
                </div>
              </div>
              <div className="text-right space-y-0.5 w-full">
                {totalTaxAmount > 0 && (
                  <p className="text-[10px] text-emerald-500 font-bold">
                    {t('common.tax')}: {currency} {totalTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-[8px] text-gray-500 uppercase tracking-widest">{t('common.totalAmount')}</p>
                <p className="text-2xl lg:text-3xl text-foreground font-bold tracking-tighter">
                  {currency} {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                {isEdit && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 lg:flex-none px-6 lg:px-8 py-2 border border-rose-900/50 text-[10px] text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash className="w-3 h-3" /> {t('common.delete')}
                  </button>
                )}
                {(isEdit || isBalanced()) && (
                  <div className="relative flex-1 lg:flex-none">
                    <button 
                      type="button"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-full px-6 lg:px-8 py-2 border border-border text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-3 h-3" /> {t('common.share')}
                    </button>
                    {showShareMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border shadow-xl z-50">
                        <button 
                          onClick={() => handleShare('whatsapp')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-foreground/5 text-left"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          {t('common.whatsapp')}
                        </button>
                        <button 
                          onClick={() => handleShare('email')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-foreground/5 text-left"
                        >
                          <Mail className="w-4 h-4 text-blue-500" />
                          {t('common.email')}
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
                  {t('common.print')}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="flex-1 lg:flex-none px-6 lg:px-8 py-2 border border-amber-500/50 text-[10px] text-amber-600 uppercase tracking-widest hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-3 h-3" /> {t('common.clear')}
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
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (isEdit ? t('common.update') : t('common.saveVoucher'))}
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

    <ClearModal 
      isOpen={isClearModalOpen}
      onClose={() => setIsClearModalOpen(false)}
      onConfirm={handleClearVoucher}
    />

    {/* Voucher Settings Shortcut Modal */}
    {isVoucherSettingsOpen && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-foreground/5">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" />
                <h3 className="text-[10px] uppercase font-bold tracking-widest">{t('voucher.config')}</h3>
              </div>
              <button onClick={() => setIsVoucherSettingsOpen(false)} className="text-gray-500 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1">
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-2">{t('voucher.invSettings')}</p>
                <Toggle 
                  label={t('voucher.maintainInv')} 
                  enabled={isInventoryEnabled} 
                  onChange={() => toggleFeature('inv')} 
                />
                <Toggle 
                  label={t('voucher.maintainGodowns')} 
                  enabled={features.find(f => f.id === 'godown')?.enabled ?? false} 
                  onChange={() => toggleFeature('godown')} 
                />
                <Toggle 
                  label={t('voucher.maintainBatches')} 
                  enabled={isBatchEnabled} 
                  onChange={() => toggleFeature('batch')} 
                />
                <Toggle 
                  label={t('voucher.trackExpiry')} 
                  enabled={isExpiryEnabled} 
                  onChange={() => toggleFeature('expiry')} 
                />
                <Toggle 
                  label={t('voucher.barcodeScanning')} 
                  enabled={isBarcodeEnabled} 
                  onChange={() => toggleFeature('barcode')} 
                />
              </div>

              <div className="space-y-1 pt-4 border-t border-border">
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-2">{t('voucher.displaySettings')}</p>
                <Toggle 
                  label={t('voucher.showFreeQty')} 
                  enabled={showFreeQty} 
                  onChange={() => updateSettings({ showFreeQty: !showFreeQty })} 
                />
                <Toggle 
                  label={t('voucher.showDiscPercent')} 
                  enabled={showDiscPercent} 
                  onChange={() => updateSettings({ showDiscPercent: !showDiscPercent })} 
                />
                <Toggle 
                  label={t('voucher.showTaxPercent')} 
                  enabled={showTaxPercent} 
                  onChange={() => updateSettings({ showTaxPercent: !showTaxPercent })} 
                />
                <Toggle 
                  label={t('voucher.enableMultiCurrency')} 
                  enabled={isMultiCurrencyEnabled} 
                  onChange={() => toggleFeature('curr')} 
                />
                <Toggle 
                  label={t('voucher.enableTaxCalc')} 
                  enabled={isTaxEnabled} 
                  onChange={() => toggleFeature('tax')} 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-2">{t('voucher.printPreviewMock')}</p>
                <div className="bg-background border border-border p-4 rounded space-y-4 scale-90 origin-top">
                  {/* Mock Header */}
                  <div className="border-b border-border pb-2 text-center space-y-1">
                    <div className="h-2 w-24 bg-foreground/20 mx-auto rounded" />
                    <div className="h-1.5 w-32 bg-foreground/10 mx-auto rounded" />
                  </div>
                  
                  {/* Mock Table */}
                  <div className="space-y-1">
                    <div className="flex gap-1 border-b border-border pb-1">
                      <div className="h-1.5 flex-1 bg-foreground/20 rounded" />
                      <div className="h-1.5 w-8 bg-foreground/20 rounded" />
                      <div className="h-1.5 w-8 bg-foreground/20 rounded" />
                    </div>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-1">
                        <div className="h-1.5 flex-1 bg-foreground/5 rounded" />
                        <div className="h-1.5 w-8 bg-foreground/5 rounded" />
                        <div className="h-1.5 w-8 bg-foreground/5 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Mock Footer */}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <div className="space-y-1">
                      <div className="h-1.5 w-16 bg-foreground/10 rounded" />
                      <div className="h-3 w-24 bg-foreground/5 rounded" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-1.5 w-12 bg-foreground/10 rounded ml-auto" />
                      <div className="h-3 w-20 bg-foreground/20 rounded ml-auto" />
                    </div>
                  </div>
                </div>
                <p className="text-[7px] text-gray-400 uppercase text-center">{t('voucher.printPreviewDesc')}</p>
              </div>
            </div>

            <div className="p-4 bg-foreground/5 border-t border-border flex justify-end">
              <button 
                onClick={() => setIsVoucherSettingsOpen(false)}
                className="px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function ClearModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl w-full max-w-sm p-6 space-y-6">
        <div className="flex items-center gap-3 text-rose-500">
          <AlertCircle className="w-6 h-6" />
          <h3 className="text-lg font-bold uppercase tracking-tighter">{t('common.warning')}</h3>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
          {t('common.clearVoucherConfirm')}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-colors"
          >
            {t('common.back')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors"
          >
            {t('common.clearVoucher')}
          </button>
        </div>
      </div>
    </div>
  );
}
