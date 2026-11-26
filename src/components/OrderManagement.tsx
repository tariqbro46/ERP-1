import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Printer, 
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
  Cpu,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  ExternalLink
} from 'lucide-react';
import { PrintingOrder, PrintingMachine, OrderStatus, PrintType, Ledger, Item } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';
import { SkeletonLoader } from './SkeletonLoader';

export function OrderManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState<PrintingOrder[]>([]);
  const [machines, setMachines] = useState<PrintingMachine[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [uniqueDesigns, setUniqueDesigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [converting, setConverting] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.companyId) {
      fetchData();
    }
  }, [user?.companyId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [ordersData, machinesData, ledgersData, itemsData, designsData] = await Promise.all([
        erpService.getOrders(user!.companyId),
        erpService.getMachines(user!.companyId),
        erpService.getLedgers(user!.companyId),
        erpService.getItems(user!.companyId),
        erpService.getUniquePrintDesigns(user!.companyId)
      ]);
      setOrders(ordersData);
      setMachines(machinesData);
      setLedgers(ledgersData);
      setItems(itemsData);
      setUniqueDesigns(designsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNewOrder = () => {
    navigate('/production/orders/new');
  };

  const handleEditOrder = (order: PrintingOrder) => {
    navigate(`/production/orders/edit/${order.id}`);
  };

  const handleConvertToFinishGoods = async (orderId: string) => {
    if (!user?.companyId) return;
    setConverting(orderId);
    try {
      await erpService.convertToFinishGoods(user.companyId, orderId);
      showNotification('Converted to Finish Goods successfully');
      fetchData();
    } catch (err) {
      console.error('Error converting to finish goods:', err);
      showNotification('Failed to convert to finish goods', 'error');
    } finally {
      setConverting(null);
    }
  };

  const handleConvertToSalesVoucher = (order: PrintingOrder) => {
    // Navigate to sales voucher entry with order data in state
    navigate('/vouchers/new', { 
      state: { 
        orderData: order,
        voucherType: 'Sales'
      } 
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await erpService.deleteOrder(id);
      showNotification('Order deleted');
      fetchData();
    } catch (err) {
      showNotification('Failed to delete order', 'error');
    }
  };

  const handleStatusChange = async (order: PrintingOrder, newStatus: OrderStatus) => {
    try {
      const updates: Partial<PrintingOrder> = { status: newStatus };
      
      // For multi-item orders, we might need a more complex machine assignment logic
      // For now, if it's a single item or we just assign to the first one
      const firstItem = order.items?.[0];
      
      if (newStatus === 'Printing' && (!firstItem?.machineId) && machines.length > 0) {
        const idleMachine = machines.find(m => m.status === 'Idle');
        if (idleMachine) {
          if (order.items && order.items.length > 0) {
            const newItems = [...order.items];
            newItems[0] = { ...newItems[0], machineId: idleMachine.id, machineName: idleMachine.name };
            updates.items = newItems;
          } else {
            updates.machineId = idleMachine.id;
            updates.machineName = idleMachine.name;
          }

          await erpService.updateMachine(idleMachine.id, { 
            status: 'Busy', 
            currentOrderId: order.id,
            currentOrderName: `${order.clientName} - ${firstItem?.itemName || order.itemName}`
          });
        }
      }
      
      if (order.status === 'Printing' && newStatus !== 'Printing') {
        const machineId = order.items?.[0]?.machineId || order.machineId;
        if (machineId) {
          await erpService.updateMachine(machineId, { 
            status: 'Idle', 
            currentOrderId: '',
            currentOrderName: ''
          });
        }
      }

      await erpService.updateOrder(order.id, updates);
      showNotification(t('production.statusUpdateSuccess', { status: newStatus }));
      fetchData();
    } catch (err) {
      showNotification(t('production.statusUpdateError'), 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      order.clientName.toLowerCase().includes(searchStr) ||
      (order.items || []).some(item => 
        item.itemName.toLowerCase().includes(searchStr) || 
        (item.printDesign || '').toLowerCase().includes(searchStr)
      ) ||
      order.itemName?.toLowerCase().includes(searchStr) ||
      (order.printDesign || '').toLowerCase().includes(searchStr);
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Printing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Delivered': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Cancelled': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-[40] bg-background border-b border-border shadow-sm p-4 lg:p-8">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary mb-1">
              <Printer className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">{t('production.productionControl')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground uppercase">{t('nav.orderManagement')}</h1>
          </div>
          
          <button 
            onClick={handleNewOrder}
            className="px-4 md:px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('production.newOrder')}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6">
        {/* Machine Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {machines.map(machine => (
          <div key={machine.id} className="bg-card border border-border rounded-xl p-4 relative overflow-hidden group shadow-[var(--shadow-surface)]">
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              machine.status === 'Idle' ? "bg-emerald-500" : machine.status === 'Busy' ? "bg-blue-500" : "bg-rose-500"
            )} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{machine.name}</span>
              <Cpu className={cn("w-4 h-4", machine.status === 'Busy' ? "text-blue-500" : "text-muted-foreground")} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground uppercase">
                {machine.status === 'Busy' ? machine.currentOrderName : t('production.idle')}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                {machine.status === 'Busy' ? t('production.processingJob') : t('production.readyForAssignment')}
              </p>
            </div>
          </div>
        ))}
        {machines.length === 0 && (
          <div className="col-span-full py-4 text-center rounded-xl border border-dashed border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('production.noMachinesConfigured')}
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-row gap-2 mb-6 items-center justify-between bg-muted/30 p-2 rounded-xl border border-border overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <div className="relative w-44 md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input 
              type="text"
              placeholder={t('production.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-primary"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs uppercase outline-none focus:border-primary cursor-pointer"
          >
            <option value="All">{t('common.all')}</option>
            <option value="Pending">{t('production.status.Pending')}</option>
            <option value="Printing">{t('production.status.Printing')}</option>
            <option value="Completed">{t('production.status.Completed')}</option>
            <option value="Delivered">{t('production.status.Delivered')}</option>
            <option value="Cancelled">{t('production.status.Cancelled')}</option>
          </select>
        </div>
        
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background min-w-max">
          <button 
            onClick={() => setViewMode('list')}
            className={cn("p-1.5 transition-colors cursor-pointer", viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={cn("p-1.5 transition-colors cursor-pointer", viewMode === 'grid' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Orders View */}
      {loading ? (
        <SkeletonLoader type="table" pageKey="payroll" isFullPage={false} />
      ) : viewMode === 'list' ? (
        <div className="border border-border rounded-xl bg-card overflow-x-auto no-scrollbar shadow-[var(--shadow-surface)]">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead className="bg-muted/95 backdrop-blur-sm border-b border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground sticky top-0 z-20">
              <tr>
                <th className="p-3 align-middle w-[34%]">{t('production.clientItemDesign')}</th>
                <th className="p-3 text-center align-middle w-[10%]">{t('production.qty')}</th>
                <th className="p-3 text-center align-middle w-[14%]">{t('production.printType')}</th>
                <th className="p-3 text-center align-middle w-[14%]">{t('production.delivery')}</th>
                <th className="p-3 text-center align-middle w-[12%]">{t('common.status')}</th>
                <th className="p-3 text-right align-middle w-[16%]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map(order => {
                const orderItems = order.items || [];
                const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0) || order.quantity || 0;
                const parsedDelivery = order.deliveryDate ? new Date(order.deliveryDate) : null;
                const formattedDelivery = parsedDelivery && !isNaN(parsedDelivery.getTime()) ? format(parsedDelivery, 'dd MMM yy') : 'N/A';

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleEditOrder(order)}
                    className="hover:bg-muted/20 transition-colors group cursor-pointer"
                  >
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded shrink-0",
                          order.orderType === 'Sales' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-blue-500 border-blue-500/20 bg-blue-500/5"
                        )}>
                          {order.orderType || 'Production'}
                        </span>
                        <p className="text-sm font-bold text-foreground uppercase tracking-tight truncate">{order.clientName}</p>
                      </div>

                      {orderItems.length > 0 ? (
                        <div className="space-y-1">
                          {orderItems.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex flex-col">
                              <p className="text-[11px] text-muted-foreground uppercase tracking-tighter font-medium truncate">
                                {item.itemName}
                              </p>
                              {item.printDesign && (
                                <p className="text-[9px] text-primary uppercase font-bold italic truncate">
                                  Design: {item.printDesign}
                                </p>
                              )}
                            </div>
                          ))}
                          {orderItems.length > 2 && (
                            <p className="text-[9px] text-muted-foreground italic">+{orderItems.length - 2} more items</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-tighter font-medium truncate">{order.itemName}</p>
                          {order.printDesign && (
                            <p className="text-[10px] text-primary uppercase font-bold mt-0.5 italic truncate">
                              Design: {order.printDesign}
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="p-3 text-center text-xs font-bold text-foreground align-middle whitespace-nowrap tabular-nums">
                      {Math.round(totalQty).toLocaleString()}
                    </td>
                    <td className="p-3 text-center align-middle whitespace-nowrap">
                      {order.orderType === 'Sales' ? (
                        <span className="inline-flex items-center text-[8px] font-bold uppercase px-1.5 py-0.5 border text-muted-foreground border-border bg-muted">
                          N/A
                        </span>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center text-[8px] font-bold uppercase px-1.5 py-0.5 border",
                          (orderItems[0]?.printType || order.printType) === 'Digital' ? "text-purple-500 border-purple-500/20 bg-purple-500/5" : "text-gray-500 border-border bg-muted"
                        )}>
                          {orderItems[0]?.printType || order.printType} {(orderItems[0]?.isDoubleSided || order.isDoubleSided) ? '2S' : '1S'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center align-middle whitespace-nowrap tabular-nums">
                      <p className="text-[10px] font-bold">{formattedDelivery}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{order.deliveryTime || '12:00'}</p>
                    </td>
                    <td className="p-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                        className={cn(
                          "text-[8px] font-bold uppercase px-2 py-1 rounded-full border outline-none cursor-pointer w-full min-w-[90px]",
                          getStatusColor(order.status)
                        )}
                      >
                        <option value="Pending">{t('production.status.Pending')}</option>
                        <option value="Printing">{t('production.status.Printing')}</option>
                        <option value="Completed">{t('production.status.Completed')}</option>
                        <option value="Delivered">{t('production.status.Delivered')}</option>
                        <option value="Cancelled">{t('production.status.Cancelled')}</option>
                      </select>
                    </td>
                    <td className="p-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-end justify-center gap-1.5">
                        <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase bg-green-600 text-white hover:bg-green-700 transition-colors rounded shadow-sm"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase bg-red-600 text-white hover:bg-red-700 transition-colors rounded shadow-sm"
                          >
                            {t('common.delete')}
                          </button>
                        </div>

                        <div className="flex flex-wrap justify-end gap-1 w-full">
                          {order.orderType === 'Production' && order.status === 'Completed' && !order.isConvertedToFinishGoods && (
                            <button
                              onClick={() => handleConvertToFinishGoods(order.id)}
                              disabled={converting === order.id}
                              className="text-[9px] font-bold uppercase px-2.5 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                            >
                              {converting === order.id ? '...' : t('production.finishGoods')}
                            </button>
                          )}

                          {(order.orderType === 'Sales' || (order.orderType === 'Production' && order.status === 'Completed')) && !order.isConvertedToSalesVoucher && (
                            <button
                              onClick={() => handleConvertToSalesVoucher(order)}
                              className="text-[9px] font-bold uppercase px-2.5 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap"
                            >
                              {t('production.salesVoucher')}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground italic align-middle">
                    {t('production.noOrdersFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-primary/40 transition-colors group relative shadow-[var(--shadow-surface)]">
              <div className="flex justify-between items-start">
                <div className={cn(
                  "text-[9px] font-bold uppercase px-2 py-0.5 rounded border",
                  getStatusColor(order.status)
                )}>
                  {order.status}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditOrder(order)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(order.id)} className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground uppercase leading-tight">{order.clientName}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{order.itemName}</p>
                {order.printDesign && (
                  <p className="text-[10px] text-primary uppercase font-bold italic">Design: {order.printDesign}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">{t('common.quantity')}</p>
                  <p className="text-xs font-bold tabular-nums">{order.quantity} Pcs</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">{t('production.printType')}</p>
                  <p className="text-xs font-bold">{order.printType}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>DELIVERY: {format(new Date(order.deliveryDate), 'dd MMM')} @ {order.deliveryTime || '12:00'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Truck className="w-3.5 h-3.5" />
                  <span className="truncate">{order.deliveryLocation}</span>
                </div>
              </div>

              {order.status === 'Printing' && order.machineName && (
                <div className="mt-4 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-bold text-blue-500 uppercase">ON {order.machineName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Modal removed as we use full page entry for multi-item support */}
      </div>
    </div>
  );
}
