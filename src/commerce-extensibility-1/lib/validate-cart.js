import Core from '@adobe/aio-lib-core-logging';
import { ok, successOperation, exceptionOperation } from '@adobe/aio-commerce-lib-webhooks/responses';
import { parseWebhookPayload } from './parse-webhook-payload.js';
import { checkLimit } from './cart-limit-rule.js';
import { readSettings } from './settings.js';
import { readCartItems } from './commerce-cart-client.js';
import { BLOCK_MESSAGE } from './constants.js';

export async function validateCart(params, kind, dependencies = {}) {
  const logger = (dependencies.logger || Core.Logger)(`validate-cart-${kind}`, { level: params?.LOG_LEVEL || 'info' });
  const parse = dependencies.parse || parseWebhookPayload;
  const settings = dependencies.settings || readSettings;
  const cart = dependencies.cart || readCartItems;
  try {
    const payload = parse(params, kind);
    const { enabled, maxCartQuantity } = await settings();
    if (!enabled) { logger.info('cart validation allowed: disabled'); return ok(successOperation()); }
    const currentItems = await cart(params, payload.quoteId);
    const verdict = checkLimit({ currentItems, nextItems: payload.nextItems, changedItem: payload.changedItem, maxCartQuantity });
    if (verdict.blocked) { logger.info('cart validation blocked'); return ok(exceptionOperation(BLOCK_MESSAGE)); }
    logger.info('cart validation allowed');
    return ok(successOperation());
  } catch (error) {
    // Never log payload, token, customer data, or raw error messages.
    logger.error(`cart validation error: ${error?.constructor?.name || 'Error'}`);
    return ok(successOperation());
  }
}
