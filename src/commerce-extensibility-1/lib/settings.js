import { initialize, getConfigurationByKey, byCodeAndLevel } from '@adobe/aio-commerce-lib-config';
import schema from '../../commerce-configuration-1/.generated/configuration-schema.json' with { type: 'json' };

export async function readSettings() {
  await initialize({ schema });
  const selector = byCodeAndLevel('global', 'global');
  const [enabled, max] = await Promise.all([
    getConfigurationByKey('enabled', selector),
    getConfigurationByKey('maxCartQuantity', selector),
  ]);
  const active = enabled.config?.value ?? true;
  const value = max.config?.value ?? '10';
  if (typeof active !== 'boolean' || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new TypeError('Invalid cart validation settings');
  return { enabled: active, maxCartQuantity: Number(value) };
}
