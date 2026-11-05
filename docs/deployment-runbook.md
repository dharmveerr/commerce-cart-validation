# Deployment Runbook: Cart Validation

Follow the steps in order. Tick a step only after you have seen it work.

## 0. Target (Stage)

| Item | Value |
| --- | --- |
| IMS organization | ACCS - PM and Engineering (`045013D3664331DC0A495CD5@AdobeOrg`) |
| Developer Console project | Comm Cart Validation (`4566206088345788886`) |
| Workspace | Stage (`4566206088345838719`) |
| Runtime namespace | `3117813-commcartvalidation-stage` |
| App ID / name | `cart-validation` / Cart Validation |
| Commerce instance | Choose the ACCS **sandbox** yourself. Never production. |

**Current status:** deployed to Stage, installed in Commerce and tested in the sandbox ([test-evidence.md](test-evidence.md)).

## 1. Before deploying

- [ ] The project has these APIs: **I/O Management API**, **ACCS-REST-API**, **OAuth Server-to-Server**.
- [ ] You are using Node.js 24.
- [ ] Run and check that all pass:

  ```bash
  npm install
  npm test
  aio app build
  ```

- [ ] `.env` is not committed. No secrets in code, screenshots or logs.

## 2. Deploy

- [ ] Select the Stage workspace (`aio app use`), then run:

  ```bash
  aio app deploy
  ```

- [ ] Wait until it finishes successfully. Deploying does **not** install the webhooks in Commerce.

## 3. Install in Commerce Admin

- [ ] Open the sandbox Commerce Admin and go to **Apps > App Management**.
- [ ] Find **Cart Validation**. If it is not associated, click **Associate App** and choose project **Comm Cart Validation**, workspace **Stage**.
- [ ] Complete the installation. The status must be **Installed** (not only "Associated" or "Partially Installed").
- [ ] Check that three webhooks are active (App Management prefixes the names with the app ID):

  | Hook name | Webhook |
  | --- | --- |
  | `cart_validation_validate_cart_add` | `observer.sales_quote_add_item` |
  | `cart_validation_validate_cart_update` | `observer.sales_quote_item_save_after` |
  | `cart_validation_validate_cart_merge` | `observer.sales_quote_merge_after` |

## 4. Configure

Installation references: [installed app](test-evidence.md#app-installation) and [webhook subscriptions](test-evidence.md#webhook-subscriptions).

- [ ] On the **Cart Validation** card, click **Configure** (global scope):
  - **Enable cart validation**: Yes
  - **Maximum total cart quantity**: `10`
- [ ] Click **Save**, then reopen to check the values are saved. Changes reach live carts within about a minute.

Configuration reference: [global configuration screenshot](test-evidence.md#global-configuration).

## 5. Test

- [ ] Run all tests in [deployment-and-live-testing.md](deployment-and-live-testing.md).
- [ ] Fill in [sandbox-test-checklist.md](sandbox-test-checklist.md) with evidence. Detailed results: [test-evidence.md](test-evidence.md).

## 6. Go / no-go

**Go** when all are true:

- Status is **Installed** and the three webhooks are active.
- `npm test` and all sandbox scenarios S1 to S8 pass.
- A blocked change shows the exact message **and** the cart is unchanged after refresh.
- A setting change works without redeploying.
- Evidence is attached to the pull request.

**No-go** if any of these happen:

- A webhook is missing, or there is an authentication or permission error.
- The message appears but the cart has still changed.
- An over-limit change is accepted.

## 7. Turn off or roll back

- **Turn off quickly:** set **Enable cart validation** to **No** and save. Carts work normally without the check.
- **Do not** use **Unassociate** as an on/off switch. It deletes the saved settings for this instance and cannot be undone.
- **Roll back code:** deploy the previous working version, then check the installation and rerun the affected tests.
