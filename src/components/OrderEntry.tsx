import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Printer, 
  ChevronLeft, 
  Save,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Package,
  User,
  Truck
} from 'lucide-react';
import { PrintingOrder, Ledger, Item, OrderStatus, PrintType, UserProfile } from '../types';
import { format } from 'date-fns';
import { SearchableSelect } from './SearchableSelect';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function OrderEntry() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [uniqueDesigns, setUniqueDesigns] = useState<string[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [formData, setFormData] = useState<Partial<PrintingOrder>>({
    clientId: '',
    clientName: '',
    orderType: 'Production',
    receivedBy: '',
    items: [{
      itemId: '',
      itemName: '',
      quantity: 0,
      price: 0,
      printDesign: '',
      printType: 'Analog',
      isDoubleSided: false
    }],
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryTime: '12:00',
    deliveryLocation: '',
    notes: '',
    status: 'Pending'
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchMasterData();
      if (id) {
        fetchOrder();
      }
    }
  }, [user?.companyId, id]);

  async function fetchMasterData() {
    try {
      const [ledgersData, itemsData, designsData, usersData, employeesData] = await Promise.all([
        erpService.getLedgers(user!.companyId),
        erpService.getItems(user!.companyId),
        erpService.getUniquePrintDesigns(user!.companyId),
        erpService.getCompanyUsers(user!.companyId),
        erpService.getEmployees(user!.companyId)
      ]);
      setLedgers(ledgersData);
      setItems(itemsData);
      setUniqueDesigns(designsData);
      
      // Combine users and employees for "Order Received By"
      const combinedStaff = [
        ...usersData,
        ...employeesData.map((e: any) => ({
          uid: e.id,
          displayName: e.name,
          email: e.email || '',
          role: 'Staff' as any,
          companyId: user!.companyId
        }))
      ];
      setUsers(combinedStaff);

      // Fetch balances
      const balanceMap: Record<string, number> = {};
      await Promise.all(ledgersData.map(async (l) => {
        // Corrected arguments: ledgerId, companyId
        const bal = await erpService.getLedgerBalance(l.id, user!.companyId);
        balanceMap[l.id] = bal;
      }));
      setBalances(balanceMap);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  }

  const handleClientChange = async (clientId: string) => {
    const ledger = ledgers.find(l => l.id === clientId);
    if (!ledger) return;

    setFormData(prev => ({ ...prev, clientId, clientName: ledger.name }));

    // Intelligent Suggestions for the first item if it's empty
    if (formData.items?.[0] && !formData.items[0].itemId) {
      try {
        const history = await erpService.getClientOrderHistory(user!.companyId, clientId);
        if (history.length > 0) {
          const itemCounts: Record<string, number> = {};
          const designCounts: Record<string, number> = {};
          
          history.forEach(order => {
            const orderItems = order.items || [];
            orderItems.forEach(item => {
              if (item.itemId) itemCounts[item.itemId] = (itemCounts[item.itemId] || 0) + 1;
              if (item.printDesign) designCounts[item.printDesign] = (designCounts[item.printDesign] || 0) + 1;
            });
          });

          const topItemId = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          const topDesign = Object.entries(designCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

          if (topItemId) {
            const item = items.find(i => i.id === topItemId);
            if (item) {
              updateItem(0, { itemId: item.id, itemName: item.name, printDesign: topDesign || '' });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching client history:', err);
      }
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          itemId: '',
          itemName: '',
          quantity: 0,
          price: 0,
          printDesign: '',
          printType: 'Analog',
          isDoubleSided: false
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, updates: Partial<any>) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  async function fetchOrder() {
    setLoading(true);
    try {
      const orders = await erpService.getOrders(user!.companyId);
      const order = orders.find(o => o.id === id);
      if (order) {
        setFormData({
          ...order,
          clientId: order.clientId || '',
          clientName: order.clientName || '',
          orderType: order.orderType || 'Production',
          receivedBy: order.receivedBy || '',
          deliveryDate: order.deliveryDate || format(new Date(), 'yyyy-MM-dd'),
          deliveryTime: order.deliveryTime || '12:00',
          deliveryLocation: order.deliveryLocation || '',
          notes: order.notes || '',
          status: order.status || 'Pending',
          items: (order.items || []).map((i: any) => ({
            itemId: i.itemId || '',
            itemName: i.itemName || '',
            quantity: i.quantity || 0,
            price: i.price || 0,
            printDesign: i.printDesign || '',
            printType: i.printType || 'Analog',
            isDoubleSided: i.isDoubleSided || false
          }))
        });
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    if (!formData.items || formData.items.length === 0) {
      showNotification('Please add at least one item', 'error');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await erpService.updateOrder(id, formData);
        showNotification('Order updated successfully');
        navigate('/production/orders');
      } else {
        await erpService.createOrder({
          ...formData,
          companyId: user.companyId
        } as any);
        showNotification('Order created successfully');
        // Reset form for next entry
        setFormData({
          clientId: '',
          clientName: '',
          orderType: 'Production',
          receivedBy: '',
          items: [{
            itemId: '',
            itemName: '',
            quantity: 0,
            price: 0,
            printDesign: '',
            printType: 'Analog',
            isDoubleSided: false
          }],
          deliveryDate: format(new Date(), 'yyyy-MM-dd'),
          deliveryTime: '12:00',
          deliveryLocation: '',
          notes: '',
          status: 'Pending'
        });
      }
    } catch (err) {
      console.error('Error saving order:', err);
      showNotification('Failed to save order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-background min-h-screen font-mono">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/production/orders')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Printer className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold">
                  {formData.orderType} Order
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tighter text-foreground uppercase">
                {id ? 'Edit Order' : 'New Order Entry'}
              </h1>
            </div>
          </div>

          <div className="flex gap-2 bg-muted p-1 rounded-sm">
            {(['Production', 'Sales'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderType: type }))}
                className={cn(
                  "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                  formData.orderType === type 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information */}
          <div className="bg-card border border-border p-8">
            <div className="flex items-center gap-2 text-primary mb-6">
              <User className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Client Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3 space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Client Name (Ledger)</label>
                  {formData.clientId && balances[formData.clientId] !== undefined && (
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Balance: <span className={cn(balances[formData.clientId] >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {Math.abs(balances[formData.clientId]).toLocaleString()} {balances[formData.clientId] >= 0 ? 'DR' : 'CR'}
                      </span>
                    </span>
                  )}
                </div>
                <SearchableSelect
                  options={ledgers.map(l => ({ id: l.id, name: l.name }))}
                  value={formData.clientId || ''}
                  onChange={handleClientChange}
                  placeholder="SEARCH CLIENT..."
                  className="text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Order Received By</label>
                <select
                  value={formData.receivedBy || ''}
                  onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                  className="w-full bg-background border border-border p-3 text-xs outline-none focus:border-primary font-bold"
                >
                  <option value="">Select Staff...</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Package className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Order Items</span>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
              >
                + Add Item
              </button>
            </div>

            {formData.items?.map((item, index) => (
              <div key={index} className="bg-card border border-border p-8 relative group">
                {formData.items!.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <span className="text-[10px] uppercase font-bold">Remove</span>
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Item / Bag</label>
                      <SearchableSelect
                        options={items.map(i => ({ id: i.id, name: i.name }))}
                        value={item.itemId || ''}
                        onChange={(val) => {
                          const selectedItem = items.find(i => i.id === val);
                          updateItem(index, { itemId: val, itemName: selectedItem?.name || '' });
                        }}
                        placeholder="SEARCH ITEM..."
                      />
                    </div>

                    {formData.orderType === 'Production' && (
                      <div className="space-y-1">
                        <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Print Design Needed</label>
                        <SearchableSelect
                          options={uniqueDesigns.map(d => ({ id: d, name: d }))}
                          value={item.printDesign || ''}
                          onChange={(val) => updateItem(index, { printDesign: val })}
                          placeholder="SEARCH OR TYPE DESIGN NAME..."
                          allowCustom={true}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Quantity</label>
                      <input 
                        type="number"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 0 })}
                        className="w-full bg-background border border-border p-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Negotiated Price</label>
                      <input 
                        type="number"
                        required
                        value={item.price}
                        onChange={(e) => updateItem(index, { price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-background border border-border p-2 text-xs outline-none focus:border-primary"
                      />
                    </div>

                    {formData.orderType === 'Production' && (
                      <>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Print Type</label>
                          <div className="flex gap-2">
                            {(['Analog', 'Digital'] as const).map(type => (
                              <button 
                                key={type}
                                type="button"
                                onClick={() => updateItem(index, { printType: type })}
                                className={cn(
                                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all",
                                  item.printType === type ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground"
                                )}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Printing Sides</label>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={() => updateItem(index, { isDoubleSided: false })}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all",
                                !item.isDoubleSided ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground"
                              )}
                            >
                              Single
                            </button>
                            <button 
                              type="button"
                              onClick={() => updateItem(index, { isDoubleSided: true })}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all",
                                item.isDoubleSided ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground"
                              )}
                            >
                              Double
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border border-border p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Truck className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Delivery Schedule</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Date *</label>
                  <input 
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full bg-background border border-border p-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Time *</label>
                  <input 
                    type="time"
                    required
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    className="w-full bg-background border border-border p-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Delivery Location</label>
                <input 
                  type="text"
                  value={formData.deliveryLocation}
                  onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                  className="w-full bg-background border border-border p-2 text-xs uppercase tracking-widest outline-none focus:border-primary"
                  placeholder="ENTER FULL ADDRESS"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Additional Info</span>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-background border border-border p-2 text-xs uppercase tracking-widest outline-none focus:border-primary min-h-[120px]"
                  placeholder="ANY SPECIAL INSTRUCTIONS..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => navigate('/production/orders')}
              className="px-8 py-4 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-12 py-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'SAVING...' : id ? 'UPDATE ORDER' : 'CONFIRM ORDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
