import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWebhookPayload } from '../src/commerce-extensibility-1/lib/parse-webhook-payload.js';
test('add quote_item and update item normalize to one line', () => { for (const [kind, key] of [['add','quote_item'], ['update','item']]) { const result = parseWebhookPayload({ data: { [key]: { sku: 'A', qty: 2, quote_id: 9 } } }, kind); assert.equal(result.quoteId, '9'); assert.equal(result.changedItem.qty, 2); } });
test('field-restricted flat payload and legacy quoteItem accepted', () => { assert.equal(parseWebhookPayload({ sku: 'A', qty: 2, quote_id: 9 }, 'add').quoteId, '9'); assert.equal(parseWebhookPayload({ data: { quoteItem: { sku: 'A', qty: 2, quote_id: 9 } } }, 'add').quoteId, '9'); });
test('merge quote and source normalize', () => { const result = parseWebhookPayload({ data: { quote: { entity_id: 9, items: [{ sku: 'A', qty: 2 }] }, source: { items: [{ sku: 'B', qty: 1 }] } } }, 'merge'); assert.equal(result.nextItems.length, 1); assert.equal(result.sourceItems.length, 1); });
test('malformed shapes rejected', () => { assert.throws(() => parseWebhookPayload({}, 'add')); assert.throws(() => parseWebhookPayload({ data: { quote: {} } }, 'merge')); });
