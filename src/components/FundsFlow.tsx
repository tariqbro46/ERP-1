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
    <div className="h-full flex flex-col bg-background font-mono transition-colors overflow-hidden">
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Funds Flow Statement</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Analysis of changes in financial position</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-background border border-border rounded-lg hover:bg-foreground/5 transition-colors">
              <Printer className="w-4 h-4" />
              {t('common.print')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-foreground rounded-lg hover:opacity-90 transition-colors">
              <Download className="w-4 h-4" />
              {t('common.downloadPdf')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sources of Funds */}
          <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-blue-500/5 flex items-center gap-2 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-blue-600 uppercase tracking-widest text-[10px]">Sources of Funds</h3>
            </div>
            <div className="divide-y divide-border">
              {sources.length > 0 ? sources.map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-foreground/5 transition-colors">
                  <span className="text-foreground/70 text-sm">{item.name}</span>
                  <span className="font-bold text-foreground font-mono">{formatCurrency(item.amount)}</span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">No sources found</div>
              )}
              <div className="px-6 py-4 bg-blue-500/10 flex justify-between items-center font-bold text-blue-700 uppercase tracking-wider text-[10px] sticky bottom-0 border-t-2 border-blue-200">
                <span>Total Sources</span>
                <span className="text-sm font-mono">{formatCurrency(totalSources)}</span>
              </div>
            </div>
          </div>

          {/* Applications of Funds */}
          <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-rose-500/5 flex items-center gap-2 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
              <MinusCircle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-rose-600 uppercase tracking-widest text-[10px]">Applications of Funds</h3>
            </div>
            <div className="divide-y divide-border">
              {applications.length > 0 ? applications.map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-foreground/5 transition-colors">
                  <span className="text-foreground/70 text-sm">{item.name}</span>
                  <span className="font-bold text-foreground font-mono">{formatCurrency(item.amount)}</span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">No applications found</div>
              )}
              <div className="px-6 py-4 bg-rose-500/10 flex justify-between items-center font-bold text-rose-700 uppercase tracking-wider text-[10px] sticky bottom-0 border-t-2 border-rose-200">
                <span>Total Applications</span>
                <span className="text-sm font-mono">{formatCurrency(totalApplications)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-background p-6 rounded-xl border border-border shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-4 rounded-full shadow-inner",
              workingCapitalChange >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
            )}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Net Change in Working Capital</h4>
              <p className={cn(
                "text-2xl font-bold font-mono tracking-tight",
                workingCapitalChange >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {workingCapitalChange >= 0 ? 'Increase of ' : 'Decrease of '}
                {formatCurrency(Math.abs(workingCapitalChange))}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 max-w-xs text-right uppercase leading-relaxed font-bold tracking-tighter">
            This represents the net change in current assets and current liabilities during the period.
          </div>
        </div>
      </div>
    </div>
  );
}
