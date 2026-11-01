# Implementation: Cart Validation

## 1. Files

| File | What it contains |
| --- | --- |
| `app.commerce.config.ts` | App details, the two settings, the three webhooks |
| `app.config.yaml`, `install.yaml` | App Builder extension points |
| `src/commerce-extensibility-1/ext.config.yaml` | The three actions (Node.js 24, Adobe authentication) |
| `src/commerce-extensibility-1/actions/validate-cart-*/index.js` | Entry points for add, update and merge |
| `src/commerce-extensibility-1/lib/validate-cart.js` | Shared handler |
| `src/commerce-extensibility-1/lib/parse-webhook-payload.js` | Reads the webhook payload |
| `src/commerce-extensibility-1/lib/cart-limit-rule.js` | Counting rule |
| `src/commerce-extensibility-1/lib/settings.js` | Reads the settings |
| `src/commerce-extensibility-1/lib/commerce-cart-client.js` | Reads the cart from Commerce |
| `src/commerce-extensibility-1/lib/constants.js` | Block message |
| `test/*.test.js` | Unit tests (`node:test`) |
| `src/**/.generated/` | Created by the SDK. Do not edit. |

## 2. Build and test

```bash
npm install
npm test
aio app build
```

If `app.commerce.config.ts` changes, regenerate the SDK files first:

```bash
npx aio-commerce-lib-app generate all
```

## 3. Status

| Item | Status |
| --- | --- |
| Code | Done |
| Unit tests | 22 tests passed (reported by CDA) |
| Deploy to Stage | Done |
| Install in Commerce (App Management) | Not done |
| Sandbox tests S1 to S8 | Not done |
| Pull request | Not done |

## 4. Known issues (fix after the first sandbox round)

1. `parent_item_id` is missing from the webhook fields, so child lines of configurable products may be counted.
2. Unit test names use different scenario numbers from [requirements.md](requirements.md).
3. No unit tests for `settings.js` (invalid values like `0` or `abc`).
4. `enabled` must be a true boolean. If Commerce sends `"true"` as text, the check is skipped.
5. An empty `if` block in `cart-limit-rule.js` can be removed.
6. Add update-handler tests for a new line and for a child line.

See [deployment-runbook.md](deployment-runbook.md) to deploy and install, and [deployment-and-live-testing.md](deployment-and-live-testing.md) to test.
