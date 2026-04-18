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
  UserProfile,
  SubscriptionPlan,
  MenuConfig,
  MenuGroupConfig,
  MenuItemConfig
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

function cleanData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) return data.map(cleanData);
  if (typeof data === 'object' && !(data instanceof Date) && !(data instanceof Timestamp)) {
    const cleaned: any = {};
    for (const key in data) {
      const value = cleanData(data[key]);
      if (value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return data;
}

// Helper to get collection with company filter
async function getCollection<T = any>(colName: string, companyId: string): Promise<T[]> {
  if (!companyId) {
    console.warn(`Attempted to fetch collection ${colName} without companyId`);
    return [];
  }
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
        date: voucher.v_date, // Add date for easier reporting
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
          date: voucher.v_date,
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

  async updateUserSettings(uid: string, settings: any) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      settings: {
        ...(await getDoc(userRef)).data()?.settings || {},
        ...settings,
        updatedAt: new Date().toISOString()
      }
    });
  },

  async getVouchersByType(companyId: string, type: string, from: string, to: string) {
    try {
      const q = query(
        collection(db, 'vouchers'),
        where('companyId', '==', companyId),
        where('v_type', '==', type),
        where('v_date', '>=', from),
        where('v_date', '<=', to),
        orderBy('v_date', 'desc')
      );
      const snap = await getDocs(q);
      const vouchers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (vouchers.length === 0) return [];

      // Fetch entries for these vouchers
      const voucherIds = vouchers.map(v => v.id);
      const allEntries: any[] = [];
      for (let i = 0; i < voucherIds.length; i += 30) {
        const chunk = voucherIds.slice(i, i + 30);
        const eSnap = await getDocs(query(
          collection(db, 'voucher_entries'), 
          where('voucher_id', 'in', chunk),
          where('companyId', '==', companyId)
        ));
        allEntries.push(...eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      return vouchers.map(v => ({
        ...v,
        entries: allEntries.filter(e => e.voucher_id === v.id)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vouchers');
      return [];
    }
  },

  async getVouchersByGroup(companyId: string, groupId: string, from: string, to: string) {
    try {
      // Get all groups to build hierarchy
      const allGroups = await getCollection<any>('ledger_groups', companyId);
      
      const getChildGroupIds = (parentId: string): string[] => {
        let ids = [parentId];
        const children = allGroups.filter(g => g.parent_id === parentId);
        children.forEach(child => {
          ids = [...ids, ...getChildGroupIds(child.id)];
        });
        return ids;
      };

      const groupIds = getChildGroupIds(groupId);
      
      // Get all ledgers in these groups
      const ledgers = await getCollection<any>('ledgers', companyId);
      const groupLedgerIds = ledgers.filter(l => groupIds.includes(l.group_id)).map(l => l.id);
      
      if (groupLedgerIds.length === 0) return [];

      // Fetch all vouchers in the date range for the company
      const vQuery = query(
        collection(db, 'vouchers'),
        where('companyId', '==', companyId),
        where('v_date', '>=', from),
        where('v_date', '<=', to)
      );
      const vSnap = await getDocs(vQuery);
      const allVouchersInRange = vSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      if (allVouchersInRange.length === 0) return [];

      // Find which vouchers have entries for our group ledgers
      const voucherIds = allVouchersInRange.map(v => v.id);
      const relevantVoucherIds = new Set<string>();

      for (let i = 0; i < voucherIds.length; i += 30) {
        const chunk = voucherIds.slice(i, i + 30);
        const eSnap = await getDocs(query(
          collection(db, 'voucher_entries'), 
          where('voucher_id', 'in', chunk),
          where('companyId', '==', companyId)
        ));
        
        eSnap.docs.forEach(d => {
          const entry = d.data();
          if (groupLedgerIds.includes(entry.ledger_id)) {
            relevantVoucherIds.add(entry.voucher_id);
          }
        });
      }

      const resultVouchers = allVouchersInRange
        .filter(v => relevantVoucherIds.has(v.id))
        .sort((a, b) => b.v_date.localeCompare(a.v_date));

      if (resultVouchers.length === 0) return [];

      // Fetch entries for the resulting vouchers to allow counterparty identification
      const finalVoucherIds = resultVouchers.map(v => v.id);
      const allEntries: any[] = [];
      for (let i = 0; i < finalVoucherIds.length; i += 30) {
        const chunk = finalVoucherIds.slice(i, i + 30);
        const eSnap = await getDocs(query(
          collection(db, 'voucher_entries'), 
          where('voucher_id', 'in', chunk),
          where('companyId', '==', companyId)
        ));
        allEntries.push(...eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      return resultVouchers.map(v => ({
        ...v,
        entries: allEntries.filter(e => e.voucher_id === v.id)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vouchers');
      return [];
    }
  },

  async getCashBankSummary(companyId: string, from: string, to: string) {
    try {
      const ledgers = await this.getLedgers(companyId);
      const cashBankLedgers = ledgers.filter(l => {
        const groupName = (l as any).ledger_groups?.name || (l as any).group_name || '';
        return groupName.includes('Cash') || 
               groupName.includes('Bank') ||
               ((l as any).nature === 'Asset' && (l.name.toLowerCase().includes('cash') || l.name.toLowerCase().includes('bank')));
      });

      if (cashBankLedgers.length === 0) return [];

      const ledgerIds = cashBankLedgers.map(l => l.id);
      
      // Fetch all vouchers in the company
      const vQuery = query(
        collection(db, 'vouchers'),
        where('companyId', '==', companyId)
      );
      const vSnap = await getDocs(vQuery);
      const allVouchers = vSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const vouchersInRange = allVouchers.filter(v => v.v_date >= from && v.v_date <= to);
      const vouchersBeforeRange = allVouchers.filter(v => v.v_date < from);

      const vIdsInRange = vouchersInRange.map(v => v.id);
      const vIdsBeforeRange = vouchersBeforeRange.map(v => v.id);

      // Fetch entries in chunks
      const entriesInRange: any[] = [];
      for (let i = 0; i < vIdsInRange.length; i += 30) {
        const chunk = vIdsInRange.slice(i, i + 30);
        const eSnap = await getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', 'in', chunk), where('companyId', '==', companyId)));
        entriesInRange.push(...eSnap.docs.map(d => d.data()).filter((e: any) => ledgerIds.includes(e.ledger_id)));
      }

      const entriesBeforeRange: any[] = [];
      for (let i = 0; i < vIdsBeforeRange.length; i += 30) {
        const chunk = vIdsBeforeRange.slice(i, i + 30);
        const eSnap = await getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', 'in', chunk), where('companyId', '==', companyId)));
        entriesBeforeRange.push(...eSnap.docs.map(d => d.data()).filter((e: any) => ledgerIds.includes(e.ledger_id)));
      }

      return cashBankLedgers.map(l => {
        const ledgerOpEntries = entriesBeforeRange.filter((e: any) => e.ledger_id === l.id);
        const ledgerEntries = entriesInRange.filter((e: any) => e.ledger_id === l.id);
        
        const openingFromEntries = ledgerOpEntries.reduce((sum, e) => sum + (e.debit || 0) - (e.credit || 0), 0);
        const openingBalance = (l.opening_balance || 0) + openingFromEntries;
        
        const debit = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const credit = ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
        const closingBalance = openingBalance + debit - credit;

        return {
          id: l.id,
          name: l.name,
          openingBalance,
          debit,
          credit,
          closingBalance
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vouchers');
      return [];
    }
  },

  async getLedgerBalancesByGroup(companyId: string, groupId: string) {
    try {
      const ledgers = await getCollection<any>('ledgers', companyId);
      return ledgers.filter(l => l.group_id === groupId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ledgers');
      return [];
    }
  },

  async getCashBankVouchers(companyId: string, from: string, to: string) {
    try {
      const ledgers = await getCollection<any>('ledgers', companyId);
      const cashBankLedgerIds = ledgers.filter(l => 
        l.group_name?.includes('Cash') || 
        l.group_name?.includes('Bank') ||
        l.nature === 'Asset' && (l.name.toLowerCase().includes('cash') || l.name.toLowerCase().includes('bank'))
      ).map(l => l.id);

      if (cashBankLedgerIds.length === 0) return [];

      const q = query(
        collection(db, 'voucher_entries'),
        where('companyId', '==', companyId),
        where('ledger_id', 'in', cashBankLedgerIds.slice(0, 10)),
        where('date', '>=', from),
        where('date', '<=', to)
      );
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const voucherIds = Array.from(new Set(entries.map((e: any) => e.voucher_id)));
      if (voucherIds.length === 0) return [];

      const vSnaps = await Promise.all(voucherIds.map(id => getDoc(doc(db, 'vouchers', id))));
      return vSnaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'voucher_entries');
      return [];
    }
  },
  async getVoucherById(id: string): Promise<any> {
    const vSnap = await getDoc(doc(db, 'vouchers', id));
    if (!vSnap.exists()) throw new Error('Voucher not found');
    const voucher = vSnap.data();
    const companyId = voucher.companyId;

    const [eSnap, iSnap, ledgers, items, godowns] = await Promise.all([
      getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId))),
      getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId))),
      this.getLedgers(companyId),
      this.getItems(companyId),
      this.getGodowns(companyId)
    ]);

    const entries = eSnap.docs.map(d => {
      const data = d.data();
      const ledger = ledgers.find(l => l.id === data.ledger_id);
      return { 
        id: d.id, 
        ...data, 
        ledger_name: ledger?.name || 'Unknown Ledger' 
      };
    }).sort((a: any, b: any) => (a.entry_index || 0) - (b.entry_index || 0));

    const inventory = iSnap.docs.map(d => {
      const data = d.data();
      const item = items.find(i => i.id === data.item_id);
      const godown = godowns.find(g => g.id === data.godown_id);
      return { 
        id: d.id, 
        ...data, 
        item_name: item?.name || 'Unknown Item',
        godown_name: godown?.name || 'N/A'
      };
    });

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
        date: voucher.v_date || oldVoucher.v_date, // Add date for easier reporting
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
      console.log('erpService.getLedgers called for companyId:', companyId);
      const [ledgers, groups] = await Promise.all([
        getCollection<Ledger>('ledgers', companyId),
        getCollection<any>('ledger_groups', companyId)
      ]);
      console.log(`Fetched ${ledgers.length} ledgers and ${groups.length} groups`);
      
      return ledgers.map(l => {
        const group = groups.find(g => g.id === l.group_id);
        return {
          ...l,
          ledger_groups: group,
          group_name: group?.name || l.group_name
        };
      });
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
        return await this.seedDefaultGroups(companyId);
      }
      return groups;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ledger_groups');
      return [];
    }
  },

  async getVoucherTypes(companyId: string): Promise<any[]> {
    try {
      const types = await getCollection<any>('voucher_types', companyId);
      if (types.length === 0) {
        return await this.seedDefaultVoucherTypes(companyId);
      }
      return types;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'voucher_types');
      return [];
    }
  },

  async seedDefaultVoucherTypes(companyId: string) {
    const defaults = [
      { name: 'Sales', base_type: 'Sales' },
      { name: 'Purchase', base_type: 'Purchase' },
      { name: 'Payment', base_type: 'Payment' },
      { name: 'Receipt', base_type: 'Receipt' },
      { name: 'Contra', base_type: 'Contra' },
      { name: 'Journal', base_type: 'Journal' },
      { name: 'Credit Note', base_type: 'Credit Note' },
      { name: 'Debit Note', base_type: 'Debit Note' }
    ];
    const batch = writeBatch(db);
    const results: any[] = [];
    for (const v of defaults) {
      const ref = doc(collection(db, 'voucher_types'));
      const data = { ...v, id: ref.id, companyId };
      batch.set(ref, data);
      results.push(data);
    }
    await batch.commit();
    return results;
  },

  async getStockGroups(companyId: string): Promise<any[]> {
    return getCollection<any>('stock_groups', companyId);
  },

  async getStockCategories(companyId: string): Promise<any[]> {
    return getCollection<any>('stock_categories', companyId);
  },

  async getEmployeeGroups(companyId: string): Promise<any[]> {
    return getCollection<any>('employee_groups', companyId);
  },

  async updateLedgerGroup(id: string, group: any) {
    try {
      const ref = doc(db, 'ledger_groups', id);
      await updateDoc(ref, group);
      return { id, ...group };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ledger_groups/${id}`);
    }
  },

  async updateVoucherType(id: string, type: any) {
    try {
      const ref = doc(db, 'voucher_types', id);
      await updateDoc(ref, type);
      return { id, ...type };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `voucher_types/${id}`);
    }
  },

  async updateStockCategory(id: string, category: any) {
    try {
      const ref = doc(db, 'stock_categories', id);
      await updateDoc(ref, category);
      return { id, ...category };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stock_categories/${id}`);
    }
  },

  async updateEmployeeGroup(id: string, group: any) {
    try {
      const ref = doc(db, 'employee_groups', id);
      await updateDoc(ref, group);
      return { id, ...group };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employee_groups/${id}`);
    }
  },

  async updateUnit(id: string, unit: any) {
    try {
      const ref = doc(db, 'units', id);
      await updateDoc(ref, unit);
      return { id, ...unit };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `units/${id}`);
    }
  },

  async deleteUnit(id: string) {
    try {
      await deleteDoc(doc(db, 'units', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `units/${id}`);
    }
  },

  async checkDuplicate(colName: string, companyId: string, field: string, value: string) {
    try {
      const q = query(
        collection(db, colName),
        where('companyId', '==', companyId),
        where(field, '==', value)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (error) {
      console.error(`Error checking duplicate in ${colName}:`, error);
      return false;
    }
  },

  async createLedgerGroup(companyId: string, group: any) {
    try {
      const isDuplicate = await this.checkDuplicate('ledger_groups', companyId, 'name', group.name);
      if (isDuplicate) throw new Error(`Ledger Group "${group.name}" already exists.`);

      const ref = doc(collection(db, 'ledger_groups'));
      const data = { ...group, id: ref.id, companyId };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ledger_groups');
    }
  },

  async createVoucherType(companyId: string, type: any) {
    try {
      const isDuplicate = await this.checkDuplicate('voucher_types', companyId, 'name', type.name);
      if (isDuplicate) throw new Error(`Voucher Type "${type.name}" already exists.`);

      const ref = doc(collection(db, 'voucher_types'));
      const data = { ...type, id: ref.id, companyId };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'voucher_types');
    }
  },

  async createStockCategory(companyId: string, category: any) {
    try {
      const isDuplicate = await this.checkDuplicate('stock_categories', companyId, 'name', category.name);
      if (isDuplicate) throw new Error(`Stock Category "${category.name}" already exists.`);

      const ref = doc(collection(db, 'stock_categories'));
      const data = { ...category, id: ref.id, companyId };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stock_categories');
    }
  },

  async createEmployeeGroup(companyId: string, group: any) {
    try {
      const isDuplicate = await this.checkDuplicate('employee_groups', companyId, 'name', group.name);
      if (isDuplicate) throw new Error(`Employee Group/Designation "${group.name}" already exists.`);

      const ref = doc(collection(db, 'employee_groups'));
      const data = { ...group, id: ref.id, companyId };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'employee_groups');
    }
  },

  async createUnit(companyId: string, unit: any) {
    try {
      const isDuplicate = await this.checkDuplicate('units', companyId, 'name', unit.name);
      if (isDuplicate) throw new Error(`Unit "${unit.name}" already exists.`);

      const ref = doc(collection(db, 'units'));
      const data = { ...unit, id: ref.id, companyId };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'units');
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
      const isDuplicate = await this.checkDuplicate('ledgers', companyId, 'name', ledger.name);
      if (isDuplicate) throw new Error(`Ledger "${ledger.name}" already exists.`);

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
    const isDuplicate = await this.checkDuplicate('items', companyId, 'name', item.name);
    if (isDuplicate) throw new Error(`Stock Item "${item.name}" already exists.`);

    const ref = doc(collection(db, 'items'));
    const data = {
      ...item,
      id: ref.id,
      companyId,
      opening_qty: Number(item.opening_qty) || 0,
      opening_rate: Number(item.opening_rate) || 0,
      current_stock: Number(item.opening_qty) || 0,
      avg_cost: Number(item.opening_rate) || 0
    };
    await setDoc(ref, data);
    // Ensure stats are perfectly calculated from the start - pass data to avoid redundant getDoc
    await this.recalculateItemStats(ref.id, companyId, data);
    return data;
  },

  async updateItem(id: string, item: any) {
    const itemRef = doc(db, 'items', id);
    const oldSnap = await getDoc(itemRef);
    if (!oldSnap.exists()) {
      await updateDoc(itemRef, item);
      return;
    }
    
    const oldData = oldSnap.data();
    const updates: any = { ...item };
    
    // Ensure numeric values
    if (updates.opening_qty !== undefined) updates.opening_qty = Number(updates.opening_qty) || 0;
    if (updates.opening_rate !== undefined) updates.opening_rate = Number(updates.opening_rate) || 0;

    await updateDoc(itemRef, {
      ...updates,
      updated_at: serverTimestamp(),
      companyId: oldData.companyId // Ensure it stays
    });

    // Always recalculate to be safe and ensure current_stock/avg_cost are correct
    await this.recalculateItemStats(id, oldData.companyId, { ...oldData, ...updates });
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
    const isDuplicate = await this.checkDuplicate('godowns', companyId, 'name', godown.name);
    if (isDuplicate) throw new Error(`Godown "${godown.name}" already exists.`);

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
    const isDuplicate = await this.checkDuplicate('employees', companyId, 'name', employee.name);
    if (isDuplicate) throw new Error(`Employee "${employee.name}" already exists.`);

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

  async recalculateItemStats(itemId: string, companyId?: string, itemData?: any) {
    const itemRef = doc(db, 'items', itemId);
    let effectiveItemData = itemData;

    if (!effectiveItemData) {
      const itemSnap = await getDoc(itemRef);
      if (!itemSnap.exists()) return;
      effectiveItemData = itemSnap.data();
    }

    const effectiveCompanyId = companyId || effectiveItemData.companyId;
    if (!effectiveCompanyId) return;

    const q = query(
      collection(db, 'inventory_entries'),
      where('item_id', '==', itemId),
      where('companyId', '==', effectiveCompanyId)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map(d => d.data());
    
    let stock = Number(effectiveItemData.opening_qty) || 0;
    let totalValue = stock * (Number(effectiveItemData.opening_rate) || 0);
    let totalQty = stock;

    for (const e of entries) {
      const movementType = e.movement_type || e.m_type;
      const qty = Number(e.qty) || 0;
      const freeQty = Number(e.free_qty) || 0;
      const rate = Number(e.rate) || 0;
      const totalEntryQty = qty + freeQty;

      if (movementType === 'Inward') {
        stock += totalEntryQty;
        totalValue += (qty * rate);
        totalQty += qty;
      } else {
        stock -= totalEntryQty;
      }
    }
    
    const avgCost = totalQty > 0 ? totalValue / totalQty : (Number(effectiveItemData.opening_rate) || 0);

    await updateDoc(itemRef, { 
      current_stock: stock,
      avg_cost: avgCost,
      companyId: effectiveCompanyId // Ensure companyId field persists
    });
  },

  async getVoucherEntriesByDate(companyId: string, asOnDate: string): Promise<any[]> {
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_date', '<=', asOnDate)
    );
    const vouchersSnap = await getDocs(vouchersQuery);
    const voucherIds = vouchersSnap.docs.map(d => d.id);
    
    if (voucherIds.length === 0) return [];
    
    // Fetch all entries for these vouchers
    // Since we might have many vouchers, we'll fetch in chunks of 30 if using 'in'
    // Or just fetch all entries for the company and filter? That's too much data.
    // Let's fetch all accounting entries for the company first (might be large, but let's try)
    const entriesQuery = query(
      collection(db, 'voucher_entries'),
      where('companyId', '==', companyId)
    );
    const entriesSnap = await getDocs(entriesQuery);
    
    // Filter in memory by voucherId and date
    return entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(e => voucherIds.includes(e.voucher_id));
  },

  async getInventoryEntriesGrouped(companyId: string): Promise<any[]> {
    const q = query(collection(db, 'inventory_entries'), where('companyId', '==', companyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getInventoryEntriesByDate(companyId: string, startDate: string, endDate: string): Promise<any[]> {
    const q = query(
      collection(db, 'inventory_entries'),
      where('companyId', '==', companyId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
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
    const vouchers = vouchersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    
    if (vouchers.length === 0) return [];
    
    const voucherIds = vouchers.map(v => v.id);
    const allEntries: any[] = [];
    const allInvEntries: any[] = [];

    // Fetch entries in chunks to avoid "in" query limits if many vouchers
    for (let i = 0; i < voucherIds.length; i += 30) {
      const chunk = voucherIds.slice(i, i + 30);
      const [eSnap, iSnap] = await Promise.all([
        getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', 'in', chunk), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', 'in', chunk), where('companyId', '==', companyId)))
      ]);
      allEntries.push(...eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      allInvEntries.push(...iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    
    // Filter vouchers that have an entry for the specific ledger
    const filteredVouchers = vouchers.filter((v: any) => 
      allEntries.some((e: any) => e.voucher_id === v.id && e.ledger_id === ledgerId)
    );
    
    // Map them together
    return filteredVouchers.map((v: any) => ({
      ...v,
      voucher_entries: allEntries.filter((e: any) => e.voucher_id === v.id),
      inventory: allInvEntries.filter((i: any) => i.voucher_id === v.id)
    })).sort((a, b) => a.v_date.localeCompare(b.v_date));
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

    // Fetch entries and inventory for these vouchers
    const voucherIds = vouchers.map(v => v.id);
    const allAccEntries: any[] = [];
    
    // Chunk accounting entries fetch
    for (let i = 0; i < voucherIds.length; i += 30) {
      const chunk = voucherIds.slice(i, i + 30);
      const eSnap = await getDocs(query(
        collection(db, 'voucher_entries'), 
        where('voucher_id', 'in', chunk),
        where('companyId', '==', companyId)
      ));
      allAccEntries.push(...eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    const invSnap = await getDocs(query(collection(db, 'inventory_entries'), where('companyId', '==', companyId)));
    const allInv = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return vouchers.map(v => ({
      ...v,
      entries: allAccEntries.filter((e: any) => e.voucher_id === v.id),
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

  // System Configuration
  async getSystemConfig() {
    try {
      const snap = await getDoc(doc(db, 'system', 'config'));
      if (snap.exists()) return snap.data();
      return {
        statusOnlineText: 'Status: Online',
        statusOfflineText: 'Status: Offline',
        statusErrorText: 'Database Error',
        appVersion: 'v1.0.1'
      };
    } catch (error) {
      console.error('Error getting system config:', error);
      return {
        statusOnlineText: 'Status: Online',
        statusOfflineText: 'Status: Offline',
        statusErrorText: 'Database Error',
        appVersion: 'v1.0.1'
      };
    }
  },

  async updateSystemConfig(config: any) {
    try {
      await setDoc(doc(db, 'system', 'config'), config, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system/config');
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
  },

  async getSiteContent(pageId: string): Promise<any> {
    try {
      const snap = await getDoc(doc(db, 'site_content', pageId));
      if (snap.exists()) {
        return snap.data().content;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `site_content/${pageId}`);
      return null;
    }
  },

  async updateSiteContent(pageId: string, content: any) {
    try {
      await setDoc(doc(db, 'site_content', pageId), {
        pageId,
        content,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `site_content/${pageId}`);
    }
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const q = query(collection(db, 'subscription_plans'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'subscription_plans');
      return [];
    }
  },

  // Menu Configuration
  async getMenuConfig(): Promise<MenuConfig | null> {
    try {
      const menuDoc = await getDoc(doc(db, 'system', 'menu'));
      if (menuDoc.exists()) {
        return menuDoc.data() as MenuConfig;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'system/menu');
      return null;
    }
  },

  async updateMenuConfig(config: MenuConfig): Promise<void> {
    try {
      const cleanedConfig = cleanData(config);
      await setDoc(doc(db, 'system', 'menu'), {
        ...cleanedConfig,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system/menu');
    }
  },

  subscribeToMenuConfig(callback: (config: MenuConfig | null) => void) {
    return onSnapshot(doc(db, 'system', 'menu'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as MenuConfig);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system/menu');
    });
  },

  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id'>) {
    try {
      const ref = doc(collection(db, 'subscription_plans'));
      const data = {
        ...plan,
        id: ref.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'subscription_plans');
    }
  },

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>) {
    try {
      await updateDoc(doc(db, 'subscription_plans', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subscription_plans/${id}`);
    }
  },

  async deleteSubscriptionPlan(id: string) {
    try {
      await deleteDoc(doc(db, 'subscription_plans', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subscription_plans/${id}`);
    }
  },

  async getCompanySubscription(companyId: string): Promise<SubscriptionPlan | null> {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (!companyDoc.exists()) return null;
      const planId = companyDoc.data().subscriptionPlanId;
      if (!planId) return null;
      const planDoc = await getDoc(doc(db, 'subscription_plans', planId));
      if (!planDoc.exists()) return null;
      return { id: planDoc.id, ...planDoc.data() } as SubscriptionPlan;
    } catch (error) {
      console.error('Error fetching company subscription:', error);
      return null;
    }
  },

  async getCollectionCount(colName: string, companyId: string): Promise<number> {
    if (!companyId) return 0;
    try {
      const q = query(collection(db, colName), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colName);
      return 0;
    }
  },

  async updateCompanySubscription(companyId: string, updates: any) {
    try {
      await updateDoc(doc(db, 'companies', companyId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `companies/${companyId}`);
    }
  },

  // Subscription Orders
  async createSubscriptionOrder(order: any) {
    try {
      const ref = doc(collection(db, 'subscription_orders'));
      const data = {
        ...order,
        id: ref.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'subscription_orders');
    }
  },

  async getSubscriptionOrders(companyId?: string): Promise<any[]> {
    try {
      let q;
      if (companyId) {
        q = query(collection(db, 'subscription_orders'), where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'subscription_orders'), orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'subscription_orders');
      return [];
    }
  },

  async updateSubscriptionOrder(id: string, updates: any) {
    try {
      await updateDoc(doc(db, 'subscription_orders', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subscription_orders/${id}`);
    }
  },

  async deleteSubscriptionOrder(id: string) {
    try {
      await deleteDoc(doc(db, 'subscription_orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subscription_orders/${id}`);
    }
  }
};
