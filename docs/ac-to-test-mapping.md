# Acceptance criteria to test mapping

The AC wording below comes from the supplied blueprint requirements block. S1–S8 scenario details are inferred because the literal `requirements.md` is not available in the workspace; obtain and compare it before final acceptance.

| Criterion (verbatim) | Scenarios supplied | Automated test(s) | Sandbox evidence |
| --- | --- | --- | --- |
| AC-1: Cart below the configured limit is accepted. | S1 | `cart-limit-rule.test.js`, `validate-cart-add.test.js` | Not run |
| AC-2: Cart at the configured limit behaves as expected (accepted). | S2 | `cart-limit-rule.test.js`, `validate-cart-merge.test.js` | Not run |
| AC-3: Cart exceeding the limit displays the agreed message. | S3, S4b, S5, S5b, S7 | `cart-limit-rule.test.js`, `validate-cart-add.test.js`, `validate-cart-update.test.js`, `validate-cart-merge.test.js` | Not run |
| AC-4: Existing SKU quantities are handled correctly, without double counting. | S4, S4b | `cart-limit-rule.test.js`, `validate-cart-update.test.js` | Not run |
| AC-5: Admin configuration changes take effect without code changes or redeployment. | S6 | `validate-cart-update.test.js` (injected live reader); sandbox needed | Not run |
| AC-6: Local and sandbox validation is completed. | Unit tests + sandbox tests for all scenarios | `npm test`; see sandbox checklist | Not run |
| AC-7: Pull request includes code, README/setup/configuration, and test evidence. | Section 10 | `README.md`, this map and sandbox checklist; PR submission external | Not run |
