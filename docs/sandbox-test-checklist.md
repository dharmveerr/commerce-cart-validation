# Sandbox validation checklist

Scenario descriptions are inferred from the supplied AC mapping: the literal `requirements.md` was not provided here. Capture timestamps, cart state before and after, visible message, and evidence link for each case. Do not mark a row verified without sandbox execution.

| Scenario | Manual operation / expected result | Evidence (fill after execution) |
| --- | --- | --- |
| S1 | Add units to stay below limit; accepted. | Not run |
| S2 | Add units to reach limit exactly; accepted. | Not run |
| S3 | Add units above limit; unchanged cart and exact message: `You have reached the maximum number of items.` | Not run |
| S4 | Update existing SKU/item_id to remain within limit; old quantity replaced. | Not run |
| S4b | Update existing SKU/item_id above limit; unchanged cart and exact message. | Not run |
| S5 | Merge guest cart so total exceeds limit; unchanged carts and exact message. | Not run |
| S5b | Add second line for same SKU with different options above limit; unchanged cart and exact message. | Not run |
| S6 | Change Admin `maxCartQuantity` without redeploy; next cart change observes new value. | Not run |
| S7 | Lower/remove quantity after Admin lowers limit; allowed even if still above it. | Not run |
| S8 | Keep total unchanged while over limit; allowed. | Not run |
| Admin Create-Order | Test Admin cart path; record whether hooks fire or note limitation. | Not run |
| Error mode | Disable validation; test invalid settings and unavailable cart API; operations allowed, error logged without customer data. | Not run |

Confirm field selection paths for add/update and whether merge's `quote.items` is pre- or post-merge; check hook types can block persistence, especially for `*_after` observer names. Record evidence in PR.
