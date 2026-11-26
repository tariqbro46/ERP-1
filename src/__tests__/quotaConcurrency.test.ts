/**
 * SAPIENT / TallyFlow ERP - Phase 2.3.1 Quota Concurrency & Reset Safety Test Suite
 * 
 * STRICT PHASE 2.3.1 SCOPE:
 * 1. Company-wise Flush Coordination (two concurrent flushes for the same company serialize cleanly; no duplicate runs).
 * 2. Reset starting while a flush is in progress (reset awaits in-flight flush).
 * 3. Pending buffer exists before reset (drain verification before resetting).
 * 4. Pre-reset flush failure (reset aborts, telemetry preserved in buffer and storage).
 * 5. New telemetry arriving during reset write (preserved for new cycle, not wiped).
 * 6. Attempt of an old flush completing after reset (no late-increment leaks).
 * 7. Chunking and retry without counter loss or duplicates.
 * 8. Daily reset vs manual reset parity (both use executeSafeQuotaReset).
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { erpService } from '../services/erpService.js';

// Setup Mock LocalStorage for Node test environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
  get length(): number {
    return Object.keys(this.store).length;
  }
  key(i: number): string | null {
    return Object.keys(this.store)[i] ?? null;
  }
}

const mockStorage = new MockLocalStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

describe('Phase 2.3.1: Quota Concurrency & Reset Safety Suite', () => {

  beforeEach(() => {
    mockStorage.clear();
    erpService.clearAllCaches();
    // Default safe no-op mock for Firestore writes in unit tests to protect live database
    erpService._performDocUpdate = async () => {};
    erpService._performUsersReset = async () => {};
    erpService._addNotification = async () => ({} as any);
    erpService._approvePendingResetRequests = async () => {};
  });

  afterEach(() => {
    if (erpService._quotaTimer) {
      clearTimeout(erpService._quotaTimer);
      erpService._quotaTimer = null;
    }
  });

  // ==========================================================================
  // SCENARIO 1: Two flushes attempting to start at the same time for the same company
  // ==========================================================================
  it('Scenario 1: Two concurrent flushes for the same company must serialize cleanly without duplicate executions', async () => {
    const companyId = 'comp_concurrency_test_1';
    let executeCalls = 0;
    let concurrentCalls = 0;
    let maxConcurrentObserved = 0;

    const originalExecute = erpService._executeCompanyFlush.bind(erpService);
    erpService._executeCompanyFlush = async (cid: string) => {
      executeCalls++;
      concurrentCalls++;
      if (concurrentCalls > maxConcurrentObserved) {
        maxConcurrentObserved = concurrentCalls;
      }
      // Simulate network latency
      await new Promise(res => setTimeout(res, 20));
      concurrentCalls--;
      return true;
    };

    try {
      erpService._quotaBuffer[companyId] = { reads: 100, writes: 50, deletes: 10, hourly: {} };

      // Trigger two concurrent flushes
      const [res1, res2] = await Promise.all([
        erpService.flushCompanyQuota(companyId),
        erpService.flushCompanyQuota(companyId)
      ]);

      assert.strictEqual(res1, true);
      assert.strictEqual(res2, true);
      assert.strictEqual(maxConcurrentObserved, 1, 'Max concurrent _executeCompanyFlush calls must never exceed 1');
      assert.strictEqual(erpService._flushingCompanies[companyId], null, 'Flush lock must be released after completion');
    } finally {
      erpService._executeCompanyFlush = originalExecute;
    }
  });

  // ==========================================================================
  // SCENARIO 2: Reset starting while a flush is in progress
  // ==========================================================================
  it('Scenario 2: Reset starting while a flush is in progress must await the in-flight flush', async () => {
    const companyId = 'comp_concurrency_test_2';
    const executionOrder: string[] = [];

    const originalExecute = erpService._executeCompanyFlush.bind(erpService);
    erpService._executeCompanyFlush = async (cid: string) => {
      executionOrder.push('flush_start');
      await new Promise(res => setTimeout(res, 30));
      executionOrder.push('flush_complete');
      // Clear buffer on success
      if (erpService._quotaBuffer[cid]) {
        erpService._quotaBuffer[cid] = { reads: 0, writes: 0, deletes: 0, hourly: {} };
      }
      return true;
    };

    try {
      erpService._quotaBuffer[companyId] = { reads: 10, writes: 5, deletes: 0, hourly: {} };

      // 1. Kick off flush
      const flushPromise = erpService.flushCompanyQuota(companyId);

      // 2. While flush is running, trigger executeSafeQuotaReset
      const resetPromise = erpService.executeSafeQuotaReset(companyId, Date.now());

      await Promise.all([flushPromise, resetPromise]);

      assert.strictEqual(executionOrder[0], 'flush_start');
      assert.strictEqual(executionOrder[1], 'flush_complete');
      assert.strictEqual(erpService._quotaBuffer[companyId].reads, 0);
    } finally {
      erpService._executeCompanyFlush = originalExecute;
    }
  });

  // ==========================================================================
  // SCENARIO 3: Pending buffer exists before reset (Drain verification)
  // ==========================================================================
  it('Scenario 3: Pending buffer must be fully drained before committing reset', async () => {
    const companyId = 'comp_concurrency_test_3';
    let drainedOps = 0;
    let resetWriteCommitted = false;

    erpService._performDocUpdate = async (ref: any, data: any) => {
      if (data.quotaUsed === 0) {
        resetWriteCommitted = true;
        // Verify that before reset write commits, buffer was completely drained
        assert.strictEqual(erpService._quotaBuffer[companyId].reads, 0);
        assert.strictEqual(erpService._quotaBuffer[companyId].writes, 0);
        assert.strictEqual(erpService._quotaBuffer[companyId].deletes, 0);
      }
    };

    const originalExecute = erpService._executeCompanyFlush.bind(erpService);
    erpService._executeCompanyFlush = async (cid: string) => {
      const buf = erpService._quotaBuffer[cid];
      if (buf) {
        drainedOps += (buf.reads + buf.writes + buf.deletes);
        buf.reads = 0;
        buf.writes = 0;
        buf.deletes = 0;
      }
      return true;
    };

    try {
      // 500 reads, 200 writes, 50 deletes in buffer
      erpService._quotaBuffer[companyId] = { reads: 500, writes: 200, deletes: 50, hourly: {} };

      const ok = await erpService.executeSafeQuotaReset(companyId, Date.now());

      assert.strictEqual(ok, true);
      assert.strictEqual(drainedOps, 750, 'All 750 pending ops must be drained before reset');
      assert.strictEqual(resetWriteCommitted, true, 'Reset write must have committed');
      assert.strictEqual(erpService._hasPendingQuotaBuffer(companyId), false, 'Buffer must be empty');
    } finally {
      erpService._executeCompanyFlush = originalExecute;
    }
  });

  // ==========================================================================
  // SCENARIO 4: Pre-reset flush failure (Reset aborts, buffer preserved)
  // ==========================================================================
  it('Scenario 4: Pre-reset flush failure must abort reset and preserve buffer data', async () => {
    const companyId = 'comp_concurrency_test_4';
    let resetPayloadCommitted = false;

    erpService._performDocUpdate = async (ref: any, data: any) => {
      if (data.quotaUsed === 0) {
        resetPayloadCommitted = true;
      }
    };

    const originalExecute = erpService._executeCompanyFlush.bind(erpService);
    // Simulate failure during pre-reset drain
    erpService._executeCompanyFlush = async () => {
      return false; // Flush failed!
    };

    try {
      erpService._quotaBuffer[companyId] = { reads: 300, writes: 150, deletes: 20, hourly: {} };
      mockStorage.setItem(`unsaved_quota_${companyId}`, JSON.stringify({ reads: 300, writes: 150, deletes: 20 }));

      const ok = await erpService.executeSafeQuotaReset(companyId, Date.now());

      assert.strictEqual(ok, false, 'Reset must abort and return false if pre-reset drain fails');
      assert.strictEqual(resetPayloadCommitted, false, 'Reset write must NOT commit to Firestore');
      assert.strictEqual(erpService._quotaBuffer[companyId].reads, 300, 'Reads must remain intact');
      assert.strictEqual(erpService._quotaBuffer[companyId].writes, 150, 'Writes must remain intact');
      assert.strictEqual(erpService._quotaBuffer[companyId].deletes, 20, 'Deletes must remain intact');

      // LocalStorage backup must also be preserved
      const backup = JSON.parse(mockStorage.getItem(`unsaved_quota_${companyId}`)!);
      assert.strictEqual(backup.reads, 300);
      assert.strictEqual(backup.writes, 150);
      assert.strictEqual(backup.deletes, 20);
    } finally {
      erpService._executeCompanyFlush = originalExecute;
    }
  });

  // ==========================================================================
  // SCENARIO 5: New telemetry arriving during reset write
  // ==========================================================================
  it('Scenario 5: Telemetry arriving during reset write must be preserved for new cycle', async () => {
    const companyId = 'comp_concurrency_test_5';

    // When reset doc update is in flight, simulate new telemetry arriving
    erpService._performDocUpdate = async (ref: any, data: any) => {
      if (data.quotaUsed === 0) {
        // While updateDoc is awaiting completion, new telemetry arrives
        erpService.trackQuota(companyId, 25, 10, 5);
        await new Promise(res => setTimeout(res, 20));
      }
    };

    const originalExecute = erpService._executeCompanyFlush.bind(erpService);
    erpService._executeCompanyFlush = async (cid: string) => {
      const b = erpService._quotaBuffer[cid];
      if (b) {
        b.reads = 0;
        b.writes = 0;
        b.deletes = 0;
      }
      return true;
    };

    try {
      // 1. Initial pre-reset buffer
      erpService._quotaBuffer[companyId] = { reads: 100, writes: 0, deletes: 0, hourly: {} };

      // 2. Execute safe reset
      const ok = await erpService.executeSafeQuotaReset(companyId, Date.now());
      assert.strictEqual(ok, true);

      // The new 40 ops (25 reads, 10 writes, 5 deletes) must be preserved for the new cycle!
      const finalBuf = erpService._quotaBuffer[companyId];
      assert.ok(finalBuf, 'Buffer must exist');
      assert.strictEqual(finalBuf.reads, 25, 'New cycle reads must be preserved');
      assert.strictEqual(finalBuf.writes, 10, 'New cycle writes must be preserved');
      assert.strictEqual(finalBuf.deletes, 5, 'New cycle deletes must be preserved');
    } finally {
      erpService._executeCompanyFlush = originalExecute;
    }
  });

  // ==========================================================================
  // SCENARIO 6: Attempt of an old flush completing after reset (no late-increment leaks)
  // ==========================================================================
  it('Scenario 6: Reset lock blocks late flush chunks from interleaving and corrupting new cycle', async () => {
    const companyId = 'comp_concurrency_test_6';

    erpService._resettingCompanies[companyId] = true;

    // While reset is active, flushCompanyQuota must refuse to execute
    const flushAttempt = await erpService.flushCompanyQuota(companyId);
    assert.strictEqual(flushAttempt, false, 'Flush must yield/return false when company is resetting');

    // Also _executeCompanyFlush must refuse to execute while resetting
    const directExecute = await erpService._executeCompanyFlush(companyId);
    assert.strictEqual(directExecute, false, 'Direct flush execution must be refused during reset');

    erpService._resettingCompanies[companyId] = false;
  });

  // ==========================================================================
  // SCENARIO 7: Chunking and retry without counter loss or duplicates
  // ==========================================================================
  it('Scenario 7: Oversized buffers chunk sequentially and retries do not lose or duplicate ops', async () => {
    const companyId = 'comp_concurrency_test_7';

    // 2500 reads, 1200 writes, 600 deletes = 4300 total ops
    erpService._quotaBuffer[companyId] = {
      reads: 2500,
      writes: 1200,
      deletes: 600,
      hourly: {
        'slot_0': { reads: 2500, writes: 1200, deletes: 600 }
      }
    };

    let totalPersistedReads = 0;
    let totalPersistedWrites = 0;
    let totalPersistedDeletes = 0;
    let attempts = 0;

    const originalExecute = erpService._executeCompanyFlush.bind(erpService);

    // Mock realistic chunking execution matching caps
    erpService._executeCompanyFlush = async (cid: string) => {
      attempts++;
      const buf = erpService._quotaBuffer[cid];
      if (!buf || (buf.reads === 0 && buf.writes === 0 && buf.deletes === 0)) return true;

      // Simulate a transient failure on attempt 2 to test retry restoration
      if (attempts === 2) {
        return false;
      }

      const rChunk = Math.min(buf.reads, 1000);
      const wChunk = Math.min(buf.writes, 500);
      const dChunk = Math.min(buf.deletes, 500);

      // Clamp total
      let added = rChunk + wChunk + dChunk;
      let finalR = rChunk, finalW = wChunk, finalD = dChunk;
      if (added > 2000) {
        finalR = Math.min(finalR, 1000);
        finalW = Math.min(finalW, 500);
        finalD = Math.max(0, 2000 - finalR - finalW);
      }

      buf.reads -= finalR;
      buf.writes -= finalW;
      buf.deletes -= finalD;

      totalPersistedReads += finalR;
      totalPersistedWrites += finalW;
      totalPersistedDeletes += finalD;

      return true;
    };

    try {
      // Loop flush until complete
      let loop = 0;
      while (erpService._hasPendingQuotaBuffer(companyId) && loop < 15) {
        loop++;
        await erpService.flushCompanyQuota(companyId);
      }

      assert.strictEqual(totalPersistedReads, 2500, 'Must persist exactly 2500 reads');
      assert.strictEqual(totalPersistedWrites, 1200, 'Must persist exactly 1200 writes');
      assert.strictEqual(totalPersistedDeletes, 600, 'Must persist exactly 600 deletes');
      assert.strictEqual(erpService._quotaBuffer[companyId].reads, 0);
      assert.strictEqual(erpService._quotaBuffer[companyId].writes, 0);
      assert.strictEqual(erpService._quotaBuffer[companyId].deletes, 0);
    } finally {
      erpService._executeCompanyFlush = originalExecute;
    }
  });

  // ==========================================================================
  // SCENARIO 8: Daily reset vs manual reset parity
  // ==========================================================================
  it('Scenario 8: Both resetCompanyQuota and updateCompanyQuotaAndReset share executeSafeQuotaReset parity', async () => {
    let executedCompany = '';
    let executedTimestamp = 0;
    let executedExtra: any = null;

    const originalSafeReset = erpService.executeSafeQuotaReset.bind(erpService);
    erpService.executeSafeQuotaReset = async (cid: string, ts: number, extra?: any) => {
      executedCompany = cid;
      executedTimestamp = ts;
      executedExtra = extra;
      return true;
    };

    try {
      const ts = 1762693200000;
      // 1. Daily Reset call
      await erpService.resetCompanyQuota('comp_daily_reset', ts);
      assert.strictEqual(executedCompany, 'comp_daily_reset');
      assert.strictEqual(executedTimestamp, ts);
      assert.strictEqual(executedExtra, undefined);

      // 2. Manual Reset call (via updateCompanyQuotaAndReset with resetUsage = true)
      await erpService.updateCompanyQuotaAndReset('comp_manual_reset', 20000, '', true);
      assert.strictEqual(executedCompany, 'comp_manual_reset');
      assert.strictEqual(executedExtra.quotaLimit, 20000);
      assert.strictEqual(executedExtra.quotaResetRequested, false);
    } finally {
      erpService.executeSafeQuotaReset = originalSafeReset;
    }
  });

});
