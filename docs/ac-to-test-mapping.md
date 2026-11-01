# Acceptance Criteria to Test Mapping

Acceptance criteria and scenarios are from [requirements.md](requirements.md).

| AC | Criterion | Scenarios | Unit test files | Sandbox evidence |
| --- | --- | --- | --- | --- |
| AC-1 | Cart below the configured limit is accepted. | S1 | `cart-limit-rule.test.js`, `validate-cart-add.test.js` | [Checklist](sandbox-test-checklist.md) S1 |
| AC-2 | Cart at the configured limit behaves as expected (accepted). | S2 | `cart-limit-rule.test.js` | Checklist S2 |
| AC-3 | Cart exceeding the limit displays the agreed message. | S3, S4b, S5, S5b, S7 | `cart-limit-rule.test.js`, `validate-cart-add.test.js`, `validate-cart-update.test.js`, `validate-cart-merge.test.js` | Checklist S3, S4b, S5, S5b, S7 |
| AC-4 | Existing SKU quantities are handled correctly, without double counting. | S4, S4b | `cart-limit-rule.test.js`, `validate-cart-update.test.js` | Checklist S4, S4b |
| AC-5 | Admin configuration changes take effect without code changes or redeployment. | S6 | `validate-cart-update.test.js` | Checklist S6 |
| AC-6 | Local and sandbox validation is completed. | All | All test files (`npm test`) | Full checklist |
| AC-7 | Pull request includes code, README/setup/configuration, and test evidence. | — | — | Pull request |

The unit test names do not yet use the same scenario numbers as `requirements.md`. They will be aligned after the first sandbox round.
