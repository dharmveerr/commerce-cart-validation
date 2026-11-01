# Cart Validation

An Adobe App Builder app for **Adobe Commerce as a Cloud Service (ACCS)** that limits the **total number of units in a cart**.

- The limit is set by an Admin user. Default: **10**.
- When a change would go over the limit, it is blocked with:
  `You have reached the maximum number of items.`
- Lowering a quantity or removing an item is always allowed.
- If anything goes wrong (for example Commerce cannot be reached), the change is allowed and an error is logged.

App ID: `cart-validation` · Runtime: Node.js 24 · Requirements: [docs/requirements.md](docs/requirements.md)

## 1. How it works

1. Commerce calls the app through a webhook when a shopper adds an item, changes a quantity, or logs in (guest cart merge).
2. The app reads the settings and the saved cart.
3. It adds up all cart lines (parent lines only) and blocks the change only if the total **goes up** and is **above the limit**.

| Case | Webhook (`before`) | Action | Fields used |
| --- | --- | --- | --- |
| Item added | `observer.sales_quote_add_item` | `validate-cart-add` | `sku`, `qty`, `quote_id`, `item_id`, `product_type`, `product_option` |
| Item saved (quantity changed, or same item added again) | `observer.sales_quote_item_save_after` | `validate-cart-update` | Same as above |
| Guest cart merged at login | `observer.sales_quote_merge_after` | `validate-cart-merge` | `quote` (with `items`) and `source` (with `items`) |

All webhooks: `required: false`, timeout 5 s, soft timeout 3 s, fallback message, Adobe authentication. Removing an item is not hooked because it is always allowed.

More detail: [docs/hld.md](docs/hld.md), [docs/lld.md](docs/lld.md).

## 2. Prerequisites

- Node.js 24 and npm
- Adobe I/O CLI: `npm install -g @adobe/aio-cli`
- An Adobe Developer Console project with an App Builder workspace (Stage and Production) and these APIs:
  - **I/O Management API**
  - **ACCS-REST-API**
  - **OAuth Server-to-Server**
- Access to an ACCS **sandbox** with **Apps > App Management** permission

## 3. Setup

```bash
git clone https://github.com/dharmveerr/commerce-cart-validation.git
cd commerce-cart-validation
npm install
aio login
aio app use        # choose the organization, project and Stage workspace
```

Then fill in the OAuth Server-to-Server values in `.env`, using [.env.template](.env.template) as the list of keys:

```text
AIO_COMMERCE_AUTH_IMS_CLIENT_ID=
AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS=
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID=
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL=
AIO_COMMERCE_AUTH_IMS_ORG_ID=
AIO_COMMERCE_AUTH_IMS_SCOPES=
```

Copy these from the OAuth Server-to-Server credential in the Developer Console. **Never commit `.env`.**

## 4. Build, test and deploy

```bash
npm test           # unit tests
aio app build
aio app deploy
```

- If you change `app.commerce.config.ts`, run `npx aio-commerce-lib-app generate all` first.
- Do not edit files in `.generated/` folders. The SDK creates them.
- Deploying does **not** install the webhooks in Commerce. Do step 5.

## 5. Install in Commerce

1. In Commerce Admin, go to **Apps > App Management**.
2. Find **Cart Validation**. Click **Associate App** and choose your project and workspace.
3. Complete the installation. The status must be **Installed**.
4. Check that the three webhooks in section 1 are active.

## 6. Configuration

In **Apps > App Management > Cart Validation > Configure** (global scope):

| Setting | Default | Meaning |
| --- | --- | --- |
| Enable cart validation | Yes | Turns the check on or off |
| Maximum total cart quantity | `10` | Highest total number of units in a cart. Whole number, 1 or more. |

- Changes apply immediately. No redeploy needed.
- An invalid value (for example `0` or `abc`) means carts are allowed and an error is logged.
- To turn the check off quickly, set **Enable cart validation** to **No**.

## 7. Testing

- **Unit tests:** `npm test`
- **Sandbox tests:** follow [docs/deployment-and-live-testing.md](docs/deployment-and-live-testing.md) and record results in [docs/sandbox-test-checklist.md](docs/sandbox-test-checklist.md).
- **Logs:** `aio app logs`. Look for `cart validation allowed`, `blocked` or `error`.

Acceptance criteria mapping: [docs/ac-to-test-mapping.md](docs/ac-to-test-mapping.md).

## 8. Project structure

```text
app.commerce.config.ts                 App details, settings, webhooks
src/commerce-extensibility-1/
  ext.config.yaml                      Action definitions
  actions/validate-cart-*/index.js     Add, update and merge entry points
  lib/validate-cart.js                 Shared handler
  lib/parse-webhook-payload.js         Reads the webhook payload
  lib/cart-limit-rule.js               Counting rule
  lib/settings.js                      Reads the Admin settings
  lib/commerce-cart-client.js          Reads the cart from Commerce
  lib/constants.js                     Block message
test/                                  Unit tests
docs/                                  Requirements, design and test documents
```

## 9. Known limitations

- If the app is down or slow, changes are allowed without a check.
- Two changes at the same moment can both pass and go over the limit.
- Items added automatically by promotions are not checked.
- One global limit for the whole store.

## 10. Assumptions (to confirm in the sandbox)

- A configurable or bundle product counts as its parent quantity only.
- A blocked change leaves the cart unchanged (update and merge webhooks).
- The cart read from Commerce shows the old quantities, not the new ones.
- The merge payload contains the merged items in `quote.items`.
- Admin "Create New Order" follows the same rule.

## 11. Documents

| Document | Purpose |
| --- | --- |
| [requirements.md](docs/requirements.md) | Requirements, acceptance criteria, scenarios |
| [solution-design.md](docs/solution-design.md) | What the app does and why |
| [blueprint.md](docs/blueprint.md) | Approved CDA plan |
| [hld.md](docs/hld.md) / [lld.md](docs/lld.md) | High-level and detailed design |
| [implementation.md](docs/implementation.md) | Files, status, known issues |
| [deployment-runbook.md](docs/deployment-runbook.md) | Deploy, install, go/no-go, rollback |
| [deployment-and-live-testing.md](docs/deployment-and-live-testing.md) | Sandbox test steps |
| [sandbox-test-checklist.md](docs/sandbox-test-checklist.md) | Test results and evidence |
| [ac-to-test-mapping.md](docs/ac-to-test-mapping.md) | Acceptance criteria to tests |
