# Blueprint: Cart Validation

A short summary of the blueprint approved in CDA (version 6). The full requirements are in [requirements.md](requirements.md).

## 1. Goal

Limit the **total number of units in a cart** (all SKUs added together). The limit is set by an Admin user. Default: **10**.

## 2. How it works

1. Commerce calls the app through a webhook when a shopper:
   - adds an item to the cart,
   - changes the quantity of a cart item, or
   - logs in and the guest cart is merged into the customer cart.
2. The app reads the settings and the saved cart, and calculates the total before and after the change.
3. The change is **blocked** only if the total goes up **and** goes above the limit. The shopper sees:
   `You have reached the maximum number of items.`
4. If anything goes wrong (bad setting, cart cannot be read, bad payload), the change is **allowed** and an error is logged.

## 3. Webhooks

| Case | Webhook | App action | Scenarios |
| --- | --- | --- | --- |
| New item added | `observer.sales_quote_add_item` | `validate-cart-add` | S1, S2, S3, S5, S6 |
| Same item added again, or quantity changed | `observer.sales_quote_item_save_after` | `validate-cart-update` | S4, S4b, S5b, S8 |
| Guest cart merged at login | `observer.sales_quote_merge_after` | `validate-cart-merge` | S7 |
| Item removed | Not used (removing is always allowed) | — | Extra check |

All three webhooks use: type `before`, `required: false`, timeout 5 s, soft timeout 3 s, a fallback message, category `validation`, SaaS only.

A new item is checked twice (once when added, once when saved). This is expected.

## 4. Settings

Edited in **Commerce Admin > Apps > App Management > Cart Validation > Configure**.

| Setting | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Turns the check on or off |
| `maxCartQuantity` | `10` | Highest total number of units in a cart |

Settings are read on every call, so a change applies immediately, without redeploying.

## 5. Decisions

- A cart line is identified by `item_id`, not by SKU.
- Only parent lines are counted (configurable and bundle child lines are ignored).
- No storage: settings and cart are read from Commerce each time.
- No webhook signature verification (out of scope).
- Reporting is through logs only.

## 6. Known limitations

- Two changes at the same moment can both pass and go over the limit.
- Items added automatically by promotions are not checked.
- If the app is down or slow, changes are allowed (the check is skipped).

## 7. To confirm in the sandbox

- A blocked change really leaves the cart unchanged (update and merge webhooks).
- The cart read from Commerce shows the **old** quantities, not the new ones.
- The merge payload contains the merged items in `quote.items`.
- The webhook field names match the real payload.
- The whole check takes less than 2 seconds.
