# Cart Validation: deployment, live testing, and execution flow

Follow this guide in order for the **Stage ACCS sandbox**. The App Builder deployment of this app to Stage **completed successfully (exit code 0)**; association, installation, Admin settings and live cart tests **have not yet been confirmed**. Do not treat an action deployment or unit test as evidence that a rejected cart stays unchanged. For release gates and recovery, use the [full deployment runbook](deployment-runbook.md).

## 1. Target and prerequisites

- App: `cart-validation` (display name **Cart Validation**), Node.js 24, ES modules.
- Adobe IMS organization: **ACCS - PM and Engineering**; Developer Console project: **Comm Cart Validation**; workspace: **Stage**; Runtime namespace: `3117813-commcartvalidation-stage`.
- Have App Builder deploy permission and access to the **intended Commerce sandbox** with **Apps > App Management** permission. Confirm the sandbox instance explicitly; Stage workspace selection does not choose the Commerce instance.
- Confirm project subscriptions/credentials for **I/O Management API**, **ACCS-REST-API** and **OAuth Server-to-Server**. Use stored secrets; never commit `.env` or place tokens/customer data in logs or screenshots.
- Prepare disposable in-stock simple products **A** and **B**, a configurable product with variants, and a guest/customer test account for merge. Use a fresh cart for each scenario unless specified otherwise. Record only anonymized cart quantities and times.

## 2. Deploy the app (developer)

1. At the revision being deployed, run from the repository root with Node.js 24:

   ```text
   npm install
   npm run typecheck
   npm test
   aio app build
   ```

   Stop and fix failed checks. If `app.commerce.config.ts` changed, first run `npx aio-commerce-lib-app generate all` and then repeat the checks; do not manually edit `.generated/` assets.
2. Verify that `app.commerce.config.ts` still declares the three webhooks and the `enabled`/`maxCartQuantity` business settings. `install.yaml` declares `commerce/extensibility/1` and `commerce/configuration/1`. The actions and their authenticated IMS inputs are declared in `src/commerce-extensibility-1/ext.config.yaml`.
3. Select **ACCS - PM and Engineering > Comm Cart Validation > Stage** in the approved managed deployment workflow; review the confirmation card and deploy. Alternatively, in an authenticated CLI context pointing to that same workspace, run `aio app deploy`. Do not run a second deploy while one is underway. The managed workflow supplies secrets automatically; do not paste them into a command.
4. Wait for a completed deployment with exit code 0 and record code revision, time and build output. **This step was already completed for the current Stage rollout**; repeat only for a newer revision. Deployment alone does not associate/install the app in Commerce.

## 3. Connect and enable it in Commerce Admin (Commerce administrator)

1. Open the **intended ACCS sandbox** Admin using its Commerce Cloud Manager link. Navigate to **Apps > App Management**. Search for **Cart Validation**; verify the Adobe organization and workspace shown are correct.
2. If unassociated, select **Associate App**, choose project **Comm Cart Validation**, workspace **Stage**, then **Associate**. Verify the card is associated with the intended Commerce instance. If scopes did not sync, correct them in **Manage Scopes**.
3. Complete the App Management **installation** flow if shown and verify the status is **Installed** rather than merely **Associated** or **Partially Installed**. The SDK installation action registers the webhooks during app installation. If installation is missing/fails or status is unclear, stop and diagnose instead of assuming the hooks are active.
4. Verify the three installed/active webhook registrations for Stage, without exposing action URLs with secrets:

   | Purpose | Hook name | Observer code | Action |
   | --- | --- | --- | --- |
   | Add item | `validate_cart_add` | `observer.sales_quote_add_item` | `validate-cart-add` |
   | Update quantity | `validate_cart_update` | `observer.sales_quote_item_save_after` | `validate-cart-update` |
   | Guest merge | `validate_cart_merge` | `observer.sales_quote_merge_after` | `validate-cart-merge` |

   These are SaaS validation hooks with `webhook_type: before`, POST, batch `cart_validation`, `required: false`, `timeout: 5000` ms and `soft_timeout: 3000` ms. **Observer names ending in `_after` have not been proved to block an already-persisted change**; the live tests below must establish that.
5. On the **Cart Validation** card choose **Configure** at **global** scope, set `enabled` (**Enable cart validation**) to `true`, and set `maxCartQuantity` (**Maximum total cart quantity**) to `10`; select **Save** and reopen the form to confirm. The limit control is text: use a positive whole number. This version reads **global** scope only. Settings are read on each invocation, so changing the global limit should take effect without redeploy.

## 4. Runtime flow being tested

```text
Shopper add / quantity change / guest login merge
  → Commerce observer invokes installed validation webhook
  → authenticated Stage App Builder action parses projected payload
  → action reads global enabled + maxCartQuantity (default true / 10)
  → if enabled, action reads the cart's other lines via Commerce Cart Items API
  → rule sums parent lines only: before vs proposed after
  → if after > before AND after > limit: return exception with
       "You have reached the maximum number of items."
    else: return success, allowing unchanged/decreased/within-limit cart
  → Commerce displays result; tester reopens cart to confirm actual persisted state
```

For add/update, the changed line replaces a matching **`item_id`** quantity; a second line sharing a SKU must not be merged into it. For merge, the handler treats the webhook's `quote.items` as the proposed post-merge cart. On invalid/unavailable settings, malformed payloads, cart-read failure or other technical errors, the action **logs an error and allows the operation**. Webhook `required: false` and fallback behavior also mean this is not guaranteed enforcement during outages. Never confuse the fallback text **We could not validate your cart right now. Please try again.** with the limit-blocking text.

## 5. Live test walkthrough (Commerce storefront on sandbox)

