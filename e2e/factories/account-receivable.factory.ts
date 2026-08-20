import { APIRequestContext } from '@playwright/test';
import { postJson, patchJson } from './api-helpers';
import { todayIso } from './ids';

export interface AccountReceivable {
  uuid: string;
  service: { uuid: string; name: string; consumptionBased: boolean };
  member: { uuid: string; fullName: string } | null;
  stall: { uuid: string; number: string } | null;
  periodStartDate: string;
  periodEndDate: string;
  amount: number;
  status: { uuid: string; name: 'Pending' | 'Paid' | 'Exempt' };
  currency: { uuid: string; code: string };
}

/**
 * `POST generate-by-stall`/`generate-by-member` generan una CxC para **cada Stall/Member
 * activo del sistema entero** (no aceptan un `stallUuid`/`memberUuid` — ver
 * `AccountReceivableService.generateByStall/generateByMember` en el backend), y no tienen
 * guarda de idempotencia: cada llamada inserta filas nuevas, aunque se repita el mismo
 * servicio+período. Por eso estas factories filtran la respuesta (que incluye una fila
 * por cada stall/member activo) para devolver solo la que corresponde al propio
 * stall/member del test — nunca asumen que la respuesta tiene un solo elemento.
 */
export const accountReceivableFactory = {
  /** Genera CxC para TODOS los puestos activos y devuelve solo la del `stallUuid` dado. */
  async generateByStallViaApi(
    api: APIRequestContext,
    params: {
      stallUuid: string;
      serviceUuid: string;
      periodStartDate?: string;
      periodEndDate?: string;
      amount?: number;
    },
  ): Promise<AccountReceivable> {
    const list = await postJson<AccountReceivable[]>(
      api,
      '/api/account-receivables/generate-by-stall',
      {
        serviceUuid: params.serviceUuid,
        periodStartDate: params.periodStartDate ?? todayIso(),
        periodEndDate: params.periodEndDate ?? todayIso(),
        amount: params.amount,
      },
    );
    const mine = list.find((item) => item.stall?.uuid === params.stallUuid);
    if (!mine) {
      throw new Error(`generate-by-stall no devolvió una CxC para el stall ${params.stallUuid}`);
    }
    return mine;
  },

  /** Genera CxC para TODOS los socios activos de las etapas dadas y devuelve solo la del
   * `memberUuid` indicado. */
  async generateByMemberViaApi(
    api: APIRequestContext,
    params: {
      memberUuid: string;
      serviceUuid: string;
      stageCodes: number[];
      periodStartDate?: string;
      periodEndDate?: string;
      amount?: number;
      uniqueMembers?: boolean;
    },
  ): Promise<AccountReceivable> {
    const list = await postJson<AccountReceivable[]>(
      api,
      '/api/account-receivables/generate-by-member',
      {
        serviceUuid: params.serviceUuid,
        periodStartDate: params.periodStartDate ?? todayIso(),
        periodEndDate: params.periodEndDate ?? todayIso(),
        amount: params.amount,
        stageCodes: params.stageCodes,
        uniqueMembers: params.uniqueMembers ?? true,
      },
    );
    const mine = list.find((item) => item.member?.uuid === params.memberUuid);
    if (!mine) {
      throw new Error(
        `generate-by-member no devolvió una CxC para el member ${params.memberUuid}`,
      );
    }
    return mine;
  },

  async exemptViaApi(api: APIRequestContext, uuid: string): Promise<AccountReceivable> {
    return patchJson<AccountReceivable>(api, `/api/account-receivables/${uuid}/exempt`);
  },
};
