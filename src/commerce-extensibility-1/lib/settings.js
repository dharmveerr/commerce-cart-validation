import { initialize, getConfigurationByKey, byCodeAndLevel } from '@adobe/aio-commerce-lib-config';
import schema from '../../commerce-configuration-1/.generated/configuration-schema.json' with { type: 'json' };

function toSettings(active, value) {
  if (typeof active !== 'boolean' || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new TypeError('Invalid cart validation settings');
  return { enabled: active, maxCartQuantity: Number(value) };
}

export async function readSettings() {
  await initialize({ schema });
  const selector = byCodeAndLevel('global', 'global');
  // The state cache is per region and saves don't refresh other regions; keep it short so changes apply quickly.
  const options = { cacheTimeout: 10 };
  const [enabled, max] = await Promise.all([
    getConfigurationByKey('enabled', selector, options),
    getConfigurationByKey('maxCartQuantity', selector, options),
  ]);
  return toSettings(enabled.config?.value ?? true, max.config?.value ?? '10');
}
