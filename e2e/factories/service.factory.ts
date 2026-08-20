import { APIRequestContext } from '@playwright/test';
import { patchJson, postJson } from './api-helpers';
import { chargeTargetTypeUuid, currencyUuid, firstRecurrenceTypeUuid } from './catalogs';
import { uniqueName } from './ids';

export interface Service {
  uuid: string;
  name: string;
  consumptionBased: boolean;
  cost: number | null;
  unitCost: number | null;
  currency: { uuid: string; code: string };
  chargeTargetType: { uuid: string; name: string };
  active: boolean;
}

export interface CreateServiceOverrides {
  name?: string;
  currencyCode?: 'PEN' | 'USD';
  recurrenceTypeUuid?: string;
  /** "Stall" (aparece en la pestaña "Por puestos" de Generar CxC) o "Member" (pestaña
   * "Por socios") — ver `cxc-generate-dialog.component.ts`. Default: "Stall". */
  chargeTarget?: 'Stall' | 'Member';
  consumptionBased?: boolean;
  /** Costo fijo — requerido cuando `consumptionBased` es `false` (default). */
  cost?: number;
  /** Costo por unidad de consumo — requerido cuando `consumptionBased` es `true`. */
  unitCost?: number;
}

export const serviceFactory = {
  async createViaApi(
    api: APIRequestContext,
    overrides: CreateServiceOverrides = {},
  ): Promise<Service> {
    const consumptionBased = overrides.consumptionBased ?? false;
    return postJson<Service>(api, '/api/services', {
      name: overrides.name ?? uniqueName('Servicio'),
      recurrenceTypeUuid: overrides.recurrenceTypeUuid ?? (await firstRecurrenceTypeUuid(api)),
      chargeTargetTypeUuid: await chargeTargetTypeUuid(api, overrides.chargeTarget ?? 'Stall'),
      currencyUuid: await currencyUuid(api, overrides.currencyCode ?? 'PEN'),
      consumptionBased,
      cost: consumptionBased ? undefined : (overrides.cost ?? 100),
      unitCost: consumptionBased ? (overrides.unitCost ?? 5) : undefined,
    });
  },

  async deactivateViaApi(api: APIRequestContext, uuid: string): Promise<void> {
    await patchJson(api, `/api/services/${uuid}/deactivate`);
  },
};
