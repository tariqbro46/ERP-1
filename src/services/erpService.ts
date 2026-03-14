import { supabase } from '../lib/supabase';
import { Voucher, VoucherEntry, Item, Ledger } from '../types';

export const erpService = {
  async logActivity(action: string, details: string, entity_type?: string, entity_id?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('activity_log').insert([{
        user_id: user?.id,
        action,
        details,
        entity_type,
        entity_id,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  },

  // Vouchers
  async createVoucher(voucher: any, entries: any[], inventoryEntries?: any[]) {
    const { data: vData, error: vError } = await supabase
      .from('vouchers')
      .insert([voucher])
      .select()
      .single();

    if (vError) throw vError;

    const entryPayload = entries.map(e => ({
      voucher_id: vData.id,
      ledger_id: e.ledger_id,
      debit: e.debit,
      credit: e.credit
    }));

    const { error: eError } = await supabase
      .from('voucher_entries')
      .insert(entryPayload);

    if (eError) throw eError;

    // Update Ledger Balances
    for (const entry of entries) {
      if (entry.ledger_id) {
        const { data: ledger } = await supabase.from('ledgers').select('current_balance').eq('id', entry.ledger_id).single();
        if (ledger) {
          const newBalance = (ledger.current_balance || 0) + (entry.debit || 0) - (entry.credit || 0);
          await supabase.from('ledgers').update({ current_balance: newBalance }).eq('id', entry.ledger_id);
        }
      }
    }

    if (inventoryEntries && inventoryEntries.length > 0) {
      const invPayload = inventoryEntries.map(i => {
        const payload: any = {
          voucher_id: vData.id,
          item_id: i.item_id,
          qty: i.qty,
          rate: i.rate,
          amount: i.amount,
          discount_percent: i.disc_percent || 0,
          movement_type: i.movement_type || i.m_type || (voucher.v_type === 'Sales' ? 'Outward' : 'Inward')
        };
        if (i.godown_id) payload.godown_id = i.godown_id;
        return payload;
      });

      const { error: iError } = await supabase
        .from('inventory_entries')
        .insert(invPayload);

      if (iError) {
        console.error('Inventory Save Error:', iError);
        throw new Error(`Inventory Error: ${iError.message}`);
      }

      // Recalculate Item Stats (Stock & Avg Cost)
      const uniqueItemIds = Array.from(new Set(inventoryEntries.map(i => i.item_id)));
      for (const itemId of uniqueItemIds) {
        await this.recalculateItemStats(itemId);
      }
    }

    return vData;
  },

  async recalculateItemStats(itemId: string) {
    // 1. Get opening stats
    const { data: item, error: iError } = await supabase
      .from('items')
      .select('opening_qty, opening_rate')
      .eq('id', itemId)
      .single();
    
    if (iError || !item) return;

    // 2. Get all inventory entries for this item, ordered by date
    // We need to join with vouchers to get the date
    const { data: entries, error: eError } = await supabase
      .from('inventory_entries')
      .select(`
        qty,
        rate,
        movement_type,
        vouchers(v_date)
      `)
      .eq('item_id', itemId);
    
    if (eError || !entries) return;

    // Sort entries by date
    const sortedEntries = entries.sort((a: any, b: any) => {
      const vA = Array.isArray(a.vouchers) ? a.vouchers[0] : a.vouchers;
      const vB = Array.isArray(b.vouchers) ? b.vouchers[0] : b.vouchers;
      const dateA = new Date(vA?.v_date || 0).getTime();
      const dateB = new Date(vB?.v_date || 0).getTime();
      return dateA - dateB;
    });

    // 3. Calculate Moving Weighted Average
    let currentStock = Number(item.opening_qty) || 0;
    let currentAvgCost = Number(item.opening_rate) || 0;

    for (const entry of sortedEntries) {
      const qty = Number(entry.qty) || 0;
      const rate = Number(entry.rate) || 0;
      
      if (entry.movement_type === 'Inward') {
        // For Inward (Purchases), update Average Cost
        const oldTotalValue = currentStock * currentAvgCost;
        const newPurchaseValue = qty * rate;
        const newTotalQty = currentStock + qty;
        
        if (newTotalQty > 0) {
          currentAvgCost = (oldTotalValue + newPurchaseValue) / newTotalQty;
        }
        currentStock = newTotalQty;
      } else {
        // For Outward (Sales), Average Cost remains same, only Stock decreases
        currentStock -= qty;
      }
    }

    // 4. Update Item
    await supabase.from('items').update({
      current_stock: currentStock,
      avg_cost: currentAvgCost
    }).eq('id', itemId);
  },

  async getVoucherById(id: string) {
    const { data: voucher, error: vError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', id)
      .single();
    if (vError) throw vError;

    const { data: entries, error: eError } = await supabase
      .from('voucher_entries')
      .select('*, ledgers(name)')
      .eq('voucher_id', id);
    if (eError) throw eError;

    const { data: inventory, error: iError } = await supabase
      .from('inventory_entries')
      .select('*, items(name, units(name))')
      .eq('voucher_id', id);
    if (iError) throw iError;

    return { ...voucher, entries, inventory };
  },

  async updateVoucher(id: string, voucher: any, entries: any[], inventoryEntries?: any[]) {
    // To update properly, we first reverse the old voucher's impact
    const oldVoucher = await this.getVoucherById(id);
    if (oldVoucher) {
      // Reverse Ledgers
      for (const entry of oldVoucher.entries) {
        const { data: ledger } = await supabase.from('ledgers').select('current_balance').eq('id', entry.ledger_id).single();
        if (ledger) {
          const reversedBalance = (ledger.current_balance || 0) - (entry.debit || 0) + (entry.credit || 0);
          await supabase.from('ledgers').update({ current_balance: reversedBalance }).eq('id', entry.ledger_id);
        }
      }
    }

    // 1. Update voucher header
    const { error: vError } = await supabase
      .from('vouchers')
      .update(voucher)
      .eq('id', id);
    if (vError) throw vError;

    // 2. Delete existing entries
    await supabase.from('voucher_entries').delete().eq('voucher_id', id);
    await supabase.from('inventory_entries').delete().eq('voucher_id', id);

    // 3. Insert new entries
    const entryPayload = entries.map(e => ({
      voucher_id: id,
      ledger_id: e.ledger_id,
      debit: e.debit,
      credit: e.credit
    }));

    const { error: eError } = await supabase
      .from('voucher_entries')
      .insert(entryPayload);
    if (eError) throw eError;

    // Apply New Ledger Balances
    for (const entry of entries) {
      if (entry.ledger_id) {
        const { data: ledger } = await supabase.from('ledgers').select('current_balance').eq('id', entry.ledger_id).single();
        if (ledger) {
          const newBalance = (ledger.current_balance || 0) + (entry.debit || 0) - (entry.credit || 0);
          await supabase.from('ledgers').update({ current_balance: newBalance }).eq('id', entry.ledger_id);
        }
      }
    }

    if (inventoryEntries && inventoryEntries.length > 0) {
      const invPayload = inventoryEntries.map(i => {
        const payload: any = {
          voucher_id: id,
          item_id: i.item_id,
          qty: i.qty,
          rate: i.rate,
          amount: i.amount,
          discount_percent: i.disc_percent || 0,
          movement_type: i.movement_type || i.m_type || (voucher.v_type === 'Sales' ? 'Outward' : 'Inward')
        };
        if (i.godown_id) payload.godown_id = i.godown_id;
        return payload;
      });

      const { error: iError } = await supabase
        .from('inventory_entries')
        .insert(invPayload);
      if (iError) throw iError;
    }

    // Recalculate Item Stats (Stock & Avg Cost) for all items involved
    const itemIdsToUpdate = new Set<string>();
    if (oldVoucher && oldVoucher.inventory) {
      oldVoucher.inventory.forEach((i: any) => itemIdsToUpdate.add(i.item_id));
    }
    if (inventoryEntries) {
      inventoryEntries.forEach(i => itemIdsToUpdate.add(i.item_id));
    }
    
    for (const itemId of Array.from(itemIdsToUpdate)) {
      await this.recalculateItemStats(itemId);
    }

    return true;
  },

  async deleteVoucher(id: string) {
    console.log('erpService: Starting deletion for voucher ID:', id);
    
    let oldVoucher: any = null;
    try {
      // Reverse impact before deleting
      oldVoucher = await this.getVoucherById(id);
      if (oldVoucher) {
        console.log('erpService: Reversing ledger balances...');
        // Reverse Ledgers
        for (const entry of oldVoucher.entries) {
          const { data: ledger } = await supabase.from('ledgers').select('current_balance').eq('id', entry.ledger_id).single();
          if (ledger) {
            const reversedBalance = (ledger.current_balance || 0) - (entry.debit || 0) + (entry.credit || 0);
            await supabase.from('ledgers').update({ current_balance: reversedBalance }).eq('id', entry.ledger_id);
          }
        }
      }
    } catch (reverseError) {
      console.error('erpService: Warning - Could not reverse balances before deletion:', reverseError);
      // We continue with deletion anyway to allow the user to clean up corrupted data
    }

    console.log('erpService: Deleting child records...');
    // Manually delete children to avoid FK issues if cascade is missing in DB
    const { error: eError } = await supabase.from('voucher_entries').delete().eq('voucher_id', id);
    if (eError) console.error('Error deleting voucher_entries:', eError);
    
    const { error: iError } = await supabase.from('inventory_entries').delete().eq('voucher_id', id);
    if (iError) console.error('Error deleting inventory_entries:', iError);

    // Recalculate Item Stats after deletion
    if (oldVoucher && oldVoucher.inventory) {
      const uniqueItemIds = Array.from(new Set(oldVoucher.inventory.map((i: any) => i.item_id)));
      for (const itemId of uniqueItemIds) {
        await this.recalculateItemStats(itemId as string);
      }
    }

    console.log('erpService: Deleting voucher record...');
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('erpService: Error deleting voucher:', error);
      throw error;
    }
    console.log('erpService: Voucher deleted successfully');
  },

  // Ledgers
  async getLedgers() {
    const { data, error } = await supabase
      .from('ledgers')
      .select('*, ledger_groups(name, nature)');
    if (error) throw error;
    return data;
  },

  async getLedgerGroups() {
    const { data, error } = await supabase
      .from('ledger_groups')
      .select('*')
      .order('name');
    if (error) throw error;
    
    if (data.length === 0) {
      return await this.seedDefaultGroups();
    }
    
    return data;
  },

  async seedDefaultGroups() {
    const defaultGroups = [
      { name: 'Bank Accounts', nature: 'Asset' },
      { name: 'Bank OD A/c', nature: 'Liability' },
      { name: 'Cash-in-Hand', nature: 'Asset' },
      { name: 'Current Assets', nature: 'Asset' },
      { name: 'Current Liabilities', nature: 'Liability' },
      { name: 'Direct Expenses', nature: 'Expense' },
      { name: 'Direct Incomes', nature: 'Income' },
      { name: 'Fixed Assets', nature: 'Asset' },
      { name: 'Indirect Expenses', nature: 'Expense' },
      { name: 'Indirect Incomes', nature: 'Income' },
      { name: 'Investments', nature: 'Asset' },
      { name: 'Loans (Liability)', nature: 'Liability' },
      { name: 'Purchase Accounts', nature: 'Expense' },
      { name: 'Sales Accounts', nature: 'Income' },
      { name: 'Stock-in-Hand', nature: 'Asset' },
      { name: 'Sundry Creditors', nature: 'Liability' },
      { name: 'Sundry Debtors', nature: 'Asset' },
      { name: 'Capital Account', nature: 'Liability' },
      { name: 'Duties & Taxes', nature: 'Liability' },
      { name: 'Provisions', nature: 'Liability' },
      { name: 'Reserves & Surplus', nature: 'Liability' },
      { name: 'Suspense A/c', nature: 'Asset' }
    ];

    // Use upsert with 'name' as the unique constraint to prevent duplicates
    const { data, error } = await supabase
      .from('ledger_groups')
      .upsert(defaultGroups, { onConflict: 'name' })
      .select();

    if (error) throw error;
    return data;
  },

  async createLedger(ledger: any) {
    // Initialize current_balance with opening_balance
    const payload = {
      ...ledger,
      current_balance: ledger.opening_balance || 0
    };
    const { data, error } = await supabase
      .from('ledgers')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLedger(id: string, ledger: any) {
    // Get old ledger to calculate difference in opening_balance
    const { data: oldLedger } = await supabase.from('ledgers').select('opening_balance, current_balance').eq('id', id).single();
    
    let payload = { ...ledger };
    
    if (oldLedger && ledger.opening_balance !== undefined) {
      const diff = (ledger.opening_balance || 0) - (oldLedger.opening_balance || 0);
      payload.current_balance = (oldLedger.current_balance || 0) + diff;
    }

    const { data, error } = await supabase
      .from('ledgers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getLedgerById(id: string) {
    const { data, error } = await supabase
      .from('ledgers')
      .select('*, ledger_groups(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLedger(id: string) {
    const { error } = await supabase
      .from('ledgers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async checkLedgerTransactions(id: string) {
    const { count, error } = await supabase
      .from('voucher_entries')
      .select('id', { count: 'exact', head: true })
      .eq('ledger_id', id);
    if (error) throw error;
    return (count || 0) > 0;
  },

  // Items
  async getItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*, units(name)');
    if (error) throw error;
    return data;
  },

  async getItemById(id: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*, units(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateItem(id: string, item: any) {
    const { data, error } = await supabase
      .from('items')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async createItem(item: any) {
    const { data, error } = await supabase
      .from('items')
      .insert([{
        ...item,
        current_stock: item.opening_qty || 0,
        avg_cost: item.opening_rate || 0
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkItemTransactions(id: string) {
    const { count, error } = await supabase
      .from('inventory_entries')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', id);
    if (error) throw error;
    return (count || 0) > 0;
  },

  // Godowns
  async getGodowns() {
    const { data, error } = await supabase
      .from('godowns')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async createGodown(godown: any) {
    const { data, error } = await supabase
      .from('godowns')
      .insert([godown])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGodown(id: string, godown: any) {
    const { data, error } = await supabase
      .from('godowns')
      .update(godown)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGodown(id: string) {
    const { error } = await supabase
      .from('godowns')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const [ledgers, vouchers, items] = await Promise.all([
        this.getLedgers(),
        supabase.from('vouchers').select('total_amount, v_type, v_date'),
        this.getItems()
      ]);

      const revenue = vouchers.data?.filter(v => v.v_type === 'Sales').reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const stockValue = items.reduce((sum, i) => sum + (i.current_stock * i.avg_cost), 0);
      const activeLedgers = ledgers.length;
      
      // Simplified profit calculation for dashboard
      const expenses = vouchers.data?.filter(v => v.v_type === 'Payment').reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
      const profit = revenue - expenses;

      // Calculate monthly revenue for chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = months.map(m => ({ name: m, value: 0 }));
      
      vouchers.data?.filter(v => v.v_type === 'Sales').forEach(v => {
        const month = new Date(v.v_date).getMonth();
        chartData[month].value += (v.total_amount || 0);
      });

      return { revenue, profit, activeLedgers, stockValue, chartData };
    } catch (err) {
      console.error('Error getting dashboard stats:', err);
      return { revenue: 0, profit: 0, activeLedgers: 0, stockValue: 0 };
    }
  },

  async getRecentVouchers(limit = 5) {
    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        voucher_entries(
          ledgers(name)
        )
      `)
      .order('v_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    
    return (data || []).map(v => ({
      ...v,
      particulars: v.voucher_entries?.[0]?.ledgers?.name || 'Journal Entry'
    }));
  },

  async getNextVoucherNumber(type: string) {
    const { data, error } = await supabase
      .from('vouchers')
      .select('v_no')
      .eq('v_type', type)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      const prefix = type.substring(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      return `${prefix}/${year}/001`;
    }

    const lastNo = data[0].v_no;
    const parts = lastNo.split('/');
    if (parts.length === 3) {
      const nextNum = String(parseInt(parts[2]) + 1).padStart(3, '0');
      return `${parts[0]}/${parts[1]}/${nextNum}`;
    }
    
    return lastNo + '-1';
  }
};
