import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ErrorLog } from '../types';
import { ensureDate } from '../lib/utils';

class ErrorService {
  private collectionName = 'error_logs';

  async logError(params: {
    message: string;
    stack?: string;
    componentName?: string;
    severity?: ErrorLog['severity'];
    metadata?: Record<string, any>;
    companyId?: string;
  }) {
    try {
      const user = auth.currentUser;
      const errorLog: any = {
        userId: user?.uid || null,
        userEmail: user?.email || null,
        companyId: params.companyId || null,
        message: params.message || 'No message provided',
        stack: params.stack || null,
        componentName: params.componentName || 'Global',
        path: window.location.pathname + window.location.search,
        browserInfo: navigator.userAgent,
        severity: params.severity || 'error',
        status: 'new',
        timestamp: serverTimestamp(),
        metadata: params.metadata || null
      };

      // Remove any keys that are truly undefined just in case, though || null handles most
      Object.keys(errorLog).forEach(key => {
        if (errorLog[key] === undefined) {
          errorLog[key] = null;
        }
      });

      const docRef = await addDoc(collection(db, this.collectionName), errorLog);
      return docRef.id;
    } catch (err) {
      console.error('Failed to log error to Firestore:', err);
      return null;
    }
  }

  subscribeToLogs(callback: (logs: ErrorLog[]) => void) {
    const q = query(
      collection(db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: ensureDate(doc.data().timestamp)
      })) as ErrorLog[];
      callback(logs);
    });
  }

  async updateLogStatus(logId: string, status: ErrorLog['status']) {
    const docRef = doc(db, this.collectionName, logId);
    await updateDoc(docRef, { status });
  }

  async updateLogAiStatus(logId: string, aiStatus: ErrorLog['aiStatus'], status?: ErrorLog['status']) {
    const docRef = doc(db, this.collectionName, logId);
    const updates: any = { aiStatus };
    if (status) {
      updates.status = status;
    }
    await updateDoc(docRef, updates);
  }

  async deleteLog(logId: string) {
    const docRef = doc(db, this.collectionName, logId);
    await deleteDoc(docRef);
  }

  async clearAllLogs() {
    // Note: In production, you'd want to use a batch or cloud function
    // For now, we just suggest the founder to clean up resolved ones
  }
}

export const errorService = new ErrorService();
