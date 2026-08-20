import { APIRequestContext } from '@playwright/test';
import { patchJson, postJson } from './api-helpers';
import { currencyUuid } from './catalogs';
import { uniqueCode, uniqueName } from './ids';

export interface Bank {
  uuid: string;
  name: string;
  accountNumber: string;
  active: boolean;
}

export interface CreateBankOverrides {
  name?: string;
  accountNumber?: string;
  cci?: string;
  currencyCode?: 'PEN' | 'USD';
}

export const bankFactory = {
  async createViaApi(api: APIRequestContext, overrides: CreateBankOverrides = {}): Promise<Bank> {
    return postJson<Bank>(api, '/api/banks', {
      name: overrides.name ?? uniqueName('Banco'),
      accountNumber: overrides.accountNumber ?? uniqueCode('E2E-B-', 40),
      cci: overrides.cci ?? uniqueCode('CCI-', 40),
      currencyUuid: await currencyUuid(api, overrides.currencyCode ?? 'PEN'),
    });
  },

  async deactivateViaApi(api: APIRequestContext, uuid: string): Promise<void> {
    await patchJson(api, `/api/banks/${uuid}/deactivate`);
  },
};
