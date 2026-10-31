function record(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function validLine(item) {
  if (!record(item) || typeof item.sku !== 'string' || !item.sku || item.qty == null || !Number.isFinite(Number(item.qty)) || Number(item.qty) < 0) throw new TypeError('Invalid cart line');
  return item;
}

export function parseWebhookPayload(params, kind) {
  const data = record(params?.data) || record(params?.body) || record(params);
  if (!data) throw new TypeError('Invalid webhook payload');
  if (kind === 'merge') {
    const quote = record(data.quote);
    const source = record(data.source);
    if (!quote || !source || !Array.isArray(quote.items) || !Array.isArray(source.items) || quote.entity_id == null) throw new TypeError('Invalid merge payload');
    return { kind, quoteId: String(quote.entity_id), nextItems: quote.items.map(validLine), sourceItems: source.items.map(validLine) };
  }
  const item = record(kind === 'add' ? data.quote_item || data.quoteItem : data.item) || (typeof data.sku === 'string' ? data : null);
  if (!item || item.quote_id == null || !String(item.quote_id)) throw new TypeError('Missing quote ID');
  return { kind, quoteId: String(item.quote_id), changedItem: validLine(item) };
}
