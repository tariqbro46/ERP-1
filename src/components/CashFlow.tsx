import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function CashFlow() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  const [operatingActivities, setOperatingActivities] = useState<any[]>([]);
  const [investingActivities, setInvestingActivities] = useState<any[]>([]);
  const [financingActivities, setFinancingActivities] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    async function fetchCashFlow() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [ledgers, vEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, dateRange.to)
        ]);

        // Filter for Cash/Bank ledgers
        const cashBankLedgers = ledgers.filter(l => 
          l.group_name?.includes('Cash') || 
          l.group_name?.includes('Bank') || 
          l.nature === 'Asset' && (l.name.toLowerCase().includes('cash') || l.name.toLowerCase().includes('bank'))
        );

        const cashBankIds = new Set(cashBankLedgers.map(l => l.id));

        // Calculate Opening Balance (before dateRange.from)
        // For simplicity in this mock, we'll use a fixed opening balance or calculate from entries
        const opening = cashBankLedgers.reduce((sum, l) => sum + (l.opening_balance || 0), 0);
        setOpeningBalance(opening);

        // Analyze movements
        const operating: any[] = [];
        const investing: any[] = [];
        const financing: any[] = [];

        // This is a simplified logic:
        // We look at all vouchers where one side is Cash/Bank and the other is NOT
        vEntries.forEach(entry => {
          // Find the counterpart in the same voucher
          const voucherEntries = vEntries.filter(e => e.voucher_id === entry.voucher_id);
          const isCashEntry = cashBankIds.has(entry.ledger_id);
          
          if (isCashEntry) {
            const amount = entry.debit - entry.credit; // Positive is inflow, negative is outflow
            if (amount === 0) return;

            // Find what this cash was for
            const counterpart = voucherEntries.find(e => !cashBankIds.has(e.ledger_id));
            if (!counterpart) return;

            const ledger = ledgers.find(l => l.id === counterpart.ledger_id);
            if (!ledger) return;

            const item = {
              name: ledger.name,
              amount: amount,
              date: entry.date
            };

            if (ledger.nature === 'Income' || ledger.nature === 'Expense' || ledger.group_name?.includes('Current')) {
              operating.push(item);
            } else if (ledger.group_name?.includes('Fixed Assets') || ledger.group_name?.includes('Investment')) {
              investing.push(item);
            } else if (ledger.group_name?.includes('Capital') || ledger.group_name?.includes('Loans')) {
              financing.push(item);
            } else {
              operating.push(item);
            }
          }
        });

        // Group by ledger name for display
        const groupItems = (items: any[]) => {
          const grouped: Record<string, number> = {};
          items.forEach(item => {
            grouped[item.name] = (grouped[item.name] || 0) + item.amount;
          });
          return Object.entries(grouped).map(([name, amount]) => ({ name, amount }));
        };

        setOperatingActivities(groupItems(operating));
        setInvestingActivities(groupItems(investing));
        setFinancingActivities(groupItems(financing));

        const totalChange = [...operating, ...investing, ...financing].reduce((sum, item) => sum + item.amount, 0);
        setClosingBalance(opening + totalChange);

      } catch (err) {
        console.error('Error fetching cash flow:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlow();
  }, [user?.companyId, dateRange]);

  const totalOperating = operatingActivities.reduce((sum, item) => sum + item.amount, 0);
  const totalInvesting = investingActivities.reduce((sum, item) => sum + item.amount, 0);
  const totalFinancing = financingActivities.reduce((sum, item) => sum + item.amount, 0);
  const netCashFlow = totalOperating + totalInvesting + totalFinancing;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash Flow Statement</h1>
              <p className="text-gray-500">Summary of cash inflows and outflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              {t('common.print')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" />
              {t('common.downloadPdf')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Opening Balance</span>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(openingBalance)}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Net Cash Flow</span>
              {netCashFlow >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
            <div className={cn("text-2xl font-bold", netCashFlow >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(netCashFlow)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Closing Balance</span>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(closingBalance)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0 no-scrollbar">
        <div className="space-y-6">
          {/* Operating Activities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <h3 className="font-semibold text-gray-900">Cash Flow from Operating Activities</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {operatingActivities.length > 0 ? operatingActivities.map((item, idx) => (
                <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item.name}</span>
                  <span className={cn("font-medium", item.amount >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">No operating activities found</div>
              )}
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center font-bold sticky bottom-0 z-10 border-t border-gray-200">
                <span>Net Cash from Operating Activities</span>
                <span className={totalOperating >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(totalOperating)}
                </span>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <h3 className="font-semibold text-gray-900">Cash Flow from Investing Activities</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {investingActivities.length > 0 ? investingActivities.map((item, idx) => (
                <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item.name}</span>
                  <span className={cn("font-medium", item.amount >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">No investing activities found</div>
              )}
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center font-bold sticky bottom-0 z-10 border-t border-gray-200">
                <span>Net Cash from Investing Activities</span>
                <span className={totalInvesting >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(totalInvesting)}
                </span>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <h3 className="font-semibold text-gray-900">Cash Flow from Financing Activities</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {financingActivities.length > 0 ? financingActivities.map((item, idx) => (
                <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item.name}</span>
                  <span className={cn("font-medium", item.amount >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">No financing activities found</div>
              )}
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center font-bold sticky bottom-0 z-10 border-t border-gray-200">
                <span>Net Cash from Financing Activities</span>
                <span className={totalFinancing >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(totalFinancing)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
