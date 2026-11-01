# High-level design (HLD) — cart validation

## System context
```text
Shopper cart change (ACCS)
    | add / update / guest merge, synchronous webhook (installation required)
    v
Commerce webhook dispatcher -> App Builder authenticated Runtime web action
                                  |               |
                                  |               +--> App Management configuration (live global settings)
                                  |               +--> Commerce REST Cart Items (IMS/association)
                                  v
                           Pure cart-limit rule
                                  |
                   successOperation / exceptionOperation
                                  v
                            Commerce -> shopper
```
The diagram shows the intended request flow; whether Commerce's selected observers execute early enough to preserve an unchanged cart on exception must be checked in sandbox.

## Boundaries and components
| Component | Responsibility | Source of truth |
| --- | --- | --- |
| SDK typed app config | App metadata, webhook subscriptions, Admin fields | `app.commerce.config.ts` |
| App Builder manifests | Declare `/commerce/extensibility/1` and `/commerce/configuration/1`; three user actions | `app.config.yaml`, `src/commerce-extensibility-1/ext.config.yaml` |
| Entrypoints | Catch unexpected errors, dispatch `add` / `update` / `merge` | `src/commerce-extensibility-1/actions/validate-cart-{add,update,merge}/index.js` |
| Orchestrator | Parse → settings → cart GET → rule → webhook operation/log | `src/commerce-extensibility-1/lib/validate-cart.js` |
| Domain logic | Normalize payload, count only parents, compare before/after | `src/commerce-extensibility-1/lib/{parse-webhook-payload,cart-limit-rule,constants}.js` |
| IO adapters | Read global Admin settings, get associated merchant's cart items | `src/commerce-extensibility-1/lib/{settings,commerce-cart-client}.js` |
| Generated assets | Derived manifest/schema and App Management actions | `.generated/` directories; **not manually edited** |

## Interactions
1. Once associated/installed, Commerce calls the appropriate POST hook, supplying fields for add/update or unprojected merge objects.
2. Runtime authenticates the web action at the gateway; IMS credential inputs are available for Commerce REST calls. The shared orchestrator validates payload shape and reads Admin settings anew.
3. If enabled, the action fetches `carts/{quoteId}/items`. For an add/update line the rule replaces the matching existing `item_id` quantity or appends a new line; for merge it sums the payload's `quote.items` as the prospective total, comparing with the fetched cart.
4. It returns the library's success or exception operation with HTTP 200 wire response. Errors cause success rather than a technical 5xx so failures are fail-open.

## Deployment/runtime topology
`app.config.yaml` includes the two SDK Commerce extension points. The generated App Management installation action registers subscriptions when the deployed app is installed/associated in Commerce Admin; building or deploying alone does **not** confirm installation. The action package is `cart-validation`, not the reserved generated `app-management` package. App Builder config provides Node.js 24; package modules use ESM. The typed config is transformed into a generated manifest during build. No separate stateful service, state keys, database collection, or scheduled worker is part of the design.

## Constraints and failure modes
- Webhook `required: false` plus fail-open response means backend outages can bypass validation. Gateway auth failures and webhook fallbacks may not have the same error response as handler failures; exercise them separately in sandbox.
- HTTP retry is bounded to two attempts for selected transient errors. End-to-end latency <2 seconds is a **target, not measured evidence**.
- Merchant setting may be changed without a code deploy because the action calls `getConfigurationByKey` on each invocation; verify propagation in sandbox.
- No concurrency lock: two simultaneous requests can read the same previous total. No signature-verification secret by approved scope. Do not put tokens or customer data into logs.

## Cross-references
[Solution design](solution-design.md) · [LLD](lld.md) · [Blueprint](blueprint.md) · [Implementation](implementation.md) · [Sandbox checklist](sandbox-test-checklist.md).
