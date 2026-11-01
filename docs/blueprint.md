# Blueprint — cart validation

## Provenance and state
This is a **human-readable as-built snapshot** of the approved 11-task build, **not** an edit to the approved Blueprint system record. Approved storage version 6 specifies `decision: none`: no App Builder Database, State, Files, or idempotency store. The supplied AC text and mappings are retained in [AC mapping](ac-to-test-mapping.md). The literal `requirements.md` is absent from this repository, so detailed S1–S8 descriptions in documentation and tests are inferred, not verified against that file.

## Goal and acceptance
For each cart mutation, compute the sum of quantities of parent cart lines across all SKUs. Allow a change if the total stays the same, falls, or remains at/below `maxCartQuantity`; block only an *increase* above it. A rule block uses the exact constant `You have reached the maximum number of items.`; intended cart state remains unchanged (sandbox proof outstanding). Invalid settings, unavailable settings/cart and malformed payloads fail open and log non-sensitive error information. Configuration changes must apply without redeployment. AC-6 and AC-7 need sandbox validation and PR evidence respectively, so they are **not yet satisfied**.

## Approved implementation workstream (11-task list consolidated)
| Blueprint deliverable | As-built artifact / status |
| --- | --- |
| 1. SDK app config and merchant settings | `app.commerce.config.ts`; SDK business config `enabled` boolean `true` and `maxCartQuantity` text `"10"` (numeric setting is validated at runtime because schema has no number type). |
| 2. Pure rule and parser | `src/commerce-extensibility-1/lib/{constants,cart-limit-rule,parse-webhook-payload}.js`. |
| 3. Cart and settings adapters | `src/commerce-extensibility-1/lib/{commerce-cart-client,settings}.js` using associated IMS Commerce client and live global settings. |
| 4. Three handlers and webhook registration | `actions/validate-cart-{add,update,merge}/index.js`, shared `lib/validate-cart.js`, `ext.config.yaml`, `app.commerce.config.ts`. |
| 5. SDK generation | Generated installation actions, business configuration schema and manifest from SDK; `.generated/` is never manually edited. |
| 6. S1–S8 and edge-case tests | Five `test/*.test.js` suites, `npm test`; 22 tests passed in the most recent workspace validation, but scenario interpretations await literal requirements. |
| 7. README, sandbox checklist and assumptions | Root `README.md`, `docs/sandbox-test-checklist.md`. |
| 8. Handler revision: fail-open, logging, timeouts | Entire action handlers catch unexpected errors; shared handler logs outcomes; hooks `required: false`, `timeout: 5000`, `soft_timeout: 3000`. |
| 9. Preliminary test list/docs/AC mapping | Covered by finalized tests, root README, checklist and `docs/ac-to-test-mapping.md`; inferential descriptions explicitly flagged. |
| 10. Final documents based on literal requirements and sandbox/PR evidence | **Awaiting user**: provide `requirements.md`, confirm inferred S1–S8 interpretations, run sandbox checklist and attach evidence to PR. |
| 11. Final webhook metadata and registration | All three have SaaS validation/batch/POST; add/update select six fields; merge unprojected; actions use Node.js 24, Adobe auth and IMS credentials. |

## Dependency/flow diagram
```text
Typed config → SDK generation → extension action wiring → Commerce install
                                             ↓
             pure parser + rule ← adapters ← shared validator ← webhook request
                                             ↓
                                    success / exception response
```

## Design decisions and open gates
- No storage or idempotency state for synchronous validation; no signature-verification secret (approved scope). Logs only.
- `item_id` is the line identity; same SKU with differing options is not deduplicated. Parent row qty is counted once.
- Hook codes are the configured observer event names, not XDM names: `observer.sales_quote_add_item`, `observer.sales_quote_item_save_after`, `observer.sales_quote_merge_after`. **Their ability to intercept before irreversible state changes is unproven.** Confirm in a target ACCS sandbox and change the architecture if needed.
- Local validation is not equivalent to sandbox tests. No deploy or Commerce Admin installation is claimed. Final go/no-go requires payload snapshots without PII, actual unchanged-cart checks, latency measurement (<2 seconds including retry), Admin dynamic settings test, and PR evidence.

## Best-practice review / deviations
App Management-generated manifest and actions, authentication annotations, SDK response builders, limited field projection for add/update, isolated pure rule, minimal logging and no hardcoded credentials align with the documented extension pattern. Risks/deviations: `required: false` explicitly favors availability over strict enforcement; using `*_after` observer names may be too late for rollback despite `webhook_type: "before"`; GET may reflect already-mutated cart; merge assumes `quote.items` is post-merge; no concurrency control; no proven overall 2-second bound. These are **not resolved by a passing build**. See [solution design](solution-design.md) and [LLD](lld.md).
