import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer, Download, PlusCircle, MinusCircle, Wallet } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function FundsFlow() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  const [sources, setSources] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [workingCapitalChange, setWorkingCapitalChange] = useState(0);

  useEffect(() => {
    async function fetchFundsFlow() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [ledgers, vEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, dateRange.to)
        ]);

        // Simplified logic for Sources and Applications
        const sourceItems: any[] = [];
        const applicationItems: any[] = [];

        // Analyze movements in non-current accounts
        // Non-current accounts: Fixed Assets, Investments, Capital, Loans (Long term)
        const nonCurrentGroups = ['Fixed Assets', 'Investments', 'Capital Account', 'Loans (Liability)'];
        
        const nonCurrentLedgers = ledgers.filter(l => 
          nonCurrentGroups.some(g => l.group_name?.includes(g))
        );

        const nonCurrentIds = new Set(nonCurrentLedgers.map(l => l.id));

        vEntries.forEach(entry => {
          if (nonCurrentIds.has(entry.ledger_id)) {
            const amount = entry.credit - entry.debit; // Credit is source (increase in liability/capital or decrease in asset), Debit is application
            if (amount === 0) return;

            const ledger = ledgers.find(l => l.id === entry.ledger_id);
            if (!ledger) return;

            if (amount > 0) {
              sourceItems.push({ name: ledger.name, amount: amount });
            } else {
              applicationItems.push({ name: ledger.name, amount: Math.abs(amount) });
            }
          }
        });

        // Funds from operations (simplified as net profit)
        // In a real app, we'd calculate this from P&L
        const income = vEntries.filter(e => ledgers.find(l => l.id === e.ledger_id)?.nature === 'Income')
          .reduce((sum, e) => sum + (e.credit - e.debit), 0);
        const expense = vEntries.filter(e => ledgers.find(l => l.id === e.ledger_id)?.nature === 'Expense')
          .reduce((sum, e) => sum + (e.debit - e.credit), 0);
        const fundsFromOps = income - expense;

        if (fundsFromOps > 0) {
          sourceItems.push({ name: 'Funds from Operations', amount: fundsFromOps });
        } else if (fundsFromOps < 0) {
          applicationItems.push({ name: 'Loss from Operations', amount: Math.abs(fundsFromOps) });
        }

        // Group items
        const groupItems = (items: any[]) => {
          const grouped: Record<string, number> = {};
          items.forEach(item => {
            grouped[item.name] = (grouped[item.name] || 0) + item.amount;
          });
          return Object.entries(grouped).map(([name, amount]) => ({ name, amount }));
        };

        const finalSources = groupItems(sourceItems);
        const finalApps = groupItems(applicationItems);

        setSources(finalSources);
        setApplications(finalApps);

        const totalSources = finalSources.reduce((sum, i) => sum + i.amount, 0);
        const totalApps = finalApps.reduce((sum, i) => sum + i.amount, 0);
        setWorkingCapitalChange(totalSources - totalApps);

      } catch (err) {
        console.error('Error fetching funds flow:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFundsFlow();
  }, [user?.companyId, dateRange]);

  const totalSources = sources.reduce((sum, item) => sum + item.amount, 0);
  const totalApplications = applications.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Funds Flow Statement</h1>
            <p className="text-gray-500">Analysis of changes in financial position</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sources of Funds */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Sources of Funds</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {sources.length > 0 ? sources.map((item, idx) => (
              <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-gray-500">No sources found</div>
            )}
            <div className="px-6 py-4 bg-blue-50 flex justify-between items-center font-bold text-blue-900">
              <span>Total Sources</span>
              <span>{formatCurrency(totalSources)}</span>
            </div>
          </div>
        </div>

        {/* Applications of Funds */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-orange-50 flex items-center gap-2">
            <MinusCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Applications of Funds</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {applications.length > 0 ? applications.map((item, idx) => (
              <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-gray-500">No applications found</div>
            )}
            <div className="px-6 py-4 bg-orange-50 flex justify-between items-center font-bold text-orange-900">
              <span>Total Applications</span>
              <span>{formatCurrency(totalApplications)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            workingCapitalChange >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Net Change in Working Capital</h4>
            <p className={cn(
              "text-2xl font-bold",
              workingCapitalChange >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {workingCapitalChange >= 0 ? 'Increase of ' : 'Decrease of '}
              {formatCurrency(Math.abs(workingCapitalChange))}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500 max-w-xs text-right">
          This represents the net change in current assets and current liabilities during the period.
        </div>
      </div>
    </div>
  );
}
