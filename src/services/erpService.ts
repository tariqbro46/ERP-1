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
  Timestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { 
  Company, 
  Ledger, 
  Voucher, 
  Item, 
  Employee, 
  SalarySheet, 
  Advance, 
  Loan, 
  AppNotification,
  PrintingOrder,
  PrintingMachine,
  UserProfile
} from '../types';
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

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
    
    // Check existence of ledgers and items
    const ledgerIds = Array.from(new Set(entries.map(e => e.ledger_id).filter(Boolean)));
    const itemIds = Array.from(new Set((inventoryEntries || []).map(i => i.item_id).filter(Boolean)));
    
    const [ledgerSnaps, itemSnaps] = await Promise.all([
      Promise.all(ledgerIds.map(id => getDoc(doc(db, 'ledgers', id as string)))),
      Promise.all(itemIds.map(id => getDoc(doc(db, 'items', id as string))))
    ]);
    
    const existingLedgers = new Set(ledgerSnaps.filter(s => s.exists()).map(s => s.id));
    const existingItems = new Set(itemSnaps.filter(s => s.exists()).map(s => s.id));

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
      if (entry.ledger_id && existingLedgers.has(entry.ledger_id)) {
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

        // Update Item Stats
        if (i.item_id && existingItems.has(i.item_id)) {
          const itemRef = doc(db, 'items', i.item_id);
          const totalQty = (i.qty || 0) + (i.free_qty || 0);
          const stockChange = movementType === 'Inward' ? totalQty : -totalQty;
          batch.update(itemRef, { current_stock: increment(stockChange) });
        }
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
    const entries = eSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.entry_index || 0) - (b.entry_index || 0));

    const iSnap = await getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
    const inventory = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { ...voucher, entries, inventory, id: vSnap.id };
  },

  async deleteVoucher(id: string) {
    const voucher = await this.getVoucherById(id);
    const companyId = voucher.companyId;
    const batch = writeBatch(db);

    // Check existence of ledgers and items
    const ledgerIds = Array.from(new Set(voucher.entries.map((e: any) => e.ledger_id).filter(Boolean)));
    const itemIds = Array.from(new Set(voucher.inventory.map((i: any) => i.item_id).filter(Boolean)));
    
    const [ledgerSnaps, itemSnaps] = await Promise.all([
      Promise.all(ledgerIds.map(id => getDoc(doc(db, 'ledgers', id as string)))),
      Promise.all(itemIds.map(id => getDoc(doc(db, 'items', id as string))))
    ]);
    
    const existingLedgers = new Set(ledgerSnaps.filter(s => s.exists()).map(s => s.id));
    const existingItems = new Set(itemSnaps.filter(s => s.exists()).map(s => s.id));

    // Reverse Ledger Balances
    for (const entry of voucher.entries) {
      if (entry.ledger_id && existingLedgers.has(entry.ledger_id)) {
        const lRef = doc(db, 'ledgers', entry.ledger_id);
        const balanceChange = (entry.credit || 0) - (entry.debit || 0);
        batch.update(lRef, { current_balance: increment(balanceChange) });
      }
    }

    // Reverse Inventory Stats
    for (const i of voucher.inventory) {
      if (i.item_id && existingItems.has(i.item_id)) {
        const itemRef = doc(db, 'items', i.item_id);
        const totalQty = (i.qty || 0) + (i.free_qty || 0);
        const stockChange = i.movement_type === 'Inward' ? -totalQty : totalQty;
        batch.update(itemRef, { current_stock: increment(stockChange) });
      }
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

    // Collect all unique ledger and item IDs from both old and new voucher
    const oldLedgerIds = oldVoucher.entries.map((e: any) => e.ledger_id).filter(Boolean);
    const newLedgerIds = entries.map(e => e.ledger_id).filter(Boolean);
    const ledgerIds = Array.from(new Set([...oldLedgerIds, ...newLedgerIds]));

    const oldItemIds = oldVoucher.inventory.map((i: any) => i.item_id).filter(Boolean);
    const newItemIds = (inventoryEntries || []).map(i => i.item_id).filter(Boolean);
    const itemIds = Array.from(new Set([...oldItemIds, ...newItemIds]));

    const [ledgerSnaps, itemSnaps] = await Promise.all([
      Promise.all(ledgerIds.map(id => getDoc(doc(db, 'ledgers', id as string)))),
      Promise.all(itemIds.map(id => getDoc(doc(db, 'items', id as string))))
    ]);
    
    const existingLedgers = new Set(ledgerSnaps.filter(s => s.exists()).map(s => s.id));
    const existingItems = new Set(itemSnaps.filter(s => s.exists()).map(s => s.id));

    // 1. Reverse Old Ledger Balances
    for (const entry of oldVoucher.entries) {
      if (entry.ledger_id && existingLedgers.has(entry.ledger_id)) {
        const lRef = doc(db, 'ledgers', entry.ledger_id);
        const balanceChange = (entry.credit || 0) - (entry.debit || 0);
        batch.update(lRef, { current_balance: increment(balanceChange) });
      }
    }

    // 2. Reverse Old Inventory Stats
    for (const i of oldVoucher.inventory) {
      if (i.item_id && existingItems.has(i.item_id)) {
        const itemRef = doc(db, 'items', i.item_id);
        const totalQty = (i.qty || 0) + (i.free_qty || 0);
        const stockChange = i.movement_type === 'Inward' ? -totalQty : totalQty;
        batch.update(itemRef, { current_stock: increment(stockChange) });
      }
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
      if (entry.ledger_id && existingLedgers.has(entry.ledger_id)) {
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
        if (i.item_id && existingItems.has(i.item_id)) {
          const itemRef = doc(db, 'items', i.item_id);
          const totalQty = (i.qty || 0) + (i.free_qty || 0);
          const stockChange = movementType === 'Inward' ? totalQty : -totalQty;
          batch.update(itemRef, { current_stock: increment(stockChange) });
        }
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

  async getLedgerById(id: string): Promise<Ledger | null> {
    try {
      const snap = await getDoc(doc(db, 'ledgers', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Ledger;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `ledgers/${id}`);
      return null;
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

  async deleteLedger(id: string, companyId: string) {
    const hasTransactions = await this.checkLedgerTransactions(id, companyId);
    if (hasTransactions) {
      throw new Error('Cannot delete ledger with transactions. Please delete all vouchers associated with this ledger first.');
    }
    await deleteDoc(doc(db, 'ledgers', id));
  },

  // Items
  async getItemById(id: string): Promise<Item | null> {
    try {
      const snap = await getDoc(doc(db, 'items', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Item;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `items/${id}`);
      return null;
    }
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

  async deleteItem(id: string, companyId: string) {
    const hasTransactions = await this.checkItemTransactions(id, companyId);
    if (hasTransactions) {
      throw new Error('Cannot delete item with transactions. Please delete all vouchers associated with this item first.');
    }
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

  // Employees
  async getEmployees(companyId: string) {
    return this.getCollection('employees', companyId);
  },

  async createEmployee(companyId: string, employee: any) {
    const ref = doc(collection(db, 'employees'));
    const data = { ...employee, id: ref.id, companyId, createdAt: serverTimestamp() };
    await setDoc(ref, data);
    return data;
  },

  async updateEmployee(id: string, employee: any) {
    await updateDoc(doc(db, 'employees', id), { ...employee, updatedAt: serverTimestamp() });
  },

  async deleteEmployee(id: string) {
    await deleteDoc(doc(db, 'employees', id));
  },

  // Salary Sheets
  async getSalarySheets(companyId: string) {
    return this.getCollection('salary_sheets', companyId);
  },

  async createSalarySheet(companyId: string, data: any) {
    const ref = doc(collection(db, 'salary_sheets'));
    const docData = { ...data, id: ref.id, companyId, createdAt: serverTimestamp() };
    await setDoc(ref, docData);
    return docData;
  },

  async updateSalarySheet(id: string, data: any) {
    await updateDoc(doc(db, 'salary_sheets', id), { ...data, updatedAt: serverTimestamp() });
  },

  async deleteSalarySheet(id: string) {
    await deleteDoc(doc(db, 'salary_sheets', id));
  },

  // Advances
  async getAdvances(companyId: string) {
    return this.getCollection('advances', companyId);
  },

  async createAdvance(companyId: string, data: any) {
    const ref = doc(collection(db, 'advances'));
    const docData = { ...data, id: ref.id, companyId, createdAt: serverTimestamp() };
    await setDoc(ref, docData);
    return docData;
  },

  async updateAdvance(id: string, data: any) {
    await updateDoc(doc(db, 'advances', id), { ...data, updatedAt: serverTimestamp() });
  },

  async deleteAdvance(id: string) {
    await deleteDoc(doc(db, 'advances', id));
  },

  // Loans
  async getLoans(companyId: string) {
    return this.getCollection('loans', companyId);
  },

  async createLoan(companyId: string, data: any) {
    const ref = doc(collection(db, 'loans'));
    const docData = { ...data, id: ref.id, companyId, createdAt: serverTimestamp() };
    await setDoc(ref, docData);
    return docData;
  },

  async updateLoan(id: string, data: any) {
    await updateDoc(doc(db, 'loans', id), { ...data, updatedAt: serverTimestamp() });
  },

  async deleteLoan(id: string) {
    await deleteDoc(doc(db, 'loans', id));
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
    const [entriesSnap, invEntriesSnap] = await Promise.all([
      getDocs(query(collection(db, 'voucher_entries'), where('companyId', '==', companyId))),
      getDocs(query(collection(db, 'inventory_entries'), where('companyId', '==', companyId)))
    ]);
    const allEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const allInvEntries = invEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Filter vouchers that have an entry for the specific ledger
    const filteredVouchers = vouchers.filter((v: any) => 
      allEntries.some((e: any) => e.voucher_id === v.id && e.ledger_id === ledgerId)
    );
    
    // Map them together
    return filteredVouchers.map((v: any) => ({
      ...v,
      voucher_entries: allEntries.filter((e: any) => e.voucher_id === v.id),
      inventory: allInvEntries.filter((i: any) => i.voucher_id === v.id)
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
    const vouchers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (vouchers.length === 0) return [];

    // Fetch inventory for these vouchers to show item names
    const invSnap = await getDocs(query(collection(db, 'inventory_entries'), where('companyId', '==', companyId)));
    const allInv = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return vouchers.map(v => ({
      ...v,
      inventory: allInv.filter((i: any) => i.voucher_id === v.id),
      item_names: (v as any).item_names || allInv.filter((i: any) => i.voucher_id === v.id).map((i: any) => i.item_name).filter(Boolean).join(', ')
    }));
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
    const vouchers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (vouchers.length === 0) return [];

    // Fetch inventory for these vouchers to show item names
    const invSnap = await getDocs(query(collection(db, 'inventory_entries'), where('companyId', '==', companyId)));
    const allInv = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return vouchers.map(v => ({
      ...v,
      item_names: (v as any).item_names || allInv.filter((i: any) => i.voucher_id === v.id).map((i: any) => i.item_name).filter(Boolean).join(', ')
    }));
  },

  async getVouchersDetailedByDateRange(companyId: string, startDate: string, endDate: string): Promise<any[]> {
    const vouchers = await this.getVouchersByDateRange(companyId, startDate, endDate);
    if (vouchers.length === 0) return [];

    const voucherIds = vouchers.map(v => v.id);
    
    // Fetch all entries for these vouchers
    // Note: Firestore 'in' query limit is 30. If we have more than 30 vouchers, we need to chunk.
    // For now, we'll fetch all entries for the company and filter in memory, similar to other methods.
    const [accEntriesSnap, invEntriesSnap] = await Promise.all([
      getDocs(query(collection(db, 'voucher_entries'), where('companyId', '==', companyId))),
      getDocs(query(collection(db, 'inventory_entries'), where('companyId', '==', companyId)))
    ]);

    const allAccEntries = accEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const allInvEntries = invEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return vouchers.map(v => ({
      ...v,
      entries: allAccEntries.filter((e: any) => e.voucher_id === v.id),
      inventory: allInvEntries.filter((i: any) => i.voucher_id === v.id)
    }));
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
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
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
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use by another account.');
      }
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

  async getNextVoucherNumber(companyId: string, type: string, format?: string): Promise<string> {
    const q = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_type', '==', type),
      orderBy('v_date', 'desc'),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    const year = new Date().getFullYear();
    const prefix = type.substring(0, 3).toUpperCase();
    const defaultFormat = '{PREFIX}/{YEAR}/{NO}';
    const activeFormat = format || defaultFormat;

    if (snapshot.empty) {
      return activeFormat
        .replace('{PREFIX}', prefix)
        .replace('{YEAR}', String(year))
        .replace('{NO}', '001');
    }

    const lastNo = snapshot.docs[0].data().v_no;
    
    // Try to extract the number part. This is tricky if format changed.
    // We'll look for the last numeric part in the string.
    const match = lastNo.match(/(\d+)(?!.*\d)/);
    const lastNum = match ? parseInt(match[0]) : 0;
    const nextNum = String(lastNum + 1).padStart(3, '0');

    return activeFormat
      .replace('{PREFIX}', prefix)
      .replace('{YEAR}', String(year))
      .replace('{NO}', nextNum);
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
      
      if (!ledger) return movement;
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
      if (companyId === 'placeholder') return { id: companyId, ...data };
      
      const ref = doc(db, 'companies', companyId);
      await setDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
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
      // Fetch companies where user is owner
      const qOwner = query(collection(db, 'companies'), where('ownerId', '==', userId));
      const snapOwner = await getDocs(qOwner);
      
      // Fetch companies where user is creator
      const qCreator = query(collection(db, 'companies'), where('createdBy', '==', userId));
      const snapCreator = await getDocs(qCreator);
      
      const companiesMap = new Map();
      
      snapOwner.docs.forEach(doc => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      snapCreator.docs.forEach(doc => {
        if (!companiesMap.has(doc.id)) {
          companiesMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
      
      return Array.from(companiesMap.values());
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
        if (companyId !== 'placeholder') {
          const companyRef = doc(db, 'companies', companyId);
          const companyUpdates: any = {
            updatedAt: serverTimestamp()
          };
          if (settings.companyName) companyUpdates.name = settings.companyName;
          if (settings.companyAddress) companyUpdates.address = settings.companyAddress;
          if (settings.printPhone) companyUpdates.phone = settings.printPhone;
          if (settings.printEmail) companyUpdates.email = settings.printEmail;
          if (settings.printWebsite) companyUpdates.website = settings.printWebsite;
          
          // Use setDoc with merge: true to avoid "No document to update" error if company doc is missing
          await setDoc(companyRef, companyUpdates, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${companyId}`);
    }
  },

  async getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
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
  },

  // Notifications
  async getNotifications(userId: string, companyId: string, isSuperAdmin: boolean): Promise<AppNotification[]> {
    try {
      let allNotifications: AppNotification[] = [];

      if (isSuperAdmin) {
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        allNotifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: doc.id, 
            createdAt: data.createdAt?.toDate() || new Date(),
            scheduledAt: data.scheduledAt?.toDate(),
            sentAt: data.sentAt?.toDate()
          } as AppNotification;
        });
      } else {
        // For non-admins, fetch targeted notifications
        // We avoid orderBy here to prevent index requirements for non-admin queries
        const qAll = query(collection(db, 'notifications'), where('targetType', '==', 'all'));
        const qCompany = query(collection(db, 'notifications'), where('targetType', '==', 'company'), where('targetId', '==', companyId));
        const qUser = query(collection(db, 'notifications'), where('targetType', '==', 'user'), where('targetId', '==', userId));
        
        const [snapAll, snapCompany, snapUser] = await Promise.all([
          getDocs(qAll),
          getDocs(qCompany),
          getDocs(qUser)
        ]);
        
        const uniqueDocs = new Map();
        [...snapAll.docs, ...snapCompany.docs, ...snapUser.docs].forEach(doc => {
          uniqueDocs.set(doc.id, doc);
        });

        allNotifications = Array.from(uniqueDocs.values()).map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: doc.id, 
            createdAt: data.createdAt?.toDate() || new Date(),
            scheduledAt: data.scheduledAt?.toDate(),
            sentAt: data.sentAt?.toDate()
          } as AppNotification;
        }).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      }
      
      if (isSuperAdmin) return allNotifications;
      
      const now = new Date();
      return allNotifications.filter(n => {
        // Only show sent or scheduled for now
        if (n.status === 'draft') return false;
        if (n.status === 'scheduled' && n.scheduledAt && n.scheduledAt > now) return false;
        return true;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  subscribeToNotifications(userId: string, companyId: string, isSuperAdmin: boolean, callback: (notifications: AppNotification[]) => void) {
    if (isSuperAdmin) {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: doc.id, 
            createdAt: data.createdAt?.toDate() || new Date(),
            scheduledAt: data.scheduledAt?.toDate(),
            sentAt: data.sentAt?.toDate()
          } as AppNotification;
        });
        callback(notifications);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      });
    } else {
      // For non-admins, we'll use a simpler approach for real-time
      // Since we can't easily combine multiple onSnapshot queries into one sorted list with Firestore's client SDK
      // we'll just listen to the 'all' notifications for real-time updates and refresh the others
      const qAll = query(collection(db, 'notifications'), where('targetType', '==', 'all'));
      return onSnapshot(qAll, async () => {
        const data = await this.getNotifications(userId, companyId, false);
        callback(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      });
    }
  },

  async createNotification(notification: Partial<AppNotification>) {
    try {
      const ref = doc(collection(db, 'notifications'));
      const data = {
        ...notification,
        id: ref.id,
        createdAt: serverTimestamp(),
        status: notification.status || 'draft'
      };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
    }
  },

  async updateNotification(id: string, updates: Partial<AppNotification>) {
    try {
      await updateDoc(doc(db, 'notifications', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  async deleteNotification(id: string) {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  },

  async markNotificationAsRead(id: string, userId: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  async markNotificationAsUnread(id: string, userId: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        readBy: arrayRemove(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  // Order Management
  async getOrders(companyId: string): Promise<PrintingOrder[]> {
    try {
      const q = query(collection(db, 'orders'), where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Migration logic: if items is missing, create it from legacy fields
        if (!data.items && data.itemName) {
          data.items = [{
            itemId: data.itemId || '',
            itemName: data.itemName,
            quantity: data.quantity || 0,
            price: data.price || 0,
            printDesign: data.printDesign,
            printType: data.printType,
            isDoubleSided: data.isDoubleSided,
            machineId: data.machineId,
            machineName: data.machineName
          }];
        }
        return { id: doc.id, ...data } as unknown as PrintingOrder;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async createOrder(order: Partial<PrintingOrder>) {
    try {
      const ref = doc(collection(db, 'orders'));
      const data = {
        ...order,
        id: ref.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: order.status || 'Pending',
        isConvertedToFinishGoods: false,
        isConvertedToSalesVoucher: false
      };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    }
  },

  async convertToFinishGoods(companyId: string, orderId: string) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) throw new Error('Order not found');
      const order = orderSnap.data() as PrintingOrder;
      if (order.isConvertedToFinishGoods) return;

      const items = order.items || [{
        itemId: order.itemId!,
        itemName: order.itemName!,
        quantity: order.quantity!,
        printDesign: order.printDesign
      }];

      const batch = writeBatch(db);

      for (const item of items) {
        if (!item.itemId) continue;

        // Reduce raw stock
        batch.update(doc(db, 'items', item.itemId), { current_stock: increment(-item.quantity) });

        const finishGoodName = item.printDesign 
          ? `${item.itemName} - ${item.printDesign}`
          : item.itemName;

        // Check if exists
        const q = query(collection(db, 'items'), where('companyId', '==', companyId), where('name', '==', finishGoodName));
        const qSnap = await getDocs(q);

        if (!qSnap.empty) {
          batch.update(qSnap.docs[0].ref, { current_stock: increment(item.quantity) });
        } else {
          // Create new
          const newRef = doc(collection(db, 'items'));
          const rawItemSnap = await getDoc(doc(db, 'items', item.itemId));
          const rawItemData = rawItemSnap.data() as Item;
          
          batch.set(newRef, {
            id: newRef.id,
            companyId,
            name: finishGoodName,
            unit_name: rawItemData?.unit_name || 'Pcs',
            unit_id: rawItemData?.unit_id || '',
            current_stock: item.quantity,
            avg_cost: rawItemData?.avg_cost || 0,
            category: 'Finish Goods',
            createdAt: serverTimestamp()
          });
        }
      }

      batch.update(orderRef, { isConvertedToFinishGoods: true, updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}/conversion`);
    }
  },

  async updateOrder(id: string, updates: Partial<PrintingOrder>) {
    try {
      await updateDoc(doc(db, 'orders', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  async deleteOrder(id: string) {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  },

  // Machine Management
  async getMachines(companyId: string): Promise<PrintingMachine[]> {
    try {
      const q = query(collection(db, 'machines'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as PrintingMachine));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'machines');
      return [];
    }
  },

  async getUniquePrintDesigns(companyId: string): Promise<string[]> {
    try {
      const q = query(collection(db, 'orders'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      const designs = new Set<string>();
      snapshot.docs.forEach(doc => {
        const design = doc.data().printDesign;
        if (design) designs.add(design);
      });
      return Array.from(designs).sort();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async getClientOrderHistory(companyId: string, clientId: string): Promise<PrintingOrder[]> {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('companyId', '==', companyId),
        where('clientId', '==', clientId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as PrintingOrder));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async createMachine(machine: Partial<PrintingMachine>) {
    try {
      const ref = doc(collection(db, 'machines'));
      const data = {
        ...machine,
        id: ref.id,
        createdAt: serverTimestamp(),
        status: machine.status || 'Idle'
      };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'machines');
    }
  },

  async updateMachine(id: string, updates: Partial<PrintingMachine>) {
    try {
      await updateDoc(doc(db, 'machines', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `machines/${id}`);
    }
  },

  async deleteMachine(id: string) {
    try {
      await deleteDoc(doc(db, 'machines', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `machines/${id}`);
    }
  },

  async updateUserPermissions(userId: string, permissions: string[]) {
    try {
      await updateDoc(doc(db, 'users', userId), { permissions });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async getUsersByCompany(companyId: string): Promise<any[]> {
    try {
      const q = query(collection(db, 'users'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  }
};
