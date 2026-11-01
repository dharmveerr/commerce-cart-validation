# Live Testing Guide: Cart Validation

How to test the app in the ACCS **sandbox** after it is installed. To deploy and install, see [deployment-runbook.md](deployment-runbook.md). Record results in [sandbox-test-checklist.md](sandbox-test-checklist.md).

## 1. Before you start

- The app status in **Apps > App Management** is **Installed**.
- Settings: **Enable cart validation** = Yes, **Maximum total cart quantity** = `10`.
- Test products: four simple products **A**, **B**, **C**, **D** with enough stock, and one configurable product.
- One test customer account.
- Start each scenario with an empty cart, unless stated otherwise.

## 2. Scenarios (limit = 10)

| # | Steps | Expected |
| --- | --- | --- |
| S1 | Empty cart. Add A × 4. | Accepted. Total 4. |
| S2 | Cart A=4. Add B × 6. | Accepted. Total 10. |
| S3 | Cart A=4, B=6. Add C × 1. | **Blocked** with the message. Cart still A=4, B=6. |
| S4 | Cart A=6. Add A × 2 again from the product page. | Accepted. Line A = 8 (not 14). |
| S4b | Cart A=8. Add A × 3 again. | **Blocked**. Line A stays 8. |
| S5 | Cart A=3, B=3, C=3. Add D × 2. | **Blocked**. Total stays 9. |
| S5b | Cart A=3, B=3, C=3. On the cart page, change B to 5. | **Blocked**. B stays 3. |
| S6 | Cart A=4. In Admin set the limit to `5` and save (no redeploy). Add B × 2. Then set the limit back to `10` and add B × 2 again. | First add **blocked**. Second add accepted (total 6). |
| S7 | Log in as the customer, build a cart of 9 units, log out. As a guest, add A × 2 and B × 2. Log in. | Merge **blocked** with the message. Customer cart stays at 9. Login still works. |
| S8 | Cart A=8. In Admin set the limit to `5`. Change A to 6. Then set the limit back to `10`. | Accepted, because the total goes down. |

The message must be exactly: `You have reached the maximum number of items.`

## 3. Extra checks

| Check | Steps | Expected |
| --- | --- | --- |
| Validation off | Set **Enable** = No. Add more than 10 units. Set it back to Yes. | Accepted |
| Remove an item | Cart above the limit. Remove a line. | Accepted |
| Configurable product | Add the configurable product × 2. | Counted as 2 units |
| Invalid setting | Set the limit to `abc`. Add an item. Set it back to `10`. | Accepted, error in logs |
| Admin order | Repeat S3 in **Sales > Orders > Create New Order**. | Same result as S3 |

## 4. How to check a result

1. **Refresh the cart** after every step. Check the saved quantities, not only the message.
2. **App logs:** run `aio app logs` and look for `cart validation allowed`, `cart validation blocked` or `cart validation error`.
3. **Commerce webhook logs** (if available in the Admin): check that the right webhook was called.

If nothing is ever blocked, look for `cart validation error` in the logs first. It usually means a payload field or setting could not be read.

## 5. Stop testing if

- A webhook is not called at all.
- The message appears but the cart has still changed after refresh.
- An over-limit change is accepted.
- There is an authentication or permission error.

Write down what happened, then fix before testing again.

## 6. What to record for each test

Date and time, tester, scenario, cart before, action, cart after, message shown, and a screenshot or log line. Do **not** record tokens, customer names, emails or full payloads.

## 7. After testing

Set the limit back to `10` and **Enable** to Yes.
