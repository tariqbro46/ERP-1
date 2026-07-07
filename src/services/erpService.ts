import { db, auth } from '../firebase';
import { ensureDate, formatToYMD, parseEntryDate, getMovementType } from '../lib/utils';
import { errorService } from './errorService';
import { 
  collection, 
  addDoc as firestoreAddDoc, 
  getDocs as firestoreGetDocs, 
  getDoc as firestoreGetDoc, 
  getDocFromCache,
  getDocsFromCache,
  doc, 
  query, 
  where, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc, 
  orderBy, 
  limit, 
  setDoc as firestoreSetDoc,
  serverTimestamp,
  increment,
  writeBatch as firestoreWriteBatch,
  runTransaction as firestoreRunTransaction,
  Timestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  DocumentReference,
  DocumentSnapshot,
  getCountFromServer as firestoreGetCountFromServer
} from 'firebase/firestore';

// Custom wrappers to enforce cache-only reads and prevent any database traffic when over quota
function getPathFromRef(ref: any): string {
  if (!ref) return "";
  if (typeof ref.path === 'string') return ref.path;
  if (ref._query && ref._query.path) {
    if (typeof ref._query.path.toString === 'function') {
      return ref._query.path.toString();
    }
  }
  try {
    const str = JSON.stringify(ref);
    if (str) {
      if (str.includes('"companies"') || str.includes('/companies')) return "companies";
      if (str.includes('"system"') || str.includes('/system')) return "system";
      if (str.includes('"users"') || str.includes('/users')) return "users";
      if (str.includes('"notifications"') || str.includes('/notifications')) return "notifications";
    }
  } catch (e) {}
  return "";
}

function triggerQuotaEvent(path: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp_quota_exceeded_attempt', { detail: { path } }));
  }
}

function isExemptFromQuotaBlock(path: string): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  return lower.startsWith('companies') || 
         lower.includes('/companies') ||
         lower.startsWith('system') || 
         lower.includes('/system') ||
         lower.startsWith('users') || 
         lower.includes('/users') ||
         lower.startsWith('global') ||
         lower.includes('/global') ||
         lower.startsWith('notifications') ||
         lower.includes('/notifications');
}

async function getDoc(docRef: any) {
  const path = getPathFromRef(docRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    try {
      console.log("[QUOTA] Offline-mode reading getDoc from cache:", path);
      return await getDocFromCache(docRef);
    } catch (cacheErr) {
      console.warn("[QUOTA] Cache read failed in over-quota mode:", cacheErr);
      return {
        exists: () => false,
        data: () => undefined,
        id: docRef.id,
        ref: docRef
      } as any;
    }
  }
  return await firestoreGetDoc(docRef);
}

async function getDocs(queryRef: any) {
  const path = getPathFromRef(queryRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    try {
      console.log("[QUOTA] Offline-mode reading getDocs from cache:", path);
      return await getDocsFromCache(queryRef);
    } catch (cacheErr) {
      console.warn("[QUOTA] Cache query failed in over-quota mode:", cacheErr);
      return {
        docs: [],
        empty: true,
        size: 0,
        forEach: (callback: any) => {}
      } as any;
    }
  }
  return await firestoreGetDocs(queryRef);
}

async function getCountFromServer(queryRef: any) {
  const path = getPathFromRef(queryRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    console.log("[QUOTA] getCountFromServer bypass when over-quota:", path);
    return {
      data: () => ({ count: 0 })
    } as any;
  }
  return await firestoreGetCountFromServer(queryRef);
}

async function addDoc(colRef: any, data: any) {
  const path = getPathFromRef(colRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
    (error as any).code = 'permission-denied';
    throw error;
  }
  return await firestoreAddDoc(colRef, data);
}

async function updateDoc(docRef: any, data: any) {
  const path = getPathFromRef(docRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
    (error as any).code = 'permission-denied';
    throw error;
  }
  return await firestoreUpdateDoc(docRef, data);
}

async function deleteDoc(docRef: any) {
  const path = getPathFromRef(docRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
    (error as any).code = 'permission-denied';
    throw error;
  }
  return await firestoreDeleteDoc(docRef);
}

async function setDoc(docRef: any, data: any, options?: any) {
  const path = getPathFromRef(docRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true' && !isExemptFromQuotaBlock(path)) {
    triggerQuotaEvent(path);
    const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
    (error as any).code = 'permission-denied';
    throw error;
  }
  return await firestoreSetDoc(docRef, data, options);
}

async function runTransaction<T>(dbRef: any, updateFunction: (transaction: any) => Promise<T>): Promise<T> {
  if (localStorage.getItem('company_quota_exceeded') === 'true') {
    return await firestoreRunTransaction(dbRef, async (transaction) => {
      const wrappedTransaction = {
        get: async (docRef: any) => {
          return await transaction.get(docRef);
        },
        set: (docRef: any, data: any, options?: any) => {
          const path = getPathFromRef(docRef);
          if (!isExemptFromQuotaBlock(path)) {
            triggerQuotaEvent(path);
            const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
            (error as any).code = 'permission-denied';
            throw error;
          }
          transaction.set(docRef, data, options);
          return wrappedTransaction;
        },
        update: (docRef: any, data: any) => {
          const path = getPathFromRef(docRef);
          if (!isExemptFromQuotaBlock(path)) {
            triggerQuotaEvent(path);
            const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
            (error as any).code = 'permission-denied';
            throw error;
          }
          transaction.update(docRef, data);
          return wrappedTransaction;
        },
        delete: (docRef: any) => {
          const path = getPathFromRef(docRef);
          if (!isExemptFromQuotaBlock(path)) {
            triggerQuotaEvent(path);
            const error = new Error(`Database quota exceeded. Write operations are disabled until your quota resets. (Path: ${path})`);
            (error as any).code = 'permission-denied';
            throw error;
          }
          transaction.delete(docRef);
          return wrappedTransaction;
        }
      };
      return await updateFunction(wrappedTransaction);
    });
  }
  return await firestoreRunTransaction(dbRef, updateFunction);
}

