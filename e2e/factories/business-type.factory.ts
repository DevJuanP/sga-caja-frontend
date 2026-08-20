import { APIRequestContext } from '@playwright/test';
import { getJson, postJson } from './api-helpers';
import { uniqueName } from './ids';

export interface BusinessType {
  uuid: string;
  name: string;
}

/** `BusinessType` no tiene columna `active` ni endpoint de desactivación — a diferencia
 * del resto de maestros, se elimina en duro (`DELETE /api/business-types/{uuid}`).
 *
 * `removeViaApi` solo es seguro si ningún `Stall` referencia ese giro (aunque esté
 * desactivado): la FK lo impide y el backend responde 500, no 409/400. Un test que crea
 * un `Stall` a partir de este giro (p. ej. vía `stallFactory.createViaApi`) no debe
 * intentar borrarlo — se deja como fila `E2E-*` huérfana (ver plan §8, riesgo aceptado). */
export const businessTypeFactory = {
  async createViaApi(
    api: APIRequestContext,
    overrides: Partial<{ name: string }> = {},
  ): Promise<BusinessType> {
    const name = overrides.name ?? uniqueName('Giro');
    return postJson<BusinessType>(api, '/api/business-types', { name });
  },

  async removeViaApi(api: APIRequestContext, uuid: string): Promise<void> {
    const response = await api.delete(`/api/business-types/${uuid}`);
    if (!response.ok() && response.status() !== 204) {
      throw new Error(`DELETE business-types/${uuid} → ${response.status()}`);
    }
  },

  async list(api: APIRequestContext): Promise<BusinessType[]> {
    return getJson<BusinessType[]>(api, '/api/business-types');
  },
};
