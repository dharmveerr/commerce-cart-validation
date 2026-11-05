# Cart Validation: Requirements and Acceptance Criteria

## 1. Goal

Build an Adobe Commerce as a Cloud Service (ACCS) App Builder application that limits the **total number of units in a cart**. The limit is set by an Admin user and defaults to `10`.

## 2. Requirements

| ID | Requirement |
| --- | --- |
| R-1 | Use webhooks to validate the cart when an item is added, a quantity is changed, or a guest cart is merged into a customer cart at login. |
| R-2 | The limit is the **total units in the cart**: the sum of all line quantities, across all SKUs. |
| R-3 | The limit can be changed by an Admin user. Default: `10`. |
| R-4 | A change to the limit applies immediately, without code changes or redeployment. |
| R-5 | An existing SKU is counted once, at its new quantity (no double counting). |
| R-6 | When the limit would be exceeded, the change is blocked with the agreed message and the cart stays unchanged. |
| R-7 | Reducing or removing items is always allowed, even if the cart is still above the limit (for example after the Admin lowers the limit). |
| R-8 | Deploy and validate in an ACCS sandbox, not production. |

**Agreed message:** `You have reached the maximum number of items.`

> The action step says "maximum **amount** of items" and the acceptance criterion says "maximum **number** of items". We use **number**: "items" are countable, and it matches the acceptance criterion. Keep the text in one constant so it is easy to change. The same message is used for every block, including a blocked cart merge.

## 3. Acceptance criteria

| # | Acceptance criterion | Covered by |
| --- | --- | --- |
| AC-1 | Cart below the configured limit is accepted. | S1 |
| AC-2 | Cart at the configured limit behaves as expected (accepted). | S2 |
| AC-3 | Cart exceeding the limit displays the agreed message. | S3, S4b, S5, S5b, S7 |
| AC-4 | Existing SKU quantities are handled correctly, without double counting. | S4, S4b |
| AC-5 | Admin configuration changes take effect without code changes or redeployment. | S6 |
| AC-6 | Local and sandbox validation is completed. | Unit tests + sandbox tests for all scenarios |
| AC-7 | Pull request includes code, README/setup/configuration, and test evidence. | Section 10 |

Success measure 1 also requires **aggregation across SKUs**, which is covered by S5 and S5b.

## 4. Scenarios (limit = 10)

S1 to S6 are the six agreed scenarios. S7 and S8 are extra checks for the merge and reduce paths. Each scenario needs a unit test and a sandbox test.

| # | Scenario | Cart before | Action | Total | Expected |
| --- | --- | --- | --- | --- | --- |
| S1 | Below limit | empty | Add A × 4 | 4 | Accepted |
| S2 | At limit | A=4 | Add B × 6 | 10 | Accepted |
| S3 | Exceeding limit | A=4, B=6 | Add C × 1 | 11 | **Blocked** with the message. Cart unchanged. |
| S4 | Existing SKU | A=6 | Add A × 2 (line becomes 8) | 8, not 14 | Accepted |
| S4b | Existing SKU over limit | A=8 | Add A × 3 (line becomes 11) | 11 | **Blocked** |
| S5 | Aggregation across SKUs | A=3, B=3, C=3 | Add D × 2 | 11 | **Blocked** |
| S5b | Update a quantity | A=3, B=3, C=3 | Change B from 3 to 5 | 11 | **Blocked** |
| S6 | Admin changes the limit | A=4 | Admin sets limit to 5 (no redeploy), then add B × 2 | 6 | **Blocked**. Set the limit back to 10, then add B × 2 again: accepted. |
| S7 | Guest cart merged at login | Customer cart = 9 units; guest cart A=2, B=2 | Guest logs in | 13 | **Blocked** with the message. The whole merge is blocked; the customer cart stays at 9. |
| S8 | Reduce when over the limit | A=8 (limit then lowered to 5) | Change A from 8 to 6 | 6 | **Accepted**, because the total goes down |

**Extra checks:** validation disabled (any total accepted); quantity `0` (line removed, accepted); a configurable product counted once (parent line only).

## 5. Counting rule

1. Total = the sum of the quantities of all cart lines.
2. For a changed line, use its **new** quantity instead of the old one. This is how an existing SKU avoids double counting.
3. A configurable or bundle product has a parent line and child lines. Count the **parent line only**.
4. If the change lowers the total (smaller quantity, or quantity `0` for removal), always allow it.
5. Otherwise, if the new total is greater than the limit, block. If not, allow.

The webhook payload may contain only the changed line. In that case, read the rest of the cart from Commerce (cart items API) to calculate the total.

## 6. Settings (Admin)

Edit in **Commerce Admin > Apps > App Management > Cart Validation > Configure**. No separate Admin page is needed.

| Setting | Default | Meaning |
| --- | --- | --- |
| Enabled | Yes | Turns the validation on or off |
| Maximum cart units | 10 | Highest total number of units allowed in a cart. Must be a whole number of 1 or more. |

If the saved value is invalid (for example `0` or text), carts are allowed and an error is logged, so a bad setting never blocks shoppers.

## 7. Non-functional needs

- **Speed:** each check must answer well within the webhook timeout (target under 3 seconds).
- **Reliability:** if the settings or the cart cannot be read, allow the change and log an error. Only the limit rule blocks.
- **Security:** no hard-coded URLs, tokens or secrets. Logs contain no customer data or tokens.
- **Portability:** works for any ACCS project that installs the app (no fixed store URL).

## 8. Assumptions

- A bundle or configurable product counts as its parent quantity. For example, 2 bundles count as 2 units, regardless of the bundle's contents.
- The limit applies to storefront carts (guest and logged-in). Admin "Create New Order" uses the same cart and is expected to follow the same rule; confirm in the sandbox.
- One global limit for the whole store.
- **Merge is all or nothing:** if the merged total is over the limit, the whole merge is blocked with the same message. No partial merge. Login itself is not blocked.
- CDA reviews and confirms the webhook names and payload fields, and documents them.

## 9. Out of scope

- A per-line (per-SKU) limit. Commerce already has this setting built in.
- Automatically reducing quantities.
- Different limits per store or customer group.

## 10. Done when

- [ ] All scenarios (S1 to S8) pass in local unit tests.
- [ ] All scenarios pass in the ACCS sandbox, with screenshots or logs as evidence.
- [ ] One pull request with code, README, setup/configuration steps and test evidence.
- [ ] Review comments resolved.
- [ ] Demo and handoff done.
