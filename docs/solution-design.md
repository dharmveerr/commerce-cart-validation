# Solution Design: Cart Validation

## 1. Problem

The client wants to limit how many units a shopper can have in one cart. The limit is the **total across all products**, not per product.

## 2. Solution

An Adobe App Builder app for Adobe Commerce as a Cloud Service (ACCS). It is installed through App Management and uses Commerce webhooks to check every cart change before it is saved.

- App ID: `cart-validation`
- Runtime: Node.js 24, ES modules

## 3. What the shopper sees

| Situation | Result |
| --- | --- |
| Total stays at or below the limit | Change allowed |
| Total goes above the limit | Change blocked with `You have reached the maximum number of items.` Cart unchanged. |
| Shopper lowers a quantity or removes an item | Always allowed, even if the cart is still above the limit |
| Guest cart merge at login goes above the limit | Whole merge blocked with the same message. Login still works. |
| Validation turned off | Change allowed |
| Technical problem (bad setting, Commerce not reachable, bad data) | Change allowed, error logged |

Two different messages exist:

- **Limit message:** `You have reached the maximum number of items.` (the limit is reached)
- **Fallback message:** `We could not validate your cart right now. Please try again.` (shown by Commerce only if the webhook itself fails)

## 4. What the Admin sees

Two settings in **Apps > App Management > Cart Validation > Configure**:

- **Enable cart validation** (on/off, default on)
- **Maximum total cart quantity** (whole number, default 10)

The SDK has no number field, so the limit is a text field. The app checks it on every call. An invalid value (for example `0` or `abc`) means carts are allowed and an error is logged.

## 5. Counting rule

1. Add up the quantities of all cart lines.
2. For the changed line, use its **new** quantity (not old + new).
3. Count only the parent line of a configurable or bundle product.
4. Block only if the new total is **higher than before** and **higher than the limit**.

## 6. Not included

- A per-product limit (Commerce already has one).
- Automatically reducing quantities.
- Different limits per store or customer group.
- A dashboard or reports (logs only).

## 7. Risks

| Risk | Impact | Action |
| --- | --- | --- |
| The update and merge webhooks may run after the change is saved | A block might not undo the change | Check in the sandbox |
| App down or slow | Changes are allowed without a check | Accepted (fail-open by design) |
| Two changes at the same moment | Cart can go over the limit | Accepted, documented |
| Items added by promotions | Not checked | Accepted, documented |

See also: [hld.md](hld.md), [lld.md](lld.md).
