# CDA Prompt

Paste the text below into CDA together with [requirements.md](requirements.md).

---

Build an Adobe Commerce as a Cloud Service (ACCS) App Builder application called **Cart Validation** (app id `cart-validation`), using the Adobe Commerce SDK (`@adobe/aio-commerce-sdk`). It is installed through App Management, which subscribes its webhooks.

**What it must do**

- Limit the **total units in the cart** (the sum of all line quantities, across all SKUs) to a maximum set by an Admin user. The default is `10`.
- Validate the cart, before the change is saved, in three cases: an item is added to the cart, a cart item quantity is changed, and a guest cart is merged into a customer cart at login. Choose the Commerce webhooks that support these cases on ACCS, explain why you chose them, describe their payload fields, and document this in the README.
- Block a change that would make the total greater than the limit, with exactly this message: `You have reached the maximum number of items.` Keep the message in one constant.
- Count an existing SKU once, at its new quantity (replace the old quantity, do not add both). Count only the parent line of a configurable or bundle product.
- Always allow a change that lowers the total (smaller quantity or removal), even if the cart is still above the limit.
- For a guest-to-customer merge, check the merged total. If it is over the limit, block the whole merge (no partial merge) with the same message.
- If the webhook payload contains only the changed line, read the other cart lines from the Commerce cart items API using the Commerce client of the associated merchant.
- Read the settings on every call, so an Admin change applies immediately without redeployment.

**Settings** (App Management business configuration, global scope; no custom Admin page)

- `enabled`: boolean, default `true`
- `maxCartQuantity`: positive whole number, default `10`

**Rules**

- If the settings are invalid, or the settings or cart cannot be read, allow the change and log an error. Only the limit rule blocks a cart.
- Configure each webhook with a timeout of 5 seconds, a soft timeout, a friendly fallback message and Adobe authentication.
- Do not hard-code URLs, tokens or secrets. Do not log customer data or tokens.
- Do not edit SDK-generated files (`.generated/`).
- Runtime: Node.js 24, ES modules.
- Keep payload parsing separate from the rule, so the rule can be unit-tested without Commerce.

**Tests**

- Write unit tests with `node:test` for every scenario in `requirements.md` (S1 to S8), plus: validation disabled, quantity `0`, configurable product (parent counted once), malformed payload, invalid setting, and settings or cart read errors.
- Check the exact message text in the tests.
- `npm test` must pass.

**Also provide**

- A README with prerequisites (Developer Console APIs: I/O Management API, ACCS-REST-API, OAuth Server-to-Server), setup, configuration, deploy, install and test steps.
- A sandbox test checklist covering S1 to S8, with a column for evidence.
- A list of any assumptions you made.

---

## Review checklist for CDA output

- [ ] The total is the sum across all SKUs, not per line.
- [ ] An existing SKU uses its new quantity, not old + new.
- [ ] Lowering a quantity is allowed even when the cart is above the limit.
- [ ] The other cart lines are read when the payload has only the changed line.
- [ ] The message text is exact and kept in one constant.
- [ ] The limit default is 10 and can be changed without redeploying.
- [ ] Technical errors allow the change and are logged; only the limit rule blocks.
- [ ] Unit tests exist for S1 to S8 and they pass.
- [ ] No hard-coded URLs, tokens or secrets. `.env` is not committed.
