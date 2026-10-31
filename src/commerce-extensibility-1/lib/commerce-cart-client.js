import { getCommerceClient } from '@adobe/aio-commerce-lib-app';
import { resolveImsAuthParams } from '@adobe/aio-commerce-sdk/auth';

const transient = (error) => [502, 503, 504].includes(error?.response?.status) || ['ETIMEDOUT', 'ECONNRESET'].includes(error?.code);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function readCartItems(params, quoteId) {
  if (!/^\d+$/.test(String(quoteId))) throw new TypeError('Invalid quote ID');
  const client = await getCommerceClient(resolveImsAuthParams(params));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const items = await client.get(`carts/${encodeURIComponent(String(quoteId))}/items`, { timeout: 650 }).json();
      if (!Array.isArray(items)) throw new TypeError('Invalid cart items response');
      return items;
    } catch (error) {
      if (attempt === 1 || !transient(error)) throw error;
      await wait(100);
    }
  }
}
