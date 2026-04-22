import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronRight, ChevronDown, Folder, FileText, Edit2, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EditableHeader } from './EditableHeader';
import { formatNumber } from '../lib/utils';

export function ChartOfAccounts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      try {
        const [g, l] = await Promise.all([
          erpService.getLedgerGroups(user.companyId),
          erpService.getLedgers(user.companyId)
        ]);
        
        // Ensure unique groups by name if duplicates somehow exist
        const uniqueGroups = Array.from(new Map((g || []).map(item => [item.name, item])).values());
        
        setGroups(uniqueGroups);
        setLedgers(l || []);
      } catch (err) {
        console.error('Error fetching chart of accounts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId]);

  const filteredLedgers = ledgers
    .filter(l => 
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.alias && l.alias.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredGroups = groups
    .filter(group => 
      search === '' ? true : filteredLedgers.some(l => l.group_id === group.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors text-[11px] overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border z-30 shadow-sm">
        <div className="p-4 lg:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <EditableHeader 
              pageId="chart_of_accounts"
              defaultTitle={t('accounts.chartOfAccounts')}
              defaultSubtitle={t('accounts.hierarchy')}
            />
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
              <input 
                type="text"
                placeholder={t('common.searchPlaceholder')}
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border text-foreground pl-9 pr-4 py-2 text-[10px] outline-none focus:border-foreground transition-colors uppercase tracking-widest"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-6">
        <div className="bg-card border border-border p-4 lg:p-8 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-6 h-6 text-foreground animate-spin" />
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">{t('accounts.loadingHierarchy')}</div>
            </div>
          ) : search ? (
            /* Flat search results as requested: "sudhu sey ledger dekhabe" */
            <div className="space-y-1">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-4 border-b border-border pb-2">
                Search Results: {filteredLedgers.length} ledgers found
              </div>
              {filteredLedgers.length === 0 ? (
                <div className="text-center py-20 text-gray-500 uppercase tracking-widest">No matching ledgers found</div>
              ) : (
                filteredLedgers.map(ledger => (
                  <div key={ledger.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-2 group hover:bg-foreground/5 px-2 -ml-2 transition-colors gap-2 border-b border-border/10 last:border-0">
                    <div className="flex items-center gap-3 text-gray-400 text-[11px] group-hover:text-foreground transition-colors">
                      <FileText className="w-3 h-3 text-gray-600" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="font-bold sm:font-normal">{ledger.name}</span>
                        <span className="text-[8px] text-gray-500 uppercase px-1.5 py-0.5 bg-foreground/5 border border-border">
                          {groups.find(g => g.id === ledger.group_id)?.name}
                        </span>
                        {ledger.alias && <span className="text-[9px] text-gray-700 italic">({ledger.alias})</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 pl-6 sm:pl-0">
                      <div className="text-[10px] text-gray-500 font-mono">
                        {formatNumber(ledger.current_balance)}
                      </div>
                      <button 
                        onClick={() => navigate(`/accounts/ledgers/edit/${ledger.id}`)}
                        className="p-1.5 bg-card border border-border text-gray-600 hover:text-foreground hover:border-foreground transition-all sm:opacity-0 group-hover:opacity-100"
                        title={t('ledger.edit')}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-8 min-w-[400px]">
              {filteredGroups.map(group => {
                const groupLedgers = filteredLedgers.filter(l => l.group_id === group.id);
                
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-[0.15em] border-b border-border pb-2 sticky top-0 bg-card z-10 py-2">
                      <Folder className="w-3.5 h-3.5 text-amber-500" />
                      {group.name}
                      <span className="text-[8px] text-gray-600 font-normal ml-2 tracking-widest">({group.nature})</span>
                    </div>
                    <div className="ml-6 space-y-1 border-l border-border pl-6">
                      {groupLedgers.length === 0 ? (
                        <div className="text-[9px] text-gray-700 italic uppercase tracking-widest py-1">{t('accounts.noLedgersInGroup')}</div>
                      ) : (
                        groupLedgers.map(ledger => (
                          <div key={ledger.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-2 group hover:bg-foreground/5 px-2 -ml-2 transition-colors gap-2">
                            <div className="flex items-center gap-3 text-gray-400 text-[11px] group-hover:text-foreground transition-colors">
                              <FileText className="w-3 h-3 text-gray-600" />
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-bold sm:font-normal">{ledger.name}</span>
                                {ledger.alias && <span className="text-[9px] text-gray-700 italic">({ledger.alias})</span>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-6 pl-6 sm:pl-0">
                              <div className="text-[10px] text-gray-500 font-mono">
                                {formatNumber(ledger.current_balance)}
                              </div>
                              <button 
                                onClick={() => navigate(`/accounts/ledgers/edit/${ledger.id}`)}
                                className="p-1.5 bg-card border border-border text-gray-600 hover:text-foreground hover:border-foreground transition-all sm:opacity-0 group-hover:opacity-100"
                                title={t('ledger.edit')}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
