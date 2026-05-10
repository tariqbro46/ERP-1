# Security Specification - TallyFlow ERP

## Data Invariants
1. **Company Ownership**: Only the creator/owner of a company or a SuperAdmin can manage company settings and delete the company.
2. **Membership Isolation**: Users can only read/write data (Ledgers, Vouchers, Items) belonging to their own company.
3. **Immutable Identity**: `companyId` and `ownerId` fields must remain unchanged after creation.
4. **Voucher Integrity**: Voucher entries and inventory entries must be linked to a valid voucher and match the company ID.
5. **Role-Based Access**: Only Admins/Founders can delete master data (Ledgers, Items). Staff can only update.
6. **Verified Users**: All write operations require a verified email.

## The Dirty Dozen Payloads (Attack Vectors)
1. **Identity Spoofing**: Attempt to create a ledger with `companyId` of a different company.
2. **Privilege Escalation**: Attempt to update user profile to set `role: 'Founder'`.
3. **Orphaned Write**: Create a `voucher_entry` without a parent `voucher` or with a mismatched `voucher_id`.
4. **Shadow Update**: Add a field `is_system_verified: true` to a voucher.
5. **Identity Poisoning**: Use a 1MB string as a document ID.
6. **Cross-Company Leak**: Attempt to list vouchers with a `where('companyId', '==', 'OTHER_COMPANY')` clause.
7. **Timestamp Spoofing**: Provide a client-side `createdAt` date into the past.
8. **Negative Debit**: Attempt to create a voucher entry with `debit: -100`.
9. **Inventory Drain**: Attempt to set `current_stock` directly via a client update on an `item` (bypassing vouchers).
10. **Admin Lockout**: Attempt to delete the founder's user record.
11. **PII Leak**: Attempt to read the full `users` collection as a non-admin.
12. **Recursive Cost Attack**: Rapidly write/delete to a collection to exhaust quota (Denial of Wallet).

## Mitigation Strategies
- Use `isVerified()` on all write operations.
- Use `isCompanyMember(companyId)` for all data access.
- Use `affectedKeys().hasOnly()` for granular updates.
- Implement `isValid[Entity]` for strict schema validation.
- Enforce `request.time` for all timestamps.
- Global deny-all catch-all.
