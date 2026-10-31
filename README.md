# Cart Validation

## 1. Overview
ACCS App Builder app `cart-validation` enforces the total number of units in a cart (parent lines only). Increases above the configured limit return **You have reached the maximum number of items.** Decreases, removals and unchanged totals pass even when the cart is already over the limit. Technical failures fail open and log only error type/outcome, not customer data.

## 2. Prerequisites
Node.js 24, Adobe Developer Console App Builder workspace with I/O Management API, ACCS-REST-API and OAuth Server-to-Server subscription, App Management access, and a SaaS Commerce test instance. Keep `.env` out of source control; credentials and endpoints must come from project setup, not code.

## 3. Setup
Run `npm install`, then `aio app build`. The SDK owns `.generated/` and the installation action: never edit generated files. App configuration is in `app.commerce.config.ts`; runtime registrations are in `src/commerce-extensibility-1/ext.config.yaml`.

## 4. Configuration
After installing/associating the app in Commerce Admin App Management, set `enabled` (boolean, default true) and `maxCartQuantity` (positive whole number, default 10). The current SDK configuration schema offers no numeric input type, so `maxCartQuantity` is a text control defaulting to `"10"` and validated strictly on every invocation. Invalid settings allow changes and log an error. Global scope is used; configuration changes are read live without redeployment.

## 5. Webhook rationale
| Registration | Payload | Rationale |
| --- | --- | --- |
| `observer.sales_quote_add_item` / `before` | `sku`, `qty`, `quote_id`, `item_id`, `product_type`, `product_option` selected from `quote_item` | Intended add interception; fetch other cart lines. |
| `observer.sales_quote_item_save_after` / `before` | Same fields selected from `item` | Intended quantity-change interception; match line by `item_id`, not SKU. |
| `observer.sales_quote_merge_after` / `before` | Nested `quote` and `source`; no field projection | Intended guest merge interception; nested field projection not established. |

Each registration is SaaS-only `validation`, batch `cart_validation`, POST, `required: false`, `timeout: 5000`, `soft_timeout: 3000`, and a friendly fallback message. Actions are HTTP-invokable with Adobe authentication and IMS credentials. `sales_quote_product_add_after` is not chosen because it is too late to block an add reliably; `sales_quote_merge_before` is not chosen because the prospective combined quote shape has not been verified. **Verify registration/event availability and exact pre-persistence payload timing on the target ACCS version before relying on enforcement**; a `before` webhook type on an `*_after` observer event is not by itself proof the mutation can be rolled back.

## 6. Deploy
Build locally with `aio app build`, inspect the generated manifest and only then deploy through the team's approved release workflow. Do not commit credentials. Deployment is a separate decision and has not been performed here.

## 7. Install and test
Install/associate the deployed app from Commerce Admin App Management; deployment alone does not install hooks. Run `npm test` locally and follow `docs/sandbox-test-checklist.md` in sandbox. Attach actual sandbox results and local test output to the pull request before acceptance.

## 8. Known limitations
Synchronous hooks fail open on timeout and operational errors (`required: false`), so the limit is not a hard guarantee during outages. Parallel cart mutations, Admin Create-Order paths, and merge payload/pre-persistence behavior require sandbox verification. The Commerce cart GET response may reflect an already-applied candidate line: this could prevent detection of an increase. There is no signature verification, persistence, or reporting database, per approved scope. Only parent lines are counted; malformed quantities fail open. Keep all cart client work under two seconds (one 650 ms attempt, one 650 ms retry after 100 ms backoff).

## 9. Assumptions and evidence boundaries
The literal `requirements.md` is not available in this workspace. S1–S8 scenario names below are inferred from the supplied acceptance-criteria mapping and not quotations from that attachment. Confirm the source document and the exact webhook payload paths before approving the PR. API permissions and webhook rollout must be validated in sandbox; no sandbox execution was possible locally.

## 10. AC-to-test mapping
See `docs/ac-to-test-mapping.md`; automated tests cover the rule, parser and action responses, not deployed end-to-end behavior. PR evidence must include local `npm test` output and completed sandbox checklist.
