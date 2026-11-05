# Sandbox Test Checklist: Cart Validation

Scenarios are from [requirements.md](requirements.md), section 4. Steps are in [deployment-and-live-testing.md](deployment-and-live-testing.md).

| Field | Value |
| --- | --- |
| Date | 2026-11-04 |
| Tester | dharmveerr@adobe.com |
| Commerce instance | ACCS sandbox (na1), Stage workspace |
| Code version (commit) | `ca38693` + fixes deployed 2026-11-04 |

## Scenarios (limit = 10)

| # | Cart before | Action | Expected | Pass / Fail | Evidence |
| --- | --- | --- | --- | --- | --- |
| S1 | empty | Add A × 4 | Accepted, total 4 | Pass | [S1](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S2 | A=4 | Add B × 6 | Accepted, total 10 | Pass | [S2](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S3 | A=4, B=6 | Add C × 1 | **Blocked** with message, cart unchanged | Pass | [S3](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S4 | A=6 | Add A × 2 | Accepted, A = 8 (not 14) | Pass | [S4](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S4b | A=8 | Add A × 3 | **Blocked**, A stays 8 | Pass | [S4b](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S5 | A=3, B=3, C=3 | Add D × 2 | **Blocked**, total stays 9 | Pass | [S5](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S5b | A=3, B=3, C=3 | Change B from 3 to 5 | **Blocked**, B stays 3 | Pass | [S5b](test-evidence.md#step-1--simple-products-logged-in-customer) |
| S6 | A=4 | Limit → 5, add B × 2; limit → 10, add B × 2 | **Blocked**, then accepted | Pass | [S6a/S6b](test-evidence.md#step-1--settings-from-app-management-no-redeploy) |
| S7 | Customer cart 9; guest A=2, B=2 | Guest cart merged into customer cart | **Blocked**, customer cart stays 9 | Pass | [S7](test-evidence.md#step-3--guest-cart-and-cart-merge) |
| S8 | A=8, limit → 5 | Change A from 8 to 6 | Accepted (total goes down) | Pass (unit test) | `test/validate-cart-update.test.js`; live decrease checks U1, C9 |

## Extra checks

| Check | Expected | Pass / Fail | Evidence |
| --- | --- | --- | --- |
| Validation off | Any total accepted | Pass | [D1/D2](test-evidence.md#step-1--settings-from-app-management-no-redeploy) |
| Remove an item (quantity 0) | Accepted | Pass | [U2, R1](test-evidence.md#step-1--simple-products-logged-in-customer) |
| Configurable product × 2 | Counted as 2 | Pass | [C1–C14](test-evidence.md#step-2--configurable--simple-products) |
| Invalid setting (`abc`) | Accepted, error logged | Pass (unit test) | `test/validate-cart-add.test.js` |
| Admin "Create New Order" (repeat S3) | Same as S3 | Not run | |
| Guest cart limit | Blocked above 10 | Pass | [G1–G3](test-evidence.md#step-3--guest-cart-and-cart-merge) |

Message to check: `You have reached the maximum number of items.`

Representative screenshots: [GraphQL add response](test-evidence.md#graphql-add-response), [blocked response](test-evidence.md#graphql-blocked-response), and [global configuration](test-evidence.md#global-configuration). These supplement the recorded results; unit-only and not-run checks above remain unchanged.
