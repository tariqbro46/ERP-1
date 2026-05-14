import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Phone, Mail, Calendar, Search, Filter, MessageCircle, MoreVertical, Star, TrendingUp, Clock, CheckCircle2, Plus } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Lead, Interaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CRM() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newInteraction, setNewInteraction] = useState({ type: 'Call', details: '' });

  const statusColors: Record<string, string> = {
    'New': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Qualified': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'Proposal': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Negotiation': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    'Won': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Lost': 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  useEffect(() => {
    loadLeads();
  }, [user?.companyId]);

  const loadLeads = async () => {
    if (!user?.companyId) return;
    setLoading(false);
    // Demo data for now, would be erpService.getLeads
    setLeads([
      { id: '1', companyId: user.companyId, name: 'Sabbir Ahmed', email: 'sabbir@example.com', phone: '01711223344', status: 'New', source: 'Web', createdAt: new Date() } as Lead,
      { id: '2', companyId: user.companyId, name: 'Farhana Kabir', email: 'farhana@example.com', phone: '01855667788', status: 'Qualified', source: 'Referral', createdAt: new Date() } as Lead,
      { id: '3', companyId: user.companyId, name: 'Tanvir Rahman', email: 'tanvir@test.com', phone: '01900112233', status: 'Won', source: 'Direct', createdAt: new Date() } as Lead,
    ]);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-full bg-background font-mono">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Advanced CRM</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden lg:block">Lead & Relationship Intelligence</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-muted border border-border pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-foreground outline-none uppercase placeholder:text-gray-400"
              />
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* Lead List */}
        <div className="flex-1 overflow-hidden flex flex-col bg-card border border-border rounded-none shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-[10px] uppercase font-bold tracking-widest outline-none border-none py-1 focus:ring-0"
              >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{filteredLeads.length} Lead Found</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-border">
              {filteredLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:bg-foreground/5",
                    selectedLead?.id === lead.id ? "bg-foreground/5 border-l-4 border-foreground" : "border-l-4 border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest">{lead.name}</h3>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 border rounded-sm",
                      statusColors[lead.status]
                    )}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 truncate uppercase tracking-widest">
                      <Mail className="w-3 h-3" /> {lead.email}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last Active: Just Now
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-foreground/10 rounded transition-colors">
                        <Star className="w-3 h-3 text-amber-500" />
                      </button>
                      <button className="p-1 hover:bg-foreground/10 rounded transition-colors">
                        <MoreVertical className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Details / Dashboard */}
        <div className="w-full lg:w-[450px] flex flex-col gap-6 overflow-y-auto no-scrollbar">
          {!selectedLead ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-card border border-border p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest">Select a Lead to View Insights</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest max-w-[200px] leading-relaxed">
                Click on any lead from the list to manage interactions and track conversions.
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col space-y-6"
            >
              {/* Profile Card */}
              <div className="bg-card border border-border p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-foreground flex items-center justify-center text-background text-lg font-bold">
                    {selectedLead.name[0]}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest leading-none mb-1">{selectedLead.name}</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Customer ID: LD-{selectedLead.id.padStart(4, '0')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 mt-6">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Total Value</p>
                    <p className="text-xs font-mono font-bold tracking-tight">৳ 0.00</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Probability</p>
                    <p className="text-xs font-mono font-bold tracking-tight text-emerald-500">85%</p>
                  </div>
                </div>
              </div>

              {/* Interactions */}
              <div className="bg-card border border-border flex-1 flex flex-col min-h-[400px]">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Timeline</h3>
                  <button className="text-[9px] text-foreground font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> New Activity
                  </button>
                </div>
                
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Timeline Items */}
                  <div className="relative pl-6 space-y-8 border-l border-border">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Lead Won</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase">Project "Skyline Design" finalized and moved to production.</p>
                        <p className="text-[8px] text-gray-400 mt-2 uppercase">2 Days Ago • System Alpha</p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-foreground ring-4 ring-foreground/5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="w-3 h-3 text-foreground" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Call Outcome: Positive</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase">Client interested in bulk purchase. Expected quote by Friday.</p>
                        <p className="text-[8px] text-gray-400 mt-2 uppercase">5 Days Ago • Sabbir Ahmed</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/50">
                  <div className="flex gap-2 mb-2">
                    {['Call', 'Meeting', 'Note'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setNewInteraction({...newInteraction, type})}
                        className={cn(
                          "px-3 py-1 text-[8px] font-bold uppercase tracking-widest transition-all",
                          newInteraction.type === type ? "bg-foreground text-background" : "bg-card text-gray-500 border border-border"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="Add an update..."
                      className="w-full bg-background border border-border p-3 text-[11px] focus:ring-1 focus:ring-foreground outline-none resize-none uppercase"
                      rows={2}
                    />
                    <button className="absolute right-2 bottom-2 p-1.5 bg-foreground text-background rounded hover:bg-foreground/90 transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
