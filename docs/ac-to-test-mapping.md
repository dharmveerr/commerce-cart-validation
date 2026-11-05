# Acceptance Criteria to Test Mapping

Acceptance criteria and scenarios are from [requirements.md](requirements.md).

| AC | Criterion | Scenarios | Unit test files | Sandbox evidence |
| --- | --- | --- | --- | --- |
| AC-1 | Cart below the configured limit is accepted. | S1 | `cart-limit-rule.test.js`, `validate-cart-add.test.js` | [Evidence](test-evidence.md) S1, C1–C6 |
| AC-2 | Cart at the configured limit behaves as expected (accepted). | S2 | `cart-limit-rule.test.js` | Evidence S2, C6, MG3 |
| AC-3 | Cart exceeding the limit displays the agreed message. | S3, S4b, S5, S5b, S7 | `cart-limit-rule.test.js`, `validate-cart-add.test.js`, `validate-cart-update.test.js`, `validate-cart-merge.test.js` | Evidence S3, S4b, S5, S5b, S7, C7, C8, C11, G3, MG4 |
| AC-4 | Existing SKU quantities are handled correctly, without double counting. | S4, S4b | `cart-limit-rule.test.js`, `validate-cart-update.test.js` | Evidence S4, S4b, C5 |
| AC-5 | Admin configuration changes take effect without code changes or redeployment. | S6 | `validate-cart-update.test.js` | Evidence S6a, S6b, D1, D2 |
| AC-6 | Local and sandbox validation is completed. | All | All test files (`npm test`) | [test-evidence.md](test-evidence.md), [checklist](sandbox-test-checklist.md) |
| AC-7 | Pull request includes code, README/setup/configuration, and test evidence. | — | — | Pull request |

The unit test names do not yet use the same scenario numbers as `requirements.md`. They will be aligned after the first sandbox round.
