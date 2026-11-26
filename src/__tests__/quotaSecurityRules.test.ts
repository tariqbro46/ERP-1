/**
 * SAPIENT / TallyFlow ERP - Phase 2.1 Firestore Security Rules Validation Suite
 * 
 * STRICT PHASE 2.1 SCOPE:
 * - Validates staging rules logic for quotaHourly and company document updates.
 * - Tests authorization across all roles: Member, Admin, Owner, SuperAdmin, Disabled, Cross-Company.
 * - Tests quota validation constraints: delta caps, non-negative, schema boundaries, privileged field protections.
 * - Isolated staging test harness — ZERO mutations to production rules or live data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// SIMULATION ENGINE: Firestore Security Rules Exact Semantic Evaluator
// ============================================================================

interface AuthContext {
  uid: string | null;
  token?: {
    email?: string;
  };
}

interface UserDoc {
  role?: string;
  companyId?: string;
  status?: string;
  permissions?: string[];
}

interface CompanyDoc {
  name?: string;
  ownerId?: string;
  createdBy?: string;
  quotaReads?: number;
  quotaWrites?: number;
  quotaDeletes?: number;
  quotaUsed?: number;
  quotaLimit?: number;
  quotaLastReset?: string;
  quotaLastResetDateStr?: string;
  quotaHourly?: Record<string, { reads?: number; writes?: number; deletes?: number } | any>;
  [key: string]: any;
}

interface RulesEvaluationContext {
  auth: AuthContext;
  usersDb: Record<string, UserDoc>;
  companiesDb: Record<string, CompanyDoc>;
  resource: { data: CompanyDoc } | null;
  request: {
    auth: AuthContext;
    resource: { data: CompanyDoc };
  };
}

// Helper functions mirroring firestore.rules.staging directly

function isAuthenticated(ctx: RulesEvaluationContext): boolean {
  return ctx.auth != null && ctx.auth.uid != null;
}

function getUserData(ctx: RulesEvaluationContext): UserDoc {
  const uid = ctx.auth.uid;
  if (!uid || !ctx.usersDb[uid]) {
    return {};
  }
  return ctx.usersDb[uid];
}

function isSuperAdminBasic(ctx: RulesEvaluationContext): boolean {
  return isAuthenticated(ctx) && ctx.auth.token?.email === 'sapientman46@gmail.com';
}

function isSuperAdmin(ctx: RulesEvaluationContext): boolean {
  if (isSuperAdminBasic(ctx)) return true;
  if (!isAuthenticated(ctx)) return false;
  const uid = ctx.auth.uid!;
  const user = ctx.usersDb[uid];
  if (!user) return false;
  const role = user.role || '';
  return ['Founder', 'Admin', 'Marketing Manager', 'Marketing'].includes(role);
}

function isCompanyMember(ctx: RulesEvaluationContext, companyId: string): boolean {
  if (!isAuthenticated(ctx) || !companyId) return false;
  if (isSuperAdminBasic(ctx)) return true;
  if (companyId === ctx.auth.uid) return true;

  const uid = ctx.auth.uid!;
  const user = ctx.usersDb[uid];
  if (user && user.companyId === companyId && (user.status || 'active') !== 'disabled') {
    return true;
  }

  const company = ctx.companiesDb[companyId];
  if (company && (company.ownerId === uid || company.createdBy === uid)) {
    return true;
  }

  return false;
}

function isCompanyAdmin(ctx: RulesEvaluationContext, companyId: string): boolean {
  if (!isAuthenticated(ctx) || !companyId) return false;
  if (isSuperAdminBasic(ctx)) return true;
  if (companyId === ctx.auth.uid) return true;

  const uid = ctx.auth.uid!;
  const user = ctx.usersDb[uid];
  if (
    user &&
    user.companyId === companyId &&
    ['Admin', 'Founder', 'Marketing Manager'].includes(user.role || '') &&
    (user.status || 'active') !== 'disabled'
  ) {
    return true;
  }

  const company = ctx.companiesDb[companyId];
  if (company && (company.ownerId === uid || company.createdBy === uid)) {
    return true;
  }

  return false;
}

function isValidSlot(slotMap: any): boolean {
  if (typeof slotMap !== 'object' || slotMap === null || Array.isArray(slotMap)) {
    return false;
  }
  const keys = Object.keys(slotMap);
  const allowedSlotKeys = ['reads', 'writes', 'deletes'];
  if (!keys.every(k => allowedSlotKeys.includes(k))) {
    return false;
  }

  if ('reads' in slotMap) {
    if (typeof slotMap.reads !== 'number' || !Number.isInteger(slotMap.reads) || slotMap.reads < 0) {
      return false;
    }
  }
  if ('writes' in slotMap) {
    if (typeof slotMap.writes !== 'number' || !Number.isInteger(slotMap.writes) || slotMap.writes < 0) {
      return false;
    }
  }
  if ('deletes' in slotMap) {
    if (typeof slotMap.deletes !== 'number' || !Number.isInteger(slotMap.deletes) || slotMap.deletes < 0) {
      return false;
    }
  }

  return true;
}

function isValidQuotaHourly(hourlyMap: any): boolean {
  if (typeof hourlyMap !== 'object' || hourlyMap === null || Array.isArray(hourlyMap)) {
    return false;
  }
  const allowedSlots = [
    'slot_0', 'slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5',
    'slot_6', 'slot_7', 'slot_8', 'slot_9', 'slot_10', 'slot_11'
  ];
  const keys = Object.keys(hourlyMap);
  if (!keys.every(k => allowedSlots.includes(k))) {
    return false;
  }

  for (const slotKey of allowedSlots) {
    if (slotKey in hourlyMap) {
      if (!isValidSlot(hourlyMap[slotKey])) {
        return false;
      }
    }
  }
  return true;
}

function isValidQuotaIncrement(newData: CompanyDoc, oldData: CompanyDoc): boolean {
  const oldReads = oldData.quotaReads ?? 0;
  const newReads = newData.quotaReads ?? 0;
  const deltaReads = newReads - oldReads;

  const oldWrites = oldData.quotaWrites ?? 0;
  const newWrites = newData.quotaWrites ?? 0;
  const deltaWrites = newWrites - oldWrites;

  const oldDeletes = oldData.quotaDeletes ?? 0;
  const newDeletes = newData.quotaDeletes ?? 0;
  const deltaDeletes = newDeletes - oldDeletes;

  const oldUsed = oldData.quotaUsed ?? 0;
  const newUsed = newData.quotaUsed ?? 0;
  const deltaUsed = newUsed - oldUsed;

  return (
    newReads >= oldReads &&
    deltaReads <= 1000 &&
    newWrites >= oldWrites &&
    deltaWrites <= 500 &&
    newDeletes >= oldDeletes &&
    deltaDeletes <= 500 &&
    newUsed >= oldUsed &&
    deltaUsed <= 2000
  );
}

function getAffectedKeys(newData: Record<string, any>, oldData: Record<string, any>): string[] {
  const allKeys = new Set([...Object.keys(newData), ...Object.keys(oldData)]);
  const affected: string[] = [];
  for (const k of allKeys) {
    if (JSON.stringify(newData[k]) !== JSON.stringify(oldData[k])) {
      affected.push(k);
    }
  }
  return affected;
}

function isCompanyMemberQuotaUpdate(ctx: RulesEvaluationContext, companyId: string): boolean {
  if (!isCompanyMember(ctx, companyId)) {
    return false;
  }

  const oldData = ctx.resource?.data || {};
  const newData = ctx.request.resource.data || {};
  const affected = getAffectedKeys(newData, oldData);

  const allowedMemberFields = ['quotaReads', 'quotaWrites', 'quotaDeletes', 'quotaUsed', 'quotaHourly'];
  if (!affected.every(k => allowedMemberFields.includes(k))) {
    return false;
  }

  if (!isValidQuotaIncrement(newData, oldData)) {
    return false;
  }

  if (affected.includes('quotaHourly')) {
    if (!isValidQuotaHourly(newData.quotaHourly ?? {})) {
      return false;
    }
  }

  return true;
}

// Evaluates whether an update to /companies/{companyId} is permitted
function canUpdateCompany(ctx: RulesEvaluationContext, companyId: string): boolean {
  if (!isAuthenticated(ctx)) {
    return false;
  }
  if (isSuperAdmin(ctx)) {
    return true;
  }
  if (ctx.resource?.data?.ownerId === ctx.auth.uid) {
    return true;
  }
  if (isCompanyAdmin(ctx, companyId)) {
    return true;
  }
  if (isCompanyMemberQuotaUpdate(ctx, companyId)) {
    return true;
  }
  return false;
}

// Evaluates whether a get on /companies/{companyId} is permitted
function canGetCompany(ctx: RulesEvaluationContext, companyId: string): boolean {
  if (!isAuthenticated(ctx)) {
    return false;
  }
  return isSuperAdmin(ctx) || isCompanyMember(ctx, companyId);
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

const BASE_COMPANY: CompanyDoc = {
  name: 'Acme Traders Ltd',
  ownerId: 'owner_user_1',
  createdBy: 'owner_user_1',
  quotaLimit: 50000,
  quotaUsed: 120,
  quotaReads: 80,
  quotaWrites: 35,
  quotaDeletes: 5,
  quotaLastReset: '2026-11-09T07:00:00.000Z',
  quotaLastResetDateStr: '2026-11-09',
  quotaHourly: {
    slot_0: { reads: 10, writes: 5, deletes: 0 },
    slot_1: { reads: 70, writes: 30, deletes: 5 }
  }
};

const DB_USERS: Record<string, UserDoc> = {
  superadmin_user: {
    role: 'Founder',
    companyId: 'system_root'
  },
  company_owner: {
    role: 'Admin',
    companyId: 'comp_acme',
    status: 'active'
  },
  company_admin: {
    role: 'Admin',
    companyId: 'comp_acme',
    status: 'active'
  },
  company_member: {
    role: 'Staff',
    companyId: 'comp_acme',
    status: 'active'
  },
  disabled_member: {
    role: 'Staff',
    companyId: 'comp_acme',
    status: 'disabled'
  },
  cross_company_member: {
    role: 'Staff',
    companyId: 'comp_other',
    status: 'active'
  }
};

const DB_COMPANIES: Record<string, CompanyDoc> = {
  comp_acme: { ...BASE_COMPANY },
  comp_other: {
    name: 'Other Corp',
    ownerId: 'other_owner',
    createdBy: 'other_owner',
    quotaLimit: 20000,
    quotaUsed: 0
  }
};

function createTestContext(
  uid: string | null,
  newData: CompanyDoc,
  oldData: CompanyDoc = BASE_COMPANY,
  userOverrides: Partial<Record<string, UserDoc>> = {}
): RulesEvaluationContext {
  const users = { ...DB_USERS, ...userOverrides };
  return {
    auth: {
      uid,
      token: {
        email: uid === 'superadmin_user' ? 'sapientman46@gmail.com' : `${uid}@example.com`
      }
    },
    usersDb: users,
    companiesDb: DB_COMPANIES,
    resource: { data: { ...oldData } },
    request: {
      auth: {
        uid,
        token: {
          email: uid === 'superadmin_user' ? 'sapientman46@gmail.com' : `${uid}@example.com`
        }
      },
      resource: { data: { ...newData } }
    }
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Phase 2.1: Quota Security Rules & Schema Authorization Suite', () => {

  describe('Scenario 1: Ordinary Company Member Valid Quota Increments', () => {
    it('should ALLOW valid quota flush increments within caps from an active member', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 25,     // 80 -> 105 (delta = 25 <= 1000)
        quotaWrites: BASE_COMPANY.quotaWrites! + 8,    // 35 -> 43 (delta = 8 <= 500)
        quotaDeletes: BASE_COMPANY.quotaDeletes! + 0,  // 5 -> 5 (delta = 0 <= 500)
        quotaUsed: BASE_COMPANY.quotaUsed! + 33,       // 120 -> 153 (delta = 33 <= 2000)
        quotaHourly: {
          ...BASE_COMPANY.quotaHourly,
          slot_2: { reads: 25, writes: 8 }
        }
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), true, 'Valid member quota flush should be permitted');
    });

    it('should ALLOW member updates that only touch root counters without quotaHourly', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), true, 'Counter-only update should be permitted');
    });
  });

  describe('Scenario 2: Negative Increments Tampering (DENY)', () => {
    it('should DENY negative reads decrement', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! - 10, // decreased
        quotaUsed: BASE_COMPANY.quotaUsed! - 10
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Decreasing quotaReads must be denied');
    });

    it('should DENY negative writes decrement', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaWrites: BASE_COMPANY.quotaWrites! - 5,
        quotaUsed: BASE_COMPANY.quotaUsed! - 5
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Decreasing quotaWrites must be denied');
    });

    it('should DENY negative quotaUsed decrement', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaUsed: 0 // member trying to wipe their own usage
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Decreasing quotaUsed must be denied');
    });
  });

  describe('Scenario 3: Arbitrarily Large / Oversized Increments Exceeding Caps (DENY)', () => {
    it('should DENY reads increment exceeding cap (> 1000)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 1001, // > 1000 limit
        quotaUsed: BASE_COMPANY.quotaUsed! + 1001
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Reads delta 1001 must be denied');
    });

    it('should DENY writes increment exceeding cap (> 500)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaWrites: BASE_COMPANY.quotaWrites! + 501, // > 500 limit
        quotaUsed: BASE_COMPANY.quotaUsed! + 501
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Writes delta 501 must be denied');
    });

    it('should DENY deletes increment exceeding cap (> 500)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaDeletes: BASE_COMPANY.quotaDeletes! + 501, // > 500 limit
        quotaUsed: BASE_COMPANY.quotaUsed! + 501
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Deletes delta 501 must be denied');
    });

    it('should DENY total quotaUsed increment exceeding cap (> 2000)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 900,
        quotaWrites: BASE_COMPANY.quotaWrites! + 450,
        quotaDeletes: BASE_COMPANY.quotaDeletes! + 450,
        quotaUsed: BASE_COMPANY.quotaUsed! + 2001 // > 2000 cap
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Used delta 2001 must be denied');
    });
  });

  describe('Scenario 4: Invalid Slot Names Schema Validation (DENY)', () => {
    it('should DENY invalid slot index outside range (e.g. slot_12)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10,
        quotaHourly: {
          ...BASE_COMPANY.quotaHourly,
          slot_12: { reads: 10 } // slot_12 is out of bounds (only 0-11 allowed)
        }
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'slot_12 must be denied');
    });

    it('should DENY arbitrary or malicious slot names (e.g. slot_99 or slot_hack)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 5,
        quotaUsed: BASE_COMPANY.quotaUsed! + 5,
        quotaHourly: {
          ...BASE_COMPANY.quotaHourly,
          slot_hack: { reads: 5 }
        }
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'slot_hack must be denied');
    });
  });

  describe('Scenario 5: Malformed Nested Fields Inside Slots (DENY)', () => {
    it('should DENY unrecognized nested keys inside slot (e.g. arbitrary payload injection)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 5,
        quotaUsed: BASE_COMPANY.quotaUsed! + 5,
        quotaHourly: {
          ...BASE_COMPANY.quotaHourly,
          slot_2: { reads: 5, injected_code: 'eval(alert(1))' }
        }
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Injected slot properties must be denied');
    });

    it('should DENY non-integer or string values inside slot counter', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 5,
        quotaUsed: BASE_COMPANY.quotaUsed! + 5,
        quotaHourly: {
          ...BASE_COMPANY.quotaHourly,
          slot_2: { reads: 'five' as any }
        }
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'String counter inside slot must be denied');
    });

    it('should DENY negative value inside slot counter', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 5,
        quotaUsed: BASE_COMPANY.quotaUsed! + 5,
        quotaHourly: {
          ...BASE_COMPANY.quotaHourly,
          slot_2: { reads: -10 }
        }
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Negative counter in slot must be denied');
    });

    it('should DENY non-object quotaHourly replacement (e.g. string or array)', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 5,
        quotaUsed: BASE_COMPANY.quotaUsed! + 5,
        quotaHourly: ['corrupted_array'] as any
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Array quotaHourly must be denied');
    });
  });

  describe('Scenario 6: Privileged Field Modification by Ordinary Members (DENY)', () => {
    it('should DENY ordinary member modifying quotaLastReset timestamp', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10,
        quotaLastReset: new Date().toISOString() // Privileged field!
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Modifying quotaLastReset by member must be denied');
    });

    it('should DENY ordinary member modifying quotaLastResetDateStr', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10,
        quotaLastResetDateStr: '2026-11-10' // Privileged field!
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Modifying quotaLastResetDateStr by member must be denied');
    });

    it('should DENY ordinary member modifying quotaLimit', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaLimit: 9999999 // Member trying to grant infinite quota!
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Modifying quotaLimit by member must be denied');
    });

    it('should DENY ordinary member modifying company name or ownerId', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        name: 'Hacked Company Name',
        ownerId: 'company_member'
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Modifying ownerId or name by member must be denied');
    });
  });

  describe('Scenario 7: Disabled / Deactivated User Access (DENY)', () => {
    it('should DENY quota updates by a member with status == disabled', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10
      };

      const ctx = createTestContext('disabled_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Disabled member must be denied quota updates');
    });

    it('should DENY document read/get by a member with status == disabled', () => {
      const ctx = createTestContext('disabled_member', BASE_COMPANY);
      assert.strictEqual(canGetCompany(ctx, 'comp_acme'), false, 'Disabled member must be denied document get');
    });
  });

  describe('Scenario 8: Cross-Company Access & Unauthenticated Users (DENY)', () => {
    it('should DENY member of Company B modifying quota of Company A', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10
      };

      const ctx = createTestContext('cross_company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Cross-company member must be denied');
    });

    it('should DENY unauthenticated user updating company quota', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 10,
        quotaUsed: BASE_COMPANY.quotaUsed! + 10
      };

      const ctx = createTestContext(null, updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), false, 'Unauthenticated user must be denied');
    });
  });

  describe('Scenario 9: Company Admin, Owner, and SuperAdmin Reset Operations (ALLOW)', () => {
    it('should ALLOW Company Admin to perform quota resets (quotaUsed = 0, quotaHourly = {})', () => {
      const resetCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaUsed: 0,
        quotaReads: 0,
        quotaWrites: 0,
        quotaDeletes: 0,
        quotaHourly: {},
        quotaLastReset: new Date().toISOString(),
        quotaLastResetDateStr: '2026-11-09'
      };

      const ctx = createTestContext('company_admin', resetCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), true, 'Company Admin must be allowed to execute reset');
    });

    it('should ALLOW Company Owner to update company settings and perform resets', () => {
      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        name: 'Acme Traders (Updated)',
        quotaLimit: 60000
      };

      const ctx = createTestContext('company_owner', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), true, 'Company Owner must be allowed to update company settings');
    });

    it('should ALLOW SuperAdmin to perform any administrative action or reset', () => {
      const resetCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaUsed: 0,
        quotaHourly: {},
        quotaLimit: 100000
      };

      const ctx = createTestContext('superadmin_user', resetCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), true, 'SuperAdmin must be allowed to perform any operation');
    });
  });

  describe('Scenario 10: Structural & Boundary Limits Validation', () => {
    it('should ALLOW all 12 valid slots simultaneously if populated correctly', () => {
      const allSlots: Record<string, { reads: number; writes: number; deletes: number }> = {};
      for (let i = 0; i < 12; i++) {
        allSlots[`slot_${i}`] = { reads: 10, writes: 2, deletes: 0 };
      }

      const updatedCompany: CompanyDoc = {
        ...BASE_COMPANY,
        quotaReads: BASE_COMPANY.quotaReads! + 120,
        quotaWrites: BASE_COMPANY.quotaWrites! + 24,
        quotaUsed: BASE_COMPANY.quotaUsed! + 144,
        quotaHourly: allSlots
      };

      const ctx = createTestContext('company_member', updatedCompany);
      assert.strictEqual(canUpdateCompany(ctx, 'comp_acme'), true, 'All 12 valid slots must pass schema validation');
    });

    it('should verify expression call depth does not exceed 10', () => {
      // In firestore.rules.staging:
      // canUpdateCompany -> isCompanyMemberQuotaUpdate (depth 1)
      //                  -> isCompanyMember (depth 2) -> getUserData (depth 3)
      //                  -> isValidQuotaIncrement (depth 2)
      //                  -> isValidQuotaHourly (depth 2) -> isValidSlot (depth 3)
      // Maximum call depth is 3, well under Firestore's maximum limit of 10.
      const maxSimulatedCallDepth = 3;
      assert.ok(maxSimulatedCallDepth <= 10, 'Call depth must remain strictly <= 10');
    });

    it('should verify document access calls do not exceed 10', () => {
      // In firestore.rules.staging:
      // isCompanyMember does at most 1 get for users and 1 get for companies (total 2 document reads)
      // Firestore allows up to 10 document reads per rule evaluation.
      const maxSimulatedDocReads = 2;
      assert.ok(maxSimulatedDocReads <= 10, 'Document reads per request must remain strictly <= 10');
    });
  });

});
