import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Truck, Clock, Search, Filter, Plus, FileText, CheckCircle2, AlertCircle, TrendingUp, BarChart3, ChevronRight, Zap, Trash2 } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PurchaseOrder } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function PurchaseManagement() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'received'>('all');

  useEffect(() => {
    loadOrders();
  }, [user?.companyId]);

  const loadOrders = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getPurchaseOrders(user.companyId);
      setOrders(data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      showNotification('Failed to load purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await erpService.deletePurchaseOrder(id);
      showNotification('Purchase order deleted successfully');
      loadOrders();
    } catch (error) {
      showNotification('Failed to delete purchase order', 'error');
    }
  };

  const stats = [
    { label: 'Open POs', value: orders.filter(o => o.status === 'Pending').length.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Month Spend', value: `৳ ${orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Suppliers', value: new Set(orders.map(o => o.supplierName)).size.toString(), icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background font-mono">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Supply Chain & Purchase</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden lg:block">Logistics & Vendor Management</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all">
              <Truck className="w-4 h-4 text-blue-500" /> Manage Suppliers
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Raise PO
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border p-6 flex items-center justify-between shadow-sm group hover:border-foreground/20 transition-all"
            >
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold font-mono tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-lg transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main PO Table */}
          <div className="flex-1 bg-card border border-border shadow-sm flex flex-col overflow-hidden uppercase">
            <div className="flex items-center gap-1 border-b border-border p-2 bg-muted/30">
              {['all', 'pending', 'received'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-foreground text-background" : "text-gray-500 hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left order-collapse border-b border-border">
                <thead className="bg-muted text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-border">
                  <tr>
                    <th className="px-6 py-4">PO Details</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Clock className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">No Purchase Orders Found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-foreground/5 cursor-pointer group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground mb-0.5">{order.poNumber}</span>
                          <span className="text-[9px] text-gray-400">{order.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                            {order.supplierName?.[0] || 'S'}
                          </div>
                          <span className="text-[10px] font-bold text-foreground">{order.supplierName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold">৳ {order.totalAmount?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit",
                          order.status === 'Pending' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {order.status === 'Pending' ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order.id);
                            }}
                            className="p-2 hover:bg-rose-500/10 text-rose-500 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Showing Latest 25 Transactions</span>
              </div>
              <button className="text-[10px] text-foreground font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                View All POs <BarChart3 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Actions / Tips */}
          <div className="w-full lg:w-[350px] space-y-6">
            <div className="bg-foreground text-background p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Supply Intelligence</h3>
              </div>
              <ul className="space-y-4">
                <li className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Reorder Suggestion</p>
                  <p className="text-[11px] leading-relaxed uppercase">"Art Paper 120GSM" is running low. Average replenishment time: 4 days.</p>
                </li>
                <li className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Vendor Performance</p>
                  <p className="text-[11px] leading-relaxed uppercase">Global Paper Mart delivery delay increased by 20% this month.</p>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border p-6 shadow-sm space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-2">Recent Shipments</h3>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest">Standard Ink - In Transit</p>
                      <p className="text-[9px] text-gray-500 uppercase">Est. Delivery: March 15, 2024</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
