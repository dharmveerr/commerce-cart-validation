# Low-level design (LLD) — cart validation

## Configuration and webhook contract
`app.commerce.config.ts` declares `enabled: boolean = true` and `maxCartQuantity: text = "10"`. The runtime accepts only text convertible via `/^[1-9]\d*$/` to a safe integer; a missing/null config value falls back to the defaults. Settings are read using `initialize({ schema })` and `getConfigurationByKey` at `byCodeAndLevel('global', 'global')` each call. All three webhook registrations have `webhook_type: "before"`, POST, `required: false`, timeout `5000`, soft timeout `3000`, fallback `We could not validate your cart right now. Please try again.`, category `validation`, env `["saas"]`, batch `cart_validation`.

| Action / hook | Source fields and expected input | Normalized result |
| --- | --- | --- |
| `validate-cart-add` / `observer.sales_quote_add_item` / `validate_cart_add` | `data.quote_item.{sku,qty,quote_id,item_id,product_type,product_option}` projected individually to named fields; parser also accepts `data.quoteItem` and flat fields. | `{ kind:'add', quoteId, changedItem }` |
| `validate-cart-update` / `observer.sales_quote_item_save_after` / `validate_cart_update` | Same six fields from `data.item.*`; parser also accepts flat fields. | `{ kind:'update', quoteId, changedItem }` |
| `validate-cart-merge` / `observer.sales_quote_merge_after` / `validate_cart_merge` | Unprojected `data.quote` with `entity_id`, `items[]` and `data.source.items[]`. | `{ kind:'merge', quoteId, nextItems:quote.items, sourceItems:source.items }` |

Actual projected webhook envelope and whether merge has a fully updated `quote.items` have **not** been confirmed against a live sandbox. The parser accepts `params.data`, `params.body`, or the params object itself. Required add/update inputs are a nonempty `sku`, numeric nonnegative `qty`, and `quote_id`; merge requires both item arrays and a `quote.entity_id`. Missing/invalid input raises; the orchestrator catches it and allows the change.

## Decision algorithm (`cart-limit-rule.js`)
```text
before = sum(Number(qty) for parent items in currentItems)
if nextItems is provided (merge): after = sum(parent qty in nextItems)
else (add/update):
    matching = parent row in currentItems with same item_id (if supplied)
    after = before - Number(matching.qty or 0) + Number(changedItem.qty)
blocked = (after > before) && (after > maxCartQuantity)
```
Parent means `parent_item_id`, `parentItemId` and `parent_item` are all absent/null. Rows sharing an SKU but with different `item_id` are distinct. An add without `item_id` is treated as a new row. A zero `qty` removes that row from the arithmetic. The rule throws on invalid max/qty or duplicate matching IDs. It returns `{ blocked, before, after, message }`; only blocked verdicts carry `BLOCK_MESSAGE = 'You have reached the maximum number of items.'`. A decrease or unchanged total is always allowed even if the resulting total exceeds the limit.

## External read and response
`commerce-cart-client.js` requires a numeric quote ID and uses `getCommerceClient(resolveImsAuthParams(params))`, built from the app's merchant association and IMS inputs; GET path is `carts/{quoteId}/items`. The code passes `{ timeout: 650 }` to GET, retries once on HTTP 502/503/504, `ETIMEDOUT`, or `ECONNRESET` after a 100 ms pause; malformed responses throw. `validate-cart.js` runs parse → readSettings → (if enabled) readCartItems → checkLimit, logging `allowed`, `blocked`, or sanitized error type. It uses `ok(successOperation())` for allowed/errors and `ok(exceptionOperation(BLOCK_MESSAGE))` for limits. Unexpected entrypoint exceptions are caught and return the success operation. **No guarantee of total <2 seconds:** config initialization/reads and client construction are not capped by this file.

## Security and test seams
The `cart-validation` Runtime actions are `web: "yes"`, `runtime: nodejs:24` and annotated `final: true`, `require-adobe-auth: true`, `include-ims-credentials: true`; manifest action inputs are `LOG_LEVEL` and six `AIO_COMMERCE_AUTH_IMS_*` settings (client ID, client secrets, technical account ID, technical account email, org ID and scopes). The shared orchestrator accepts injectable `logger`, `parse`, `settings`, and `cart` dependencies to unit-test behavior without network calls. No tokens, request bodies, SKU, or customer identifiers are written to logs. Do not edit SDK-generated assets or include `.env` in source control.

## Unverified contract / correctness checkpoints
1. A `before` hook attached to an `*_after` observer must actually prevent a persisted cart change; verify both update and merge in sandbox.
2. The GET cart may already include the candidate row/qty; if so `before` is miscomputed and legitimate over-limit changes may pass. Prove pre-change baseline for add/update/merge.
3. `sourceItems` is parsed but **not used** by the current merge rule; verify whether `quote.items` is prospective, not pre-merge, and account for same-item merging correctly.
4. Child row types/field names from REST and webhook must match the parent filter. Verify `item_id` on new and existing lines, permissions for GET, and whether Commerce delivers projected fields flat or nested.
5. Invalid setting behavior is nuanced: missing/null values use defaults; malformed non-null values fail open. See [sandbox checklist](sandbox-test-checklist.md) for evidence required.

## References
[Commerce webhook response helpers](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-webhooks/docs/usage.md) · [App Management client helper](https://developer.adobe.com/commerce/extensibility/app-management/helpers/) · [AC mapping](ac-to-test-mapping.md).