function writeBatch(dbRef: any) {
  const batch = firestoreWriteBatch(dbRef);
  if (localStorage.getItem('company_quota_exceeded') === 'true') {
    return {
      set: (docRef: any, data: any, options?: any) => {
        const path = getPathFromRef(docRef);
        if (!isExemptFromQuotaBlock(path)) {
          triggerQuotaEvent(path);
          console.warn("[QUOTA] writeBatch.set blocked for path:", path);
          return;
        }
        batch.set(docRef, data, options);
      },
      update: (docRef: any, data: any) => {
        const path = getPathFromRef(docRef);
        if (!isExemptFromQuotaBlock(path)) {
          triggerQuotaEvent(path);
          console.warn("[QUOTA] writeBatch.update blocked for path:", path);
          return;
        }
        batch.update(docRef, data);
      },
      delete: (docRef: any) => {
        const path = getPathFromRef(docRef);
        if (!isExemptFromQuotaBlock(path)) {
          triggerQuotaEvent(path);
          console.warn("[QUOTA] writeBatch.delete blocked for path:", path);
          return;
        }
        batch.delete(docRef);
      },
      commit: async () => {
        return await batch.commit();
      }
    } as any;
  }
  return batch;
}
import { initializeApp } from 'firebase/app';
import { 
  Feature,
  FeatureCategory
} from '../constants/features';
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
  MenuItemConfig,
  TaxRate,
  Lead,
  Interaction,
  PurchaseOrder,
  Batch,
  SerialNumber
} from '../types';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  // Persist error to Firestore for founder visibility - wrap in try-catch to avoid blocking
  try {
    errorService.logError({
      message: `Firestore Error: ${errInfo.error}`,
      metadata: {
        operationType,
        path,
        auth: errInfo.authInfo,
        stack: error instanceof Error ? error.stack : undefined
      },
      severity: 'error',
      companyId: localStorage.getItem('last_company_id') || undefined,
      componentName: 'erpService'
    });
  } catch (logErr) {
    console.error('Failed to log error to Firestore:', logErr);
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

export function deduplicateMenuConfig(config: MenuConfig | null): MenuConfig | null {
  if (!config || !Array.isArray(config.groups)) return config;

  const mergedGroupsMap = new Map<string, MenuGroupConfig>();

  config.groups.forEach((group) => {
    if (!group || !group.group) return;
    
    // Normalize group name as key for merging (e.g., masters)
    const normalizedGroupName = group.group.trim().toLowerCase();

    // Deduplicate items inside this group:
    const seenPathsAndIds = new Set<string>();
    const uniqueItems: MenuItemConfig[] = [];
    
    if (Array.isArray(group.items)) {
      group.items.forEach((item) => {
        if (!item) return;
        const key = ((item.id || '').trim().toLowerCase() + '||' + (item.to || '').trim().toLowerCase());
        const toUrl = (item.to || '').trim().toLowerCase();
        
        if (key && !seenPathsAndIds.has(key) && !seenPathsAndIds.has(toUrl)) {
          seenPathsAndIds.add(key);
          seenPathsAndIds.add(toUrl);
          uniqueItems.push(item);
        }
      });
    }

    const existingGroup = mergedGroupsMap.get(normalizedGroupName);
    if (existingGroup) {
      // Merge items from group into existingGroup
      uniqueItems.forEach((item) => {
        const key = ((item.id || '').trim().toLowerCase() + '||' + (item.to || '').trim().toLowerCase());
        const toUrl = (item.to || '').trim().toLowerCase();
        
        const existingItemKeys = new Set(
          existingGroup.items.map(i => (i.id || '').trim().toLowerCase() + '||' + (i.to || '').trim().toLowerCase())
        );
        const existingItemPaths = new Set(
          existingGroup.items.map(i => (i.to || '').trim().toLowerCase())
        );

        if (!existingItemKeys.has(key) && !existingItemPaths.has(toUrl)) {
          existingGroup.items.push(item);
        }
      });
    } else {
      mergedGroupsMap.set(normalizedGroupName, {
        ...group,
        items: uniqueItems
      });
    }
  });

  return {
    ...config,
    groups: Array.from(mergedGroupsMap.values()),
    updatedAt: config.updatedAt ? (typeof config.updatedAt.toDate === 'function' ? config.updatedAt.toDate() : config.updatedAt) : new Date()
  };
}

export const erpService: any = {
  // Demo Mode Client-side Database Helpers
  isDemoMode() {
    return localStorage.getItem('erp_is_demo_mode') === 'true';
  },

  _getDemoData(colName: string): any[] {
    const dbStr = localStorage.getItem('erp_demo_db');
    let dataObj: any = {};
    if (dbStr) {
      try {
        dataObj = JSON.parse(dbStr);
      } catch (e) {
        dataObj = {};
      }
    }
    return dataObj[colName] || [];
  },

  _saveDemoData(colName: string, data: any[]) {
    const dbStr = localStorage.getItem('erp_demo_db');
    let dataObj: any = {};
    if (dbStr) {
      try {
        dataObj = JSON.parse(dbStr);
      } catch (e) {}
    }
    dataObj[colName] = data;
    localStorage.setItem('erp_demo_db', JSON.stringify(dataObj));
  },

  _demoCreate(colName: string, docData: any) {
    const list = this._getDemoData(colName);
    const newDoc = {
      ...docData,
      id: 'demo_' + colName + '_' + Date.now() + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    list.push(newDoc);
    this._saveDemoData(colName, list);
    return newDoc;
  },

  _demoUpdate(colName: string, id: string, docData: any) {
    const list = this._getDemoData(colName);
    const index = list.findIndex((x: any) => x.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...docData,
        id
      };
      this._saveDemoData(colName, list);
    }
    return list[index];
  },

  _demoDelete(colName: string, id: string) {
    const list = this._getDemoData(colName);
    const filtered = list.filter((x: any) => x.id !== id);
    this._saveDemoData(colName, filtered);
  },

  initDemoDbIfNeeded() {
    if (!localStorage.getItem('erp_demo_db_initialized') || !localStorage.getItem('erp_demo_db')) {
      const demoDb: any = {
        ledger_groups: [
          { id: 'g_bank', name: 'Bank Accounts', nature: 'Asset' },
          { id: 'g_cash', name: 'Cash-in-Hand', nature: 'Asset' },
          { id: 'g_assets', name: 'Current Assets', nature: 'Asset' },
          { id: 'g_liabilities', name: 'Current Liabilities', nature: 'Liability' },
          { id: 'g_direct_exp', name: 'Direct Expenses', nature: 'Expense' },
          { id: 'g_direct_inc', name: 'Direct Incomes', nature: 'Income' },
          { id: 'g_fixed_assets', name: 'Fixed Assets', nature: 'Asset' },
          { id: 'g_indirect_exp', name: 'Indirect Expenses', nature: 'Expense' },
          { id: 'g_indirect_inc', name: 'Indirect Incomes', nature: 'Income' },
          { id: 'g_purchase', name: 'Purchase Accounts', nature: 'Expense' },
          { id: 'g_sales', name: 'Sales Accounts', nature: 'Income' },
          { id: 'g_creditors', name: 'Sundry Creditors', nature: 'Liability' },
          { id: 'g_debtors', name: 'Sundry Debtors', nature: 'Asset' },
          { id: 'g_capital', name: 'Capital Account', nature: 'Liability' }
        ],
        voucher_types: [
          { id: 'vt_sales', name: 'Sales', base_type: 'Sales' },
          { id: 'vt_purchase', name: 'Purchase', base_type: 'Purchase' },
          { id: 'vt_payment', name: 'Payment', base_type: 'Payment' },
          { id: 'vt_receipt', name: 'Receipt', base_type: 'Receipt' },
          { id: 'vt_contra', name: 'Contra', base_type: 'Contra' },
          { id: 'vt_journal', name: 'Journal', base_type: 'Journal' },
          { id: 'vt_credit_note', name: 'Credit Note', base_type: 'Credit Note' },
          { id: 'vt_debit_note', name: 'Debit Note', base_type: 'Debit Note' }
        ],
        units: [
          { id: 'u_pcs', name: 'Pcs', formal_name: 'Pieces' },
          { id: 'u_kg', name: 'Kg', formal_name: 'Kilograms' }
        ],
        godowns: [
          { id: 'godown_main', name: 'Main Warehouse', companyId: 'demo_company_id' },
          { id: 'godown_retail', name: 'Retail Store', companyId: 'demo_company_id' }
        ],
        ledgers: [
          { id: 'l_cash', name: 'Cash', parent_group_id: 'g_cash', opening_balance: 150000, current_balance: 150000, companyId: 'demo_company_id' },
          { id: 'l_bank', name: 'Prime Bank A/C', parent_group_id: 'g_bank', opening_balance: 500000, current_balance: 500000, companyId: 'demo_company_id' },
          { id: 'l_sales', name: 'Sales Ledger', parent_group_id: 'g_sales', opening_balance: 0, current_balance: 0, companyId: 'demo_company_id' },
          { id: 'l_purchase', name: 'Purchase Ledger', parent_group_id: 'g_purchase', opening_balance: 0, current_balance: 0, companyId: 'demo_company_id' },
          { id: 'l_rent', name: 'Office Rent', parent_group_id: 'g_indirect_exp', opening_balance: 0, current_balance: 0, companyId: 'demo_company_id' },
          { id: 'l_salaries', name: 'Employee Salaries', parent_group_id: 'g_indirect_exp', opening_balance: 0, current_balance: 0, companyId: 'demo_company_id' },
          { id: 'l_customer_a', name: 'Acme Corporates', parent_group_id: 'g_debtors', opening_balance: 50000, current_balance: 50000, companyId: 'demo_company_id' },
          { id: 'l_vendor_a', name: 'Apex Distributing', parent_group_id: 'g_creditors', opening_balance: -30000, current_balance: -30000, companyId: 'demo_company_id' }
        ],
        items: [
          { id: 'item_laptop', name: 'Core i7 Laptop', unit_id: 'u_pcs', current_stock: 25, rate: 45000, companyId: 'demo_company_id' },
          { id: 'item_monitor', name: '24" LED Monitor', unit_id: 'u_pcs', current_stock: 50, rate: 12000, companyId: 'demo_company_id' },
          { id: 'item_keyboard', name: 'Mechanical Keyboard', unit_id: 'u_pcs', current_stock: 120, rate: 25000, companyId: 'demo_company_id' }
        ],
        vouchers: [],
        voucher_entries: [],
        inventory_entries: [],
        tax_rates: [
          { id: 't_vat_15', name: 'VAT 15%', rate: 15, companyId: 'demo_company_id' }
        ]
      };
      localStorage.setItem('erp_demo_db', JSON.stringify(demoDb));
      localStorage.setItem('erp_demo_db_initialized', 'true');
    }
  },

  // Caching mechanism for voucher serials and common collections to significantly reduce reads
  _serialsCache: {} as Record<string, { data: Record<string, number>, timestamp: number }>,
  _ledgersCache: {} as Record<string, { data: Ledger[], timestamp: number }>,
  _itemsCache: {} as Record<string, { data: Item[], timestamp: number }>,
  _godownsCache: {} as Record<string, { data: any[], timestamp: number }>,
  _employeesCache: {} as Record<string, { data: any[], timestamp: number }>,
  _unitsCache: {} as Record<string, { data: any[], timestamp: number }>,
  _dashboardStatsCache: {} as Record<string, { data: any, timestamp: number }>,
  _collectionTTL: 3600000, // 1 hour for collections (increased from 10m to dramatically save reads)
  _SERIALS_CACHE_TTL: 1800000, // 30 minutes for serials cache
  _ledgerGroupsCache: {} as Record<string, { data: any[], timestamp: number }>,
  _voucherTypesCache: {} as Record<string, { data: any[], timestamp: number }>,
  _stockGroupsCache: {} as Record<string, { data: any[], timestamp: number }>,
  _stockCategoriesCache: {} as Record<string, { data: any[], timestamp: number }>,
  _employeeGroupsCache: {} as Record<string, { data: any[], timestamp: number }>,
  _usersCache: {} as Record<string, { data: any[], timestamp: number }>,

  _singleLedgerCache: {} as Record<string, { data: Ledger, timestamp: number }>,
  _singleItemCache: {} as Record<string, { data: Item, timestamp: number }>,

  _genericCollectionsCache: {} as Record<string, { data: any[], timestamp: number }>,
  _vouchersByDateRangeCache: {} as Record<string, { data: any[], timestamp: number }>,
  _vouchersByTypeCache: {} as Record<string, { data: any[], timestamp: number }>,
  _vouchersByGroupCache: {} as Record<string, { data: any[], timestamp: number }>,
  _ledgerBalanceCache: {} as Record<string, { data: number, timestamp: number }>,
  _voucherDetailCache: {} as Record<string, { data: any, timestamp: number }>,
  _voucherWithEntriesCache: {} as Record<string, { data: any[], timestamp: number }>,
  _ledgerMovementBeforeDateCache: {} as Record<string, { data: number, timestamp: number }>,
  _itemStatsCache: {} as Record<string, { data: any, timestamp: number }>,

  _updateCachedCollection(colName: string, companyId: string, item: any, op: 'add' | 'update' | 'delete') {
    if (!companyId) return;
    try {
      const cacheKey = `${colName}_${companyId}`;
      let data: any[] = [];
      const cachedStr = localStorage.getItem(`col_cache_${cacheKey}`);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (parsed && Array.isArray(parsed.data)) {
          data = parsed.data;
        }
      }
      
      if (op === 'add') {
        if (!data.some(existing => existing.id === item.id)) {
          data.push(item);
        }
      } else if (op === 'update') {
        data = data.map(existing => existing.id === item.id ? { ...existing, ...item } : existing);
      } else if (op === 'delete') {
        data = data.filter(existing => existing.id !== item.id);
      }

      const timestamp = Date.now();
      localStorage.setItem(`col_cache_${cacheKey}`, JSON.stringify({ data, timestamp }));

      // Update in-memory caches as well
      if (colName === 'ledgers') this._ledgersCache[companyId] = { data, timestamp };
      else if (colName === 'items') this._itemsCache[companyId] = { data, timestamp };
      else if (colName === 'godowns') this._godownsCache[companyId] = { data, timestamp };
      else if (colName === 'employees') this._employeesCache[companyId] = { data, timestamp };
      else if (colName === 'units') this._unitsCache[companyId] = { data, timestamp };
      else if (colName === 'ledger_groups') this._ledgerGroupsCache[companyId] = { data, timestamp };
      else if (colName === 'voucher_types') this._voucherTypesCache[companyId] = { data, timestamp };
      else if (colName === 'stock_groups') this._stockGroupsCache[companyId] = { data, timestamp };
      else if (colName === 'stock_categories') this._stockCategoriesCache[companyId] = { data, timestamp };
      else if (colName === 'employee_groups') this._employeeGroupsCache[companyId] = { data, timestamp };
      else {
        this._genericCollectionsCache[cacheKey] = { data, timestamp };
      }
    } catch (e) {
      console.warn('Error updating cached collection:', e);
    }
  },

  _replaceCachedSubCollection(colName: string, companyId: string, voucherId: string, newEntries: any[]) {
    if (!companyId) return;
    try {
      const cacheKey = `${colName}_${companyId}`;
      let data: any[] = [];
      const cachedStr = localStorage.getItem(`col_cache_${cacheKey}`);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (parsed && Array.isArray(parsed.data)) {
          data = parsed.data;
        }
      }
      
      data = data.filter((item: any) => item.voucher_id !== voucherId);
      data.push(...newEntries);
      
      const timestamp = Date.now();
      localStorage.setItem(`col_cache_${cacheKey}`, JSON.stringify({ data, timestamp }));
      this._genericCollectionsCache[cacheKey] = { data, timestamp };
    } catch (e) {
      console.warn('Error replacing cached subcollection:', e);
    }
  },

  invalidateLedgersCache(companyId: string) {
    if (!companyId) return;
    this._ledgersCache[companyId] = { data: [], timestamp: 0 };
    this._singleLedgerCache = {};
    try {
      localStorage.removeItem(`col_cache_ledgers_${companyId}`);
    } catch (e) {}
  },

  invalidateItemsCache(companyId: string) {
    if (!companyId) return;
    this._itemsCache[companyId] = { data: [], timestamp: 0 };
    this._singleItemCache = {};
    try {
      localStorage.removeItem(`col_cache_items_${companyId}`);
    } catch (e) {}
  },

  invalidateAllCaches(companyId: string) {
    if (!companyId) return;
    this._itemStatsCache = {};
    this._serialsCache[companyId] = { data: {}, timestamp: 0 };
    this._ledgersCache[companyId] = { data: [], timestamp: 0 };
    this._itemsCache[companyId] = { data: [], timestamp: 0 };
    this._ledgerGroupsCache[companyId] = { data: [], timestamp: 0 };
    this._voucherTypesCache[companyId] = { data: [], timestamp: 0 };
    this._stockGroupsCache[companyId] = { data: [], timestamp: 0 };
    this._stockCategoriesCache[companyId] = { data: [], timestamp: 0 };
    this._employeeGroupsCache[companyId] = { data: [], timestamp: 0 };
    this._godownsCache[companyId] = { data: [], timestamp: 0 };
    this._employeesCache[companyId] = { data: [], timestamp: 0 };
    this._unitsCache[companyId] = { data: [], timestamp: 0 };
    this._usersCache[companyId] = { data: [], timestamp: 0 };
    this._dashboardStatsCache = {};
    this._recentVouchersCache = {};
    this._ledgerBalanceCache = {};
    this._voucherDetailCache = {};
    this._singleLedgerCache = {};
    this._singleItemCache = {};
    this._voucherWithEntriesCache = {};
    this._ledgerMovementBeforeDateCache = {};
    if (this._searchVouchersCache.companyId === companyId) {
      this._searchVouchersCache = { companyId: '', data: [], timestamp: 0 };
    }
    this._vouchersByDateRangeCache = {};
    this._vouchersByTypeCache = {};
    this._vouchersByGroupCache = {};

    const suffix = `_${companyId}`;
    Object.keys(this._genericCollectionsCache).forEach(key => {
      if (key.endsWith(suffix)) {
        delete this._genericCollectionsCache[key];
      }
    });

    Object.keys(this._swrCache).forEach(key => {
      if (key.endsWith(suffix)) {
        delete this._swrCache[key];
        try {
          localStorage.removeItem(`swr_${key}`);
        } catch (e) {}
      }
    });

    // Clear collection localstorage caches
    const collectionsToClear = [
      'ledgers', 'items', 'godowns', 'employees', 'units', 
      'ledger_groups', 'voucher_types', 'stock_groups', 
      'stock_categories', 'employee_groups'
    ];
    collectionsToClear.forEach(col => {
      try {
        localStorage.removeItem(`col_cache_${col}_${companyId}`);
      } catch (e) {}
    });
  },

  _patchCachesOnCreate(companyId: string, voucher: any, entries: any[], inventoryEntries: any[]) {
    if (!companyId) return;

    // 1. Update in-memory & localstorage ledgers cache
    const ledgersCache = this._ledgersCache[companyId];
    if (ledgersCache && Array.isArray(ledgersCache.data)) {
      ledgersCache.data = ledgersCache.data.map((l: any) => {
        const entry = entries?.find((e: any) => e.ledger_id === l.id);
        if (entry) {
          const balanceChange = (entry.debit || 0) - (entry.credit || 0);
          return { ...l, current_balance: (l.current_balance || 0) + balanceChange };
        }
        return l;
      });
      try {
        localStorage.setItem(`col_cache_ledgers_${companyId}`, JSON.stringify(ledgersCache));
      } catch (e) {}
    }

    // 2. Update in-memory & localstorage items cache
    const itemsCache = this._itemsCache[companyId];
    if (itemsCache && Array.isArray(itemsCache.data)) {
      itemsCache.data = itemsCache.data.map((item: any) => {
        const invEntry = inventoryEntries?.find((i: any) => i.item_id === item.id);
        if (invEntry) {
          const vTypeLower = (voucher.v_type || '').toLowerCase();
          let isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower) || 
                         ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((invEntry.entry_type || '').toLowerCase()) ||
                         ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((invEntry.m_type || '').toLowerCase());

          const totalEntryQty = (Number(invEntry.qty) || 0) + (Number(invEntry.free_qty) || 0);
          const stockChange = isOutward ? -totalEntryQty : totalEntryQty;
          return { ...item, current_stock: (item.current_stock || 0) + stockChange };
        }
        return item;
      });
      try {
        localStorage.setItem(`col_cache_items_${companyId}`, JSON.stringify(itemsCache));
      } catch (e) {}
    }

    // 3. Add/Update in voucherDetailCache
    this._voucherDetailCache[voucher.id] = {
      data: {
        ...voucher,
        entries,
        inventory: inventoryEntries
      },
      timestamp: Date.now()
    };

    // 4. Insert into appropriate positions of the voucherWithEntriesCache lists
    for (const key of Object.keys(this._voucherWithEntriesCache)) {
      if (key.startsWith(companyId)) {
        const parts = key.split('_');
        if (parts.length >= 4) {
          const ledgerId = parts[1];
          const startDate = parts[2];
          const endDate = parts[3];

          const hasLedger = entries.some(e => e.ledger_id === ledgerId);
          const inRange = voucher.v_date >= startDate && voucher.v_date <= endDate;

          if (hasLedger && inRange) {
            const cached = this._voucherWithEntriesCache[key];
            if (cached && Array.isArray(cached.data)) {
              const fullVoucher = {
                ...voucher,
                voucher_entries: entries,
                inventory: inventoryEntries
              };
              const filtered = cached.data.filter((v: any) => v.id !== voucher.id);
              filtered.push(fullVoucher);
              
              filtered.sort((a: any, b: any) => {
                const serialA = a.serial_no || a.auto_serial_no || 0;
                const serialB = b.serial_no || b.auto_serial_no || 0;
                return serialA - serialB;
              });

              cached.data = filtered;
            }
          }
        }
      }
    }

    // 5. Adjust ledgerMovementBeforeDateCache
    for (const key of Object.keys(this._ledgerMovementBeforeDateCache)) {
      if (key.startsWith(companyId)) {
        const parts = key.split('_');
        if (parts.length >= 3) {
          const ledgerId = parts[1];
          const date = parts[2];
          if (voucher.v_date < date) {
            const entry = entries?.find((e: any) => e.ledger_id === ledgerId);
            if (entry) {
              const prevMovement = this._ledgerMovementBeforeDateCache[key].data;
              const movementChange = (entry.debit || 0) - (entry.credit || 0);
              this._ledgerMovementBeforeDateCache[key].data = prevMovement + movementChange;
            }
          }
        }
      }
    }

    // 6. Update search and recent vouchers cached arrays
    if (this._searchVouchersCache.companyId === companyId) {
      const idx = this._searchVouchersCache.data.findIndex((v: any) => v.id === voucher.id);
      if (idx === -1) {
        this._searchVouchersCache.data.unshift(voucher);
      } else {
        this._searchVouchersCache.data[idx] = voucher;
      }
    }
    for (const key of Object.keys(this._recentVouchersCache)) {
      if (key.startsWith(companyId)) {
        const cached = this._recentVouchersCache[key];
        if (cached && Array.isArray(cached.data)) {
          const idx = cached.data.findIndex((v: any) => v.id === voucher.id);
          if (idx === -1) {
            cached.data.unshift(voucher);
          } else {
            cached.data[idx] = voucher;
          }
        }
      }
    }

    // 7. Inject into generic collection caches to keep general reports (like Daybook, Summary, Register, StockItemReport) fully up-to-date instantly!
    this._updateCachedCollection('vouchers', companyId, voucher, 'add');
    entries.forEach(e => this._updateCachedCollection('voucher_entries', companyId, e, 'add'));
    inventoryEntries.forEach(i => this._updateCachedCollection('inventory_entries', companyId, i, 'add'));

    // 8. Delete cache entries for item stats so they dynamically recalculate accurate stats based on updated inventory_entries
    if (inventoryEntries && inventoryEntries.length > 0) {
      inventoryEntries.forEach(i => {
        if (i.item_id) {
          delete this._itemStatsCache[`${companyId}_${i.item_id}`];
        }
      });
    }
  },

  _patchCachesOnUpdate(companyId: string, id: string, oldVoucher: any, newVoucher: any, newEntries: any[], newInventory: any[]) {
    if (!companyId) return;

    // 1. Update in-memory & localstorage ledgers cache
    const ledgersCache = this._ledgersCache[companyId];
    if (ledgersCache && Array.isArray(ledgersCache.data)) {
      ledgersCache.data = ledgersCache.data.map((l: any) => {
        const oldEntry = oldVoucher.entries?.find((e: any) => e.ledger_id === l.id);
        const newEntry = newEntries?.find((e: any) => e.ledger_id === l.id);
        
        let balanceChange = 0;
        if (oldEntry) {
          balanceChange += (oldEntry.credit || 0) - (oldEntry.debit || 0);
        }
        if (newEntry) {
          balanceChange += (newEntry.debit || 0) - (newEntry.credit || 0);
        }

        if (balanceChange !== 0) {
          return { ...l, current_balance: (l.current_balance || 0) + balanceChange };
        }
        return l;
      });
      try {
        localStorage.setItem(`col_cache_ledgers_${companyId}`, JSON.stringify(ledgersCache));
      } catch (e) {}
    }

    // 2. Update in-memory & localstorage items cache
    const itemsCache = this._itemsCache[companyId];
    if (itemsCache && Array.isArray(itemsCache.data)) {
      itemsCache.data = itemsCache.data.map((item: any) => {
        const oldInvEntry = oldVoucher.inventory?.find((i: any) => i.item_id === item.id);
        const newInvEntry = newInventory?.find((i: any) => i.item_id === item.id);
        
        let stockChange = 0;
        if (oldInvEntry) {
          const vTypeLower = (oldVoucher.v_type || '').toLowerCase();
          let isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower) || 
                         ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((oldInvEntry.entry_type || '').toLowerCase()) ||
                         ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((oldInvEntry.m_type || '').toLowerCase());
          const totalQty = (oldInvEntry.qty || 0) + (oldInvEntry.free_qty || 0);
          stockChange += isOutward ? totalQty : -totalQty;
        }

        if (newInvEntry) {
          const vTypeLower = (newVoucher.v_type || '').toLowerCase();
          let isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower) || 
                         ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((newInvEntry.entry_type || '').toLowerCase()) ||
                         ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((newInvEntry.m_type || '').toLowerCase());
          const totalQty = (newInvEntry.qty || 0) + (newInvEntry.free_qty || 0);
          stockChange += isOutward ? -totalQty : totalQty;
        }

        if (stockChange !== 0) {
          return { ...item, current_stock: (item.current_stock || 0) + stockChange };
        }
        return item;
      });
      try {
        localStorage.setItem(`col_cache_items_${companyId}`, JSON.stringify(itemsCache));
      } catch (e) {}
    }

    // 3. Update in voucherDetailCache
    this._voucherDetailCache[id] = {
      data: {
        ...newVoucher,
        entries: newEntries,
        inventory: newInventory
      },
      timestamp: Date.now()
    };

    // 4. Update in voucherWithEntriesCache
    for (const key of Object.keys(this._voucherWithEntriesCache)) {
      if (key.startsWith(companyId)) {
        const parts = key.split('_');
        if (parts.length >= 4) {
          const ledgerId = parts[1];
          const startDate = parts[2];
          const endDate = parts[3];

          const hasLedger = newEntries.some(e => e.ledger_id === ledgerId);
          const inRange = newVoucher.v_date >= startDate && newVoucher.v_date <= endDate;

          const cached = this._voucherWithEntriesCache[key];
          if (cached && Array.isArray(cached.data)) {
            let filtered = cached.data.filter((v: any) => v.id !== id);

            if (hasLedger && inRange) {
              const fullVoucher = {
                ...newVoucher,
                voucher_entries: newEntries,
                inventory: newInventory
              };
              filtered.push(fullVoucher);
              
              filtered.sort((a: any, b: any) => {
                const serialA = a.serial_no || a.auto_serial_no || 0;
                const serialB = b.serial_no || b.auto_serial_no || 0;
                return serialA - serialB;
              });
            }

            cached.data = filtered;
          }
        }
      }
    }

    // 5. Adjust ledgerMovementBeforeDateCache
    for (const key of Object.keys(this._ledgerMovementBeforeDateCache)) {
      if (key.startsWith(companyId)) {
        const parts = key.split('_');
        if (parts.length >= 3) {
          const ledgerId = parts[1];
          const date = parts[2];

          let adjustment = 0;
          if (oldVoucher.v_date < date) {
            const oldEntry = oldVoucher.entries?.find((e: any) => e.ledger_id === ledgerId);
            if (oldEntry) {
              adjustment -= (oldEntry.debit || 0) - (oldEntry.credit || 0);
            }
          }
          if (newVoucher.v_date < date) {
            const newEntry = newEntries?.find((e: any) => e.ledger_id === ledgerId);
            if (newEntry) {
              adjustment += (newEntry.debit || 0) - (newEntry.credit || 0);
            }
          }

          if (adjustment !== 0) {
            this._ledgerMovementBeforeDateCache[key].data += adjustment;
          }
        }
      }
    }

    // 6. Update search and recent vouchers cached arrays
    if (this._searchVouchersCache.companyId === companyId) {
      this._searchVouchersCache.data = this._searchVouchersCache.data.map((v: any) => v.id === id ? newVoucher : v);
    }
    for (const key of Object.keys(this._recentVouchersCache)) {
      if (key.startsWith(companyId)) {
        const cached = this._recentVouchersCache[key];
        if (cached && Array.isArray(cached.data)) {
          cached.data = cached.data.map((v: any) => v.id === id ? { ...v, ...newVoucher } : v);
        }
      }
    }

    // 7. Inject / Update generic Collection Caches
    this._updateCachedCollection('vouchers', companyId, newVoucher, 'update');
    this._replaceCachedSubCollection('voucher_entries', companyId, id, newEntries);
    this._replaceCachedSubCollection('inventory_entries', companyId, id, newInventory || []);

    // 8. Delete cache entries for item stats so they dynamically recalculate
    const oldItemIds = oldVoucher.inventory?.map((i: any) => i.item_id).filter(Boolean) || [];
    const newItemIds = newInventory?.map(i => i.item_id).filter(Boolean) || [];
    const allItemIds = Array.from(new Set([...oldItemIds, ...newItemIds]));
    allItemIds.forEach(itemId => {
      delete this._itemStatsCache[`${companyId}_${itemId}`];
    });
  },

  _patchCachesOnDelete(companyId: string, id: string, voucher: any) {
    if (!companyId) return;

    // Remove from ledgers cache
    const ledgersCache = this._ledgersCache[companyId];
    if (ledgersCache && Array.isArray(ledgersCache.data)) {
      ledgersCache.data = ledgersCache.data.map((l: any) => {
        const entry = voucher.entries?.find((e: any) => e.ledger_id === l.id);
        if (entry) {
          const balanceChange = (entry.credit || 0) - (entry.debit || 0);
          return { ...l, current_balance: (l.current_balance || 0) + balanceChange };
        }
        return l;
      });
      try {
        localStorage.setItem(`col_cache_ledgers_${companyId}`, JSON.stringify(ledgersCache));
      } catch (e) {}
    }

    // Remove from items cache
    const itemsCache = this._itemsCache[companyId];
    if (itemsCache && Array.isArray(itemsCache.data)) {
      itemsCache.data = itemsCache.data.map((item: any) => {
        const invEntry = voucher.inventory?.find((i: any) => i.item_id === item.id);
        if (invEntry) {
          const totalQty = (invEntry.qty || 0) + (invEntry.free_qty || 0);
          const stockChange = invEntry.movement_type === 'Inward' ? -totalQty : totalQty;
          return { ...item, current_stock: (item.current_stock || 0) + stockChange };
        }
        return item;
      });
      try {
        localStorage.setItem(`col_cache_items_${companyId}`, JSON.stringify(itemsCache));
      } catch (e) {}
    }

    delete this._voucherDetailCache[id];

    for (const key of Object.keys(this._voucherWithEntriesCache)) {
      if (key.startsWith(companyId)) {
        const cached = this._voucherWithEntriesCache[key];
        if (cached && Array.isArray(cached.data)) {
          cached.data = cached.data.filter((v: any) => v.id !== id);
        }
      }
    }

    for (const key of Object.keys(this._ledgerMovementBeforeDateCache)) {
      if (key.startsWith(companyId)) {
        const parts = key.split('_');
        if (parts.length >= 3) {
          const ledgerId = parts[1];
          const date = parts[2];
          if (voucher.v_date < date) {
            const entry = voucher.entries?.find((e: any) => e.ledger_id === ledgerId);
            if (entry) {
              const prevMovement = this._ledgerMovementBeforeDateCache[key].data;
              const movementChange = (entry.debit || 0) - (entry.credit || 0);
              this._ledgerMovementBeforeDateCache[key].data = prevMovement - movementChange;
            }
          }
        }
      }
    }

    if (this._searchVouchersCache.companyId === companyId) {
      this._searchVouchersCache.data = this._searchVouchersCache.data.filter((v: any) => v.id !== id);
    }
    for (const key of Object.keys(this._recentVouchersCache)) {
      if (key.startsWith(companyId)) {
        const cached = this._recentVouchersCache[key];
        if (cached && Array.isArray(cached.data)) {
          cached.data = cached.data.filter((v: any) => v.id !== id);
        }
      }
    }

    // 7. Remove from generic Collection Caches
    this._updateCachedCollection('vouchers', companyId, { id }, 'delete');
    this._replaceCachedSubCollection('voucher_entries', companyId, id, []);
    this._replaceCachedSubCollection('inventory_entries', companyId, id, []);

    // 8. Delete cache entries for item stats so they dynamically recalculate
    const itemIds = voucher.inventory?.map((i: any) => i.item_id).filter(Boolean) || [];
    itemIds.forEach((itemId: string) => {
      delete this._itemStatsCache[`${companyId}_${itemId}`];
    });
  },

  _pendingRequests: {} as Record<string, Promise<any>>,

  // Browser Client/Session Cache for zero-flash transitions (SWR style)
  _swrCache: {} as Record<string, any>,

  getCachedData: function(key: string, companyId: string): any {
    if (!companyId) return null;
    const cacheKey = `${key}_${companyId}`;
    if (this._swrCache[cacheKey]) {
      return this._swrCache[cacheKey];
    }
    try {
      const persisted = localStorage.getItem(`swr_${cacheKey}`);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        this._swrCache[cacheKey] = parsed;
        return parsed;
      }
    } catch (e) {}
    return null;
  },

  setCachedData: function(key: string, companyId: string, data: any) {
    if (!companyId) return;
    const cacheKey = `${key}_${companyId}`;
    this._swrCache[cacheKey] = data;
    try {
      localStorage.setItem(`swr_${cacheKey}`, JSON.stringify(data));
    } catch (e) {}
  },

  hasCache: function(key: string, companyId: string): boolean {
    if (!companyId) return false;
    const cacheKey = `${key}_${companyId}`;
    if (this._swrCache[cacheKey]) return true;
    try {
      const persisted = localStorage.getItem(`swr_${cacheKey}`);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        this._swrCache[cacheKey] = parsed;
        return true;
      }
    } catch (e) {}
    return false;
  },

  getCollection: async function<T = any>(colName: string, companyId: string, limitCount: number = 5000, forceRefresh = false): Promise<T[]> {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      if (typeof (this as any).initDemoDbIfNeeded === 'function') {
        (this as any).initDemoDbIfNeeded();
      }
      return (this as any)._getDemoData(colName);
    }
    if (!companyId) return [];
    const cacheKey = `${colName}_${companyId}`;
    
    // Check if there's a pending request for this exact collection (unless forcing)
    if (!forceRefresh && (this as any)._pendingRequests[cacheKey]) {
      return (this as any)._pendingRequests[cacheKey];
    }

    const now = Date.now();
    // Use the appropriate cache based on collection name
    let cache: any = null;
    if (colName === 'ledgers') cache = (this as any)._ledgersCache[companyId];
    else if (colName === 'items') cache = (this as any)._itemsCache[companyId];
    else if (colName === 'godowns') cache = (this as any)._godownsCache[companyId];
    else if (colName === 'employees') cache = (this as any)._employeesCache[companyId];
    else if (colName === 'units') cache = (this as any)._unitsCache[companyId];
    else if (colName === 'ledger_groups') cache = (this as any)._ledgerGroupsCache[companyId];
    else if (colName === 'voucher_types') cache = (this as any)._voucherTypesCache[companyId];
    else if (colName === 'stock_groups') cache = (this as any)._stockGroupsCache[companyId];
    else if (colName === 'stock_categories') cache = (this as any)._stockCategoriesCache[companyId];
    else if (colName === 'employee_groups') cache = (this as any)._employeeGroupsCache[companyId];
    else {
      cache = (this as any)._genericCollectionsCache[cacheKey];
    }

    if (!forceRefresh && cache && Array.isArray(cache.data)) {
      return cache.data;
    }

    // Try hydrating from localStorage if memory cache is stale/empty to avoid fetching from server
    if (!forceRefresh) {
      try {
        const item = localStorage.getItem(`col_cache_${cacheKey}`);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed && Array.isArray(parsed.data)) {
            const data = parsed.data;
            if (colName === 'ledgers') (this as any)._ledgersCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'items') (this as any)._itemsCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'godowns') (this as any)._godownsCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'employees') (this as any)._employeesCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'units') (this as any)._unitsCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'ledger_groups') (this as any)._ledgerGroupsCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'voucher_types') (this as any)._voucherTypesCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'stock_groups') (this as any)._stockGroupsCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'stock_categories') (this as any)._stockCategoriesCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else if (colName === 'employee_groups') (this as any)._employeeGroupsCache[companyId] = { data, timestamp: parsed.timestamp || now };
            else {
              (this as any)._genericCollectionsCache[cacheKey] = { data, timestamp: parsed.timestamp || now };
            }
            return data;
          }
        }
      } catch (err) {
        console.warn('Error reviving collection cache:', err);
      }
    }

    const fetchPromise = (async () => {
      try {
        const q = query(
          collection(db, colName), 
          where('companyId', '==', companyId),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        
        // Track real-time reads in database quota
        this.trackQuota(companyId, snapshot.size || 1, 0);

        const data = snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as unknown as T));
        
        // Update specific cache if applicable
        if (colName === 'ledgers') (this as any)._ledgersCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'items') (this as any)._itemsCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'godowns') (this as any)._godownsCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'employees') (this as any)._employeesCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'units') (this as any)._unitsCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'ledger_groups') (this as any)._ledgerGroupsCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'voucher_types') (this as any)._voucherTypesCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'stock_groups') (this as any)._stockGroupsCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'stock_categories') (this as any)._stockCategoriesCache[companyId] = { data: data as any, timestamp: now };
        else if (colName === 'employee_groups') (this as any)._employeeGroupsCache[companyId] = { data: data as any, timestamp: now };
        else {
          (this as any)._genericCollectionsCache[cacheKey] = { data: data as any, timestamp: now };
        }

        // Cache persistent copy in localStorage for high-performance zero-fetch reloads
        try {
          localStorage.setItem(`col_cache_${cacheKey}`, JSON.stringify({ data, timestamp: now }));
        } catch (e) {}

        return data;
      } finally {
        delete (this as any)._pendingRequests[cacheKey];
      }
    })();

    (this as any)._pendingRequests[cacheKey] = fetchPromise;
    return fetchPromise;
  },

  async deleteDocCustom(colName: string, id: string) {
    await deleteDoc(doc(db, colName, id));
  },

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

  async updateAutoSerialNo(companyId: string, vType: string, newSerial: number) {
    try {
      const typeKey = vType.trim().toLowerCase().replace(/\s+/g, '_');
      const counterRef = doc(db, 'counters', `${companyId}_voucher_${typeKey}`);
      await setDoc(counterRef, {
        lastSerial: Math.max(0, newSerial - 1),
        vType: vType,
        companyId: companyId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return newSerial;
    } catch (error) {
      console.error('Error updating auto serial:', error);
      throw error;
    }
  },

  async getNextAutoSerialNo(companyId: string, vType: string, isDeepScan = false, forceResync = false): Promise<number> {
    try {
      if (!companyId || !vType) return 1;
      
      const normalizedRequested = vType.trim();
      const lowerRequested = normalizedRequested.toLowerCase();
      const typeKey = lowerRequested.replace(/\s+/g, '_');
      const counterRef = doc(db, 'counters', `${companyId}_voucher_${typeKey}`);
      
      const counterSnap = await getDoc(counterRef);
      let lastSerial = (counterSnap.exists() ? counterSnap.data().lastSerial : 0) || 0;

      // Deep scan or force resync: perform a targeted search for all vouchers of this type
      if (forceResync || isDeepScan || lastSerial === 0) {
        let foundMax = 0;

        try {
          // 1. Try a targeted query (This is the most reliable way)
          // Targeted by type avoids the "limit" issue where other voucher types bury your results
          const qTargeted = query(
            collection(db, 'vouchers'),
            where('companyId', '==', companyId),
            where('v_type', '==', normalizedRequested)
          );
          
          const snap = await getDocs(qTargeted);
          
          if (!snap.empty) {
            snap.docs.forEach(d => {
              const data = d.data();
              const sField = Number(data.serial_no || data.auto_serial_no) || 0;
              // Check for valid range and ignore outliers
              if (sField > 0 && sField < 1000000 && sField > foundMax) {
                foundMax = sField;
              }
            });
          }

          // 2. If nothing found by exact match, try lowercase match fallback (for data consistency)
          if (foundMax === 0) {
             const qBroad = query(
               collection(db, 'vouchers'),
               where('companyId', '==', companyId),
               limit(5000) 
             );
             const snapBroad = await getDocs(qBroad);
             snapBroad.docs.forEach(d => {
               const data = d.data();
               const docType = (data.v_type || '').toString().trim().toLowerCase();
               if (docType === lowerRequested) {
                 const sField = Number(data.serial_no || data.auto_serial_no) || 0;
                 if (sField > 0 && sField > foundMax) foundMax = sField;
               }
             });
          }
        } catch (err) {
          console.warn('getNextAutoSerialNo scan failed:', err);
        }

        // Update the counter if we found a true maximum from the database
        if (foundMax > 0 && (foundMax > lastSerial || forceResync)) {
          lastSerial = foundMax;
          try {
            await setDoc(counterRef, {
              lastSerial: foundMax,
              vType: normalizedRequested,
              companyId: companyId,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `counters/${companyId}_voucher_${typeKey}`);
          }
        } else if (!counterSnap.exists()) {
          try {
            await setDoc(counterRef, {
              lastSerial: foundMax,
              vType: normalizedRequested,
              companyId: companyId,
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `counters/${companyId}_voucher_${typeKey}`);
          }
        }
      }

      return lastSerial + 1;
    } catch (error: any) {
      if (error.message && error.message.startsWith('{')) throw error;
      console.error('Error in getNextAutoSerialNo:', error);
      return 1;
    }
  },

  async getVoucherSerials(companyId: string): Promise<Record<string, number>> {
    const now = Date.now();
    const cached = this._serialsCache[companyId];
    if (cached && (now - cached.timestamp < this._SERIALS_CACHE_TTL)) {
      return cached.data;
    }

    try {
      const q = query(
        collection(db, 'vouchers'),
        where('companyId', '==', companyId),
        orderBy('v_date', 'asc'),
        limit(2000) // Restricted for performance. Deep scan would need more.
      );
      const snap = await getDocs(q);
      const vouchers = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      
      // Sort vouchers BEFORE assigning serials to ensure stability
      // Priority: v_date, then numeric part of v_no, then saved serial_no, then createdAt
      vouchers.sort((a, b) => {
        const dateComp = (a.v_date || '').localeCompare(b.v_date || '');
        if (dateComp !== 0) return dateComp;

        // Try numeric sort for Ref No (v_no)
        const numA = parseInt(a.v_no?.toString().replace(/\D/g, '') || '0') || 0;
        const numB = parseInt(b.v_no?.toString().replace(/\D/g, '') || '0') || 0;
        if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

        // Fallback to saved serial_no
        const sA = Number(a.serial_no || a.auto_serial_no) || 0;
        const sB = Number(b.serial_no || b.auto_serial_no) || 0;
        if (sA !== sB) return sA - sB;

        // Final fallback to v_no string compare
        const vNoA = (a.v_no || '').toString();
        const vNoB = (b.v_no || '').toString();
        const vNoComp = vNoA.localeCompare(vNoB);
        if (vNoComp !== 0) return vNoComp;

        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });

      const typeCounters: Record<string, number> = {};
      const serialMap: Record<string, number> = {};
      
      vouchers.forEach(v => {
        const type = v.v_type;
        typeCounters[type] = (typeCounters[type] || 0) + 1;
        serialMap[v.id] = typeCounters[type];
      });

      this._serialsCache[companyId] = { data: serialMap, timestamp: now };
      return serialMap;
    } catch (error) {
      console.error('Error fetching voucher serials:', error);
      return {};
    }
  },

  async migrateVoucherSerials(companyId: string) {
    try {
      const q = query(collection(db, 'vouchers'), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;

      for (const d of snap.docs) {
        const data = d.data();
        const vNo = (data.v_no || '').toString();
        
        let refNo = vNo;
        let serial = data.serial_no || data.auto_serial_no || 0;

        // If it looks like "REF / S#SER", split it
        if (vNo.includes(' / S#')) {
          const parts = vNo.split(' / S#');
          refNo = parts[0];
          if (serial === 0) {
            serial = parseInt(parts[1]) || 0;
          }
        } else if (vNo.includes('S#')) {
          const sMatch = vNo.match(/S#(\d+)/);
          if (sMatch) {
            serial = parseInt(sMatch[1]);
            refNo = vNo.replace(/S#\d+/, '').replace(/\s*\/\s*$/, '').trim();
          }
        }

        if (refNo !== data.reference_no || serial !== (data.serial_no || data.auto_serial_no) || refNo !== data.v_no) {
          batch.update(d.ref, {
            reference_no: refNo,
            serial_no: serial,
            v_no: refNo // Transition v_no to be strictly reference_no
          });
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
      return count;
    } catch (err) {
      console.error('Migration error:', err);
      throw err;
    }
  },
  async createVoucher(companyId: string, userId: string, voucher: any, entries: any[], inventoryEntries?: any[]) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const demoVouchers = this._getDemoData('vouchers');
      const demoEntries = this._getDemoData('voucher_entries');
      const demoInventory = this._getDemoData('inventory_entries');
      const demoLedgers = this._getDemoData('ledgers');
      const demoItems = this._getDemoData('items');

      const vType = (voucher.v_type || '').toString().trim();
      
      // Calculate next serial
      const typeVouchers = demoVouchers.filter((v: any) => (v.v_type || '').toLowerCase() === vType.toLowerCase());
      const nextSerial = typeVouchers.length + 1;
      const vId = 'demo_v_' + Date.now() + Math.random().toString(36).substring(2, 7);

      const vData = {
        ...voucher,
        id: vId,
        companyId,
        serial_no: nextSerial,
        v_no: voucher.v_no || `${vType}-${nextSerial}`,
        reference_no: voucher.v_no || `${vType}-${nextSerial}`,
        v_date: voucher.v_date || new Date().toISOString().split('T')[0],
        createdBy: userId,
        createdAt: new Date().toISOString()
      };
      demoVouchers.push(vData);

      // Save accounting entries
      for (const entry of entries) {
        const eId = 'demo_e_' + Date.now() + Math.random().toString(36).substring(2, 7);
        demoEntries.push({
          ...entry,
          id: eId,
          voucher_id: vId,
          companyId,
          date: vData.v_date,
          created_at: new Date().toISOString()
        });

        // Update Ledger Balance
        if (entry.ledger_id) {
          const ledgerIndex = demoLedgers.findIndex((l: any) => l.id === entry.ledger_id);
          if (ledgerIndex !== -1) {
            const balanceChange = (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
            demoLedgers[ledgerIndex] = {
              ...demoLedgers[ledgerIndex],
              current_balance: (Number(demoLedgers[ledgerIndex].current_balance) || 0) + balanceChange
            };
          }
        }
      }

      // Save inventory entries
      if (inventoryEntries && inventoryEntries.length > 0) {
        for (const inv of inventoryEntries) {
          const invId = 'demo_inv_' + Date.now() + Math.random().toString(36).substring(2, 7);
          const vTypeLower = vType.toLowerCase();
          const isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower);
          const totalEntryQty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
          const qtyChange = isOutward ? -totalEntryQty : totalEntryQty;

          demoInventory.push({
            ...inv,
            id: invId,
            voucher_id: vId,
            v_type: vType,
            companyId,
            date: vData.v_date,
            created_at: new Date().toISOString(),
            movement_type: isOutward ? 'Outward' : 'Inward',
            m_type: isOutward ? 'Outward' : 'Inward',
            entry_type: inv.entry_type || (isOutward ? 'Outward' : 'Inward')
          });

          if (inv.item_id) {
            const itemIndex = demoItems.findIndex((i: any) => i.id === inv.item_id);
            if (itemIndex !== -1) {
              demoItems[itemIndex] = {
                ...demoItems[itemIndex],
                current_stock: (Number(demoItems[itemIndex].current_stock) || 0) + qtyChange
              };
            }
          }
        }
      }

      this._saveDemoData('vouchers', demoVouchers);
      this._saveDemoData('voucher_entries', demoEntries);
      this._saveDemoData('inventory_entries', demoInventory);
      this._saveDemoData('ledgers', demoLedgers);
      this._saveDemoData('items', demoItems);

      return { id: vId, ...vData };
    }

    // Track Firestore operations used
    this.trackQuota(companyId, 5, 5);
    try {
      const vType = (voucher.v_type || '').toString().trim();
      const typeKey = vType.toLowerCase().replace(/\s+/g, '_');
      const counterRef = doc(db, 'counters', `${companyId}_voucher_${typeKey}`);

      const res = await runTransaction(db, async (transaction) => {
        // Log transaction start attempt
        console.log(`Starting transaction for ${vType} in company ${companyId}`);
        
        // 1. All mandatory reads first
        const reads: Promise<DocumentSnapshot>[] = [transaction.get(counterRef)];
        
        // Track references needed for Physical Stock reads
        const itemRefsMap: Record<string, DocumentReference> = {};
        const godownStockRefsMap: Record<string, DocumentReference> = {};

        if (vType.toLowerCase() === 'physical stock' && inventoryEntries && inventoryEntries.length > 0) {
          for (const inv of inventoryEntries) {
            if (inv.item_id) {
              if (!itemRefsMap[inv.item_id]) {
                const iRef = doc(db, 'items', inv.item_id);
                itemRefsMap[inv.item_id] = iRef;
                reads.push(transaction.get(iRef));
              }
              if (inv.godown_id) {
                const gsKey = `${inv.godown_id}_${inv.item_id}`;
                if (!godownStockRefsMap[gsKey]) {
                  const gsRef = doc(db, 'godown_stock', gsKey);
                  godownStockRefsMap[gsKey] = gsRef;
                  reads.push(transaction.get(gsRef));
                }
              }
            }
          }
        }

        const allSnaps = await Promise.all(reads);
        const counterSnap = allSnaps[0];
        
        // Cache item and godown snapshots by path
        const snapsCache: Record<string, DocumentSnapshot> = {};
        allSnaps.slice(1).forEach(snap => {
          snapsCache[snap.ref.path] = snap;
        });

        let nextSerial = 1;
        if (counterSnap && counterSnap.exists()) {
          nextSerial = (counterSnap.data().lastSerial || 0) + 1;
        }

        // 2. Start writes after all reads are done
        const vRef = doc(collection(db, 'vouchers'));
        const reference_no = voucher.v_no || ''; 
        
        const vData = cleanData({
          ...voucher,
          id: vRef.id,
          companyId,
          reference_no: reference_no,
          serial_no: nextSerial,
          v_no: reference_no, 
          v_date: formatToYMD(voucher.v_date), // Ensure YYYY-MM-DD
          createdBy: userId,
          createdAt: serverTimestamp()
        });
        transaction.set(vRef, vData);

        // 3. Create Accounting Entries
        const vDateYMD = formatToYMD(voucher.v_date);
        for (const entry of entries) {
          const eRef = doc(collection(db, 'voucher_entries'));
          transaction.set(eRef, cleanData({
            ...entry,
            voucher_id: vRef.id,
            companyId,
            date: vDateYMD,
            created_at: serverTimestamp()
          }));

          // Update Ledger Balance
          if (entry.ledger_id) {
            const lRef = doc(db, 'ledgers', entry.ledger_id);
            const balanceChange = (entry.debit || 0) - (entry.credit || 0);
            transaction.update(lRef, { current_balance: increment(balanceChange) });
          }
        }

        // 4. Create Inventory Entries
        if (inventoryEntries && inventoryEntries.length > 0) {
          for (const inv of inventoryEntries) {
            const invRef = doc(collection(db, 'inventory_entries'));
            
            // Special handling for movement type
            const vTypeLower = vType.toLowerCase();
            let isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower) || 
                           ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((inv.entry_type || '').toLowerCase()) ||
                           ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((inv.m_type || '').toLowerCase()) ||
                           ['outward', 'out'].includes((inv.type || '').toLowerCase());
            
            const totalEntryQty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
            let qtyChange = isOutward ? -totalEntryQty : totalEntryQty;
            let finalInvData = {
              ...inv,
              voucher_id: vRef.id,
              v_type: vType,
              companyId,
              date: vDateYMD,
              created_at: serverTimestamp(),
              // Ensure consistent movement fields for reporting
              movement_type: isOutward ? 'Outward' : 'Inward',
              m_type: isOutward ? 'Outward' : 'Inward',
              entry_type: inv.entry_type || (isOutward ? 'Outward' : 'Inward')
            };

            if (vTypeLower === 'physical stock' && inv.item_id) {
              const iRef = itemRefsMap[inv.item_id];
              const itemSnap = snapsCache[iRef.path];
              const globalStock = (itemSnap && itemSnap.exists() ? itemSnap.data().current_stock : 0) || 0;

              let currentGodownStock = 0;
              if (inv.godown_id) {
                const gsKey = `${inv.godown_id}_${inv.item_id}`;
                const gsRef = godownStockRefsMap[gsKey];
                const gsSnap = snapsCache[gsRef.path];
                currentGodownStock = (gsSnap && gsSnap.exists() ? gsSnap.data().current_stock : 0) || 0;
              }

              const targetQty = Number(inv.qty) || 0;
              const adjustment = targetQty - (inv.godown_id ? currentGodownStock : globalStock);
              
              qtyChange = adjustment;
              
              finalInvData = {
                ...finalInvData,
                qty: targetQty,
                adjustment_qty: adjustment,
                movement_type: adjustment >= 0 ? 'Inward' : 'Outward',
                is_physical_snapshot: true
              };
            }

            transaction.set(invRef, cleanData(finalInvData));

            if (inv.item_id) {
              const iRef = doc(db, 'items', inv.item_id);
              if (vType.toLowerCase() === 'physical stock' && !inv.godown_id) {
                 // If no godown specified, physical stock sets the global absolute
                 transaction.update(iRef, { current_stock: Number(inv.qty) || 0 });
              } else {
                 transaction.update(iRef, { current_stock: increment(qtyChange) });
              }

              if (inv.godown_id) {
                const gsRef = doc(db, 'godown_stock', `${inv.godown_id}_${inv.item_id}`);
                if (vType.toLowerCase() === 'physical stock') {
                  transaction.set(gsRef, {
                    godown_id: inv.godown_id,
                    item_id: inv.item_id,
                    companyId,
                    current_stock: Number(inv.qty) || 0,
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                } else {
                  transaction.set(gsRef, {
                    godown_id: inv.godown_id,
                    item_id: inv.item_id,
                    companyId,
                    current_stock: increment(qtyChange),
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                }
              }
            }
          }
        }

        // 5. Commit counter increment
        await transaction.set(counterRef, {
          lastSerial: nextSerial,
          vType,
          companyId,
          updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true, id: vRef.id, serial_no: nextSerial, v_date: vDateYMD, itemIds: Array.from(new Set(inventoryEntries?.map(i => i.item_id).filter(Boolean) || [])) };
      });

      if (res && res.success) {
        // Construct full voucher
        const createdVoucher = {
          ...voucher,
          id: res.id,
          serial_no: res.serial_no,
          v_date: res.v_date,
          reference_no: voucher.v_no || '',
          v_no: voucher.v_no || '',
          companyId
        };
        const mappedEntries = entries.map(e => ({ ...e, voucher_id: res.id, date: res.v_date, companyId }));
        const mappedInventory = (inventoryEntries || []).map(i => ({ ...i, voucher_id: res.id, companyId }));
        
        this._patchCachesOnCreate(companyId, createdVoucher, mappedEntries, mappedInventory);

        if (res.itemIds.length > 0) {
          for (const itemId of res.itemIds) {
            this.recalculateItemStats(itemId as string, companyId).catch(console.error);
          }
        }
      }
      return true;
    } catch (err: any) {
      // If it's already a JSON error, just throw it
      if (err.message && err.message.startsWith('{')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, 'vouchers_transaction');
    }
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
    const cacheKey = `${companyId}_${type}_${from}_${to}`;
    const now = Date.now();
    if (this._vouchersByTypeCache[cacheKey]) {
      return this._vouchersByTypeCache[cacheKey].data;
    }
    try {
      let vouchers: any[] = [];
      let allEntries: any[] = [];
      let serialMap: any = {};

      try {
        const [vSnap, eSnap, sMap] = await Promise.all([
          getDocs(query(
            collection(db, 'vouchers'),
            where('companyId', '==', companyId),
            where('v_type', '==', type),
            where('v_date', '>=', from),
            where('v_date', '<=', to)
          )),
          getDocs(query(
            collection(db, 'voucher_entries'),
            where('companyId', '==', companyId),
            where('date', '>=', from),
            where('date', '<=', to)
          )),
          this.getVoucherSerials(companyId)
        ]);
        vouchers = vSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        allEntries = eSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        serialMap = sMap;
        this.trackQuota(companyId, vSnap.size + eSnap.size, 0);
      } catch (rangeErr) {
        console.warn('Targeted range query in getVouchersByType failed, falling back:', rangeErr);
        const [vCollection, eCollection, sMap] = await Promise.all([
          this.getCollection('vouchers', companyId),
          this.getCollection('voucher_entries', companyId),
          this.getVoucherSerials(companyId)
        ]);
        vouchers = vCollection.filter((v: any) => v.v_type === type && v.v_date >= from && v.v_date <= to);
        allEntries = eCollection;
        serialMap = sMap;
      }

      const result = vouchers.map((v: any) => {
        const dynamicSerial = serialMap[v.id];
        return {
          ...v,
          serial_no: dynamicSerial || v.serial_no || v.auto_serial_no || 0,
          entries: allEntries.filter((e: any) => e.voucher_id === v.id)
        };
      }).sort((a: any, b: any) => {
        const dateComp = (a.v_date || '').localeCompare(b.v_date || '');
        if (dateComp !== 0) return dateComp;
        
        const numA = parseInt(a.v_no?.replace(/\D/g, '') || '0') || 0;
        const numB = parseInt(b.v_no?.replace(/\D/g, '') || '0') || 0;
        if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

        const vNoComp = (a.v_no || '').localeCompare(b.v_no || '');
        if (vNoComp !== 0) return vNoComp;

        const serialA = a.serial_no || a.auto_serial_no || 0;
        const serialB = b.serial_no || b.auto_serial_no || 0;
        if (serialA !== serialB) return serialA - serialB;

        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        if (timeA !== timeB) return timeA - timeB;

        return a.id.localeCompare(b.id);
      });

      this._vouchersByTypeCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error in getVouchersByType:', error);
      return [];
    }
  },

  async getVouchersByGroup(companyId: string, groupId: string, from: string, to: string) {
    const cacheKey = `${companyId}_${groupId}_${from}_${to}`;
    const now = Date.now();
    if (this._vouchersByGroupCache[cacheKey]) {
      return this._vouchersByGroupCache[cacheKey].data;
    }
    try {
      const [allGroups, ledgers, serialMap] = await Promise.all([
        this.getCollection('ledger_groups', companyId),
        this.getCollection('ledgers', companyId),
        this.getVoucherSerials(companyId)
      ]);
      
      const getChildGroupIds = (parentId: string): string[] => {
        let ids = [parentId];
        const children = allGroups.filter((g: any) => g.parent_id === parentId);
        children.forEach((child: any) => {
          ids = [...ids, ...getChildGroupIds(child.id)];
        });
        return ids;
      };

      const groupIds = getChildGroupIds(groupId);
      const groupLedgerIds = ledgers.filter((l: any) => groupIds.includes(l.group_id)).map((l: any) => l.id);
      
      if (groupLedgerIds.length === 0) return [];

      let vouchers: any[] = [];
      let allEntries: any[] = [];

      try {
        const [vSnap, eSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'vouchers'),
            where('companyId', '==', companyId),
            where('v_date', '>=', from),
            where('v_date', '<=', to)
          )),
          getDocs(query(
            collection(db, 'voucher_entries'),
            where('companyId', '==', companyId),
            where('date', '>=', from),
            where('date', '<=', to)
          ))
        ]);
        vouchers = vSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        allEntries = eSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        this.trackQuota(companyId, vSnap.size + eSnap.size, 0);
      } catch (rangeErr) {
        console.warn('Targeted range query in getVouchersByGroup failed, falling back:', rangeErr);
        const [vCollection, eCollection] = await Promise.all([
          this.getCollection('vouchers', companyId),
          this.getCollection('voucher_entries', companyId)
        ]);
        vouchers = vCollection.filter((v: any) => v.v_date >= from && v.v_date <= to);
        allEntries = eCollection;
      }

      const result = vouchers.map((v: any) => {
        const dynamicSerial = serialMap[v.id];
        const voucherEntries = allEntries.filter((e: any) => e.voucher_id === v.id);
        const hasMatchingLedger = voucherEntries.some((e: any) => groupLedgerIds.includes(e.ledger_id));
        if (!hasMatchingLedger) return null;

        return {
          ...v,
          serial_no: dynamicSerial || v.serial_no || v.auto_serial_no || 0,
          entries: voucherEntries
        };
      }).filter(Boolean).sort((a: any, b: any) => {
        const dateComp = (a.v_date || '').localeCompare(b.v_date || '');
        if (dateComp !== 0) return dateComp;
        
        const numA = parseInt(a.v_no?.replace(/\D/g, '') || '0') || 0;
        const numB = parseInt(b.v_no?.replace(/\D/g, '') || '0') || 0;
        if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

        const vNoComp = (a.v_no || '').localeCompare(b.v_no || '');
        if (vNoComp !== 0) return vNoComp;

        const serialA = a.serial_no || a.auto_serial_no || 0;
        const serialB = b.serial_no || b.auto_serial_no || 0;
        if (serialA !== serialB) return serialA - serialB;

        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        if (timeA !== timeB) return timeA - timeB;

        return a.id.localeCompare(b.id);
      });

      this._vouchersByGroupCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error in getVouchersByGroup:', error);
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
      const allVouchers = vSnap.docs.map(d => ({ ...d.data(), id: d.id } as any));

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
      const ledgers = await this.getCollection('ledgers', companyId);
      return ledgers.filter(l => l.group_id === groupId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ledgers');
      return [];
    }
  },

  async getGroupSummary(companyId: string, groupId: string, from: string, to: string) {
    try {
      const allLedgers = await this.getCollection('ledgers', companyId);
      const groupLedgers = allLedgers.filter(l => l.group_id === groupId);
      
      if (groupLedgers.length === 0) return [];
      
      const ledgerIds = groupLedgers.map(l => l.id);
      
      // Fetch all entries for these ledgers up to 'to' date
      const entries: any[] = [];
      
      // Process in chunks of 30 because of Firestore 'in' query limit
      for (let i = 0; i < ledgerIds.length; i += 30) {
        const chunk = ledgerIds.slice(i, i + 30);
        const q = query(
          collection(db, 'voucher_entries'),
          where('companyId', '==', companyId),
          where('ledger_id', 'in', chunk),
          where('date', '<=', to)
        );
        const snap = await getDocs(q);
        entries.push(...snap.docs.map(d => d.data()));
      }
      
      return groupLedgers.map(l => {
        const ledgerEntries = entries.filter(e => e.ledger_id === l.id);
        const openingEntries = ledgerEntries.filter(e => e.date < from);
        const periodEntries = ledgerEntries.filter(e => e.date >= from && e.date <= to);
        
        const openingBalance = (l.opening_balance || 0) + 
          openingEntries.reduce((sum, e) => sum + (e.debit || 0) - (e.credit || 0), 0);
        
        const debit = periodEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const credit = periodEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
        
        const closingBalance = openingBalance + debit - credit;
        
        return {
          ...l,
          openingBalance,
          debit,
          credit,
          closingBalance,
          current_balance: closingBalance // For compatibility with existing UI
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'groupSummary');
      return [];
    }
  },

  async getCashBankVouchers(companyId: string, from: string, to: string) {
    try {
      const ledgers = await this.getCollection('ledgers', companyId);
      const cashBankLedgerIds = ledgers.filter((l: any) => 
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
      const entries = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      
      const voucherIds = Array.from(new Set(entries.map((e: any) => e.voucher_id)));
      if (voucherIds.length === 0) return [];

      const vSnaps = await Promise.all(voucherIds.map((id: any) => getDoc(doc(db, 'vouchers', id as string))));
      return vSnaps.filter(s => s.exists()).map(s => ({ ...s.data(), id: s.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'voucher_entries');
      return [];
    }
  },
   async getVoucherById(id: string): Promise<any> {
     const now = Date.now();
     if (this._voucherDetailCache[id]) {
       return this._voucherDetailCache[id].data;
     }
     
     // Try loading from cached local collections first
     const lastCompanyId = localStorage.getItem('last_company_id') || localStorage.getItem('current_company_id');
     if (lastCompanyId) {
       try {
         const [vouchers, allEntries, allInventory, ledgers, items, godowns, serialMap] = await Promise.all([
           this.getCollection('vouchers', lastCompanyId),
           this.getCollection('voucher_entries', lastCompanyId),
           this.getCollection('inventory_entries', lastCompanyId),
           this.getCollection('ledgers', lastCompanyId),
           this.getCollection('items', lastCompanyId),
           this.getCollection('godowns', lastCompanyId),
           this.getVoucherSerials(lastCompanyId)
         ]);

         const voucher = vouchers.find((v: any) => v.id === id);
         if (voucher) {
           const entries = allEntries
             .filter((e: any) => e.voucher_id === id)
             .map((e: any) => {
               const ledger = ledgers.find((l: any) => l.id === e.ledger_id);
               return {
                 ...e,
                 ledger_name: ledger?.name || 'Unknown Ledger'
               };
             })
             .sort((a: any, b: any) => (a.entry_index || 0) - (b.entry_index || 0));

           const inventory = allInventory
             .filter((i: any) => i.voucher_id === id)
             .map((i: any) => {
               const item = items.find((itm: any) => itm.id === i.item_id);
               const godown = godowns.find((g: any) => g.id === i.godown_id);
               return {
                 ...i,
                 item_name: item?.name || 'Unknown Item',
                 godown_name: godown?.name || 'N/A'
               };
             });

           const result = {
             ...voucher,
             entries,
             inventory,
             serial_no: serialMap[id] || voucher.serial_no || voucher.auto_serial_no || 0
           };
           this._voucherDetailCache[id] = { data: result, timestamp: now };
           return result;
         }
       } catch (cacheErr) {
         console.warn('Error reading from local cache inside getVoucherById:', cacheErr);
       }
     }

     try {
       const vSnap = await getDoc(doc(db, 'vouchers', id));
       if (!vSnap.exists()) return null;
       const voucher = vSnap.data();
       const companyId = voucher.companyId;

       const [eSnap, iSnap, ledgers, items, godowns, serialMap] = await Promise.all([
         getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId))),
         getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId))),
         this.getLedgers(companyId),
         this.getItems(companyId),
         this.getGodowns(companyId),
         this.getVoucherSerials(companyId)
       ]);

       this.trackQuota(companyId, (1 + eSnap.size + iSnap.size) || 1, 0);

       const entries = eSnap.docs.map(d => {
         const data = d.data();
         const ledger = ledgers.find(l => l.id === data.ledger_id);
         return { 
           ...data,
           id: d.id, 
           ledger_name: ledger?.name || 'Unknown Ledger' 
         };
       }).sort((a: any, b: any) => (a.entry_index || 0) - (b.entry_index || 0));

       const inventory = iSnap.docs.map(d => {
         const data = d.data();
         const item = items.find(i => i.id === data.item_id);
         const godown = godowns.find(g => g.id === data.godown_id);
         return { 
           ...data,
           id: d.id, 
           item_name: item?.name || 'Unknown Item',
           godown_name: godown?.name || 'N/A'
         };
       });

       const result = { ...voucher, entries, inventory, id: vSnap.id, serial_no: serialMap[vSnap.id] || voucher.serial_no || voucher.auto_serial_no || 0 };
       this._voucherDetailCache[id] = { data: result, timestamp: now };
       return result;
     } catch (error) {
       handleFirestoreError(error, OperationType.GET, `vouchers/${id}`);
       throw error;
     }
   },

  async deleteVoucher(id: string) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const demoVouchers = this._getDemoData('vouchers');
      const demoEntries = this._getDemoData('voucher_entries');
      const demoInventory = this._getDemoData('inventory_entries');
      const demoLedgers = this._getDemoData('ledgers');
      const demoItems = this._getDemoData('items');

      const vIndex = demoVouchers.findIndex((v: any) => v.id === id);
      if (vIndex === -1) return;

      const voucher = demoVouchers[vIndex];
      const matchingEntries = demoEntries.filter((e: any) => e.voucher_id === id);
      const matchingInventory = demoInventory.filter((i: any) => i.voucher_id === id);

      // Reverse ledger balances
      for (const entry of matchingEntries) {
        if (entry.ledger_id) {
          const lIndex = demoLedgers.findIndex((l: any) => l.id === entry.ledger_id);
          if (lIndex !== -1) {
            const balanceChange = (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
            demoLedgers[lIndex] = {
              ...demoLedgers[lIndex],
              current_balance: (Number(demoLedgers[lIndex].current_balance) || 0) - balanceChange
            };
          }
        }
      }

      // Reverse inventory items
      for (const inv of matchingInventory) {
        if (inv.item_id) {
          const iIndex = demoItems.findIndex((i: any) => i.id === inv.item_id);
          if (iIndex !== -1) {
            const isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((voucher.v_type || '').toLowerCase());
            const totalQty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
            const qtyChange = isOutward ? -totalQty : totalQty;

            demoItems[iIndex] = {
              ...demoItems[iIndex],
              current_stock: (Number(demoItems[iIndex].current_stock) || 0) - qtyChange
            };
          }
        }
      }

      // Remove from arrays
      const filteredVouchers = demoVouchers.filter((v: any) => v.id !== id);
      const filteredEntries = demoEntries.filter((e: any) => e.voucher_id !== id);
      const filteredInventory = demoInventory.filter((i: any) => i.voucher_id !== id);

      this._saveDemoData('vouchers', filteredVouchers);
      this._saveDemoData('voucher_entries', filteredEntries);
      this._saveDemoData('inventory_entries', filteredInventory);
      this._saveDemoData('ledgers', demoLedgers);
      this._saveDemoData('items', demoItems);

      return;
    }

    const voucher = await this.getVoucherById(id);
    if (!voucher) throw new Error('Voucher not found');
    const companyId = voucher.companyId;
    this._patchCachesOnDelete(companyId, id, voucher);
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
    const itemIdsToRecalc = new Set<string>();
    for (const i of voucher.inventory) {
      if (i.item_id && existingItems.has(i.item_id)) {
        itemIdsToRecalc.add(i.item_id as string);
        const itemRef = doc(db, 'items', i.item_id);
        if (voucher.v_type === 'Physical Stock') {
           // No direct update needed, recalculation will fix it
        } else {
          const totalQty = (i.qty || 0) + (i.free_qty || 0);
          const stockChange = i.movement_type === 'Inward' ? -totalQty : totalQty;
          batch.update(itemRef, { current_stock: increment(stockChange) });

          if (i.godown_id) {
            const gsRef = doc(db, 'godown_stock', `${i.godown_id}_${i.item_id}`);
            batch.set(gsRef, { current_stock: increment(stockChange) }, { merge: true });
          }
        }
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
    this.trackQuota(companyId, 0, 0, 1 + eSnap.size + iSnap.size);

    // Trigger recalculation for affected items
    for (const itemId of itemIdsToRecalc) {
      this.recalculateItemStats(itemId, companyId).catch(console.error);
    }
  },

  async updateVoucher(id: string, voucher: any, entries: any[], inventoryEntries?: any[]) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const companyId = voucher.companyId || 'demo_company_id';
      const userId = 'demo_user_uid';
      await this.deleteVoucher(id);
      
      const demoVouchers = this._getDemoData('vouchers');
      const demoEntries = this._getDemoData('voucher_entries');
      const demoInventory = this._getDemoData('inventory_entries');
      const demoLedgers = this._getDemoData('ledgers');
      const demoItems = this._getDemoData('items');

      const vType = (voucher.v_type || '').toString().trim();
      const typeVouchers = demoVouchers.filter((v: any) => (v.v_type || '').toLowerCase() === vType.toLowerCase());
      const nextSerial = typeVouchers.length + 1;

      const vData = {
        ...voucher,
        id: id,
        companyId,
        serial_no: nextSerial,
        v_no: voucher.v_no || `${vType}-${nextSerial}`,
        reference_no: voucher.v_no || `${vType}-${nextSerial}`,
        v_date: voucher.v_date || new Date().toISOString().split('T')[0],
        createdBy: userId,
        createdAt: new Date().toISOString()
      };
      demoVouchers.push(vData);

      // Save entries
      for (const entry of entries) {
        const eId = 'demo_e_' + Date.now() + Math.random().toString(36).substring(2, 7);
        demoEntries.push({
          ...entry,
          id: eId,
          voucher_id: id,
          companyId,
          date: vData.v_date,
          created_at: new Date().toISOString()
        });

        if (entry.ledger_id) {
          const lIndex = demoLedgers.findIndex((l: any) => l.id === entry.ledger_id);
          if (lIndex !== -1) {
            const balanceChange = (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
            demoLedgers[lIndex] = {
              ...demoLedgers[lIndex],
              current_balance: (Number(demoLedgers[lIndex].current_balance) || 0) + balanceChange
            };
          }
        }
      }

      // Save inventory
      if (inventoryEntries && inventoryEntries.length > 0) {
        for (const inv of inventoryEntries) {
          const invId = 'demo_inv_' + Date.now() + Math.random().toString(36).substring(2, 7);
          const vTypeLower = vType.toLowerCase();
          const isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower);
          const totalEntryQty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
          const qtyChange = isOutward ? -totalEntryQty : totalEntryQty;

          demoInventory.push({
            ...inv,
            id: invId,
            voucher_id: id,
            v_type: vType,
            companyId,
            date: vData.v_date,
            created_at: new Date().toISOString(),
            movement_type: isOutward ? 'Outward' : 'Inward',
            m_type: isOutward ? 'Outward' : 'Inward',
            entry_type: inv.entry_type || (isOutward ? 'Outward' : 'Inward')
          });

          if (inv.item_id) {
            const itemIndex = demoItems.findIndex((i: any) => i.id === inv.item_id);
            if (itemIndex !== -1) {
              demoItems[itemIndex] = {
                ...demoItems[itemIndex],
                current_stock: (Number(demoItems[itemIndex].current_stock) || 0) + qtyChange
              };
            }
          }
        }
      }

      this._saveDemoData('vouchers', demoVouchers);
      this._saveDemoData('voucher_entries', demoEntries);
      this._saveDemoData('inventory_entries', demoInventory);
      this._saveDemoData('ledgers', demoLedgers);
      this._saveDemoData('items', demoItems);

      return { id, ...vData };
    }

    try {
      const oldVoucher = await this.getVoucherById(id);
      if (!oldVoucher) throw new Error('Voucher not found');
      
      const vType = (voucher.v_type || '').toString().trim();
      const companyId = oldVoucher.companyId;
      const updatedVoucher = {
        ...oldVoucher,
        ...voucher,
        v_date: formatToYMD(voucher.v_date || oldVoucher.v_date),
        id,
        companyId
      };
      this._patchCachesOnUpdate(companyId, id, oldVoucher, updatedVoucher, entries, inventoryEntries || []);
      // Track Firestore operations used
      this.trackQuota(companyId, 5, 5);

      const res = await runTransaction(db, async (transaction) => {
        // Collect all IDs
        const oldLedgerIds = oldVoucher.entries.map((e: any) => e.ledger_id).filter(Boolean);
        const newLedgerIds = entries.map(e => e.ledger_id).filter(Boolean);
        const ledgerIds = Array.from(new Set([...oldLedgerIds, ...newLedgerIds]));

        const oldItemIds = oldVoucher.inventory.map((i: any) => i.item_id).filter(Boolean);
        const newItemIds = (inventoryEntries || []).map(i => i.item_id).filter(Boolean);
        const itemIds = Array.from(new Set([...oldItemIds, ...newItemIds]));

        // Setup reads
        const reads: Promise<DocumentSnapshot>[] = [];
        ledgerIds.forEach(lId => reads.push(transaction.get(doc(db, 'ledgers', lId as string))));
        itemIds.forEach(iId => reads.push(transaction.get(doc(db, 'items', iId as string))));
        
        // Add godown stock reads if Physical Stock
        const godownStockRefsMap: Record<string, DocumentReference> = {};
        if (vType.toLowerCase() === 'physical stock' && inventoryEntries) {
          inventoryEntries.filter(i => i.item_id && i.godown_id).forEach(i => {
            const key = `${i.godown_id}_${i.item_id}`;
            const ref = doc(db, 'godown_stock', key);
            godownStockRefsMap[key] = ref;
            reads.push(transaction.get(ref));
          });
        }

        const allSnaps = await Promise.all(reads);
        const snapsCache: Record<string, DocumentSnapshot> = {};
        allSnaps.forEach(s => { snapsCache[s.ref.path] = s; });

        // 1. Reverse Old
        for (const entry of oldVoucher.entries) {
          if (entry.ledger_id) {
            const lRef = doc(db, 'ledgers', entry.ledger_id);
            if (snapsCache[lRef.path]?.exists()) {
              const balanceChange = (entry.credit || 0) - (entry.debit || 0);
              transaction.update(lRef, { current_balance: increment(balanceChange) });
            }
          }
        }

        for (const i of oldVoucher.inventory) {
          if (i.item_id) {
            const iRef = doc(db, 'items', i.item_id);
            if (snapsCache[iRef.path]?.exists()) {
              if (oldVoucher.v_type?.toLowerCase() === 'physical stock') {
                // For Physical Stock, reversing depends on whether it was godown-specific or global
                if (i.godown_id) {
                   // Reverse the adjustment
                   const adj = Number(i.adjustment_qty) || 0;
                   transaction.update(iRef, { current_stock: increment(-adj) });
                   
                   const gsRef = doc(db, 'godown_stock', `${i.godown_id}_${i.item_id}`);
                   // For godown stock, we don't 'reverse' easily because it's absolute. 
                   // We trust the new voucher will set it.
                } else {
                   // Global absolute reset reversal is difficult without a full history re-run.
                   // Recalculation at end will fix it.
                }
              } else {
                const totalQty = (i.qty || 0) + (i.free_qty || 0);
                const stockChange = i.movement_type === 'Inward' ? -totalQty : totalQty;
                transaction.update(iRef, { current_stock: increment(stockChange) });

                if (i.godown_id) {
                  const gsRef = doc(db, 'godown_stock', `${i.godown_id}_${i.item_id}`);
                  transaction.set(gsRef, { current_stock: increment(stockChange) }, { merge: true });
                }
              }
            }
          }
        }

        // Delete Old Entries
        const eSnapOld = await getDocs(query(collection(db, 'voucher_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
        eSnapOld.docs.forEach(d => transaction.delete(d.ref));
        const iSnapOld = await getDocs(query(collection(db, 'inventory_entries'), where('voucher_id', '==', id), where('companyId', '==', companyId)));
        iSnapOld.docs.forEach(d => transaction.delete(d.ref));

        // 2. Apply New
        const vRef = doc(db, 'vouchers', id);
        const reference_no = voucher.v_no || '';
        const vDateYMD = formatToYMD(voucher.v_date || oldVoucher.v_date);
        
        transaction.update(vRef, cleanData({
          ...voucher,
          reference_no: reference_no,
          v_no: reference_no,
          v_date: vDateYMD,
          updated_at: serverTimestamp()
        }));

        for (const entry of entries) {
          const eRef = doc(collection(db, 'voucher_entries'));
          transaction.set(eRef, cleanData({
            ...entry,
            voucher_id: id,
            companyId,
            date: vDateYMD,
            created_at: serverTimestamp()
          }));

          if (entry.ledger_id) {
            const lRef = doc(db, 'ledgers', entry.ledger_id);
            if (snapsCache[lRef.path]?.exists()) {
              const balanceChange = (entry.debit || 0) - (entry.credit || 0);
              transaction.update(lRef, { current_balance: increment(balanceChange) });
            }
          }
        }

        if (inventoryEntries && inventoryEntries.length > 0) {
          for (const i of inventoryEntries) {
            const invRef = doc(collection(db, 'inventory_entries'));
            
            // Re-use logic for movement detection
            const vTypeLower = vType.toLowerCase();
            let isOutward = ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes(vTypeLower) || 
                           ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((i.movement_type || '').toLowerCase()) ||
                           ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((i.m_type || '').toLowerCase()) ||
                           ['sales', 'delivery note', 'rejection out', 'purchase return', 'physical stock', 'material out', 'outward', 'out', 'consumption', 'debit note'].includes((i.entry_type || '').toLowerCase());

            let movementType = isOutward ? 'Outward' : 'Inward';
            let adjustment_qty = 0;
            const totalEntryQty = (Number(i.qty) || 0) + (Number(i.free_qty) || 0);
            let qtyChange = isOutward ? -totalEntryQty : totalEntryQty;

            if (vTypeLower === 'physical stock' && i.item_id) {
              const itemRef = doc(db, 'items', i.item_id);
              const itemSnap = snapsCache[itemRef.path];
              const globalStock = (itemSnap && itemSnap.exists() ? itemSnap.data().current_stock : 0) || 0;
              
              let currentGodownStock = 0;
              if (i.godown_id) {
                const gsRef = godownStockRefsMap[`${i.godown_id}_${i.item_id}`];
                const gsSnap = gsRef ? snapsCache[gsRef.path] : null;
                currentGodownStock = (gsSnap && gsSnap.exists() ? gsSnap.data().current_stock : 0) || 0;
              }
              
              const targetQty = Number(i.qty) || 0;
              adjustment_qty = targetQty - (i.godown_id ? currentGodownStock : globalStock);
              movementType = adjustment_qty >= 0 ? 'Inward' : 'Outward';
              qtyChange = adjustment_qty;
            }

            transaction.set(invRef, cleanData({
              ...i,
              voucher_id: id,
              v_type: vType,
              companyId,
              date: vDateYMD,
              movement_type: movementType,
              m_type: movementType,
              adjustment_qty,
              is_physical_snapshot: vTypeLower === 'physical stock',
              created_at: serverTimestamp()
            }));

            if (i.item_id) {
              const itemRef = doc(db, 'items', i.item_id);
              if (vType.toLowerCase() === 'physical stock' && !i.godown_id) {
                transaction.update(itemRef, { current_stock: Number(i.qty) || 0 });
              } else {
                transaction.update(itemRef, { current_stock: increment(qtyChange) });
              }
              
              if (i.godown_id) {
                const gsRef = doc(db, 'godown_stock', `${i.godown_id}_${i.item_id}`);
                if (vType.toLowerCase() === 'physical stock') {
                  transaction.set(gsRef, {
                    godown_id: i.godown_id,
                    item_id: i.item_id,
                    companyId,
                    current_stock: Number(i.qty) || 0,
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                } else {
                  transaction.set(gsRef, { current_stock: increment(qtyChange) }, { merge: true });
                }
              }
            }
          }
        }

        return { success: true, itemIds };
      });

      if (res && res.success && res.itemIds.length > 0) {
        for (const itemId of res.itemIds) {
          this.recalculateItemStats(itemId as string, companyId).catch(console.error);
        }
      }
      return true;
    } catch (err: any) {
      if (err.message && err.message.startsWith('{')) throw err;
      handleFirestoreError(err, OperationType.WRITE, 'vouchers_update_transaction');
    }
  },

  // Ledgers
  async getLedgers(companyId: string, forceRefresh = false): Promise<Ledger[]> {
    const now = Date.now();
    if (!forceRefresh && this._ledgersCache[companyId] && (now - this._ledgersCache[companyId].timestamp < this._collectionTTL)) {
      return this._ledgersCache[companyId].data;
    }

    try {
      console.log('erpService.getLedgers called for companyId:', companyId);
      const [ledgers, groups] = await Promise.all([
        this.getCollection('ledgers', companyId, 5000, forceRefresh),
        this.getCollection('ledger_groups', companyId, 5000, forceRefresh)
      ]);
      
      const result = ledgers.map(l => {
        const group = groups.find(g => g.id === l.group_id);
        return {
          ...l,
          ledger_groups: group,
          group_name: group?.name || l.group_name
        };
      });

      this._ledgersCache[companyId] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error in getLedgers:', error);
      return [];
    }
  },

  async getLedgerById(id: string): Promise<Ledger | null> {
    const now = Date.now();
    if (this._singleLedgerCache[id] && (now - this._singleLedgerCache[id].timestamp < 300000)) { // 5-minute single ledger cache TTL
      return this._singleLedgerCache[id].data;
    }
    try {
      const snap = await getDoc(doc(db, 'ledgers', id));
      if (!snap.exists()) return null;
      const data = { ...(snap.data() as any), id: snap.id } as Ledger;
      this._singleLedgerCache[id] = { data, timestamp: now };
      return data;
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
    const now = Date.now();
    if (this._ledgerGroupsCache[companyId] && (now - this._ledgerGroupsCache[companyId].timestamp < this._collectionTTL)) {
      return this._ledgerGroupsCache[companyId].data;
    }
    try {
      const groups = await this.getCollection('ledger_groups', companyId);
      if (groups.length === 0) {
        const seeded = await this.seedDefaultGroups(companyId);
        this._ledgerGroupsCache[companyId] = { data: seeded, timestamp: now };
        return seeded;
      }
      this._ledgerGroupsCache[companyId] = { data: groups, timestamp: now };
      return groups;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ledger_groups');
      return [];
    }
  },

  async getVoucherTypes(companyId: string): Promise<any[]> {
    const now = Date.now();
    if (this._voucherTypesCache[companyId] && (now - this._voucherTypesCache[companyId].timestamp < this._collectionTTL)) {
      return this._voucherTypesCache[companyId].data;
    }
    try {
      const types = await this.getCollection('voucher_types', companyId);
      if (types.length === 0) {
        const seeded = await this.seedDefaultVoucherTypes(companyId);
        this._voucherTypesCache[companyId] = { data: seeded, timestamp: now };
        return seeded;
      }
      this._voucherTypesCache[companyId] = { data: types, timestamp: now };
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
      const data = cleanData({ ...v, id: ref.id, companyId });
      batch.set(ref, data);
      results.push(data);
    }
    await batch.commit();
    return results;
  },

  async getStockGroups(companyId: string): Promise<any[]> {
    const now = Date.now();
    if (this._stockGroupsCache[companyId] && (now - this._stockGroupsCache[companyId].timestamp < this._collectionTTL)) {
      return this._stockGroupsCache[companyId].data;
    }
    const result = await this.getCollection('stock_groups', companyId);
    this._stockGroupsCache[companyId] = { data: result, timestamp: now };
    return result;
  },

  async getStockCategories(companyId: string): Promise<any[]> {
    const now = Date.now();
    if (this._stockCategoriesCache[companyId] && (now - this._stockCategoriesCache[companyId].timestamp < this._collectionTTL)) {
      return this._stockCategoriesCache[companyId].data;
    }
    const result = await this.getCollection('stock_categories', companyId);
    this._stockCategoriesCache[companyId] = { data: result, timestamp: now };
    return result;
  },

  async getEmployeeGroups(companyId: string): Promise<any[]> {
    const now = Date.now();
    if (this._employeeGroupsCache[companyId] && (now - this._employeeGroupsCache[companyId].timestamp < this._collectionTTL)) {
      return this._employeeGroupsCache[companyId].data;
    }
    const result = await this.getCollection('employee_groups', companyId);
    this._employeeGroupsCache[companyId] = { data: result, timestamp: now };
    return result;
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
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const companyId = snap.data().companyId;
        if (companyId) this._unitsCache[companyId] = { data: [], timestamp: 0 };
      }
      await updateDoc(ref, unit);
      return { id, ...unit };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `units/${id}`);
    }
  },

  async deleteUnit(id: string) {
    try {
      const ref = doc(db, 'units', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const companyId = snap.data().companyId;
        if (companyId) this._unitsCache[companyId] = { data: [], timestamp: 0 };
      }
      await deleteDoc(ref);
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
      const data = cleanData({ ...group, id: ref.id, companyId });
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
      const data = cleanData({ ...type, id: ref.id, companyId });
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
      const data = cleanData({ ...category, id: ref.id, companyId });
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
      const data = cleanData({ ...group, id: ref.id, companyId });
      await setDoc(ref, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'employee_groups');
    }
  },

  async createUnit(companyId: string, unit: any) {
    this._unitsCache[companyId] = { data: [], timestamp: 0 }; // Invalidate cache
    try {
      const isDuplicate = await this.checkDuplicate('units', companyId, 'name', unit.name);
      if (isDuplicate) throw new Error(`Unit "${unit.name}" already exists.`);

      const ref = doc(collection(db, 'units'));
      const data = cleanData({ ...unit, id: ref.id, companyId });
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
      const data = cleanData({ ...g, id: ref.id, companyId });
      batch.set(ref, data);
      results.push(data);
    }
    await batch.commit();
    return results;
  },

  async createLedger(companyId: string, ledger: any) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const ledgers = this._getDemoData('ledgers');
      const isDuplicate = ledgers.some((l: any) => l.name.toLowerCase() === ledger.name.toLowerCase() && l.companyId === companyId);
      if (isDuplicate) throw new Error(`Ledger "${ledger.name}" already exists.`);

      const newLedger = {
        ...ledger,
        id: 'demo_ledger_' + Date.now() + Math.random().toString(36).substring(2, 7),
        companyId,
        opening_balance: Number(ledger.opening_balance) || 0,
        current_balance: Number(ledger.opening_balance) || 0,
        createdAt: new Date().toISOString()
      };
      ledgers.push(newLedger);
      this._saveDemoData('ledgers', ledgers);
      return newLedger;
    }
    try {
      const isDuplicate = await this.checkDuplicate('ledgers', companyId, 'name', ledger.name);
      if (isDuplicate) throw new Error(`Ledger "${ledger.name}" already exists.`);

      const ref = doc(collection(db, 'ledgers'));
      const data = cleanData({
        ...ledger,
        id: ref.id,
        companyId,
        current_balance: ledger.opening_balance || 0
      });
      await setDoc(ref, data);
      this._updateCachedCollection('ledgers', companyId, data, 'add');
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ledgers');
    }
  },

  async updateLedger(id: string, ledger: any) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const ledgers = this._getDemoData('ledgers');
      const index = ledgers.findIndex((l: any) => l.id === id);
      if (index !== -1) {
        const old = ledgers[index];
        ledgers[index] = {
          ...old,
          ...ledger,
          id,
          opening_balance: ledger.opening_balance !== undefined ? Number(ledger.opening_balance) : old.opening_balance,
          current_balance: ledger.current_balance !== undefined ? Number(ledger.current_balance) : old.current_balance
        };
        this._saveDemoData('ledgers', ledgers);
      }
      return { id, ...ledger };
    }
    try {
      const ref = doc(db, 'ledgers', id);
      const snap = await getDoc(ref);
      let companyId = '';
      if (snap.exists()) {
        companyId = snap.data().companyId;
      }
      await updateDoc(ref, ledger);
      if (companyId) {
        this._updateCachedCollection('ledgers', companyId, { id, ...ledger }, 'update');
      }
      return { id, ...ledger };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ledgers/${id}`);
    }
  },

  async deleteLedger(id: string, companyId: string) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const hasTransactions = await this.checkLedgerTransactions(id, companyId);
      if (hasTransactions) {
        throw new Error('Cannot delete ledger with transactions. Please delete all vouchers associated with this ledger first.');
      }
      const ledgers = this._getDemoData('ledgers');
      const filtered = ledgers.filter((l: any) => l.id !== id);
      this._saveDemoData('ledgers', filtered);
      return;
    }
    const hasTransactions = await this.checkLedgerTransactions(id, companyId);
    if (hasTransactions) {
      throw new Error('Cannot delete ledger with transactions. Please delete all vouchers associated with this ledger first.');
    }
    await deleteDoc(doc(db, 'ledgers', id));
    this._updateCachedCollection('ledgers', companyId, { id }, 'delete');
    this.trackQuota(companyId, 0, 0, 1);
  },

  // Items
  async getItemById(id: string): Promise<Item | null> {
    const now = Date.now();
    if (this._singleItemCache[id] && (now - this._singleItemCache[id].timestamp < 300000)) { // 5-minute single item cache TTL
      return this._singleItemCache[id].data;
    }
    try {
      const snap = await getDoc(doc(db, 'items', id));
      if (!snap.exists()) return null;
      const data = { ...(snap.data() as any), id: snap.id } as Item;
      this._singleItemCache[id] = { data, timestamp: now };
      return data;
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
    const now = Date.now();
    if (this._unitsCache[companyId] && (now - this._unitsCache[companyId].timestamp < this._collectionTTL)) {
      return this._unitsCache[companyId].data;
    }

    const units = await this.getCollection('units', companyId);
    if (units.length === 0) {
      const seeded = await this.seedDefaultUnits(companyId);
      this._unitsCache[companyId] = { data: seeded, timestamp: now };
      return seeded;
    }
    this._unitsCache[companyId] = { data: units, timestamp: now };
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
      const data = cleanData({ ...u, id: ref.id, companyId });
      batch.set(ref, data);
      results.push(data);
    }
    await batch.commit();
    return results;
  },

  async getItems(companyId: string, forceRefresh = false): Promise<Item[]> {
    return this.getCollection('items', companyId, 5000, forceRefresh);
  },

  async createItem(companyId: string, item: any) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const items = this._getDemoData('items');
      const isDuplicate = items.some((i: any) => i.name.toLowerCase() === item.name.toLowerCase() && i.companyId === companyId);
      if (isDuplicate) throw new Error(`Stock Item "${item.name}" already exists.`);

      const newItem = {
        ...item,
        id: 'demo_item_' + Date.now() + Math.random().toString(36).substring(2, 7),
        companyId,
        opening_qty: Number(item.opening_qty) || 0,
        opening_rate: Number(item.opening_rate) || 0,
        current_stock: Number(item.opening_qty) || 0,
        avg_cost: Number(item.opening_rate) || 0,
        rate: Number(item.rate) || 0,
        createdAt: new Date().toISOString()
      };
      items.push(newItem);
      this._saveDemoData('items', items);
      return newItem;
    }
    const isDuplicate = await this.checkDuplicate('items', companyId, 'name', item.name);
    if (isDuplicate) throw new Error(`Stock Item "${item.name}" already exists.`);

    const ref = doc(collection(db, 'items'));
    const data = cleanData({
      ...item,
      id: ref.id,
      companyId,
      opening_qty: Number(item.opening_qty) || 0,
      opening_rate: Number(item.opening_rate) || 0,
      current_stock: Number(item.opening_qty) || 0,
      avg_cost: Number(item.opening_rate) || 0
    });
    await setDoc(ref, data);
    this._updateCachedCollection('items', companyId, data, 'add');
    return data;
  },

  async updateItem(id: string, item: any) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const items = this._getDemoData('items');
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index] = {
          ...items[index],
          ...item,
          id,
          opening_qty: item.opening_qty !== undefined ? Number(item.opening_qty) : items[index].opening_qty,
          opening_rate: item.opening_rate !== undefined ? Number(item.opening_rate) : items[index].opening_rate,
          current_stock: item.current_stock !== undefined ? Number(item.current_stock) : items[index].current_stock
        };
        this._saveDemoData('items', items);
      }
      return;
    }
    const itemRef = doc(db, 'items', id);
    const oldSnap = await getDoc(itemRef);
    if (!oldSnap.exists()) {
      await updateDoc(itemRef, item);
      return;
    }
    
    const oldData = oldSnap.data();
    const companyId = oldData.companyId;
    const updates: any = { ...item };
    
    // Ensure numeric values
    if (updates.opening_qty !== undefined) updates.opening_qty = Number(updates.opening_qty) || 0;
    if (updates.opening_rate !== undefined) updates.opening_rate = Number(updates.opening_rate) || 0;

    await updateDoc(itemRef, {
      ...updates,
      updated_at: serverTimestamp(),
      companyId: companyId // Ensure it stays
    });
    if (companyId) {
      this._updateCachedCollection('items', companyId, { id, ...updates }, 'update');
    }
  },

  async deleteItem(id: string, companyId: string) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const hasTransactions = await this.checkItemTransactions(id, companyId);
      if (hasTransactions) {
        throw new Error('Cannot delete item with transactions. Please delete all vouchers associated with this item first.');
      }
      const items = this._getDemoData('items');
      const filtered = items.filter((i: any) => i.id !== id);
      this._saveDemoData('items', filtered);
      return;
    }
    const hasTransactions = await this.checkItemTransactions(id, companyId);
    if (hasTransactions) {
      throw new Error('Cannot delete item with transactions. Please delete all vouchers associated with this item first.');
    }
    await deleteDoc(doc(db, 'items', id));
    this._updateCachedCollection('items', companyId, { id }, 'delete');
    this.trackQuota(companyId, 0, 0, 1);
  },

  // Godowns
  async getGodowns(companyId: string, forceRefresh = false): Promise<any[]> {
    const now = Date.now();
    if (!forceRefresh && this._godownsCache[companyId] && (now - this._godownsCache[companyId].timestamp < this._collectionTTL)) {
      return this._godownsCache[companyId].data;
    }
    const result = await this.getCollection('godowns', companyId, 5000, forceRefresh);
    this._godownsCache[companyId] = { data: result, timestamp: now };
    return result;
  },

  async createGodown(companyId: string, godown: any) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const godowns = this._getDemoData('godowns');
      const isDuplicate = godowns.some((g: any) => g.name.toLowerCase() === godown.name.toLowerCase() && g.companyId === companyId);
      if (isDuplicate) throw new Error(`Godown "${godown.name}" already exists.`);
      return this._demoCreate('godowns', godown);
    }
    this._godownsCache[companyId] = { data: [], timestamp: 0 }; // Invalidate cache
    const isDuplicate = await this.checkDuplicate('godowns', companyId, 'name', godown.name);
    if (isDuplicate) throw new Error(`Godown "${godown.name}" already exists.`);

    const ref = doc(collection(db, 'godowns'));
    const data = cleanData({ ...godown, id: ref.id, companyId });
    await setDoc(ref, data);
    return data;
  },

  async updateGodown(id: string, godown: any) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      return this._demoUpdate('godowns', id, godown);
    }
    const ref = doc(db, 'godowns', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const companyId = snap.data().companyId;
      if (companyId) this._godownsCache[companyId] = { data: [], timestamp: 0 };
    }
    await updateDoc(ref, godown);
  },

  async deleteGodown(id: string) {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      return this._demoDelete('godowns', id);
    }
    const ref = doc(db, 'godowns', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const companyId = snap.data().companyId;
      if (companyId) this._godownsCache[companyId] = { data: [], timestamp: 0 };
    }
    await deleteDoc(ref);
  },

  // Employees
  async getEmployees(companyId: string): Promise<any[]> {
    const now = Date.now();
    if (this._employeesCache[companyId] && (now - this._employeesCache[companyId].timestamp < this._collectionTTL)) {
      return this._employeesCache[companyId].data;
    }
    const result = await this.getCollection('employees', companyId);
    this._employeesCache[companyId] = { data: result, timestamp: now };
    return result;
  },

  async createEmployee(companyId: string, employee: any) {
    this._employeesCache[companyId] = { data: [], timestamp: 0 }; // Invalidate cache
    const isDuplicate = await this.checkDuplicate('employees', companyId, 'name', employee.name);
    if (isDuplicate) throw new Error(`Employee "${employee.name}" already exists.`);

    const ref = doc(collection(db, 'employees'));
    const data = cleanData({ ...employee, id: ref.id, companyId, createdAt: serverTimestamp() });
    await setDoc(ref, data);
    return data;
  },

  async updateEmployee(id: string, employee: any) {
    const ref = doc(db, 'employees', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const companyId = snap.data().companyId;
      if (companyId) this._employeesCache[companyId] = { data: [], timestamp: 0 };
    }
    await updateDoc(ref, { ...employee, updatedAt: serverTimestamp() });
  },

  async deleteEmployee(id: string) {
    const ref = doc(db, 'employees', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const companyId = snap.data().companyId;
      if (companyId) this._employeesCache[companyId] = { data: [], timestamp: 0 };
    }
    await deleteDoc(ref);
  },

  // Salary Sheets
  async getSalarySheets(companyId: string) {
    return this.getCollection('salary_sheets', companyId);
  },

  async createSalarySheet(companyId: string, data: any) {
    const ref = doc(collection(db, 'salary_sheets'));
    const docData = cleanData({ ...data, id: ref.id, companyId, createdAt: serverTimestamp() });
    await setDoc(ref, docData);
    return docData;
  },

  async updateSalarySheet(id: string, data: any) {
    await updateDoc(doc(db, 'salary_sheets', id), { ...data, updatedAt: serverTimestamp() });
  },

  async deleteSalarySheet(id: string) {
    await deleteDoc(doc(db, 'salary_sheets', id));
  },

  // Pay Heads
  async getPayHeads(companyId: string) {
    return this.getCollection('pay_heads', companyId);
  },
  async createPayHead(companyId: string, data: any) {
    const ref = doc(collection(db, 'pay_heads'));
    const docData = cleanData({ ...data, id: ref.id, companyId, createdAt: serverTimestamp() });
    await setDoc(ref, docData);
    return docData;
  },
  async updatePayHead(id: string, data: any) {
    await updateDoc(doc(db, 'pay_heads', id), { ...data, updatedAt: serverTimestamp() });
  },
  async deletePayHead(id: string) {
    await deleteDoc(doc(db, 'pay_heads', id));
  },

  // Salary Structures
  async getSalaryStructures(companyId: string, employeeId?: string) {
    if (employeeId) {
      const q = query(
        collection(db, 'salary_structures'),
        where('companyId', '==', companyId),
        where('employeeId', '==', employeeId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
    }
    return this.getCollection('salary_structures', companyId);
  },
  async createSalaryStructure(companyId: string, data: any) {
    const ref = doc(collection(db, 'salary_structures'));
    const docData = cleanData({ ...data, id: ref.id, companyId, createdAt: serverTimestamp() });
    await setDoc(ref, docData);
    return docData;
  },
  async updateSalaryStructure(id: string, data: any) {
    await updateDoc(doc(db, 'salary_structures', id), { ...data, updatedAt: serverTimestamp() });
  },
  async deleteSalaryStructure(id: string) {
    await deleteDoc(doc(db, 'salary_structures', id));
  },

  // Attendance
  async getAttendance(companyId: string, startDate?: string, endDate?: string) {
    let q = query(collection(db, 'attendance'), where('companyId', '==', companyId));
    if (startDate && endDate) {
      q = query(q, where('date', '>=', startDate), where('date', '<=', endDate));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
  },
  async createAttendance(companyId: string, data: any) {
    const ref = doc(collection(db, 'attendance'));
    const docData = cleanData({ ...data, id: ref.id, companyId, createdAt: serverTimestamp() });
    await setDoc(ref, docData);
    return docData;
  },
  async bulkCreateAttendance(companyId: string, records: any[]) {
    const batch = writeBatch(db);
    records.forEach(r => {
      const ref = doc(collection(db, 'attendance'));
      batch.set(ref, cleanData({ ...r, id: ref.id, companyId, createdAt: serverTimestamp() }));
    });
    await batch.commit();
  },
  async updateAttendance(id: string, data: any) {
    await updateDoc(doc(db, 'attendance', id), { ...data, updatedAt: serverTimestamp() });
  },
  async deleteAttendance(id: string) {
    await deleteDoc(doc(db, 'attendance', id));
  },

  // Advances
  async getAdvances(companyId: string) {
    return this.getCollection('advances', companyId);
  },

  async createAdvance(companyId: string, data: any) {
    const ref = doc(collection(db, 'advances'));
    const docData = cleanData({ ...data, id: ref.id, companyId, createdAt: serverTimestamp() });
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
    const docData = cleanData({ ...data, id: ref.id, companyId, createdAt: serverTimestamp() });
    await setDoc(ref, docData);
    return docData;
  },

  async updateLoan(id: string, data: any) {
    await updateDoc(doc(db, 'loans', id), { ...data, updatedAt: serverTimestamp() });
  },

  async deleteLoan(id: string) {
    await deleteDoc(doc(db, 'loans', id));
  },

  async getItemStats(itemId: string, companyId: string) {
    const cacheKey = `${companyId}_${itemId}`;
    const now = Date.now();
    if (this._itemStatsCache[cacheKey] && (now - this._itemStatsCache[cacheKey].timestamp < 3600000)) {
      return this._itemStatsCache[cacheKey].data;
    }
    try {
      const item = await this.getItemById(itemId);
      if (!item) return null;

      const entriesRef = collection(db, 'inventory_entries');
      const q = query(
        entriesRef,
        where('item_id', '==', itemId),
        where('companyId', '==', companyId)
      );
      
      const snap = await getDocs(q);
      const sortedEntries = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }))
        .sort((a, b) => {
          const dateComp = (a.date || '').localeCompare(b.date || '');
          if (dateComp !== 0) return dateComp;
          return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
        });
      
      let currentStock = (item.opening_qty || 0);
      let totalInward = 0;
      let totalOutward = 0;

      for (const e of sortedEntries) {
        const qty = (Number(e.qty) || 0) + (Number(e.free_qty) || 0);
        const mType = getMovementType(e);
        
        if (e.v_type?.toLowerCase() === 'physical stock') {
          currentStock = (Number(e.qty) || 0);
          const adj = (e.adjustment_qty !== undefined) ? Number(e.adjustment_qty) : (currentStock - (currentStock - qty)); // approximated if missing
          if (adj > 0) totalInward += adj;
          else if (adj < 0) totalOutward += Math.abs(adj);
        } else if (mType === 'inward') {
          currentStock += qty;
          totalInward += qty;
        } else {
          currentStock -= qty;
          totalOutward += qty;
        }
      }
      
      const result = {
        currentStock,
        totalInward,
        totalOutward,
        lastRate: sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].rate : item.opening_rate
      };
      this._itemStatsCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error fetching item stats:', error);
      return null;
    }
  },

  // Queue for recalculation to prevent rapid redundant reads
    _recalcQueue: new Set<string>(),
    _isProcessingQueue: false,

    async recalculateItemStats(itemId: string, companyId?: string, itemData?: any) {
      if (!itemId) return;
      
      // Add to queue and wait for processing or process immediately if not too frequent
      const queueKey = `${itemId}:${companyId}`;
      this._recalcQueue.add(queueKey);
      
      if (this._isProcessingQueue) return;
      
      this._isProcessingQueue = true;
      // Small delay to coalesce multiple updates (e.g. from a voucher with many items)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const itemsToProcess = Array.from(this._recalcQueue) as string[];
        this._recalcQueue.clear();
        
        for (const key of itemsToProcess) {
          const [id, cId] = key.split(':');
          await this._executeRecalculateItemStats(id, cId, key === queueKey ? itemData : undefined);
        }
      } finally {
        this._isProcessingQueue = false;
      }
    },

    async _executeRecalculateItemStats(itemId: string, companyId?: string, itemData?: any) {
      try {
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
      const entries = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }))
        .sort((a, b) => {
          const d_a = parseEntryDate(a.date, a.created_at);
          const d_b = parseEntryDate(b.date, b.created_at);
          if (d_a.getTime() !== d_b.getTime()) return d_a.getTime() - d_b.getTime();
          return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
        });
      
      let stock = Number(effectiveItemData.opening_qty) || 0;
      let totalValue = stock * (Number(effectiveItemData.opening_rate) || 0);
      let totalQty = stock;

      // Track godown balances during recalculation if we want perfectly accurate global physical stock handling
      const godownBalances: Record<string, number> = {};
      (effectiveItemData.opening_godowns || []).forEach((ag: any) => {
        godownBalances[ag.godown_id] = Number(ag.qty) || 0;
      });

      for (const e of entries) {
        const vType = e.v_type;
        const mType = getMovementType(e);
        const qty = Number(e.qty) || 0;
        const freeQty = Number(e.free_qty) || 0;
        const rate = Number(e.rate) || 0;
        const totalEntryQty = qty + freeQty;
        const godownId = e.godown_id;

        if (vType?.toLowerCase() === 'physical stock') {
          if (!godownId) {
            stock = qty;
            totalQty = stock;
          } else {
            const oldGodownStock = godownBalances[godownId] || 0;
            const adjustment = qty - oldGodownStock;
            stock += adjustment;
            godownBalances[godownId] = qty;
            totalQty += adjustment;
          }
        } else if (mType === 'inward') {
          stock += totalEntryQty;
          totalValue += (qty * rate);
          totalQty += totalEntryQty; // Included free_qty in totalQty for weighted average cost calculation
          if (godownId) godownBalances[godownId] = (godownBalances[godownId] || 0) + totalEntryQty;
        } else {
          stock -= totalEntryQty;
          if (godownId) godownBalances[godownId] = (godownBalances[godownId] || 0) - totalEntryQty;
        }
      }
      
      const avgCost = totalQty > 0 ? totalValue / totalQty : (Number(effectiveItemData.opening_rate) || 0);

      await updateDoc(itemRef, { 
        current_stock: stock,
        avg_cost: avgCost,
        companyId: effectiveCompanyId // Ensure companyId field persists
      });
    } catch (error) {
      console.error('Error recalculating item stats:', error);
    }
  },

  async getVoucherEntriesByDate(companyId: string, asOnDate: string): Promise<any[]> {
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId)
    );
    const vouchersSnap = await getDocs(vouchersQuery);
    const targetDate = parseEntryDate(asOnDate, null);

    const filteredVouchers = vouchersSnap.docs.filter(d => {
      const vDate = parseEntryDate(d.data().v_date, d.data().createdAt);
      return vDate <= targetDate;
    });

    const voucherIds = filteredVouchers.map(d => d.id);
    
    if (voucherIds.length === 0) return [];
    
    const entriesQuery = query(
      collection(db, 'voucher_entries'),
      where('companyId', '==', companyId)
    );
    const entriesSnap = await getDocs(entriesQuery);
    
    return entriesSnap.docs
      .map(d => ({ ...(d.data() as any), id: d.id }))
      .filter(e => voucherIds.includes(e.voucher_id))
      .map(e => ({
        ...e,
        v_date: vouchersSnap.docs.find(v => v.id === e.voucher_id)?.data()?.v_date
      }));
  },

  async getVoucherEntriesByDateRange(companyId: string, startDate: string, endDate: string) {
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('companyId', '==', companyId),
      where('v_date', '>=', startDate),
      where('v_date', '<=', endDate)
    );
    const vouchersSnap = await getDocs(vouchersQuery);
    const voucherIds = vouchersSnap.docs.map(d => d.id);
    
    if (voucherIds.length === 0) return [];
    
    const entriesQuery = query(
      collection(db, 'voucher_entries'),
      where('companyId', '==', companyId)
    );
    const entriesSnap = await getDocs(entriesQuery);
    
    return entriesSnap.docs
      .map(d => ({ ...(d.data() as any), id: d.id }))
      .filter(e => voucherIds.includes(e.voucher_id))
      .map(e => ({
        ...e,
        v_date: vouchersSnap.docs.find(v => v.id === e.voucher_id)?.data()?.v_date
      }));
  },

  async getInventoryEntriesGrouped(companyId: string): Promise<any[]> {
    const q = query(collection(db, 'inventory_entries'), where('companyId', '==', companyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
  },

  async getInventoryEntriesByDate(companyId: string, startDate: string, endDate: string): Promise<any[]> {
    // We widen the query to be string-format agnostic and filter in JS for absolute correctness
    // while the database is being migrated to YYYY-MM-DD
    const q = query(
      collection(db, 'inventory_entries'),
      where('companyId', '==', companyId)
    );
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'inventory_entries');
      return [];
    }
  },

  async getLedgerMovementBeforeDate(companyId: string, ledgerId: string, date: string): Promise<number> {
    const cacheKey = `${companyId}_${ledgerId}_${date}`;
    const now = Date.now();
    if (this._ledgerMovementBeforeDateCache[cacheKey] && (now - this._ledgerMovementBeforeDateCache[cacheKey].timestamp < 3600000)) {
      return this._ledgerMovementBeforeDateCache[cacheKey].data;
    }
    try {
      // Use only equality filters that are more likely to have indexes
      const q = query(
        collection(db, 'voucher_entries'),
        where('companyId', '==', companyId),
        where('ledger_id', '==', ledgerId)
      );
      const snap = await getDocs(q);
      let movement = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        // Filter by date in memory to avoid needing a complex composite index (companyId, ledger_id, date)
        if (data.date && data.date < date) {
          movement += (data.debit || 0) - (data.credit || 0);
        }
      });
      const result = movement;
      this._ledgerMovementBeforeDateCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error calculating movement before date:', error);
      return 0;
    }
  },

  async getVoucherWithEntries(companyId: string, ledgerId: string, startDate: string, endDate: string): Promise<any[]> {
    const cacheKey = `${companyId}_${ledgerId}_${startDate}_${endDate}`;
    const now = Date.now();
    if (this._voucherWithEntriesCache[cacheKey] && (now - this._voucherWithEntriesCache[cacheKey].timestamp < 3600000)) {
      return this._voucherWithEntriesCache[cacheKey].data;
    }

    const [vouchersSnap, serialMap] = await Promise.all([
      getDocs(query(
        collection(db, 'vouchers'),
        where('companyId', '==', companyId),
        where('v_date', '>=', startDate),
        where('v_date', '<=', endDate)
      )),
      this.getVoucherSerials(companyId)
    ]);
    const vouchers = vouchersSnap.docs.map(d => {
      const data = d.data() as any;
      const dynamicSerial = serialMap[d.id];
      return { 
        ...data,
        id: d.id, 
        serial_no: dynamicSerial || data.serial_no || data.auto_serial_no || 0
      };
    });
    
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
      allEntries.push(...eSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      allInvEntries.push(...iSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    }
    
    // Filter vouchers that have an entry for the specific ledger
    const filteredVouchers = vouchers.filter((v: any) => 
      allEntries.some((e: any) => e.voucher_id === v.id && e.ledger_id === ledgerId)
    );
    
    // Map them together
    const result = filteredVouchers.map((v: any) => ({
      ...v,
      voucher_entries: allEntries.filter((e: any) => e.voucher_id === v.id),
      inventory: allInvEntries.filter((i: any) => i.voucher_id === v.id)
    })).sort((a, b) => {
      const dateComp = (a.v_date || '').localeCompare(b.v_date || '');
      if (dateComp !== 0) return dateComp;
      
      const vTypeComp = (a.v_type || '').localeCompare(b.v_type || '');
      if (vTypeComp !== 0) return vTypeComp;

      const numA = parseInt(a.v_no?.replace(/\D/g, '') || '0') || 0;
      const numB = parseInt(b.v_no?.replace(/\D/g, '') || '0') || 0;
      if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

      const vNoComp = (a.v_no || '').localeCompare(b.v_no || '', undefined, { numeric: true });
      if (vNoComp !== 0) return vNoComp;

      const serialA = a.serial_no || a.auto_serial_no || 0;
      const serialB = b.serial_no || b.auto_serial_no || 0;
      return serialA - serialB;
    });

    this._voucherWithEntriesCache[cacheKey] = { data: result, timestamp: now };
    return result;
  },

  // Dashboard Stats
  async getDashboardStats(companyId: string, fromDate?: string, toDate?: string, forceRefresh = false) {
    const cacheKey = `${companyId}_${fromDate}_${toDate}`;
    const now = Date.now();
    
    // Increased cache TTL for dashboard stats to 30 minutes to save reads
    const DASHBOARD_TTL = 1800000; 
    
    if (!forceRefresh && this._dashboardStatsCache[cacheKey] && (now - this._dashboardStatsCache[cacheKey].timestamp < DASHBOARD_TTL)) {
      return this._dashboardStatsCache[cacheKey].data;
    }

    try {
      let q;
      // Optimization: For free quota saving, we limit the documents fetched severely
      // Large companies should move to a summarized document
      if (fromDate && toDate) {
        q = query(
          collection(db, 'vouchers'), 
          where('companyId', '==', companyId),
          where('v_date', '>=', fromDate),
          where('v_date', '<=', toDate),
          limit(300) // Lowered cap to save reads on broad ranges
        );
      } else {
        q = query(
          collection(db, 'vouchers'), 
          where('companyId', '==', companyId),
          orderBy('v_date', 'desc'),
          limit(200) // Lowered limit for dashboard
        );
      }

      // We use getDocs instead of onSnapshot for dashboard to save persistent read cost
      const [vouchersSnap, items, ledgers] = await Promise.all([
        getDocs(q),
        this.getItems(companyId, forceRefresh),
        this.getLedgers(companyId, forceRefresh)
      ]);

      const vDocs = vouchersSnap.docs.map(d => d.data());
      
      const stats = {
        sales: vDocs.filter((v: any) => v.v_type === 'Sales').reduce((sum: number, v: any) => sum + (v.total_amount || 0), 0),
        purchase: vDocs.filter((v: any) => v.v_type === 'Purchase').reduce((sum: number, v: any) => sum + (v.total_amount || 0), 0),
        payment: vDocs.filter((v: any) => v.v_type === 'Payment').reduce((sum: number, v: any) => sum + (v.total_amount || 0), 0),
        receipt: vDocs.filter((v: any) => v.v_type === 'Receipt').reduce((sum: number, v: any) => sum + (v.total_amount || 0), 0),
        stockValue: items.reduce((sum: number, i: any) => sum + ((Number(i.current_stock) || 0) * (Number(i.avg_cost || i.purchase_price) || 0)), 0),
        revenue: 0, 
        profit: 0,
        activeLedgers: ledgers.length,
        chartData: [] as any[]
      };

      stats.revenue = Number(stats.sales) || 0;
      stats.profit = (Number(stats.sales) || 0) - (Number(stats.purchase) || 0);

      // Generate dynamic months based on range or default to 12 months
      let chartData: any[] = [];
      if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const curr = new Date(start.getFullYear(), start.getMonth(), 1);
        
        while (curr <= end) {
          chartData.push({
            name: curr.toLocaleString('default', { month: 'short' }),
            month: curr.getMonth(),
            year: curr.getFullYear(),
            value: 0,
            expense: 0,
            profit: 0
          });
          curr.setMonth(curr.getMonth() + 1);
        }
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        chartData = months.map((m, i) => ({ name: m, month: i, year: new Date().getFullYear(), value: 0, expense: 0, profit: 0 }));
      }
      
      vDocs.forEach((v: any) => {
        const dateString = v.v_date;
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const monthData = chartData.find(d => d.month === month && d.year === year);
          if (monthData) {
            if (v.v_type === 'Sales') monthData.value += (Number(v.total_amount) || 0);
            if (v.v_type === 'Purchase') monthData.expense += (Number(v.total_amount) || 0);
            monthData.profit = (Number(monthData.value) || 0) - (Number(monthData.expense) || 0);
          }
        }
      });

      stats.chartData = chartData;

      // Save to cache
      this._dashboardStatsCache[cacheKey] = {
        data: stats,
        timestamp: now
      };

      return stats;
    } catch (err) {
      console.error('Error getting dashboard stats:', err);
      return { revenue: 0, profit: 0, sales: 0, purchase: 0, payment: 0, receipt: 0, activeLedgers: 0, stockValue: 0, chartData: [] };
    }
  },

  _recentVouchersCache: {} as Record<string, { data: any[], timestamp: number }>,

  async getRecentVouchers(companyId: string, limitCount = 5): Promise<any[]> {
    const cacheKey = `${companyId}_${limitCount}`;
    const now = Date.now();
    
    if (this._recentVouchersCache[cacheKey] && (now - this._recentVouchersCache[cacheKey].timestamp < 600000)) { // 10 minutes TTL (increased from 30s)
      return this._recentVouchersCache[cacheKey].data;
    }

    try {
      const q = query(
        collection(db, 'vouchers'), 
        where('companyId', '==', companyId),
        orderBy('v_date', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const vouchers = snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
      
      if (vouchers.length === 0) return [];

      const vIds = vouchers.map(v => v.id);
      const allInv: any[] = [];
      
      // Only fetch inventory for these specific vouchers
      for (let i = 0; i < vIds.length; i += 30) {
        const chunk = vIds.slice(i, i + 30);
        const invSnap = await getDocs(query(
          collection(db, 'inventory_entries'), 
          where('companyId', '==', companyId),
          where('voucher_id', 'in', chunk)
        ));
        allInv.push(...invSnap.docs.map(d => ({ ...(d.data() as any), id: d.id })));
      }

      const result = vouchers.map(v => {
        const voucherInv = allInv.filter((i: any) => i.voucher_id === v.id);
        return {
          ...v,
          inventory: voucherInv,
          item_names: (v as any).item_names || voucherInv.map((i: any) => i.item_name).filter(Boolean).join(', ')
        };
      });

      this._recentVouchersCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'recent_vouchers');
      return [];
    }
  },

  async getVouchersByDateRange(companyId: string, startDate: string, endDate: string): Promise<any[]> {
    const cacheKey = `${companyId}_${startDate}_${endDate}`;
    const now = Date.now();
    if (this._vouchersByDateRangeCache[cacheKey]) {
      return this._vouchersByDateRangeCache[cacheKey].data;
    }
    try {
      let vouchers: any[] = [];
      let allEntries: any[] = [];
      let allInventory: any[] = [];
      let serialMap: any = {};

      try {
        const [vSnap, eSnap, iSnap, sMap] = await Promise.all([
          getDocs(query(
            collection(db, 'vouchers'),
            where('companyId', '==', companyId),
            where('v_date', '>=', startDate),
            where('v_date', '<=', endDate)
          )),
          getDocs(query(
            collection(db, 'voucher_entries'),
            where('companyId', '==', companyId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
          )),
          getDocs(query(
            collection(db, 'inventory_entries'),
            where('companyId', '==', companyId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
          )),
          this.getVoucherSerials(companyId)
        ]);
        vouchers = vSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        allEntries = eSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        allInventory = iSnap.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
        serialMap = sMap;
        this.trackQuota(companyId, vSnap.size + eSnap.size + iSnap.size, 0);
      } catch (rangeErr) {
        console.warn('Targeted range query in getVouchersByDateRange failed, falling back:', rangeErr);
        const [vCollection, eCollection, iCollection, sMap] = await Promise.all([
          this.getCollection('vouchers', companyId),
          this.getCollection('voucher_entries', companyId),
          this.getCollection('inventory_entries', companyId),
          this.getVoucherSerials(companyId)
        ]);
        vouchers = vCollection.filter((v: any) => v.v_date >= startDate && v.v_date <= endDate);
        allEntries = eCollection;
        allInventory = iCollection;
        serialMap = sMap;
      }

      const result = vouchers.map((v: any) => {
        const dynamicSerial = serialMap[v.id];
        return {
          ...v,
          serial_no: dynamicSerial || v.serial_no || v.auto_serial_no || 0,
          entries: allEntries.filter((e: any) => e.voucher_id === v.id),
          inventory: allInventory.filter((i: any) => i.voucher_id === v.id)
        };
      }).sort((a: any, b: any) => {
        const dateComp = (a.v_date || '').localeCompare(b.v_date || '');
        if (dateComp !== 0) return dateComp;
        
        const numA = parseInt(a.v_no?.replace(/\D/g, '') || '0') || 0;
        const numB = parseInt(b.v_no?.replace(/\D/g, '') || '0') || 0;
        if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

        const vNoComp = (a.v_no || '').localeCompare(b.v_no || '');
        if (vNoComp !== 0) return vNoComp;

        const serialA = a.serial_no || a.auto_serial_no || 0;
        const serialB = b.serial_no || b.auto_serial_no || 0;
        if (serialA !== serialB) return serialA - serialB;

        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        if (timeA !== timeB) return timeA - timeB;

        return a.id.localeCompare(b.id);
      });

      this._vouchersByDateRangeCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error in getVouchersByDateRange:', error);
      return [];
    }
  },

  async getVouchersDetailedByDateRange(companyId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const vouchers = await this.getVouchersByDateRange(companyId, startDate, endDate);
      return vouchers; // getVouchersByDateRange already fetches entries and inventory now
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vouchers');
      return [];
    }
  },

  async getUsers(companyId: string): Promise<any[]> {
    const q = query(collection(db, 'users'), where('companyId', '==', companyId), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as any) }));
  },

  async getAllUsers(): Promise<any[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), limit(500)));
      return snapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as any) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  async getAllCompanies(): Promise<any[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'companies'), limit(200)));
      return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'companies');
      return [];
    }
  },

  async getActivityLogs(companyId?: string, limitCount = 50): Promise<any[]> {
    try {
      let q;
      if (companyId) {
        q = query(collection(db, 'activity_log'), where('companyId', '==', companyId), orderBy('createdAt', 'desc'), limit(limitCount));
      } else {
        q = query(collection(db, 'activity_log'), orderBy('createdAt', 'desc'), limit(limitCount));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'activity_log');
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
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
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
      await setDoc(doc(db, 'users', uid), cleanData({
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        companyId: data.companyId,
        target_amount: data.target_amount || 0,
        createdAt: serverTimestamp(),
      }));

      // Sign out from the secondary instance immediately
      await signOut(secondaryAuth);

      return { uid };
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Error in adminAddUser:', error);

      // Map Firebase Auth errors to user-friendly messages
      if (error.code === 'auth/email-already-in-use' || 
          error.message?.includes('auth/email-already-in-use') ||
          error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('This email address is already in use by another account.');
      }

      if (error.code === 'auth/invalid-email' || error.message?.includes('auth/invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }

      if (error.code === 'auth/weak-password' || error.message?.includes('auth/weak-password')) {
        throw new Error('The password is too weak. Please use at least 6 characters.');
      }

      // Handle Firestore permission errors
      if (error.code === 'permission-denied' || 
          error.message?.toLowerCase().includes('permission') || 
          error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }

      // Generic fallback
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
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
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
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    let lastNo = '';
    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        lastNo = snapshot.docs[0].data().v_no || '';
      }
    } catch (err) {
      console.warn('getNextVoucherNumber strict query failed, trying fallback:', err);
      const qBroad = query(
        collection(db, 'vouchers'),
        where('companyId', '==', companyId),
        orderBy('v_date', 'desc'),
        limit(200)
      );
      const broadSnap = await getDocs(qBroad);
      const matchingDoc = broadSnap.docs.find(d => d.data().v_type === type);
      if (matchingDoc) {
        lastNo = matchingDoc.data().v_no || '';
      }
    }
    
    const year = new Date().getFullYear();
    const prefix = type.substring(0, 3).toUpperCase();
    const defaultFormat = '{PREFIX}/{YEAR}/{NO}';
    const activeFormat = format || defaultFormat;

    if (!lastNo) {
      return activeFormat
        .replace('{PREFIX}', prefix)
        .replace('{YEAR}', String(year))
        .replace('{NO}', '001');
    }

    // Try to extract the number part.
    const match = lastNo.match(/(\d+)(?!.*\d)/);
    const lastNum = match ? parseInt(match[0]) : 0;
    const nextNum = String(lastNum + 1).padStart(3, '0');

    return activeFormat
      .replace('{PREFIX}', prefix)
      .replace('{YEAR}', String(year))
      .replace('{NO}', nextNum);
  },

  async getLedgerBalance(ledgerId: string, companyId: string): Promise<number> {
    if (localStorage.getItem('erp_is_demo_mode') === 'true') {
      const ledgers = this._getDemoData('ledgers');
      const ledger = ledgers.find((l: any) => l.id === ledgerId);
      return ledger ? (Number(ledger.current_balance) !== undefined ? Number(ledger.current_balance) : Number(ledger.opening_balance) || 0) : 0;
    }
    const cacheKey = `${companyId}_${ledgerId}`;
    const now = Date.now();
    if (this._ledgerBalanceCache[cacheKey] && (now - this._ledgerBalanceCache[cacheKey].timestamp < this._collectionTTL)) {
      return this._ledgerBalanceCache[cacheKey].data;
    }
    try {
      let ledger: any = null;
      if (companyId && this._ledgersCache[companyId]?.data?.length > 0) {
        ledger = this._ledgersCache[companyId].data.find((l: any) => l.id === ledgerId);
      }

      if (ledger) {
        const bal = ledger.current_balance !== undefined ? ledger.current_balance : (ledger.opening_balance || 0);
        this._ledgerBalanceCache[cacheKey] = { data: bal, timestamp: now };
        return bal;
      }

      // Fetch the single ledger document instead of querying voucher_entries
      const lSnap = await getDoc(doc(db, 'ledgers', ledgerId));
      this.trackQuota(companyId, 1, 0);

      if (lSnap.exists()) {
        const lData = lSnap.data();
        const bal = lData.current_balance !== undefined ? lData.current_balance : (lData.opening_balance || 0);
        this._ledgerBalanceCache[cacheKey] = { data: bal, timestamp: now };
        return bal;
      }

      return 0;
    } catch (err) {
      console.error('Error getting ledger balance:', err);
      return 0;
    }
  },

  // Company Management
  async createCompany(userId: string, companyData: any) {
    try {
      const ref = doc(collection(db, 'companies'));
      const data = cleanData({
        ...companyData,
        id: ref.id,
        createdBy: userId,
        ownerId: userId,
        createdAt: serverTimestamp(),
        isAccessEnabled: true,
        subscriptionStatus: 'Trial',
        plan: 'Standard',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 days trial
      });
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
      if (companyId === 'placeholder') return { ...data, id: companyId };
      
      const ref = doc(db, 'companies', companyId);
      await setDoc(ref, cleanData({
        ...data,
        updatedAt: serverTimestamp()
      }), { merge: true });
      return { ...data, id: companyId };
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
        companiesMap.set(doc.id, { ...(doc.data() as any), id: doc.id });
      });
      
      snapCreator.docs.forEach(doc => {
        if (!companiesMap.has(doc.id)) {
          companiesMap.set(doc.id, { ...(doc.data() as any), id: doc.id });
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
      await setDoc(ref, cleanData({ ...settings, companyId }), { merge: true });

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
          await setDoc(companyRef, cleanData(companyUpdates), { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${companyId}`);
    }
  },

  async getRolePermissions(companyId: string): Promise<Record<string, string[]> | null> {
    try {
      if (!companyId) return null;
      const ref = doc(db, 'settings', companyId, 'config', 'role_permissions');
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() as Record<string, string[]> : null;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return null;
    }
  },

  async updateRolePermissions(companyId: string, permissions: Record<string, string[]>) {
    try {
      if (!companyId) return;
      const ref = doc(db, 'settings', companyId, 'config', 'role_permissions');
      await setDoc(ref, cleanData({ ...permissions, updatedAt: serverTimestamp() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${companyId}/config/role_permissions`);
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
      await setDoc(doc(db, 'system', 'config'), cleanData(config), { merge: true });
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
            createdAt: ensureDate(data.createdAt),
            scheduledAt: data.scheduledAt ? ensureDate(data.scheduledAt) : undefined,
            sentAt: data.sentAt ? ensureDate(data.sentAt) : undefined
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
            createdAt: ensureDate(data.createdAt),
            scheduledAt: data.scheduledAt ? ensureDate(data.scheduledAt) : undefined,
            sentAt: data.sentAt ? ensureDate(data.sentAt) : undefined
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
            createdAt: ensureDate(data.createdAt),
            scheduledAt: data.scheduledAt ? ensureDate(data.scheduledAt) : undefined,
            sentAt: data.sentAt ? ensureDate(data.sentAt) : undefined
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
      const data = cleanData({
        ...notification,
        id: ref.id,
        createdAt: serverTimestamp(),
        status: notification.status || 'draft'
      });
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
        return { ...(doc.data() as any), id: doc.id } as unknown as PrintingOrder;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async createOrder(order: Partial<PrintingOrder>) {
    try {
      const ref = doc(collection(db, 'orders'));
      const data = cleanData({
        ...order,
        id: ref.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: order.status || 'Pending',
        isConvertedToFinishGoods: false,
        isConvertedToSalesVoucher: false
      });
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
          
          batch.set(newRef, cleanData({
            id: newRef.id,
            companyId,
            name: finishGoodName,
            unit_name: rawItemData?.unit_name || 'Pcs',
            unit_id: rawItemData?.unit_id || '',
            current_stock: item.quantity,
            avg_cost: rawItemData?.avg_cost || 0,
            category: 'Finish Goods',
            createdAt: serverTimestamp()
          }));
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
      return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as unknown as PrintingMachine));
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
      return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as unknown as PrintingOrder));
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
    if (!companyId) return [];
    const now = Date.now();
    if (this._usersCache[companyId] && (now - this._usersCache[companyId].timestamp < this._collectionTTL)) {
      return this._usersCache[companyId].data;
    }

    try {
      const q = query(collection(db, 'users'), where('companyId', '==', companyId), limit(500));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      this._usersCache[companyId] = { data, timestamp: now };
      return data;
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
      return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as SubscriptionPlan));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'subscription_plans');
      return [];
    }
  },

  // Menu Configuration
  _menuConfigCache: null as MenuConfig | null,
  async getMenuConfig(forceRefresh = false): Promise<MenuConfig | null> {
    if (this._menuConfigCache && !forceRefresh) return this._menuConfigCache;
    
    // Check localStorage first
    try {
      const persisted = localStorage.getItem('swr_system_menu');
      if (persisted && !this._menuConfigCache) {
        this._menuConfigCache = deduplicateMenuConfig(JSON.parse(persisted));
      }
    } catch (e) {}

    try {
      const menuDoc = await getDoc(doc(db, 'system', 'menu'));
      if (menuDoc.exists()) {
        const data = menuDoc.data() as MenuConfig;
        const cleaned = deduplicateMenuConfig(data);
        this._menuConfigCache = cleaned;
        try {
          localStorage.setItem('swr_system_menu', JSON.stringify(cleaned));
        } catch (e) {}
        return cleaned;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'system/menu');
    }
    return this._menuConfigCache;
  },

  async updateMenuConfig(config: MenuConfig): Promise<void> {
    try {
      const cleaned = deduplicateMenuConfig(config);
      this._menuConfigCache = cleaned;
      try {
        localStorage.setItem('swr_system_menu', JSON.stringify(cleaned));
      } catch (e) {}
      const cleanedConfig = cleanData(cleaned);
      await setDoc(doc(db, 'system', 'menu'), {
        ...cleanedConfig,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system/menu');
    }
  },

  subscribeToMenuConfig(callback: (config: MenuConfig | null) => void) {
    // 1. Immediately invoke with the memory or localStorage cache to prevent visual flashing
    let cache: MenuConfig | null = this._menuConfigCache;
    if (!cache) {
      try {
        const persisted = localStorage.getItem('swr_system_menu');
        if (persisted) {
          cache = deduplicateMenuConfig(JSON.parse(persisted));
          this._menuConfigCache = cache;
        }
      } catch (e) {}
    }

    if (cache) {
      callback(cache);
    }

    // 2. Fetch fresh config in the background and trigger callback if changed/loaded
    this.getMenuConfig(true).then((fresh) => {
      if (fresh) {
        callback(fresh);
      }
    });

    return () => {};
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
      return { ...(planDoc.data() as any), id: planDoc.id } as SubscriptionPlan;
    } catch (error) {
      console.error('Error fetching company subscription:', error);
      return null;
    }
  },

  async getCollectionCount(colName: string, companyId: string): Promise<number> {
    if (!companyId) return 0;

    // Fast cache-hit bypass: check if we have the collection cached in-memory
    let cachedLength: number | null = null;
    if (colName === 'ledgers' && this._ledgersCache[companyId]) cachedLength = this._ledgersCache[companyId].data.length;
    else if (colName === 'items' && this._itemsCache[companyId]) cachedLength = this._itemsCache[companyId].data.length;
    else if (colName === 'godowns' && this._godownsCache[companyId]) cachedLength = this._godownsCache[companyId].data.length;
    else if (colName === 'employees' && this._employeesCache[companyId]) cachedLength = this._employeesCache[companyId].data.length;
    else if (colName === 'units' && this._unitsCache[companyId]) cachedLength = this._unitsCache[companyId].data.length;
    else if (colName === 'ledger_groups' && this._ledgerGroupsCache[companyId]) cachedLength = this._ledgerGroupsCache[companyId].data.length;
    else if (colName === 'voucher_types' && this._voucherTypesCache[companyId]) cachedLength = this._voucherTypesCache[companyId].data.length;
    else if (colName === 'stock_groups' && this._stockGroupsCache[companyId]) cachedLength = this._stockGroupsCache[companyId].data.length;
    else if (colName === 'stock_categories' && this._stockCategoriesCache[companyId]) cachedLength = this._stockCategoriesCache[companyId].data.length;
    
    if (cachedLength !== null) {
      return cachedLength;
    }

    try {
      const q = query(collection(db, colName), where('companyId', '==', companyId));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.warn(`Error getting server count for ${colName}:`, error);
      // Fallback: If quota has been exceeded or database is offline, catch silently and return 0
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
      return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
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
  },
  // Cache for search results to save quota
  _searchVouchersCache: { companyId: '', data: [] as any[], timestamp: 0 },

  async searchCompanyData(companyId: string, searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2 || !companyId) return [];
    const lowerSearch = searchTerm.toLowerCase();
    
    // 1. Search Ledgers
    const ledgerResults = await (async () => {
      try {
        const ledgers = await this.getLedgers(companyId);
        return ledgers
          .filter(l => 
            l.name.toLowerCase().includes(lowerSearch) || 
            l.alias?.toLowerCase().includes(lowerSearch) ||
            (l as any).ledger_groups?.name?.toLowerCase().includes(lowerSearch)
          )
          .map(l => ({
            id: l.id,
            title: l.name,
            subtitle: `Ledger • ${(l as any).ledger_groups?.name || 'Group'}`,
            type: 'ledger' as const,
            category: 'Masters',
            metadata: l
          }));
      } catch (e) {
        console.error('Search Ledgers error:', e);
        return [];
      }
    })();

    // 2. Search Items
    const itemResults = await (async () => {
      try {
        const items = await this.getItems(companyId);
        return items
          .filter(i => 
            i.name.toLowerCase().includes(lowerSearch) || 
            i.part_no?.toLowerCase().includes(lowerSearch) || 
            i.barcode?.toLowerCase().includes(lowerSearch) ||
            i.description?.toLowerCase().includes(lowerSearch)
          )
          .map(i => ({
            id: i.id,
            title: i.name,
            subtitle: `Stock Item • ${i.part_no || 'No Part No'}`,
            type: 'item' as const,
            category: 'Masters',
            metadata: i
          }));
      } catch (e) {
        console.error('Search Items error:', e);
        return [];
      }
    })();

    // 3. Search Employees
    const employeeResults = await (async () => {
      try {
        const employees = await this.getEmployees(companyId);
        return employees
          .filter(e => 
            e.name.toLowerCase().includes(lowerSearch) || 
            e.employee_id?.toLowerCase().includes(lowerSearch) ||
            e.mobile?.toLowerCase().includes(lowerSearch)
          )
          .map(e => ({
            id: e.id,
            title: e.name,
            subtitle: `Employee • ${e.employee_id || 'No ID'}`,
            type: 'employee' as const,
            category: 'Masters',
            metadata: e
          }));
      } catch (e) {
        console.error('Search Employees error:', e);
        return [];
      }
    })();

    // 4. Search Vouchers (Optimized with 5-minute session cache)
    const voucherResults = await (async () => {
      try {
        const now = Date.now();
        let vouchers = [];
        
        // Use cache if same company and less than 5 minutes old
        if (this._searchVouchersCache.companyId === companyId && 
            (now - this._searchVouchersCache.timestamp < 300000)) {
          vouchers = this._searchVouchersCache.data;
        } else {
          const vSnap = await getDocs(query(
            collection(db, 'vouchers'),
            where('companyId', '==', companyId),
            orderBy('v_date', 'desc'),
            limit(400)
          ));
          vouchers = vSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
          this._searchVouchersCache = {
            companyId,
            data: vouchers,
            timestamp: now
          };
        }
        
        return vouchers
          .filter(v => 
            (v.v_no || '').toLowerCase().includes(lowerSearch) ||
            (v.reference_no || '').toLowerCase().includes(lowerSearch) ||
            (v.narration || '').toLowerCase().includes(lowerSearch) ||
            (v.v_type || '').toLowerCase().includes(lowerSearch) ||
            (v.party_name || '').toLowerCase().includes(lowerSearch) ||
            (v.entries || []).some((e: any) => (e.ledger_name || '').toLowerCase().includes(lowerSearch))
          )
          .map(v => ({
            id: v.id,
            title: `${v.v_type} - ${v.v_no}`,
            subtitle: `Voucher • ${v.v_date} • ${v.narration?.substring(0, 50) || 'No narration'}`,
            type: 'voucher' as const,
            category: 'Transactions',
            metadata: v
          }));
      } catch (e) {
        console.error('Search Vouchers error:', e);
        return [];
      }
    })();

    return [...ledgerResults, ...itemResults, ...employeeResults, ...voucherResults];
  },

  async updateFeaturesConfig(categories: FeatureCategory[]): Promise<void> {
    try {
      const cleanedData = cleanData({ categories });
      await setDoc(doc(db, 'system', 'features'), {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system/features');
    }
  },

  // --- TAX & VAT ---
  getTaxRates: async function(companyId: string): Promise<TaxRate[]> {
    return this.getCollection('tax_rates', companyId);
  },

  createTaxRate: async function(data: Partial<TaxRate>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'tax_rates'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tax_rates');
      return '';
    }
  },

  // --- CRM ---
  getLeads: async function(companyId: string): Promise<Lead[]> {
    return this.getCollection('leads', companyId);
  },

  createLead: async function(data: Partial<Lead>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
      return '';
    }
  },

  addInteraction: async function(data: Partial<Interaction>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'interactions'), {
        ...data,
        createdAt: serverTimestamp()
      });
      // Update lead last contact
      if (data.leadId) {
        await updateDoc(doc(db, 'leads', data.leadId), {
          lastContactDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'interactions');
      return '';
    }
  },

  // --- SUPPLY CHAIN ---
  getPurchaseOrders: async function(companyId: string): Promise<PurchaseOrder[]> {
    return this.getCollection('purchase_orders', companyId);
  },

  createPurchaseOrder: async function(data: Partial<PurchaseOrder>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'purchase_orders'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'purchase_orders');
      return '';
    }
  },

  deletePurchaseOrder: async function(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'purchase_orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `purchase_orders/${id}`);
    }
  },

  updateLead: async function(id: string, data: Partial<Lead>): Promise<void> {
    try {
      await updateDoc(doc(db, 'leads', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  },

  deleteLead: async function(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  },

  // --- INVENTORY ---
  getAllBatches: async function(companyId: string): Promise<Batch[]> {
    try {
      const q = query(collection(db, 'batches'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Batch));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'batches');
      return [];
    }
  },

  getAllSerialNumbers: async function(companyId: string): Promise<SerialNumber[]> {
    try {
      const q = query(collection(db, 'serial_numbers'), where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SerialNumber));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'serial_numbers');
      return [];
    }
  },

  getBatches: async function(itemId: string, companyId: string): Promise<Batch[]> {
    try {
      const q = query(
        collection(db, 'batches'),
        where('item_id', '==', itemId),
        where('companyId', '==', companyId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Batch));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'batches');
      return [];
    }
  },

  getSerialNumbers: async function(itemId: string, companyId: string): Promise<SerialNumber[]> {
    try {
      const q = query(
        collection(db, 'serial_numbers'),
        where('item_id', '==', itemId),
        where('companyId', '==', companyId),
        where('status', '==', 'Available')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SerialNumber));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'serial_numbers');
      return [];
    }
  },

  // --- AI INSIGHTS ---
  getAIInsights: async function(prompt: string, dataContext: any): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = 'gemini-3.1-flash-lite';
      const fullPrompt = `
        You are an AI ERP Expert. Analyze the following business data and provide insights.
        Context: ${JSON.stringify(dataContext)}
        User Question: ${prompt}
        
        Provide a concise, professional analysis in Markdown format.
      `;
      
      const response = await ai.models.generateContent({
        model,
        contents: [fullPrompt]
      });
      
      return response.text || 'Unable to generate insights at this time.';
    } catch (error) {
      console.error('AI Insights Error:', error);
      return 'AI Insights service is temporarily unavailable.';
    }
  },

  // --- QUOTA TRACKING ---
  getMostRecent130PM(now: Date): Date {
    const tz = "Asia/Dhaka";
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const parts = formatter.formatToParts(now);
      const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

      const today130PM = new Date(
        Date.UTC(
          parseInt(map.year),
          parseInt(map.month) - 1,
          parseInt(map.day),
          7,
          30,
          0,
          0
        )
      );

      if (now.getTime() >= today130PM.getTime()) {
        return today130PM;
      } else {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yParts = formatter.formatToParts(yesterday);
        const yMap = Object.fromEntries(yParts.map((p) => [p.type, p.value]));
        return new Date(
          Date.UTC(
            parseInt(yMap.year),
            parseInt(yMap.month) - 1,
            parseInt(yMap.day),
            7,
            30,
            0,
            0
          )
        );
      }
    } catch (e) {
      const fallback = new Date(now);
      fallback.setUTCHours(7, 30, 0, 0);
      if (now.getTime() >= fallback.getTime()) {
        return fallback;
      } else {
        return new Date(fallback.getTime() - 24 * 60 * 60 * 1000);
      }
    }
  },

  async resetCompanyQuota(companyId: string, resetTimestamp: number) {
    if (!companyId || companyId === "placeholder" || companyId === "test") return;
    try {
      const companyRef = doc(db, "companies", companyId);
      await updateDoc(companyRef, {
        quotaUsed: 0,
        quotaReads: 0,
        quotaWrites: 0,
        quotaDeletes: 0,
        quotaLastReset: resetTimestamp,
        quotaLastResetDateStr: new Date(resetTimestamp).toISOString(),
      });
      console.log(`[QUOTA] Successfully reset daily quota in Firestore for company ${companyId}.`);
    } catch (err) {
      console.warn("[QUOTA] Error in resetCompanyQuota:", err);
    }
  },

  _quotaBuffer: {} as Record<string, { reads: number, writes: number, deletes: number }>,
  _quotaTimer: null as any,

  trackQuota: function(
    companyId: string | undefined,
    reads: number,
    writes: number,
    deletes: number = 0
  ) {
    if (!companyId || companyId === "placeholder" || companyId === "test") return;
    
    // Initialize buffer if not exists
    if (!this._quotaBuffer[companyId]) {
      this._quotaBuffer[companyId] = { reads: 0, writes: 0, deletes: 0 };
    }
    
    // Accumulate in memory
    this._quotaBuffer[companyId].reads += reads;
    this._quotaBuffer[companyId].writes += writes;
    this._quotaBuffer[companyId].deletes += deletes;

    // Save backup to localStorage to prevent data loss on tab close/reload
    try {
      const storedKey = `unsaved_quota_${companyId}`;
      const existing = localStorage.getItem(storedKey);
      let localData = { reads: 0, writes: 0, deletes: 0 };
      if (existing) {
        try {
          localData = JSON.parse(existing);
        } catch (e) {}
      }
      localData.reads += reads;
      localData.writes += writes;
      localData.deletes += deletes;
      localStorage.setItem(storedKey, JSON.stringify(localData));
    } catch (e) {
      console.warn('Error saving unsaved quota backup:', e);
    }

    // Schedule flush in 10 seconds if not already scheduled
    if (!this._quotaTimer) {
      this._quotaTimer = setTimeout(() => {
        this.flushQuotaBuffer();
      }, 10000);
    }
  },

  async flushQuotaBuffer() {
    this._quotaTimer = null;
    const companies = Object.keys(this._quotaBuffer);
    if (companies.length === 0) return;

    for (const companyId of companies) {
      const buffer = this._quotaBuffer[companyId];
      if (buffer.reads === 0 && buffer.writes === 0 && buffer.deletes === 0) continue;

      const readsToSave = buffer.reads;
      const writesToSave = buffer.writes;
      const deletesToSave = buffer.deletes;
      
      // Reset in-memory buffer before making async call to avoid race conditions
      buffer.reads = 0;
      buffer.writes = 0;
      buffer.deletes = 0;

      try {
        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
          quotaReads: increment(readsToSave),
          quotaWrites: increment(writesToSave),
          quotaDeletes: increment(deletesToSave),
          quotaUsed: increment(readsToSave + writesToSave * 5 + deletesToSave * 2),
        });

        // Success! Clean up localStorage backup
        const storedKey = `unsaved_quota_${companyId}`;
        const existing = localStorage.getItem(storedKey);
        if (existing) {
          try {
            const localData = JSON.parse(existing);
            localData.reads = Math.max(0, localData.reads - readsToSave);
            localData.writes = Math.max(0, localData.writes - writesToSave);
            localData.deletes = Math.max(0, localData.deletes - deletesToSave);
            if (localData.reads === 0 && localData.writes === 0 && localData.deletes === 0) {
              localStorage.removeItem(storedKey);
            } else {
              localStorage.setItem(storedKey, JSON.stringify(localData));
            }
          } catch (e) {
            localStorage.removeItem(storedKey);
          }
        }
      } catch (e) {
        console.warn(`[QUOTA] Failed to flush quota buffer for ${companyId}:`, e);
        // Put back in buffer on failure to retry next time
        if (!this._quotaBuffer[companyId]) {
          this._quotaBuffer[companyId] = { reads: 0, writes: 0, deletes: 0 };
        }
        this._quotaBuffer[companyId].reads += readsToSave;
        this._quotaBuffer[companyId].writes += writesToSave;
        this._quotaBuffer[companyId].deletes += deletesToSave;
      }
    }
  },

  initQuotaTracking() {
    if (typeof window === 'undefined') return;
    
    // Flush on page unload or visibility hide
    const handleFlush = () => {
      this.flushQuotaBuffer();
    };
    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    });

    // Recover unsaved quota from localStorage on startup
    setTimeout(async () => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('unsaved_quota_')) {
            const companyId = key.replace('unsaved_quota_', '');
            const raw = localStorage.getItem(key);
            if (raw) {
              try {
                const data = JSON.parse(raw);
                if (data && (data.reads > 0 || data.writes > 0 || data.deletes > 0)) {
                  if (!this._quotaBuffer[companyId]) {
                    this._quotaBuffer[companyId] = { reads: 0, writes: 0, deletes: 0 };
                  }
                  this._quotaBuffer[companyId].reads += data.reads;
                  this._quotaBuffer[companyId].writes += data.writes;
                  this._quotaBuffer[companyId].deletes += data.deletes;
                }
              } catch (e) {}
            }
          }
        }
        this.flushQuotaBuffer();
      } catch (err) {
        console.warn('Error in initQuotaTracking recovery:', err);
      }
    }, 1000);
  },

  // --- DATA EXPORT ---
  exportToExcel: function(data: any[], fileName: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
};

// Initialize quota tracking automatically on service load
try {
  erpService.initQuotaTracking();
} catch (e) {
  console.warn('Failed to auto-initialize erpService quota tracking:', e);
}
