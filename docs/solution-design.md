# Solution design — cart validation

## Purpose and status
This is an **as-built design with unverified integration assumptions**, not a claim of live enforcement. App ID: `cart-validation`; target: Adobe Commerce as a Cloud Service (ACCS), Adobe App Builder, Node.js 24 ES modules. The app aims to reject only cart changes that **increase** the total number of units beyond an Admin-configured maximum. A rejection must show exactly **You have reached the maximum number of items.** and leave the cart unchanged. Unit/build validation passed previously; installation, sandbox behavior and cart-unchanged verification have not been demonstrated.

## Scope
- Three synchronous webhook paths: add item, update item quantity, and guest-cart merge. Add/update project `sku`, `qty`, `quote_id`, `item_id`, `product_type`, `product_option`; merge receives its unprojected payload.
- Read `enabled` (boolean, default `true`) and `maxCartQuantity` (positive whole number, default `10`) at global configuration scope per request. The supported schema presents the latter as **text** (`"10"`); runtime validates it.
- Count quantities of top-level/parent cart lines across all SKUs; child rows do not add to the total. Identify an existing line by `item_id`, never by SKU alone. Allow decreases/removals/unchanged totals even while over the limit.
- Technical errors allow the operation and log an error type; no persistence, idempotency database, signature verification, or analytics store (approved storage decision: none, blueprint version 6).

## User-visible behavior
| Situation | Intended result |
| --- | --- |
| Validation disabled | Change allowed. |
| Increasing total to or below limit | Change allowed. |
| Increasing total beyond limit | Webhook exception with exact message; intended unchanged cart, **requires sandbox proof**. |
| Reducing/removing/unchanged total | Change allowed, including when already above limit. |
| Invalid payload, invalid setting, or failed config/cart read | Change allowed; non-sensitive error log. |

## Operating model
App Management installs the Commerce webhooks generated from `app.commerce.config.ts`. Each hook routes to one authenticated App Builder action in `src/commerce-extensibility-1/actions/`, which delegates to `lib/validate-cart.js`. That shared module parses the payload, reads live business config, obtains current cart items with an IMS-authenticated Commerce client, calls the pure rule, and returns `ok(successOperation())` or `ok(exceptionOperation(BLOCK_MESSAGE))`. Configuration is not cached by the app.

## Non-functional and security design
All three hooks use `category: "validation"`, `env: ["saas"]`, batch `cart_validation`, POST, `required: false`, `timeout: 5000`, `soft_timeout: 3000`, and `fallback_error_message: "We could not validate your cart right now. Please try again."` Actions run on `nodejs:24`, `web: "yes"`, with `final: true`, `require-adobe-auth: true`, and `include-ims-credentials: true`. Secrets and Commerce URLs come from the installed app association and action inputs, never from literals; error logs omit tokens, payloads and customer information. A single retry follows transient cart HTTP failures (502/503/504 or timeout/reset) with 100 ms delay and a 650 ms request timeout **as passed to the client**; this is not proof of a <2-second complete check because client setup/config calls are not separately time-bounded.

## Decisions, risks and release gate
`required: false` preserves the fail-open policy, so availability is prioritized over strict enforcement. In particular, `observer.sales_quote_item_save_after` and `observer.sales_quote_merge_after` have *after* in the observer name although the webhook's `webhook_type` is `before`: whether a rejection prevents persistence is **not established**. The GET cart items response could already include the candidate change; the merge handler currently treats `quote.items` as the prospective final cart and parses but does not use `source.items` for arithmetic. Parallel writes and Admin Create-Order may bypass the intended rule. Confirm payload timing, parent/child representation, REST permissions, hook availability, visible exception text and unchanged cart in sandbox before rollout. If these assumptions fail, redesign the hook/quote calculation rather than treating unit tests as proof. See [sandbox checklist](sandbox-test-checklist.md), [AC mapping](ac-to-test-mapping.md) and [LLD](lld.md).

## Sources
- [App Management webhook configuration](https://developer.adobe.com/commerce/extensibility/app-management/installation/webhooks/) and [webhook response operations](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-webhooks/docs/usage.md).
- [App Management Commerce client/association](https://developer.adobe.com/commerce/extensibility/app-management/helpers/) and [Commerce webhook API properties](https://developer.adobe.com/commerce/extensibility/webhooks/api/).
- Repository source is authoritative for this app's **implemented** behavior; vendor references describe the interfaces, not proof that this specific hook combination works end-to-end.
