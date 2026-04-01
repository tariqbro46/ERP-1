import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
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

export function OrderManagement() {
  const { user } = useAuth();
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
      showNotification(`Order status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      showNotification('Failed to update status', 'error');
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
    <div className="p-4 lg:p-8 bg-background min-h-screen font-mono">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-6 mb-12 border-b border-border pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary mb-1">
            <Printer className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Production Control</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-foreground uppercase">Order Management</h1>
        </div>
        
        <button 
          onClick={handleNewOrder}
          className="px-4 md:px-6 py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Machine Status Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 mb-12">
        {machines.map(machine => (
          <div key={machine.id} className="bg-card border border-border p-4 relative overflow-hidden group">
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              machine.status === 'Idle' ? "bg-emerald-500" : machine.status === 'Busy' ? "bg-blue-500" : "bg-rose-500"
            )} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{machine.name}</span>
              <Cpu className={cn("w-4 h-4", machine.status === 'Busy' ? "text-blue-500 animate-pulse" : "text-muted-foreground")} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground uppercase">
                {machine.status === 'Busy' ? machine.currentOrderName : 'System Idle'}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                {machine.status === 'Busy' ? 'Processing Print Job' : 'Ready for Assignment'}
              </p>
            </div>
          </div>
        ))}
        {machines.length === 0 && (
          <div className="col-span-full py-4 text-center border border-dashed border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            No machines configured. Add machines in settings.
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-row gap-2 mb-8 items-center justify-between bg-muted/30 p-2 border border-border overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <div className="relative w-40 md:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input 
              type="text"
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border py-1.5 pl-8 pr-2 text-[9px] uppercase tracking-widest outline-none focus:border-primary"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-background border border-border py-1.5 px-2 text-[9px] uppercase tracking-widest outline-none focus:border-primary"
          >
            <option value="All">ALL</option>
            <option value="Pending">PENDING</option>
            <option value="Printing">PRINTING</option>
            <option value="Completed">COMPLETED</option>
            <option value="Delivered">DELIVERED</option>
            <option value="Cancelled">CANCELLED</option>
          </select>
        </div>
        
        <div className="flex items-center border border-border bg-background min-w-max">
          <button 
            onClick={() => setViewMode('list')}
            className={cn("p-1.5 transition-colors", viewMode === 'list' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={cn("p-1.5 transition-colors", viewMode === 'grid' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Orders View */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Printer className="w-8 h-8 text-primary animate-bounce" />
        </div>
      ) : viewMode === 'list' ? (
        <div className="border border-border bg-card overflow-x-auto no-scrollbar">
          <div className="min-w-[800px] lg:min-w-full">
              <div className="grid grid-cols-12 gap-2 p-3 border-b border-border bg-muted/50 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                <div className="col-span-4">Client / Item / Design</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Print Type</div>
                <div className="col-span-2 text-center">Delivery</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-border">
                {filteredOrders.map(order => {
                  const orderItems = order.items || [];
                  const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0) || order.quantity || 0;
                  
                  return (
                    <div 
                      key={order.id} 
                      onClick={() => handleEditOrder(order)}
                      className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/20 transition-colors group cursor-pointer"
                    >
                      <div className="col-span-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded",
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
                      </div>
                      <div className="col-span-1 text-center text-xs font-bold text-foreground">
                        {totalQty.toLocaleString()}
                      </div>
                      <div className="col-span-2 text-center">
                        {order.orderType === 'Sales' ? (
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 border text-muted-foreground border-border bg-muted">
                            N/A
                          </span>
                        ) : (
                          <span className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0.5 border",
                            (orderItems[0]?.printType || order.printType) === 'Digital' ? "text-purple-500 border-purple-500/20 bg-purple-500/5" : "text-gray-500 border-border bg-muted"
                          )}>
                            {orderItems[0]?.printType || order.printType} {(orderItems[0]?.isDoubleSided || order.isDoubleSided) ? '2S' : '1S'}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-[9px] font-bold">{format(new Date(order.deliveryDate), 'dd MMM yy')}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">{order.deliveryTime || '12:00'}</p>
                      </div>
                      <div className="col-span-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                          className={cn(
                            "text-[8px] font-bold uppercase px-1 py-0.5 rounded-full border outline-none cursor-pointer w-full",
                            getStatusColor(order.status)
                          )}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Printing">Printing</option>
                          <option value="Completed">Completed</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-span-2 text-right flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditOrder(order)}
                            className="px-4 py-2 text-[10px] font-bold uppercase bg-green-600 text-white hover:bg-green-700 transition-colors rounded shadow-sm min-w-[80px]"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="px-4 py-2 text-[10px] font-bold uppercase bg-red-600 text-white hover:bg-red-700 transition-colors rounded shadow-sm min-w-[80px]"
                          >
                            Delete
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-1 w-full">
                          {order.orderType === 'Production' && order.status === 'Completed' && !order.isConvertedToFinishGoods && (
                            <button
                              onClick={() => handleConvertToFinishGoods(order.id)}
                              disabled={converting === order.id}
                              className="text-[9px] font-bold uppercase px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {converting === order.id ? '...' : 'Finish Goods'}
                            </button>
                          )}
                          
                          {(order.orderType === 'Sales' || (order.orderType === 'Production' && order.status === 'Completed')) && !order.isConvertedToSalesVoucher && (
                            <button
                              onClick={() => handleConvertToSalesVoucher(order)}
                              className="text-[9px] font-bold uppercase px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm"
                            >
                              Sales Voucher
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {filteredOrders.length === 0 && (
                <div className="p-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground italic">
                  No orders found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-card border border-border p-6 space-y-4 hover:border-primary transition-colors group relative">
              <div className="flex justify-between items-start">
                <div className={cn(
                  "text-[8px] font-bold uppercase px-2 py-0.5 rounded border",
                  getStatusColor(order.status)
                )}>
                  {order.status}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditOrder(order)} className="p-1.5 hover:bg-foreground/5 text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(order.id)} className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground uppercase leading-tight">{order.clientName}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.itemName}</p>
                {order.printDesign && (
                  <p className="text-[9px] text-primary uppercase font-bold italic">Design: {order.printDesign}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-0.5">
                  <p className="text-[8px] text-muted-foreground uppercase font-bold">Quantity</p>
                  <p className="text-xs font-bold">{order.quantity} Pcs</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] text-muted-foreground uppercase font-bold">Print Type</p>
                  <p className="text-xs font-bold">{order.printType}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>DELIVERY: {format(new Date(order.deliveryDate), 'dd MMM')} @ {order.deliveryTime || '12:00'}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <Truck className="w-3 h-3" />
                  <span className="truncate">{order.deliveryLocation}</span>
                </div>
              </div>

              {order.status === 'Printing' && order.machineName && (
                <div className="mt-4 p-2 bg-blue-500/5 border border-blue-500/20 flex items-center gap-2">
                  <Printer className="w-3 h-3 text-blue-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-blue-500 uppercase">ON {order.machineName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Modal removed as we use full page entry for multi-item support */}
    </div>
  );
}
