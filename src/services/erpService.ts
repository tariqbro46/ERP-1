import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  setDoc,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Voucher, Item, Ledger } from '../types';

// Initialize a secondary auth instance for admin tasks (adding users)
// This avoids signing out the current admin user
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
// ... (rest of the error handling code remains same)

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to get collection with company filter
async function getCollection<T = any>(colName: string, companyId: string): Promise<T[]> {
  try {
    const q = query(collection(db, colName), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
    return [];
  }
}

export const erpService = {
  getCollection,

  async logActivity(companyId: string, userId: string, action: string, details: string, entity_type?: string, entity_id?: string) {
    try {
      await addDoc(collection(db, 'activity_log'), {
        companyId,
        userId,
        action,
        details,
        entity_type,
        entity_id,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  },

  // Vouchers
  async createVoucher(companyId: string, userId: string, voucher: any, entries: any[], inventoryEntries?: any[]) {
    const batch = writeBatch(db);
    
    // 1. Create Voucher Header
    const vRef = doc(collection(db, 'vouchers'));
    const vData = {
      ...voucher,
      id: vRef.id,
      companyId,
      createdBy: userId,
      createdAt: serverTimestamp()
    };
    batch.set(vRef, vData);

    // 2. Create Accounting Entries
    for (const entry of entries) {
      const eRef = doc(collection(db, 'voucher_entries'));
      batch.set(eRef, {
        ...entry,
        voucher_id: vRef.id,
        companyId,
        created_at: serverTimestamp()
      });

      // Update Ledger Balance
      if (entry.ledger_id) {
        const lRef = doc(db, 'ledgers', entry.ledger_id);
        const balanceChange = (entry.debit || 0) - (entry.credit || 0);
        batch.update(lRef, { current_balance: increment(balanceChange) });
      }
    }

    // 3. Create Inventory Entries
    if (inventoryEntries && inventoryEntries.length > 0) {
      for (const i of inventoryEntries) {
        const iRef = doc(collection(db, 'inventory_entries'));
        const movementType = i.movement_type || i.m_type || (voucher.v_type === 'Sales' ? 'Outward' : 'Inward');
        batch.set(iRef, {
          ...i,
          voucher_id: vRef.id,
          companyId,
          movement_type: movementType,
          created_at: serverTimestamp()
        });

        // Update Item Stats (Simplified for now, real-time recalculation is better)
        const itemRef = doc(db, 'items', i.item_id);
        const totalQty = (i.qty || 0) + (i.free_qty || 0);
        const stockChange = movementType === 'Inward' ? totalQty : -totalQty;
        batch.update(itemRef, { current_stock: increment(stockChange) });
      }
    }

    await batch.commit();
    return vData;
  },

  async getVoucherById(id: string): Promise<any> {
    const vSnap = await getDoc(doc(db, 'vouchers', id));
    if (!vSnap.exists()) throw new Error('Voucher not found');
    const voucher = vSnap.data();
    const companyId = voucher.companyId;

    const eSnap = await getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    const entries = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const iSnap = await getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    const inventory = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { ...voucher, entries, inventory, id: vSnap.id };
  },

  async deleteVoucher(id: string) {
    const voucher = await this.getVoucherById(id);
    const companyId = voucher.companyId;
    const batch = writeBatch(db);

    // Reverse Ledger Balances
    for (const entry of voucher.entries) {
      if (entry.ledger_id) {
        const lRef = doc(db, 'ledgers', entry.ledger_id);
        const balanceChange = (entry.credit || 0) - (entry.debit || 0);
        batch.update(lRef, { current_balance: increment(balanceChange) });
      }
    }

    // Reverse Inventory Stats
    for (const i of voucher.inventory) {
      const itemRef = doc(db, 'items', i.item_id);
      const totalQty = (i.qty || 0) + (i.free_qty || 0);
      const stockChange = i.movement_type === 'Inward' ? -totalQty : totalQty;
      batch.update(itemRef, { current_stock: increment(stockChange) });
    }

    // Delete Entries
    const eSnap = await getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    eSnap.docs.forEach(d => batch.delete(d.ref));

    const iSnap = await getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    iSnap.docs.forEach(d => batch.delete(d.ref));

    // Delete Voucher
    batch.delete(doc(db, 'vouchers', id));

    await batch.commit();
  },

  async updateVoucher(id: string, voucher: any, entries: any[], inventoryEntries?: any[]) {
    // To update, we first reverse the effects of the old voucher and delete its entries,
    // then we apply the new effects.
    
    const oldVoucher = await this.getVoucherById(id);
    const batch = writeBatch(db);

    // 1. Reverse Old Ledger Balances
    for (const entry of oldVoucher.entries) {
      if (entry.ledger_id) {
        const lRef = doc(db, 'ledgers', entry.ledger_id);
        const balanceChange = (entry.credit || 0) - (entry.debit || 0);
        batch.update(lRef, { current_balance: increment(balanceChange) });
      }
    }

    // 2. Reverse Old Inventory Stats
    for (const i of oldVoucher.inventory) {
      const itemRef = doc(db, 'items', i.item_id);
      const totalQty = (i.qty || 0) + (i.free_qty || 0);
      const stockChange = i.movement_type === 'Inward' ? -totalQty : totalQty;
      batch.update(itemRef, { current_stock: increment(stockChange) });
    }

    // 3. Delete Old Entries
    const companyId = oldVoucher.companyId;
    const eSnapOld = await getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    eSnapOld.docs.forEach(d => batch.delete(d.ref));

    const iSnapOld = await getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    iSnapOld.docs.forEach(d => batch.delete(d.ref));

    // 4. Update Voucher Header
    const vRef = doc(db, 'vouchers', id);
    batch.update(vRef, {
      ...voucher,
      updated_at: serverTimestamp()
    });

    // 5. Create New Accounting Entries
    for (const entry of entries) {
      const eRef = doc(collection(db, 'voucher_entries'));
      batch.set(eRef, {
        ...entry,
        voucher_id: id,
        companyId: oldVoucher.companyId,
        created_at: serverTimestamp()
      });

      // Update Ledger Balance
      if (entry.ledger_id) {
        const lRef = doc(db, 'ledgers', entry.ledger_id);
        const balanceChange = (entry.debit || 0) - (entry.credit || 0);
        batch.update(lRef, { current_balance: increment(balanceChange) });
      }
    }

    // 6. Create New Inventory Entries
    if (inventoryEntries && inventoryEntries.length > 0) {
      for (const i of inventoryEntries) {
        const iRef = doc(collection(db, 'inventory_entries'));
        const movementType = i.movement_type || i.m_type || (voucher.v_type === 'Sales' ? 'Outward' : 'Inward');
        batch.set(iRef, {
          ...i,
          voucher_id: id,
          companyId: oldVoucher.companyId,
          movement_type: movementType,
          created_at: serverTimestamp()
        });

        // Update Item Stats
        const itemRef = doc(db, 'items', i.item_id);
        const totalQty = (i.qty || 0) + (i.free_qty || 0);
        const stockChange = movementType === 'Inward' ? totalQty : -totalQty;
        batch.update(itemRef, { current_stock: increment(stockChange) });
      }
    }

    await batch.commit();
  },

  // Ledgers
  async getLedgers(companyId: string): Promise<Ledger[]> {
    try {
      const [ledgers, groups] = await Promise.all([
        getCollection<Ledger>('ledgers', companyId),
        getCollection<any>('ledger_groups', companyId)
      ]);
      
      return ledgers.map(l => ({
        ...l,
        ledger_groups: groups.find(g => g.id === l.group_id)
      }));
    } catch (error) {
      console.error('Error in getLedgers:', error);
      return [];
    }
  },

  async getLedgerById(id: string): Promise<Ledger> {
    try {
      const snap = await getDoc(doc(db, 'ledgers', id));
      if (!snap.exists()) throw new Error('Ledger not found');
      return { id: snap.id, ...snap.data() } as Ledger;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `ledgers/${id}`);
      throw error;
    }
  },

  async checkLedgerTransactions(id: string, companyId: string) {
    try {
      const q = query(
        collection(db, 'voucher_entries'), 
        where('ledger_id', '==', id), 
        where('companyId', '==', companyId),
        limit(1)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'voucher_entries');
      return false;
    }
  },

  async getLedgerGroups(companyId: string): Promise<any[]> {
    try {
      const groups = await getCollection<any>('ledger_groups', companyId);
      if (groups.length === 0) {
        // Use a lock or check again to prevent duplicate seeding
        const secondCheck = await getCollection<any>('ledger_groups', companyId);
        if (secondCheck.length > 0) return secondCheck;
        return await this.seedDefaultGroups(companyId);
      }
      // Ensure unique by name just in case
      const unique = Array.from(new Map(groups.map(g => [g.name, g])).values());
      return unique;
    } catch (error) {
      // Retry once if it's a permission error (might be race condition during registration)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const groups = await getCollection<any>('ledger_groups', companyId);
        if (groups.length === 0) {
          return await this.seedDefaultGroups(companyId);
        }
        return groups;
      } catch (retryError) {
        handleFirestoreError(retryError, OperationType.LIST, 'ledger_groups');
        return [];
      }
    }
  },

  async seedDefaultGroups(companyId: string) {
    const defaultGroups = [
      { name: 'Bank Accounts', nature: 'Asset' },
      { name: 'Cash-in-Hand', nature: 'Asset' },
      { name: 'Current Assets', nature: 'Asset' },
      { name: 'Current Liabilities', nature: 'Liability' },
      { name: 'Direct Expenses', nature: 'Expense' },
      { name: 'Direct Incomes', nature: 'Income' },
      { name: 'Fixed Assets', nature: 'Asset' },
      { name: 'Indirect Expenses', nature: 'Expense' },
      { name: 'Indirect Incomes', nature: 'Income' },
      { name: 'Purchase Accounts', nature: 'Expense' },
      { name: 'Sales Accounts', nature: 'Income' },
      { name: 'Sundry Creditors', nature: 'Liability' },
      { name: 'Sundry Debtors', nature: 'Asset' },
      { name: 'Capital Account', nature: 'Liability' }
    ];

    const batch = writeBatch(db);
    const results: any[] = [];
    for (const g of defaultGroups) {
      const ref = doc(collection(db, 'ledger_groups'));
      const data = { ...g, id: ref.id, companyId };
      batch.set(ref, data);
      results.push(data);
    }
    await batch.commit();
    return results;
  },

  async createLedger(companyId: string, ledger: any) {
    try {
      const ref = doc(collection(db, 'ledgers'));
      const data = {
        ...ledger,
        id: ref.id,
        companyId,
        current_balance: ledger.opening_balance || 0
      };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ledgers');
    }
  },

  async updateLedger(id: string, ledger: any) {
    try {
      const ref = doc(db, 'ledgers', id);
      await updateDoc(ref, ledger);
      return { id, ...ledger };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ledgers/${id}`);
    }
  },

  async deleteLedger(id: string) {
    await deleteDoc(doc(db, 'ledgers', id));
  },

  // Items
  async getItemById(id: string): Promise<Item> {
    const snap = await getDoc(doc(db, 'items', id));
    if (!snap.exists()) throw new Error('Item not found');
    return { id: snap.id, ...snap.data() } as Item;
  },

  async checkItemTransactions(id: string, companyId: string) {
    const q = query(
      collection(db, 'inventory_entries'), 
      where('item_id', '==', id), 
      where('companyId', '==', companyId),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async getUnits(companyId: string) {
    const units = await this.getCollection('units', companyId);
    if (units.length === 0) {
      return await this.seedDefaultUnits(companyId);
    }
    return units;
  },

  async seedDefaultUnits(companyId: string) {
    const defaults = [
      { name: 'Pcs', formal_name: 'Pieces' },
      { name: 'Kg', formal_name: 'Kilograms' },
      { name: 'Ltr', formal_name: 'Liters' },
      { name: 'Box', formal_name: 'Boxes' },
      { name: 'Nos', formal_name: 'Numbers' }
    ];
    const batch = writeBatch(db);
    const results: any[] = [];
    for (const u of defaults) {
      const ref = doc(collection(db, 'units'));
      const data = { ...u, id: ref.id, companyId };
      batch.set(ref, data);
      results.push(data);
    }
    await batch.commit();
    return results;
  },

  async getItems(companyId: string): Promise<Item[]> {
    return getCollection<Item>('items', companyId);
  },

  async createItem(companyId: string, item: any) {
    const ref = doc(collection(db, 'items'));
    const data = {
      ...item,
      id: ref.id,
      companyId,
      current_stock: item.opening_qty || 0,
      avg_cost: item.opening_rate || 0
    };
    await setDoc(ref, data);
    return data;
  },

  async updateItem(id: string, item: any) {
    await updateDoc(doc(db, 'items', id), item);
  },

  async deleteItem(id: string) {
    await deleteDoc(doc(db, 'items', id));
  },

  // Godowns
  async getGodowns(companyId: string) {
    return this.getCollection('godowns', companyId);
  },

  async createGodown(companyId: string, godown: any) {
    const ref = doc(collection(db, 'godowns'));
    const data = { ...godown, id: ref.id, companyId };
    await setDoc(ref, data);
    return data;
  },

  async updateGodown(id: string, godown: any) {
    await updateDoc(doc(db, 'godowns', id), godown);
  },

  async deleteGodown(id: string) {
    await deleteDoc(doc(db, 'godowns', id));
  },

  async recalculateItemStats(itemId: string) {
    const q = query(collection(db, 'inventory_entries'), where('item_id', '==', itemId));
    const snap = await getDocs(q);
    const entries = snap.docs.map(d => d.data());
    
    let stock = 0;
    for (const e of entries) {
      const movementType = e.movement_type || e.m_type;
      stock += movementType === 'Inward' ? e.qty : -e.qty;
    }
    
    await updateDoc(doc(db, 'items', itemId), { current_stock: stock });
  },

  async getVoucherEntriesByDate(companyId: string, asOnDate: string): Promise<any[]> {
    // We need to fetch vouchers first to filter by date, then get their entries
    // Or we can denormalize v_date into voucher_entries.
    // For now, let's fetch vouchers in range and then their entries.
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_date', '<=', asOnDate)
    );
    const vouchersSnap = await getDocs(vouchersQuery);
    const voucherIds = vouchersSnap.docs.map(d => d.id);
    
    if (voucherIds.length === 0) return [];
    
    // Firestore 'in' query limit is 10, so we might need to chunk or use a different approach
    // For simplicity in this ERP, we'll fetch all entries for the company and filter in memory if needed,
    // but better to filter by voucherIds if possible.
    // Actually, let's just fetch all entries for the company and filter by voucher date if we had it there.
    // Since we don't have v_date in entries, we'll fetch all and filter.
    const entriesQuery = query(collection(db, 'voucher_entries'), where('companyId', '==', companyId));
    const entriesSnap = await getDocs(entriesQuery);
    return entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((e: any) => voucherIds.includes(e.voucher_id));
  },

  async getInventoryEntriesByDate(companyId: string, endDate: string): Promise<any[]> {
    const q = query(
      collection(db, 'inventory_entries'),
      where('companyId', '==', companyId),
      where('created_at', '<=', endDate + 'T23:59:59Z')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getVoucherWithEntries(companyId: string, ledgerId: string, startDate: string, endDate: string): Promise<any[]> {
    // Fetch vouchers in range
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_date', '>=', startDate),
      where('v_date', '<=', endDate)
    );
    const vouchersSnap = await getDocs(vouchersQuery);
    const vouchers = vouchersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    if (vouchers.length === 0) return [];
    
    // Fetch ALL entries for these vouchers
    const entriesQuery = query(collection(db, 'voucher_entries'), where('companyId', '==', companyId));
    const entriesSnap = await getDocs(entriesQuery);
    const allEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Filter vouchers that have an entry for the specific ledger
    const filteredVouchers = vouchers.filter((v: any) => 
      allEntries.some((e: any) => e.voucher_id === v.id && e.ledger_id === ledgerId)
    );
    
    // Map them together
    return filteredVouchers.map((v: any) => ({
      ...v,
      voucher_entries: allEntries.filter((e: any) => e.voucher_id === v.id)
    }));
  },

  // Dashboard Stats
  async getDashboardStats(companyId: string) {
    try {
      const [vouchers, items, ledgers] = await Promise.all([
        getDocs(query(collection(db, 'vouchers'), where('companyId', '==', companyId))),
        this.getItems(companyId),
        this.getLedgers(companyId)
      ]);

      const vDocs = vouchers.docs.map(d => d.data());
      const revenue = vDocs.filter(v => v.v_type === 'Sales').reduce((sum, v) => sum + (v.total_amount || 0), 0);
      const expenses = vDocs.filter(v => v.v_type === 'Payment').reduce((sum, v) => sum + (v.total_amount || 0), 0);
      const stockValue = items.reduce((sum: number, i: any) => sum + (i.current_stock * i.avg_cost), 0);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = months.map(m => ({ name: m, value: 0 }));
      
      vDocs.filter(v => v.v_type === 'Sales').forEach(v => {
        const date = v.v_date instanceof Timestamp ? v.v_date.toDate() : new Date(v.v_date);
        const month = date.getMonth();
        chartData[month].value += (v.total_amount || 0);
      });

      return { 
        revenue, 
        profit: revenue - expenses, 
        activeLedgers: ledgers.length, 
        stockValue, 
        chartData 
      };
    } catch (err) {
      console.error('Error getting dashboard stats:', err);
      return { revenue: 0, profit: 0, activeLedgers: 0, stockValue: 0, chartData: [] };
    }
  },

  async getRecentVouchers(companyId: string, limitCount = 5): Promise<any[]> {
    const q = query(
      collection(db, 'vouchers'), 
      where('companyId', '==', companyId),
      orderBy('v_date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), particulars: 'Transaction' }));
  },

  async getVouchersByDateRange(companyId: string, startDate: string, endDate: string): Promise<any[]> {
    const q = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_date', '>=', startDate),
      where('v_date', '<=', endDate),
      orderBy('v_date', 'desc')
    );
    const snapshot = await getDocs(q);
    
    // In a real app, we'd fetch entries too. For now, we'll simplify or use a separate fetch.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getUsers(companyId: string): Promise<any[]> {
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  },

  async getAllUsers(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  async getAllCompanies(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'companies'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'companies');
      return [];
    }
  },

  async getItemByBarcode(companyId: string, barcode: string): Promise<any | null> {
    const q = query(
      collection(db, 'items'), 
      where('companyId', '==', companyId),
      where('barcode', '==', barcode),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  async updateUserRole(uid: string, role: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  },

  async adminAddUser(data: { email: string; password: string; displayName: string; role: string; companyId: string; target_amount?: number }) {
    try {
      // Create user in Firebase Auth using the secondary instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const uid = userCredential.user.uid;

      // Create the user profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        companyId: data.companyId,
        target_amount: data.target_amount || 0,
        createdAt: serverTimestamp(),
      });

      // Sign out from the secondary instance immediately
      await signOut(secondaryAuth);

      return { uid };
    } catch (error: any) {
      console.error('Error in adminAddUser:', error);
      throw new Error(error.message || 'Failed to add user');
    }
  },

  async adminDeleteUser(uid: string) {
    try {
      // We can't delete the Auth account from client-side without admin SDK
      // but we can remove their profile so they can't access the app data
      await deleteDoc(doc(db, 'users', uid));
      return { success: true };
    } catch (error: any) {
      console.error('Error in adminDeleteUser:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  async adminResetPassword(uid: string, email: string) {
    try {
      // Instead of setting password directly (which requires Admin SDK),
      // we send a password reset email which is the standard secure way.
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Error in adminResetPassword:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  },

  async getNextVoucherNumber(companyId: string, type: string): Promise<string> {
    const q = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_type', '==', type),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      const prefix = type.substring(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      return `${prefix}/${year}/001`;
    }

    const lastNo = snapshot.docs[0].data().v_no;
    const parts = lastNo.split('/');
    if (parts.length === 3) {
      const nextNum = String(parseInt(parts[2]) + 1).padStart(3, '0');
      return `${parts[0]}/${parts[1]}/${nextNum}`;
    }
    
    return lastNo + '-1';
  },

  async getLedgerBalance(ledgerId: string, companyId: string): Promise<number> {
    try {
      const [ledger, entries] = await Promise.all([
        this.getLedgerById(ledgerId),
        getDocs(query(collection(db, 'voucher_entries'), where('ledger_id', '==', ledgerId), where('companyId', '==', companyId)))
      ]);
      
      const movement = entries.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.debit || 0) - (data.credit || 0);
      }, 0);
      
      return (ledger.opening_balance || 0) + movement;
    } catch (err) {
      console.error('Error getting ledger balance:', err);
      return 0;
    }
  },

  // Company Management
  async createCompany(userId: string, companyData: any) {
    try {
      const ref = doc(collection(db, 'companies'));
      const data = {
        ...companyData,
        id: ref.id,
        createdBy: userId,
        ownerId: userId,
        createdAt: serverTimestamp(),
        isAccessEnabled: true,
        subscriptionStatus: 'Trial',
        plan: 'Standard',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 days trial
      };
      await setDoc(ref, data);
      
      // Update user's current companyId
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { companyId: ref.id });
      
      // Seed default groups for the new company
      await this.seedDefaultGroups(ref.id);
      
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'companies');
    }
  },

  async updateCompany(companyId: string, data: any) {
    try {
      const ref = doc(db, 'companies', companyId);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { id: companyId, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `companies/${companyId}`);
    }
  },

  async deleteCompany(companyId: string) {
    try {
      const batch = writeBatch(db);
      
      // List of collections to clean up
      const collections = [
        'vouchers', 'voucher_entries', 'inventory_entries', 
        'ledgers', 'ledger_groups', 'items', 'godowns', 
        'units', 'activity_log', 'settings', 'users'
      ];

      for (const colName of collections) {
        let q = query(collection(db, colName), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          // Special protection for Founder: do not delete their user profile
          if (colName === 'users' && d.data().email === 'sapientman46@gmail.com') {
            return;
          }
          batch.delete(d.ref);
        });
      }

      // Delete the company document itself
      batch.delete(doc(db, 'companies', companyId));

      await batch.commit();
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `companies/${companyId}`);
    }
  },

  async deleteUserAccount(userId: string) {
    try {
      const batch = writeBatch(db);
      
      // 1. Find all companies created by this user
      const companiesQuery = query(collection(db, 'companies'), where('createdBy', '==', userId));
      const companiesSnap = await getDocs(companiesQuery);
      
      // 2. For each company, delete all its data
      for (const companyDoc of companiesSnap.docs) {
        const companyId = companyDoc.id;
        const collections = [
          'vouchers', 'voucher_entries', 'inventory_entries', 
          'ledgers', 'ledger_groups', 'items', 'godowns', 
          'units', 'activity_log', 'settings', 'users'
        ];

        for (const colName of collections) {
          const q = query(collection(db, colName), where('companyId', '==', companyId));
          const snap = await getDocs(q);
          snap.docs.forEach(d => batch.delete(d.ref));
        }
        batch.delete(companyDoc.ref);
      }

      // 3. Delete the user profile
      batch.delete(doc(db, 'users', userId));

      await batch.commit();
      
      // 4. Delete Auth account (if possible)
      // Note: Client-side auth deletion requires recent login.
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          await auth.currentUser.delete();
        } catch (authError: any) {
          if (authError.code === 'auth/requires-recent-login') {
            throw new Error('This operation is sensitive and requires recent authentication. Please log out and log back in, then try again.');
          }
          throw authError;
        }
      }

      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  },

  async getUserCompanies(userId: string) {
    try {
      const q = query(collection(db, 'companies'), where('createdBy', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'companies');
      return [];
    }
  },

  async switchCompany(userId: string, companyId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { companyId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  // Settings
  async getSettings(companyId: string) {
    try {
      const ref = doc(db, 'settings', companyId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `settings/${companyId}`);
    }
  },

  async updateSettings(companyId: string, settings: any) {
    try {
      const ref = doc(db, 'settings', companyId);
      await setDoc(ref, { ...settings, companyId }, { merge: true });

      // If companyName, companyAddress, phone, email, or website is updated, also update the main company document
      if (settings.companyName || settings.companyAddress || settings.printPhone || settings.printEmail || settings.printWebsite) {
        const companyRef = doc(db, 'companies', companyId);
        const companyUpdates: any = {};
        if (settings.companyName) companyUpdates.name = settings.companyName;
        if (settings.companyAddress) companyUpdates.address = settings.companyAddress;
        if (settings.printPhone) companyUpdates.phone = settings.printPhone;
        if (settings.printEmail) companyUpdates.email = settings.printEmail;
        if (settings.printWebsite) companyUpdates.website = settings.printWebsite;
        await updateDoc(companyRef, companyUpdates);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${companyId}`);
    }
  },

  async getCompanyUsers(companyId: string) {
    try {
      const q = query(collection(db, 'users'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  async updateTargetAmount(uid: string, target_amount: number) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { target_amount });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }
};
