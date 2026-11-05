import { BLOCK_MESSAGE } from './constants.js';

export function parentLines(items) {
  if (!Array.isArray(items)) throw new TypeError('Invalid cart items');
  return items.filter((item) => item && item.parent_item_id == null && item.parentItemId == null && item.parent_item == null);
}

export function totalUnits(items) {
  return parentLines(items).reduce((sum, item) => {
    const qty = Number(item.qty);
    if (!Number.isFinite(qty) || qty < 0) throw new TypeError('Invalid cart item quantity');
    return sum + qty;
  }, 0);
}

export function checkLimit({ currentItems, nextItems, changedItem, maxCartQuantity }) {
  if (!Number.isSafeInteger(maxCartQuantity) || maxCartQuantity < 1) throw new TypeError('Invalid limit');
  const before = totalUnits(currentItems);
  let after;
  if (nextItems) {
    after = totalUnits(nextItems);
  } else {
    if (!changedItem || changedItem.parent_item_id != null || changedItem.parentItemId != null) throw new TypeError('Invalid changed item');
    const qty = Number(changedItem.qty);
    if (!Number.isFinite(qty) || qty < 0) throw new TypeError('Invalid requested quantity');
    const current = parentLines(currentItems);
    // Never identify a cart line by SKU: configurable options can produce distinct lines.
    const matches = changedItem.item_id == null ? [] : current.filter((item) => String(item.item_id) === String(changedItem.item_id));
    if (matches.length > 1) throw new TypeError('Ambiguous cart line');
    if (matches.length === 0 && changedItem.item_id != null && current.some((item) => item.sku === changedItem.sku)) {
      // A new item_id with an existing SKU is still a distinct line.
    }
    after = before - (matches.length ? Number(matches[0].qty) : 0) + qty;
  }
  const blocked = after > before && after > maxCartQuantity;
  return { blocked, before, after, message: blocked ? BLOCK_MESSAGE : undefined };
}
