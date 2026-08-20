import { APIRequestContext } from '@playwright/test';
import { patchJson, postJson } from './api-helpers';
import { uniqueCode, uniqueName } from './ids';

export interface Provider {
  uuid: string;
  name: string;
  active: boolean;
}

export const providerFactory = {
  async createViaApi(
    api: APIRequestContext,
    overrides: Partial<{ name: string; document: string }> = {},
  ): Promise<Provider> {
    return postJson<Provider>(api, '/api/providers', {
      name: overrides.name ?? uniqueName('Proveedor'),
      document: overrides.document ?? uniqueCode('E2E-DOC-', 20),
    });
  },

  async deactivateViaApi(api: APIRequestContext, uuid: string): Promise<void> {
    await patchJson(api, `/api/providers/${uuid}/deactivate`);
  },
};
