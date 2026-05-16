# Security Specification for Profitly UMKM

## Data Invariants
1. A Sale cannot exist without a valid productId that exists in the products collection.
2. Total Profit must be correctly calculated as (sellingPrice - costPrice) * quantity.
3. Selling price should generally be greater than or equal to cost price.
4. Stock quantities cannot be negative unless explicitly allowed for specific scenarios (but here we want to avoid it).
5. All transactions must have a valid server timestamp.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthorized Write**: Try to create a product without being logged in.
2. **Identity Spoofing**: Logged in as User A, try to delete a record belonging to User B (if we had per-user isolation, but here we assume a shared UMKM dashboard for the tenant).
3. **Price Poisoning**: Create a product with `sellingPrice: 1000000000000` (overflow/exhaustion).
4. **Invalid Type**: Create a sale with `quantity: "five"` (string instead of number).
5. **Negative Value**: Create a product with `stock: -100`.
6. **Shadow Field**: Update a product with an extra field `isVerified: true`.
7. **Bypass Modal**: Create a sale where `totalCost` is set to 0 even if the product has a cost.
8. **Orphaned Sale**: Create a sale for a `productId` that doesn't exist.
9. **Debt status shift**: Change debt status from `Lunas` back to `Belum Lunas` without proper authorization (if restricted).
10. **Huge ID**: Create a product with a document ID that is 1MB in size.
11. **Future Date**: Set `date` to a year in the future.
12. **Blanket Read**: Try to list all users' data if the system was multi-tenant (here it's single UMKM instance, but we check for auth).

## The Test Runner (firestore.rules.test.ts)
(Implementation would follow here in a real test suite)
