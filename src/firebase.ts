import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Clean up any stale multi-tab firestore mutation keys left in localStorage to prevent QuotaExceededError
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('firestore_mutations_') || k.startsWith('firestore_client_state_') || k.startsWith('firestore_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    // Defensive global wrapper: intercept any QuotaExceededError on localStorage.setItem
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = function (key: string, value: string) {
      try {
        originalSetItem(key, value);
      } catch (err: any) {
        if (
          err?.name === 'QuotaExceededError' ||
          err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err?.code === 22 ||
          err?.code === 1014 ||
          String(err).toLowerCase().includes('quota')
        ) {
          console.warn(`[Storage] localStorage quota reached. Purging stale caches for key "${key}"...`);
          try {
            const staleKeys: string[] = [];
            for (let j = 0; j < window.localStorage.length; j++) {
              const sk = window.localStorage.key(j);
              if (sk && (
                sk.startsWith('firestore_mutations_') ||
                sk.startsWith('firestore_') ||
                sk.startsWith('col_cache_') ||
                sk.startsWith('group_summary_') ||
                sk.startsWith('vouchers_type_') ||
                sk.startsWith('vouchers_range_') ||
                sk.startsWith('entries_range_') ||
                sk.startsWith('entries_by_date_') ||
                sk.startsWith('item_inv_entries_') ||
                sk.startsWith('voucher_detail_') ||
                sk.startsWith('cache_search_') ||
                sk.startsWith('cache_count_') ||
                sk.startsWith('dashboard_stats_')
              )) {
                staleKeys.push(sk);
              }
            }
            staleKeys.forEach(sk => {
              try { window.localStorage.removeItem(sk); } catch (e) {}
            });
            // Retry setting item once space is freed
            originalSetItem(key, value);
          } catch (retryErr) {
            console.warn(`[Storage] Value too large or storage unavailable for key "${key}". Skipping localStorage cache.`, retryErr);
          }
        } else {
          throw err;
        }
      }
    };
  }
} catch (e) {
  console.warn('Storage cleanup notice:', e);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use standard Firestore instance as specified in Firebase Integration guidelines
// Avoid persistentMultipleTabManager() which floods localStorage with mutations and triggers QuotaExceededError
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

