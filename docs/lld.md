# Low-Level Design: Cart Validation

## 1. Webhooks

All three: type `before`, `POST`, `required: false`, `timeout: 5000`, `soft_timeout: 3000`, category `validation`, env `saas`, batch `cart_validation`, fallback message `We could not validate your cart right now. Please try again.`

| Hook name | Webhook | Action | Fields sent |
| --- | --- | --- | --- |
| `validate_cart_add` | `observer.sales_quote_add_item` | `validate-cart-add` | `sku`, `qty`, `quote_id`, `item_id`, `product_type`, `product_option` from `data.quote_item` |
| `validate_cart_update` | `observer.sales_quote_item_save_after` | `validate-cart-update` | Same fields from `data.item` |
| `validate_cart_merge` | `observer.sales_quote_merge_after` | `validate-cart-merge` | Full payload: `data.quote` (with `entity_id`, `items`) and `data.source` (with `items`) |

## 2. Reading the payload (`parse-webhook-payload.js`)

| Kind | Input | Output |
| --- | --- | --- |
| add | `data.quote_item` | `{ quoteId, changedItem }` |
| update | `data.item` | `{ quoteId, changedItem }` |
| merge | `data.quote`, `data.source` | `{ quoteId, nextItems: quote.items }` |

A line must have a `sku`, and a `qty` of 0 or more. Add and update also need a `quote_id`. If anything is missing, an error is raised and the change is allowed.

## 3. Counting rule (`cart-limit-rule.js`)

```text
before = sum of qty of parent lines in the saved cart

merge:        after = sum of qty of parent lines in quote.items
add / update: after = before - (old qty of the same item_id, or 0 if new) + new qty

block = after > before AND after > maxCartQuantity
```

- A parent line has no `parent_item_id`.
- A line without `item_id` is a new line.
- Two lines with the same SKU but different `item_id` are counted separately.

**Examples (limit 10):**

| Scenario | before | after | Result |
| --- | --- | --- | --- |
| S4: A=6, add A×2 | 6 | 6 − 6 + 8 = 8 | Allowed |
| S5b: A=3, B=3, C=3, change B to 5 | 9 | 9 − 3 + 5 = 11 | Blocked |
| S8: A=8, limit 5, change A to 6 | 8 | 6 | Allowed (total went down) |

## 4. Reading the cart (`commerce-cart-client.js`)

- Calls `GET carts/{quoteId}/items` with the Commerce client of the installed app.
- Timeout of 1500 ms for each call (stays within the 5000 ms webhook hard timeout including one retry).
- Retries once after 100 ms on 502, 503, 504, `ETIMEDOUT` or `ECONNRESET`.

## 5. Reading the settings (`settings.js`)

- Reads `enabled` and `maxCartQuantity` at global scope, on every call.
- If a value is empty, the default is used (`true`, `10`).
- `maxCartQuantity` must be a whole number of 1 or more. Otherwise an error is raised and the change is allowed.

## 6. Replies to Commerce (`validate-cart.js`)

| Case | Reply |
| --- | --- |
| Allowed | `successOperation()` |
| Blocked | `exceptionOperation('You have reached the maximum number of items.')` |
| Any error | `successOperation()` plus an error log |

## 7. Error handling

| Error | Result |
| --- | --- |
| Bad or missing payload | Allowed, error logged |
| Invalid setting | Allowed, error logged |
| Settings cannot be read | Allowed, error logged |
| Cart cannot be read (after 1 retry) | Allowed, error logged |
| Any other error | Allowed, error logged |

Logs contain only the result and the error type. No customer data, payloads or tokens.

## 8. Security

- Actions require Adobe authentication (`require-adobe-auth: true`).
- Credentials come from the App Builder project, never from code.
- `.env` is not committed.
