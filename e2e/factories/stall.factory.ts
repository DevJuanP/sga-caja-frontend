import { APIRequestContext } from '@playwright/test';
import { patchJson, postJson } from './api-helpers';
import { businessTypeFactory } from './business-type.factory';
import { uniqueCode } from './ids';

export interface Stall {
  uuid: string;
  number: string;
  active: boolean;
}

export interface CreateStallOverrides {
  number?: string;
  businessTypeUuid?: string;
  memberUuid?: string;
  tenantName?: string;
  tenantDocument?: string;
  validityStartDate?: string;
  validityEndDate?: string;
}

export const stallFactory = {
  async createViaApi(
    api: APIRequestContext,
    overrides: CreateStallOverrides = {},
  ): Promise<Stall> {
    const businessTypeUuid =
      overrides.businessTypeUuid ?? (await businessTypeFactory.createViaApi(api)).uuid;
    return postJson<Stall>(api, '/api/stalls', {
      number: overrides.number ?? uniqueCode('E2E-S-', 20),
      businessTypeUuid,
      memberUuid: overrides.memberUuid,
      tenantName: overrides.tenantName,
      tenantDocument: overrides.tenantDocument,
      validityStartDate: overrides.validityStartDate,
      validityEndDate: overrides.validityEndDate,
    });
  },

  async deactivateViaApi(api: APIRequestContext, uuid: string): Promise<void> {
    await patchJson(api, `/api/stalls/${uuid}/deactivate`);
  },
};
