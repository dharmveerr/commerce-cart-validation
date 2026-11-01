# Cart Validation: Discussion Summary

**Date:** 31 Oct 2026

## 1. Requirement

The client's wording ("maximum-cart-units", "cart below / at / exceeding the limit", "aggregation across SKUs") means a limit on the **total number of units in the cart**, not a limit per cart line.

The earlier app (`commerce-cart-validate`) limited each line. That came from the CDA blueprint, not from the client.

## 2. Decisions

| Topic | Decision |
| --- | --- |
| Rule | Total units across all SKUs must not exceed the limit. Default **10**, set by an Admin user. |
| Existing SKU | Counted once, at its new quantity: 6 + 2 = 8, not 14. |
| Configurable or bundle product | Only the parent line is counted. |
| Lowering a quantity | Always allowed, even if the cart is still over the limit. |
| Guest cart merge at login | All or nothing: blocked if the merged total is over the limit, with the same message. |
| Message | `You have reached the maximum number of items.` ("number" because items are countable, and it matches the acceptance criterion). Kept in one constant. |
| Technical errors | The change is allowed and an error is logged. Only the limit rule blocks a cart. |
| Settings | App Management settings form only: `enabled`, `maxCartQuantity`. No custom Admin page. |
| Webhooks | CDA chooses and validates them. No webhook names are given in our documents. |
| Out of scope | Per-line limit (Commerce has this built in), automatic quantity reduction, per-store limits. |

## 3. Repositories

- **New repo:** `commerce-cart-validation`, branch `feature/commerce-cart-qty-validation`.
  - [requirements.md](requirements.md): requirements, acceptance criteria, scenarios S1 to S8, counting rule, settings, assumptions, done-when checklist.
  - [cda-prompt.md](cda-prompt.md): the prompt to paste into CDA, plus a review checklist.
- **Old repo:** `commerce-cart-validate` keeps the per-line version as an archive (branch `feat/appbuilder-cartitemvalidation`). Its gaps were fixed, 18 tests pass, and the docs were simplified. Its `main` branch contains only a README.

## 4. Next steps

1. Generate the CDA blueprint and code from `cda-prompt.md` and `requirements.md`.
2. Review the CDA output against the checklist, including its webhook choice and payload fields.
3. Create a new Developer Console project with Stage and Production workspaces and three APIs: I/O Management API, ACCS-REST-API, OAuth Server-to-Server.
4. Rotate the old secrets that were shared in chat.
5. Uninstall the old app from the sandbox, install the new one, and run S1 to S8 with evidence.
6. Open the pull request, address the review comments, and do the demo and handoff.
