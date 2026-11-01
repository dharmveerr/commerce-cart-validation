# Implementation guide and evidence — cart validation

## As-built file map
| Path | What is implemented |
| --- | --- |
| `app.commerce.config.ts` | SDK metadata, `enabled`/`maxCartQuantity` schema, three SaaS validation webhook subscriptions and field mappings. |
| `app.config.yaml` | Includes `commerce/extensibility/1` and `commerce/configuration/1`. |
| `src/commerce-extensibility-1/ext.config.yaml` | Generated App Management action definitions plus custom `cart-validation` package with three authenticated Node.js 24 actions and IMS inputs. |
| `src/commerce-extensibility-1/actions/validate-cart-{add,update,merge}/index.js` | Thin ESM entrypoints with top-level fail-open catch. |
| `src/commerce-extensibility-1/lib/validate-cart.js` | Shared response orchestration and outcome/error-type logging. |
| `src/commerce-extensibility-1/lib/{parse-webhook-payload,cart-limit-rule,constants}.js` | Payload normalization, parent-only totals, one exact exception message. |
| `src/commerce-extensibility-1/lib/{settings,commerce-cart-client}.js` | Live global config read and authenticated cart items GET with bounded retry. |
| `test/*.test.js` | Five `node:test` suites for rule, parser and shared handler flows. |
| `src/**/.generated/` | SDK-owned manifest, configuration schema and installation actions; regenerate via SDK, never edit manually. |

## Setup and validation
1. Use Node.js 24 and a Developer Console workspace subscribed to I/O Management API, ACCS-REST-API and OAuth Server-to-Server. Keep local `.env` and IMS secrets out of commits.
2. Run `npm install`. Regenerate derived artifacts after typed config changes using the SDK (`aio-commerce-lib-app generate all`), then run `npm run typecheck`, `aio app build`, and `npm test`. Do not hand-edit generated manifest/actions. The last workspace validation ran App Builder build and `npm test` successfully: **8 actions built, 22 tests passed**. This is local evidence, not live Commerce evidence; the explicit standalone `npm run typecheck` is listed as a recommended step, not a claimed prior result.
3. A deploy, if authorized separately, must use project-managed credentials. Install/associate the deployed app through Commerce Admin App Management, then configure global `enabled` and `maxCartQuantity`. Deployment alone does not prove hooks are installed. No deploy was requested or performed in this documentation task.
4. Follow [sandbox checklist](sandbox-test-checklist.md). Capture before/after cart totals, actual visible text, latency and non-sensitive webhook diagnostics. Complete [AC mapping](ac-to-test-mapping.md) with links before PR acceptance.

## Key implementation behavior
`validateCart(params, kind)` parses payload first, reads settings, short-circuits if disabled, reads the current cart and compares before/after. Add/update replace the quantity of the matching `item_id` (or treat a missing ID as a new line); merge sums `quote.items` from the webhook as the prospective cart and **does not calculate a combined cart from `source.items`**. A block returns `ok(exceptionOperation('You have reached the maximum number of items.'))`; any parsing/config/cart/rule failure returns `ok(successOperation())` and logs only the error class. Missing/null settings use defaults; malformed non-null values are invalid. The fallback error message configured on the webhook is distinct from the limit exception.

## Tests and evidence boundaries
The test suites are `test/cart-limit-rule.test.js`, `test/parse-webhook-payload.test.js`, `test/validate-cart-add.test.js`, `test/validate-cart-update.test.js`, and `test/validate-cart-merge.test.js`. They exercise shared behavior with injected cart/settings/logger dependencies; they do **not** invoke Commerce, prove exact webhook event timing, call the real Admin config/REST services, verify a deployed cart remains unchanged, or constitute end-to-end tests of every entrypoint. S1–S8 labels are interpreted from available ACs, not confirmed against the missing `requirements.md`. See [blueprint](blueprint.md) for the awaiting-user gate.

## Operational risks and next actions
- Confirm webhook events can register on the target SaaS environment; confirm `data.quote_item.*` and `data.item.*` projections, quote IDs and merge object structure against sanitized sandbox payloads. `observer.sales_quote_item_save_after` / `observer.sales_quote_merge_after` with `webhook_type: "before"` still need a real rollback/unchanged-cart test.
- Ensure REST GET reads the **pre-change** cart; if the candidate quantity is already present, an over-limit increase can be mistakenly allowed. Verify parent/child handling and options-split SKU cases.
- Measure end-to-end duration including config and association; two HTTP attempts at nominal 650 ms plus 100 ms backoff alone do not prove <2 seconds.
- Test error paths/disabled setting and concurrency. `required: false` and fail-open handling intentionally permit unvalidated operations on failures; no idempotency store or webhook signature verification is implemented by design.
- Obtain the literal requirements document, finish sandbox evidence, create the PR with code/docs/test evidence, and obtain approval before describing AC-6/AC-7 as complete.

## Further reading
[Solution design](solution-design.md) · [HLD](hld.md) · [LLD](lld.md) · [Blueprint](blueprint.md) · [AC mapping](ac-to-test-mapping.md) · [Sandbox checklist](sandbox-test-checklist.md).
