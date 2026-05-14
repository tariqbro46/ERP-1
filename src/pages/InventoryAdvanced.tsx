import React, { useState, useEffect } from 'react';
import { Package, Hash, Calendar, ShieldCheck, Search, Filter, Plus, AlertTriangle, Layers, QrCode, FileBarChart, ArrowRightLeft, Database, History, Zap } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Item, Batch, SerialNumber } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function InventoryAdvanced() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'batches' | 'serials' | 'history'>('batches');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventory();
  }, [user?.companyId]);

  const loadInventory = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getCollection('items', user.companyId);
      setItems(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuActions = [
    { label: 'Batch Tracking', id: 'batches', icon: Layers },
    { label: 'Serial Management', id: 'serials', icon: Hash },
    { label: 'Movement Ledger', id: 'history', icon: History },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background font-mono">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Modern Inventory</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden lg:block">Advanced Tracking & Logistics</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search serials/batches..."
                className="bg-muted border border-border pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-foreground outline-none uppercase placeholder:text-gray-400 w-full sm:w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Initialize Stock
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-muted border border-border">
          {menuActions.map(action => (
            <button
              key={action.id}
              onClick={() => setActiveTab(action.id as any)}
              className={cn(
                "flex items-center justify-center gap-2 py-4 text-[10px] uppercase font-bold tracking-widest transition-all",
                activeTab === action.id 
                  ? "bg-foreground text-background shadow-md"
                  : "text-gray-500 hover:bg-foreground/5"
              )}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Content Table Area */}
        <div className="bg-card border border-border shadow-sm overflow-hidden flex flex-col uppercase">
          <div className="p-4 border-b border-border bg-muted/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Active Stock Tracking</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-border bg-card rounded hover:bg-muted"><Filter className="w-4 h-4" /></button>
              <button className="p-2 border border-border bg-card rounded hover:bg-muted"><QrCode className="w-4 h-4" /></button>
              <button className="p-2 border border-border bg-card rounded hover:bg-muted"><FileBarChart className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-border">
                <tr>
                  <th className="px-6 py-4">Item Identity</th>
                  <th className="px-6 py-4">Reference No</th>
                  <th className="px-6 py-4">Status / Location</th>
                  <th className="px-6 py-4">Lifecycle Date</th>
                  <th className="px-6 py-4 text-right">Inventory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Art Paper 120GSM', ref: 'BATCH-4402', status: 'In Stock', date: 'Exp: 2026-05-12', godown: 'Factory A' },
                  { name: 'HP LaserJet Toner', ref: 'SN-HP9901223', status: 'Allocated', date: 'Added: 2024-02-10', godown: 'H.O Store' },
                  { name: 'Standard Ink Cyan', ref: 'BATCH-2291', status: 'Low Stock', date: 'Exp: 2024-12-01', godown: 'Factory B' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-foreground/5 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-border bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground mb-0.5 tracking-tight">{row.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono italic">ERP-ITEM-{idx+1}00</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 px-2 border border-blue-500/20 bg-blue-500/5 text-blue-600 text-[10px] font-mono font-bold rounded">
                          {row.ref}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", row.status === 'In Stock' ? 'bg-emerald-500' : 'bg-amber-500')} />
                          <span className="text-[10px] font-bold text-foreground">{row.status}</span>
                        </div>
                        <p className="text-[9px] text-gray-400">{row.godown}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                        <Calendar className="w-3 h-3" /> {row.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-4 py-1.5 border border-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
                          Transfer
                        </button>
                        <button className="p-2 border border-border hover:bg-muted transition-colors rounded">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-foreground text-background p-8 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Inventory Intelligence</h3>
              </div>
              <p className="text-xl font-bold font-mono tracking-tighter uppercase leading-none">Your stock rotation has increased by <span className="text-emerald-400">12.5%</span> this quarter.</p>
              <div className="pt-4 flex gap-4">
                <button className="px-6 py-2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all">Download Analysis</button>
                <button className="px-6 py-2 border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Optimize Godown</button>
              </div>
            </div>
            <BarChart3 className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 rotate-12" />
          </div>

          <div className="bg-card border border-border p-8 py-10 flex flex-col justify-center space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Compliance & Audit</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[11px] text-gray-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                All 45,000+ Serial Numbers are Verified
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Batch expiry alerts integrated with Sales
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                3 Item Godowns require Physical Verification
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
