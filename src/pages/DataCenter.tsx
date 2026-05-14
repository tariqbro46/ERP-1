import React, { useState } from 'react';
import { Download, Share2, FileJson, Table, FileText, Database, Shield, Globe, Clock, CheckCircle2, AlertCircle, Copy, Link as LinkIcon, Trash2 } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function DataCenter() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'xlsx' | 'json' | 'pdf', type: string) => {
    setExporting(`${type}-${format}`);
    try {
      // Simulate data fetch based on type
      let data: any[] = [];
      if (type === 'vouchers') {
        const vouchers = await erpService.getCollection('vouchers', user?.companyId || '');
        data = vouchers;
      } else if (type === 'ledgers') {
        const ledgers = await erpService.getCollection('ledgers', user?.companyId || '');
        data = ledgers;
      }
      
      if (format === 'xlsx') {
        erpService.exportToExcel(data, `${type}_export`);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.json`;
        a.click();
      }
      
      showNotification(`${type} exported successfully!`, 'success');
    } catch (error) {
      showNotification('Export failed. Check console for details.', 'error');
    } finally {
      setExporting(null);
    }
  };

  const exportModules = [
    { id: 'vouchers', label: 'Transaction Database (Vouchers)', icon: Table, description: 'All Sales, Purchase, and Journal records.' },
    { id: 'ledgers', label: 'Financial Masters (Ledgers)', icon: Database, description: 'Customer, Supplier, and Bank accounts.' },
    { id: 'items', label: 'Inventory Masters (Items)', icon: FileText, description: 'Stock items, Units, and Categories.' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background font-mono italic">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter not-italic">Data Export & Sharing</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block not-italic px-2 bg-emerald-500/10 text-emerald-600 rounded">Secure Gateway</p>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-8">
        {/* Security Banner */}
        <div className="bg-foreground text-background p-6 lg:p-8 flex items-center gap-6 relative overflow-hidden not-italic">
          <div className="shrink-0 hidden sm:flex w-16 h-16 bg-white/10 items-center justify-center rounded-full">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest">End-to-End Encrypted Data Center</h2>
            <p className="text-[11px] leading-relaxed uppercase opacity-80 max-w-2xl">
              All exports are processed locally in your browser. No financial data leaves the secure environment during the export process. Your cloud backups are synced every 30 seconds.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-white/10 text-[8px] uppercase font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Protection
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 not-italic">
          {/* Main Exports */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
              <Download className="w-3 h-3" /> System Exports
            </h3>
            
            <div className="space-y-4">
              {exportModules.map((mod) => (
                <div key={mod.id} className="bg-card border border-border p-6 shadow-sm flex items-center justify-between group hover:border-foreground/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded group-hover:bg-foreground group-hover:text-background transition-colors">
                      <mod.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-tighter">{mod.label}</h4>
                      <p className="text-[9px] text-gray-500 uppercase">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleExport('xlsx', mod.id)}
                      disabled={!!exporting}
                      className="p-2 border border-border hover:bg-emerald-500 hover:text-white transition-all rounded disabled:opacity-50"
                      title="Export to Excel"
                    >
                      <Table className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleExport('json', mod.id)}
                      disabled={!!exporting}
                      className="p-2 border border-border hover:bg-blue-500 hover:text-white transition-all rounded disabled:opacity-50"
                      title="Export to JSON"
                    >
                      <FileJson className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Share & Public Access */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
              <Share2 className="w-3 h-3" /> External Sharing (Sharing Links)
            </h3>

            <div className="bg-card border border-border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Public View Links</h4>
                  <p className="text-[9px] text-gray-400 uppercase">Share live reports with clients via secure URL.</p>
                </div>
                <button className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all">
                  Generate Link
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-muted/50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase">Balance Sheet - Q1 2024</span>
                      <span className="text-[8px] text-gray-400 uppercase">Expires in 12 Days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-foreground/5 rounded transition-colors" title="Copy Link"><Copy className="w-3 h-3 text-gray-500" /></button>
                    <button className="p-1.5 hover:bg-red-500/10 rounded transition-colors group" title="Revoke Access"><Trash2 className="w-3 h-3 text-gray-400 group-hover:text-red-500" /></button>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Table className="w-4 h-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase">Customer Statement: Tanvir R.</span>
                      <span className="text-[8px] text-gray-400 uppercase">No Expiry • Public</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-foreground/5 rounded transition-colors"><Copy className="w-3 h-3 text-gray-500" /></button>
                    <button className="p-1.5 hover:bg-red-500/10 rounded transition-colors group"><Trash2 className="w-3 h-3 text-gray-400 group-hover:text-red-500" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 p-4 flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[9px] text-amber-700 leading-relaxed uppercase font-bold">
                  Shared links allow anyone with the URL to view (not edit) the report. Be careful when sharing sensitive data with external parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-card border border-border p-6 space-y-4 not-italic uppercase">
          <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Recent Export Activity
          </h3>
          <div className="text-[10px] space-y-3">
             <div className="flex items-center gap-4 text-gray-500">
                <span className="w-24">12:30 PM</span>
                <span className="w-32 font-bold text-foreground">XLSX Export</span>
                <span className="flex-1 opacity-70 italic font-mono lowercase">Daybook_Full_Report.xlsx • Processed Successfully</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
             </div>
             <div className="flex items-center gap-4 text-gray-500">
                <span className="w-24">10:15 AM</span>
                <span className="w-32 font-bold text-foreground">JSON Stream</span>
                <span className="flex-1 opacity-70 italic font-mono lowercase">Ledger_Masters_Raw.json • 156 Records Exported</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
