import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCart } from '../src/commerce-extensibility-1/lib/validate-cart.js';
import { BLOCK_MESSAGE } from '../src/commerce-extensibility-1/lib/constants.js';
const params = { data: { quote: { entity_id: 9, items: [{ item_id: 1, sku: 'A', qty: 8 }, { item_id: 2, sku: 'B', qty: 3 }] }, source: { items: [{ item_id: 2, sku: 'B', qty: 3 }] } } };
const deps = { logger: () => ({ info() {}, error() {} }), settings: async () => ({ enabled: true, maxCartQuantity: 10 }), cart: async () => [{ item_id: 1, sku: 'A', qty: 8 }] };
test('merge blocks prospective increase and exact message', async () => assert.match(JSON.stringify(await validateCart(params, 'merge', deps)), new RegExp(BLOCK_MESSAGE.replaceAll('.', '\\.'))));
test('merge allows at limit and fails open when cart cannot be fetched', async () => { const accepted = structuredClone(params); accepted.data.quote.items[1].qty = 2; assert.doesNotMatch(JSON.stringify(await validateCart(accepted, 'merge', deps)), /maximum number/); assert.doesNotMatch(JSON.stringify(await validateCart(params, 'merge', { ...deps, cart: async () => { throw Error('read failed'); } })), /maximum number/); });
