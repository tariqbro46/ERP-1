import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronDown, Folder, FileText, Edit2, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChartOfAccounts() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    ledgers.some(l => l.group_id === group.id && l.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Chart of Accounts</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Hierarchy of Ledgers and Groups</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
            <input 
              type="text"
              placeholder="Search accounts..."
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-foreground pl-9 pr-4 py-2 text-[10px] outline-none focus:border-foreground transition-colors uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="bg-card border border-border p-4 lg:p-8 overflow-x-auto no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-6 h-6 text-foreground animate-spin" />
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">Loading Hierarchy...</div>
            </div>
          ) : (
            <div className="space-y-8 min-w-[400px]">
              {filteredGroups.map(group => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-[0.15em] border-b border-border pb-2">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    {group.name}
                    <span className="text-[8px] text-gray-600 font-normal ml-2 tracking-widest">({group.nature})</span>
                  </div>
                  <div className="ml-6 space-y-1 border-l border-border pl-6">
                    {ledgers.filter(l => l.group_id === group.id).length === 0 ? (
                      <div className="text-[9px] text-gray-700 italic uppercase tracking-widest py-1">No ledgers in this group</div>
                    ) : (
                      ledgers.filter(l => l.group_id === group.id).map(ledger => (
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
                              ৳ {ledger.current_balance?.toLocaleString() || 0}
                            </div>
                            <button 
                              onClick={() => navigate(`/accounts/ledgers/edit/${ledger.id}`)}
                              className="p-1.5 bg-card border border-border text-gray-600 hover:text-foreground hover:border-foreground transition-all sm:opacity-0 group-hover:opacity-100"
                              title="Edit Ledger"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
