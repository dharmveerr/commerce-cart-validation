# Cart Validation — deployment and post-deployment runbook

This is the ordered checklist for the `cart-validation` App Builder app on **Adobe Commerce as a Cloud Service (ACCS)**. Use the **Stage** values below for the current rollout; choose and explicitly verify an equivalent project/workspace/Commerce instance before using this guide in another environment. Check off steps only after observing their results. **App Builder deployment succeeded (exit code 0) for Stage in this conversation; Commerce association, installation, configuration, and sandbox verification are not yet confirmed.** A successful deployment does not prove that a cart change is blocked or unchanged.

## 0. Target, ownership and evidence

| Item | Stage target / owner |
| --- | --- |
| Adobe IMS organization | `ACCS - PM and Engineering` (`045013D3664331DC0A495CD5@AdobeOrg`) |
| Developer Console project | `Comm Cart Validation` (`4566206088345788886`) |
| Developer Console workspace | `Stage` (`4566206088345838719`) |
| Runtime namespace | `3117813-commcartvalidation-stage` |
| Commerce app ID / display name | `cart-validation` / `Cart Validation` |
| Commerce instance | **Select the intended ACCS sandbox manually; never assume it from the workspace name.** |
| Release operator | Developer with Developer Console/App Builder access; Commerce administrator with **Apps > App Management** permission for the association/configuration steps. |

Record for each run: code revision, who deployed, deployment time/result, selected Commerce instance, association/installation status, settings values (not credentials), test evidence links and go/no-go owner. Do not save access tokens, `.env`, customer cart data or raw payloads in documentation or PR evidence.

## 1. Pre-deployment checks (developer)

