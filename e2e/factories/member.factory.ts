import { APIRequestContext } from '@playwright/test';
import { patchJson, postJson } from './api-helpers';
import { firstStageUuid } from './catalogs';
import { uniqueCode } from './ids';

export interface Member {
  uuid: string;
  code: string;
  firstName: string;
  lastName: string;
  active: boolean;
}

export interface CreateMemberOverrides {
  code?: string;
  firstName?: string;
  lastName?: string;
  shareNumber?: string;
  stageUuid?: string;
  birthDate?: string;
}

export const memberFactory = {
  async createViaApi(
    api: APIRequestContext,
    overrides: CreateMemberOverrides = {},
  ): Promise<Member> {
    const stageUuid = overrides.stageUuid ?? (await firstStageUuid(api));
    return postJson<Member>(api, '/api/members', {
      code: overrides.code ?? uniqueCode('E2E-M-', 20),
      firstName: overrides.firstName ?? 'E2E',
      lastName: overrides.lastName ?? uniqueCode('Socio-', 20),
      shareNumber: overrides.shareNumber,
      stageUuid,
      birthDate: overrides.birthDate,
    });
  },

  async deactivateViaApi(api: APIRequestContext, uuid: string): Promise<void> {
    await patchJson(api, `/api/members/${uuid}/deactivate`);
  },
};
