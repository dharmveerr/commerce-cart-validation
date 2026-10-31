import { validateCart } from '../../lib/validate-cart.js';
import { ok, successOperation } from '@adobe/aio-commerce-lib-webhooks/responses';
import Core from '@adobe/aio-lib-core-logging';

export async function main(params) {
  try { return await validateCart(params, 'merge'); }
  catch (error) { Core.Logger('validate-cart-merge').error(`unexpected error: ${error?.constructor?.name || 'Error'}`); return ok(successOperation()); }
}