- [ ] Confirm you are in the intended Developer Console organization/project/**Stage** workspace and have permission to deploy; do not point Stage at production Commerce inadvertently. Confirm the project has **I/O Management API**, **ACCS-REST-API**, and **OAuth Server-to-Server** configured for this app. Credentials are provisioned through project secrets; do **not** paste them into commits, commands, screenshots or logs.
- [ ] Use **Node.js 24** and project dependencies. From the project root run:

  ```text
  npm install
  npm run typecheck
  npm test
  aio app build
  ```

  Record results; stop on any failed check. The `package.json` test command is `node --test test/*.test.js`. Earlier local verification built the app and passed **22 tests**, but rerun at the revision you will deploy.
- [ ] Review `app.commerce.config.ts`, `app.config.yaml`, `install.yaml` and `src/commerce-extensibility-1/ext.config.yaml`. Both extension points must be present: `commerce/extensibility/1` and `commerce/configuration/1`. The three action names must remain `cart-validation/validate-cart-add`, `cart-validation/validate-cart-update`, and `cart-validation/validate-cart-merge`. Their runtime is `nodejs:24` with `final: true`, `require-adobe-auth: true`, `include-ims-credentials: true` and IMS inputs. Do not edit `src/**/.generated/` by hand.
- [ ] If the typed configuration changed since the last build, regenerate generated files using the SDK (`npx aio-commerce-lib-app generate all`), review the derived manifest, and repeat typecheck, tests and build. Do not commit or publish `.env`.

## 2. Deploy App Builder (developer)

- [ ] Through the approved release workflow, select the target organization/project/workspace/namespace shown in section 0 and confirm the target **in the deployment confirmation card**. If using your own authenticated App Builder CLI instead of this workspace's managed deploy workflow, use `aio app deploy` from the project root only after explicitly selecting the correct Developer Console workspace; avoid duplicating a deployment already in progress. The managed deploy operation injects stored project secrets and performs a build/deploy; never reproduce secret values in a script.
- [x] For the current Stage rollout, the managed App Builder deployment returned **exit code 0**. For subsequent runs, wait for the deployment to complete; do not treat “started” as success. Record the command/workflow log and revision, and check that the intended actions/extensions were deployed. Do not call the protected actions without the required Adobe authentication merely to test reachability.
- [ ] If build/deploy fails, inspect the failure output without exposing secrets, fix the configuration/code or workspace mismatch, rerun local validation and redeploy. A deploy is **not** a Commerce Admin association/installation.

## 3. Associate with the intended Commerce instance (Commerce administrator)

- [ ] Open the intended **ACCS sandbox** Commerce Admin (get the Admin entry point from your Commerce Cloud Manager; do not assume a `/admin` URL). Navigate to **Apps > App Management**. On ACCS, App Management is available without installing an extra Composer package; ensure the operator has access and can see the correct Adobe organization.
- [ ] Search for **Cart Validation** / `cart-validation`. If not already associated to this specific Commerce instance, choose **Associate App**, select **Project: Comm Cart Validation**, **Workspace: Stage**, and choose **Associate**. Verify the resulting app card corresponds to the intended instance/project/workspace. If association or scope sync fails, resolve it before testing; Adobe notes association may complete even if scope sync fails—use **Manage Scopes** to sync if needed.
- [ ] Complete the app's **installation** flow in App Management if offered/required and verify its lifecycle is **Installed**, not just **Associated** or **Partially Installed**. The SDK-generated `app-management/installation` action is responsible for installing the declared webhooks; deployment alone does not run that flow. UI labels/sequence can vary: if no install action or Installed status is visible, consult your App Management instance's installation view or administrator; do not infer that hooks are active merely from association.
- [ ] Verify that the Commerce environment shows three active webhook subscriptions for the app (via its Admin webhook listing/installation diagnostics) and that their methods, auth and URLs correspond to the **Stage** Runtime actions. App Management defines webhook subscriptions from app code; store administrators should not manually recreate mismatched subscriptions as a workaround. Record installation errors and the hook status, without recording auth headers or secrets.

Expected registrations in `app.commerce.config.ts`:

| Hook name | Observer method | Action | Webhook type |
| --- | --- | --- | --- |
| `validate_cart_add` | `observer.sales_quote_add_item` | `cart-validation/validate-cart-add` | `before` |
| `validate_cart_update` | `observer.sales_quote_item_save_after` | `cart-validation/validate-cart-update` | `before` |
| `validate_cart_merge` | `observer.sales_quote_merge_after` | `cart-validation/validate-cart-merge` | `before` |

All are SaaS `validation`, batch `cart_validation`, POST, `required: false`, `timeout: 5000`, `soft_timeout: 3000`, fallback error message **We could not validate your cart right now. Please try again.** Add/update project `sku`, `qty`, `quote_id`, `item_id`, `product_type`, `product_option` from `data.quote_item.*` / `data.item.*`; merge has no field projection. Confirm actual projected payload and timing in sandbox before trusting these contracts. A `before` webhook on an observer whose *name* ends in `_after` is **not proof** of rollback.

## 4. Configure and confirm Admin settings (Commerce administrator)

- [ ] In **Apps > App Management**, select the associated **Cart Validation** card, click **Configure**, set the **global** values and click **Save**:
  - `enabled` — **Enable cart validation** (boolean; default `true`).
  - `maxCartQuantity` — **Maximum total cart quantity** (text control; enter a **positive whole number**, default `10`, e.g. `10`). The app validates the text at runtime because this SDK schema does not expose a numeric field type. Avoid `0`, negatives, decimals, spaces, and non-numeric values.
- [ ] Reopen the configuration and verify the saved values and selected scope. The handler currently reads **global** scope only; do not expect website/store/store-view overrides to be honored by this version even if the App Management UI can create them. A settings change should apply on the next invocation without a redeploy; verify this in step 5. Invalid/unreadable configuration allows the operation and logs an error, rather than blocking a cart.

## 5. Sandbox verification (developer + QA + Commerce administrator)

Use disposable sandbox carts and reversible settings. Fill out [the scenario checklist](sandbox-test-checklist.md) and [AC-to-test mapping](ac-to-test-mapping.md). The scenario descriptions are **inferred** because the literal `requirements.md` is unavailable; obtain it and resolve discrepancies before sign-off. For each case, note the limit, cart totals and item IDs/quantities **without PII**, the attempted action, before/after state, observed message, elapsed duration and a timestamp/evidence link. Do not mark a scenario passed merely because the hook ran.

- [ ] S1/S2: Add units to stay below or reach the configured limit. Both changes should succeed.
- [ ] S3: Add an item so the total goes over the limit. Expect **You have reached the maximum number of items.** exactly; refresh or reread the cart and verify it is **unchanged**.
- [ ] S4/S4b: Change quantity on an existing `item_id`; the old qty is **replaced**, not added to the new qty. Verify within-limit success and over-limit rejection with unchanged cart.
- [ ] S5/S5b: Merge a guest cart above the limit and add separate lines with the same SKU but different options. Verify parent items counted once, actual before/after state and exact rejected message. If a merge is already persisted by the selected observer, stop: this is not an acceptable enforcement result.
- [ ] S6: Change **global** `maxCartQuantity` in Admin (e.g. `10` to `8`) and retest immediately **without redeploy**. Restore the original value after testing.
- [ ] S7/S8: When the existing total is above a newly lowered limit, decreasing/removing quantities or leaving the total unchanged must still succeed.
- [ ] Test `enabled: false`; deliberately test an invalid setting and a controlled config/cart read failure, confirming each fails open and logs only a sanitized error class. Restore a valid setting/healthy service afterward. Do not take production services down to simulate this.
- [ ] Test configurable/bundle parent-child counting, other cart lines fetched from Commerce for a changed-line payload, Admin Create-Order behavior if in scope, and two simultaneous mutations; record any bypass as a limitation rather than assuming strict enforcement.
- [ ] Inspect Commerce **System > Webhook Logs** (if available in this instance), App Management installation errors, and sanitized Runtime action logs. Check add/update/merge reach the expected actions and response shape; verify projected fields, GET `carts/{quoteId}/items` permission, pre-change cart baseline and merge `quote.items` timing. Measure **the complete check** (including config/association and a transient retry) against the under-2-second target. The client's two 650 ms GET attempts and 100 ms pause do not guarantee total duration.

**Important:** The configured hooks are `required: false` and the action explicitly fails open on technical errors. During outages/timeouts the limit is not a hard guarantee. The exact business message and unchanged cart are acceptance criteria only when the limit check executes correctly; the fallback error message is a different text. Do **not** claim the extension is production-ready until webhook timing/rollback and the Commerce cart read baseline are confirmed on the target instance.

## 6. Go/no-go, ongoing changes and recovery

- [ ] **Go:** installation is Installed; three subscriptions are active; actions respond; local tests/build and all applicable sandbox cases pass; an over-limit operation shows the exact text **and leaves the cart unchanged**; under-2-second target is measured; change-without-redeploy verified; evidence linked in the PR. Confirm acceptance against the actual `requirements.md` when available. Include release revision, documentation and test evidence in the PR.
- [ ] **No-go:** missing/partially installed hooks, auth/API permission error, `_after` observer cannot block persistence, baseline GET reflects already-modified cart, merge payload differs, or any cart changes despite rejection. Stop rollout, keep evidence, and fix the implementation/design before retesting. A passing unit test/build cannot clear these failures.
- [ ] **Containment in Stage:** with approval, set `enabled` to `false` globally to bypass validation while preserving cart operations; this is **not** a fix for incorrect enforcement and intentionally disables the rule. Escalate to an administrator/developer to correct installation or code. Avoid **Unassociate** as a routine toggle: Adobe documents that unassociation removes this instance's configuration values and cannot be undone. Redeploy a tested revision and rerun installation checks as required by your app lifecycle.
- [ ] After any Admin setting change, check its effect on a fresh cart operation; after a new code/config deploy, check association, installed hooks and the affected scenarios again. Save timestamped non-sensitive evidence and monitor sanitized action logs/webhook errors after release.

## References

- [Adobe Commerce App Management: install and access](https://experienceleague.adobe.com/en/docs/commerce/app-management/install) — ACCS availability, Admin path and webhook behavior.
- [Adobe Commerce: manage your app](https://experienceleague.adobe.com/en/docs/commerce/app-management/manage-app/manage-app) — association, status, Configure/Save, scopes and unassociation warning.
- [App Management build and deploy](https://developer.adobe.com/commerce/extensibility/app-management/build-deploy/) — generated SDK assets and deployment flow.
- [App Management webhook installation](https://developer.adobe.com/commerce/extensibility/app-management/installation/webhooks/) — webhook registration through installed apps.
- Repository details: [`../app.commerce.config.ts`](../app.commerce.config.ts), [`../src/commerce-extensibility-1/ext.config.yaml`](../src/commerce-extensibility-1/ext.config.yaml), [implementation](implementation.md), [sandbox checklist](sandbox-test-checklist.md), [AC mapping](ac-to-test-mapping.md).
