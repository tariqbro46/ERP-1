import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, ArrowLeft, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { printReport } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { QuickAdjustmentModal } from './QuickAdjustmentModal';

export function LedgerStatement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useSettings();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [showLedgerList, setShowLedgerList] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailed, setIsDetailed] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      const [lData, iData, gData] = await Promise.all([
        erpService.getLedgers(user.companyId),
        erpService.getItems(user.companyId),
        erpService.getGodowns(user.companyId)
      ]);
      if (lData) setLedgers(lData);
      setItems(iData);
      setGodowns(gData);
    }
    fetchData();
  }, [user?.companyId]);

  const fetchEntries = async () => {
    if (!selectedLedger || !user?.companyId) {
      setEntries([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await erpService.getVoucherWithEntries(user.companyId, selectedLedger, startDate, endDate);
      
      const processed = data.map((v: any) => {
        // Find the specific entry for our selected ledger
        const mainEntry = v.voucher_entries.find((e: any) => e.ledger_id === selectedLedger);
        
        // Find the "other side" particulars from all_entries
        const otherEntries = v.voucher_entries.filter((e: any) => e.ledger_id !== selectedLedger);
        
        let particulars = 'Self';
        if (otherEntries.length === 1) {
          // We need to fetch the ledger name for otherEntries[0].ledger_id
          // For now, we'll assume we can find it in our ledgers state
          const otherLedger = ledgers.find(l => l.id === otherEntries[0].ledger_id);
          particulars = otherLedger?.name || 'Unknown';
        } else if (otherEntries.length > 1) {
          particulars = 'As per details';
        }

        return {
          id: v.id,
          debit: mainEntry?.debit || 0,
          credit: mainEntry?.credit || 0,
          vouchers: v,
          particulars
        };
      });

      setEntries(processed);
    } catch (err) {
      console.error('LedgerStatement Error:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedLedger, startDate, endDate]);

  const filteredLedgers = ledgers.filter(l => 
    l.name.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  const handleLedgerSelect = (ledger: any) => {
    setSelectedLedger(ledger.id);
    setLedgerSearch(ledger.name);
    setShowLedgerList(false);
  };

  const currentLedger = ledgers.find(l => l.id === selectedLedger);
  let runningBalance = currentLedger?.opening_balance || 0;

  const handlePrint = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = currentLedger?.opening_balance || 0;
    const printData = [
      {
        date: '-',
        vch_no: '-',
        vch_type: 'Opening Balance',
        debit: rb > 0 ? rb : 0,
        credit: rb < 0 ? Math.abs(rb) : 0,
        balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
      },
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        return {
          date: e.vouchers?.v_date,
          vch_no: e.vouchers?.v_no,
          vch_type: e.vouchers?.v_type,
          debit: e.debit || 0,
          credit: e.credit || 0,
          balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
        };
      })
    ];

    const period = `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    printReport(`Ledger Statement: ${ledgerName}\n${period}`, printData, ['Date', 'Vch No', 'Vch Type', 'Debit', 'Credit', 'Balance'], settings);
  };

  const handleDownload = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = currentLedger?.opening_balance || 0;
    const exportData = [
      {
        date: '-',
        particulars: 'Opening Balance',
        vch_no: '-',
        vch_type: '-',
        debit: rb > 0 ? rb : 0,
        credit: rb < 0 ? Math.abs(rb) : 0,
        balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
      },
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        return {
          date: e.vouchers?.v_date,
          particulars: e.particulars,
          vch_no: e.vouchers?.v_no,
          vch_type: e.vouchers?.v_type,
          debit: e.debit || 0,
          credit: e.credit || 0,
          balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
        };
      })
    ];

    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    exportToCSV(`Ledger_Statement_${ledgerName.replace(/ /g, '_')}`, `Ledger Statement: ${ledgerName} (${period})`, exportData, ['Date', 'Particulars', 'Vch No', 'Vch Type', 'Debit', 'Credit', 'Balance'], settings);
  };

  const handleDownloadPDF = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = currentLedger?.opening_balance || 0;
    const exportData = [
      {
        date: '-',
        particulars: 'Opening Balance',
        vch_no: '-',
        vch_type: '-',
        debit: rb > 0 ? rb : 0,
        credit: rb < 0 ? Math.abs(rb) : 0,
        balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
      },
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        return {
          date: e.vouchers?.v_date,
          particulars: e.particulars,
          vch_no: e.vouchers?.v_no,
          vch_type: e.vouchers?.v_type,
          debit: e.debit || 0,
          credit: e.credit || 0,
          balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
        };
      })
    ];

    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    exportToPDF(`Ledger_Statement_${ledgerName.replace(/ /g, '_')}`, `Ledger Statement: ${ledgerName} (${period})`, exportData, ['Date', 'Particulars', 'Vch No', 'Vch Type', 'Debit', 'Credit', 'Balance'], settings);
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-md space-y-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Ledger Statement</h1>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Ledger..."
                  value={ledgerSearch || ''}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setShowLedgerList(true);
                  }}
                  onFocus={() => setShowLedgerList(true)}
                  className="w-full bg-card border border-border text-foreground pl-10 pr-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>
              
              {showLedgerList && ledgerSearch && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-xl max-h-60 overflow-y-auto no-scrollbar">
                  {filteredLedgers.length > 0 ? (
                    filteredLedgers.map(l => (
                      <button
                        key={l.id}
                        onClick={() => handleLedgerSelect(l)}
                        className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-foreground/5 border-b border-border/50 last:border-none transition-colors"
                      >
                        {l.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching ledgers</div>
                  )}
                </div>
              )}
              {showLedgerList && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLedgerList(false)}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">From</label>
                <input 
                  type="date" 
                  value={startDate || ''} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">To</label>
                <input 
                  type="date" 
                  value={endDate || ''} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsDetailed(!isDetailed)}
              className={cn(
                "flex-1 sm:flex-none px-3 py-2 border border-border transition-colors flex items-center gap-2 text-[10px] font-bold uppercase",
                isDetailed ? "bg-foreground text-background" : "text-gray-500 hover:text-foreground"
              )}
            >
              {isDetailed ? 'Condensed' : 'Detailed'}
            </button>
            <button 
              onClick={fetchEntries}
              disabled={loading || !selectedLedger}
              className="flex-1 sm:flex-none p-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center disabled:opacity-50"
              title="Refresh Data"
            >
              <Search className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button 
              onClick={handlePrint}
              disabled={!selectedLedger}
              className="flex-1 sm:flex-none p-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              disabled={!selectedLedger || entries.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Download CSV"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={!selectedLedger || entries.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Download PDF"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
            <button 
              onClick={() => setShowAdjustmentModal(true)}
              disabled={!selectedLedger}
              className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Quick Adjustment"
            >
              <Calculator className="w-3 h-3" /> Adjust
            </button>
          </div>
        </div>

        <div className="bg-card border border-border overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-gray-500 uppercase">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Vch No.</th>
                <th className="px-6 py-4 font-medium">Vch Type</th>
                <th className="px-6 py-4 font-medium text-right">Debit</th>
                <th className="px-6 py-4 font-medium text-right">Credit</th>
                <th className="px-6 py-4 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              {!selectedLedger ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600">Please select a ledger to view statement</td></tr>
              ) : loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600">Loading entries...</td></tr>
              ) : (
                <>
                  {/* Opening Balance Row */}
                  <tr className="border-b border-border/50 bg-foreground/5 font-bold italic">
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">Opening Balance</td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4 text-right">
                      {(currentLedger?.opening_balance || 0) > 0 ? `৳ ${currentLedger.opening_balance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(currentLedger?.opening_balance || 0) < 0 ? `৳ ${Math.abs(currentLedger.opening_balance).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-foreground">
                      ৳ {Math.abs(currentLedger?.opening_balance || 0).toLocaleString()} {(currentLedger?.opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>

                  {entries.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600 italic">No transactions found for this period</td></tr>
                  ) : entries.map((e) => {
                    runningBalance += (e.debit || 0) - (e.credit || 0);
                    const currentBalance = runningBalance;
                    return (
                      <React.Fragment key={e.id}>
                        <tr 
                          className="border-b border-border/50 hover:bg-foreground/5 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/vouchers/edit/${e.id}`)}
                        >
                          <td className="px-6 py-4">{e.vouchers?.v_date}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-foreground">{e.particulars}</span>
                              <span className="text-[10px] text-gray-500">{e.vouchers?.v_no}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 uppercase text-[10px] text-gray-500">{e.vouchers?.v_type}</td>
                          <td className="px-6 py-4 text-right">{e.debit > 0 ? `৳ ${e.debit.toLocaleString()}` : '-'}</td>
                          <td className="px-6 py-4 text-right">{e.credit > 0 ? `৳ ${e.credit.toLocaleString()}` : '-'}</td>
                          <td className="px-6 py-4 text-right text-foreground font-bold">
                            ৳ {Math.abs(currentBalance).toLocaleString()} {currentBalance >= 0 ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                        {isDetailed && e.vouchers?.inventory && e.vouchers.inventory.length > 0 && (
                          <tr className="bg-foreground/[0.02] border-b border-border/30">
                            <td colSpan={6} className="px-6 py-2">
                              <table className="w-full text-[10px] text-gray-500">
                                <thead>
                                  <tr className="border-b border-border/20 uppercase text-[8px]">
                                    <th className="py-1 text-left">Name of Item</th>
                                    <th className="py-1 text-left">Godown</th>
                                    <th className="py-1 text-right">Quantity</th>
                                    <th className="py-1 text-right">Free</th>
                                    <th className="py-1 text-right">Rate</th>
                                    <th className="py-1 text-center">per</th>
                                    <th className="py-1 text-right">Disc %</th>
                                    <th className="py-1 text-right">Tax %</th>
                                    <th className="py-1 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {e.vouchers.inventory.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-border/10 last:border-0">
                                      <td className="py-1">{items.find(i => i.id === item.item_id)?.name || 'Unknown Item'}</td>
                                      <td className="py-1">{godowns.find(g => g.id === item.godown_id)?.name || '-'}</td>
                                      <td className="py-1 text-right">{item.qty}</td>
                                      <td className="py-1 text-right">{item.free_qty || 0}</td>
                                      <td className="py-1 text-right">{item.rate.toLocaleString()}</td>
                                      <td className="py-1 text-center">{item.unit || 'pcs'}</td>
                                      <td className="py-1 text-right">{item.disc_percent || 0}%</td>
                                      <td className="py-1 text-right">{item.tax_percent || 0}%</td>
                                      <td className="py-1 text-right font-bold text-foreground/70">{item.amount.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLedger && (
        <QuickAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={() => {
            fetchEntries();
            // Also refresh ledgers to get updated balance
            async function refreshLedgers() {
              if (!user?.companyId) return;
              const data = await erpService.getLedgers(user.companyId);
              if (data) setLedgers(data);
            }
            refreshLedgers();
          }}
          partyLedgerId={selectedLedger}
          partyName={currentLedger?.name || ''}
          currentBalance={runningBalance}
        />
      )}
    </div>
  );
}
