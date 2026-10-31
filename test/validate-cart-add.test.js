import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCart } from '../src/commerce-extensibility-1/lib/validate-cart.js';
import { BLOCK_MESSAGE } from '../src/commerce-extensibility-1/lib/constants.js';
const input = { data: { quoteItem: { item_id: 2, quote_id: 9, sku: 'B', qty: 4 } } };
const logger = () => ({ info() {}, error() {} });
const deps = { logger, settings: async () => ({ enabled: true, maxCartQuantity: 10 }), cart: async () => [{ item_id: 1, sku: 'A', qty: 7 }] };
test('add blocks over-limit with exact text', async () => assert.equal((await validateCart(input, 'add', deps)).body.message, BLOCK_MESSAGE));
test('add allows below limit and disabled', async () => { assert.equal((await validateCart({ data: { quoteItem: { ...input.data.quoteItem, qty: 3 } } }, 'add', deps)).body.op, 'success'); assert.equal((await validateCart(input, 'add', { ...deps, settings: async () => ({ enabled: false, maxCartQuantity: 10 }) })).body.op, 'success'); });
test('malformed input, invalid setting and read errors fail open', async () => {
  assert.equal((await validateCart({}, 'add', deps)).body.op, 'success');
  for (const override of [
    { settings: async () => { throw Error('bad setting'); } },
    { cart: async () => { throw Error('cart error'); } },
  ]) assert.equal((await validateCart(input, 'add', { ...deps, ...override })).body.op, 'success');
});
