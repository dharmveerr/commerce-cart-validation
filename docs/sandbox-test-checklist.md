# Sandbox Test Checklist: Cart Validation

Scenarios are from [requirements.md](requirements.md), section 4. Steps are in [deployment-and-live-testing.md](deployment-and-live-testing.md).

| Field | Value |
| --- | --- |
| Date | |
| Tester | |
| Commerce instance | |
| Code version (commit) | |

## Scenarios (limit = 10)

| # | Cart before | Action | Expected | Pass / Fail | Evidence |
| --- | --- | --- | --- | --- | --- |
| S1 | empty | Add A × 4 | Accepted, total 4 | | |
| S2 | A=4 | Add B × 6 | Accepted, total 10 | | |
| S3 | A=4, B=6 | Add C × 1 | **Blocked** with message, cart unchanged | | |
| S4 | A=6 | Add A × 2 | Accepted, A = 8 (not 14) | | |
| S4b | A=8 | Add A × 3 | **Blocked**, A stays 8 | | |
| S5 | A=3, B=3, C=3 | Add D × 2 | **Blocked**, total stays 9 | | |
| S5b | A=3, B=3, C=3 | Change B from 3 to 5 | **Blocked**, B stays 3 | | |
| S6 | A=4 | Limit → 5, add B × 2; limit → 10, add B × 2 | **Blocked**, then accepted | | |
| S7 | Customer cart 9; guest A=2, B=2 | Guest logs in | **Blocked**, customer cart stays 9 | | |
| S8 | A=8, limit → 5 | Change A from 8 to 6 | Accepted (total goes down) | | |

## Extra checks

| Check | Expected | Pass / Fail | Evidence |
| --- | --- | --- | --- |
| Validation off | Any total accepted | | |
| Remove an item (quantity 0) | Accepted | | |
| Configurable product × 2 | Counted as 2 | | |
| Invalid setting (`abc`) | Accepted, error logged | | |
| Admin "Create New Order" (repeat S3) | Same as S3 | | |

Message to check: `You have reached the maximum number of items.`