Start with `enabled=true`, global limit `10`. Between rows, use a new empty cart unless a row says to carry it forward. In the **before** and **after** columns, `A:6, B:4` means six units of A and four units of B. Always verify the **server-backed cart after refreshing/reopening**, not just a transient UI message. If a test product cannot support a quantity/options arrangement, use other disposable products but preserve the totals and record the substitution.

| Test | Setup → shopper action | Expected after refresh | Evidence to collect |
| --- | --- | --- | --- |
| Below limit (S1) | Empty cart → add `A:6`. | Success; cart `A:6` (total 6). | Before/after totals, hook invocation. |
| At limit (S2) | Carry `A:6` → add `B:4`. | Success; `A:6, B:4` (total 10). | Cart and action result. |
| Over limit on add (S3) | Carry total 10 → attempt another unit of B or another product. | **Blocked**; exact message `You have reached the maximum number of items.`; cart stays total 10 with exactly the same lines/quantities. | UI message plus refreshed cart. |
| Existing line replacement (S4) | Fresh `A:3, B:2` → update the existing A line to quantity 7. | Success; `A:7, B:2` (total 9), **not** total 12. | Capture anonymized `item_id` before/after. |
| Over-limit update (S4b) | Carry total 9 → set A from 7 to 9. | **Blocked**, exact message; cart remains `A:7, B:2` (total 9). | Refresh and compare line IDs/quantities. |
| Same SKU, distinct options (S5b) | Fresh cart: configurable product variant/option line A quantity 6, other lines total 4 → try adding a distinct option line for that SKU quantity 1. | **Blocked**, exact message; existing lines unchanged. Compare distinct `item_id` values; parent counted once, not child line plus parent. | Options and safe line IDs, response. |
| Guest merge (S5) | Customer cart total 8; separate guest cart total 3 → sign into that account while guest cart is active. | If proposed combined total is 11, **blocked**, exact message and no unexpected change to the relevant carts; verify both persisted states where possible. | Before/after guest/customer cart and hook result. If quote structure/timing differs, record and stop. |
| Live config (S6) | In Admin change **global** limit from 10 to 8 and Save; fresh cart `A:8` → attempt add one B. No redeploy. | `A:8` accepted; attempted increase to 9 **blocked** with exact message and cart unchanged. | Settings screenshot (no secrets), action time and cart. |
| Reduction above lowered limit (S7) | First make `A:6, B:4` under limit 10; then lower global limit to 8 → reduce A to 5, then remove B. | Both reductions accepted even though the first leaves total 9 (>8); final total 5. | Before/after at each step. |
| Unchanged total (S8) | Using a cart total 9 while limit 8, save an unchanged quantity of A or perform another operation that does not increase total. | Allowed; total remains 9. If the UI does not send an unchanged update, use an equivalent supported path and note it. | Hook invocation and refreshed cart. |

**Additional negative tests:** Set `enabled=false`, Save, attempt an over-limit add (allowed), and restore `true`. In a controlled sandbox test only, enter an invalid global limit or simulate unavailable config/cart read; operations should be allowed and a sanitized error logged—restore the valid setting immediately. Test quantity zero/removal, configurable parent/child counting, admin create-order path (if applicable), and simultaneous cart changes; document any coverage gap. Do **not** disrupt production to force error paths. Complete [sandbox-test-checklist.md](sandbox-test-checklist.md) and [ac-to-test-mapping.md](ac-to-test-mapping.md) with actual results; S1–S8 descriptions are inferred because the literal `requirements.md` is unavailable.

## 6. Inspect every live result and stop conditions

For each test, correlate a timestamp with the Commerce **System > Webhook Logs** view (where available) and sanitized Runtime action logs. Confirm the intended hook and action were invoked, projected add fields under `data.quote_item.*`, update fields under `data.item.*`, and the expected nested merge `quote.items`/`source.items`. Verify that the Cart Items API returns the **pre-change baseline** plus other lines; if it already includes the proposed quantity, a forbidden increase might be allowed. Confirm Commerce actually leaves the cart unchanged after an exception, especially for the `_after` observer names. Measure end-to-end validation time including settings and retry against the **under-2-second** target.

**Stop / no-go** if any hook is absent, a Commerce API/auth failure occurs, the exception shows but a cart has changed, the merged quote structure is different, or an over-limit increase is accepted. Save anonymized evidence and fix the issue before describing the app as enforcing the rule. Test-webhook execution in Admin (if offered) can help troubleshoot action/payload processing but does **not** replace a real storefront operation and persisted-cart verification. Do not manually re-register a different hook just to make a test pass.

Record: revision, Commerce instance, workspace, installation status, `enabled`/limit, test ID, cart line quantities before/attempted/after, visible message, webhook/action status, duration, timestamp, evidence link and tester. Do not include tokens, raw payloads or customer identifiers. After tests, restore limit `10` (or the administrator-approved value) and `enabled=true` if appropriate, check the next operation sees the restored values, and obtain Commerce administrator/QA sign-off before production rollout.

## References

- [Complete release checklist and recovery](deployment-runbook.md)
- [Sandbox scenario checklist](sandbox-test-checklist.md) · [Acceptance criteria mapping](ac-to-test-mapping.md)
- [Adobe Commerce App Management: associate and configure](https://experienceleague.adobe.com/en/docs/commerce/app-management/manage-app/manage-app)
- [App Management: build and deploy](https://developer.adobe.com/commerce/extensibility/app-management/build-deploy/)
- [Commerce webhook testing](https://developer.adobe.com/commerce/extensibility/webhooks/testing/) · [Commerce webhook debugging](https://developer.adobe.com/commerce/extensibility/webhooks/tutorial/debug/)
