import { APIRequestContext } from '@playwright/test';
import { getJson } from './api-helpers';

/** Nombres tal cual sembrados en `003_currency.sql` — la UI (`catalog-select`) solo
 * muestra `name`, nunca `code`, así que los Page Objects necesitan este texto exacto
 * para seleccionar la opción correcta en los `mat-select` de moneda. */
export const CURRENCY_NAMES: Record<'PEN' | 'USD', string> = {
  PEN: 'Peruvian Sol',
  USD: 'US Dollar',
};

/** Símbolos usados por `CurrencyPipe` (src/app/shared/pipes/currency.pipe.ts) — la
 * columna "Monto" de servicios los muestra en vez del código ISO crudo. */
export const CURRENCY_SYMBOLS: Record<'PEN' | 'USD', string> = {
  PEN: 'S/',
  USD: 'US$',
};

interface CodeEntity {
  uuid: string;
  code?: string;
  name: string;
}

/** Catálogos sembrados (`Currency`, `Stage`, `RecurrenceType`, ...) — nunca se crean desde
 * un test (plan §3.3.1), solo se leen para resolver el uuid que exigen los formularios. */

export async function currencyUuid(api: APIRequestContext, code: 'PEN' | 'USD'): Promise<string> {
  const currencies = await getJson<CodeEntity[]>(api, '/api/currencies');
  const match = currencies.find((c) => c.code === code);
  if (!match) throw new Error(`Moneda "${code}" no encontrada en /api/currencies`);
  return match.uuid;
}

export async function firstStageUuid(api: APIRequestContext): Promise<string> {
  return firstUuid(api, '/api/stages');
}

export async function stageUuids(api: APIRequestContext, count = 2): Promise<string[]> {
  const stages = await getJson<CodeEntity[]>(api, '/api/stages');
  if (stages.length < count) {
    throw new Error(`Se esperaban al menos ${count} etapas sembradas en /api/stages`);
  }
  return stages.slice(0, count).map((s) => s.uuid);
}

interface StageEntity extends CodeEntity {
  code: number;
}

/** Uuid de la etapa (`Stage`) sembrada con este `code` (1/2/3 — ver `004_stage.sql`). */
export async function stageUuidByCode(api: APIRequestContext, code: number): Promise<string> {
  const stages = await getJson<StageEntity[]>(api, '/api/stages');
  const match = stages.find((s) => s.code === code);
  if (!match) throw new Error(`No hay etapa sembrada con code=${code}`);
  return match.uuid;
}

/** Uuid del `ChargeTargetType` ("Stall" o "Member") — determina en qué pestaña del
 * diálogo "Generar CxC" aparece un servicio (`cxc-generate-dialog.component.ts`
 * filtra por substring "stall"/"member" en el nombre, insensible a mayúsculas). */
export async function chargeTargetTypeUuid(
  api: APIRequestContext,
  target: 'Stall' | 'Member',
): Promise<string> {
  const types = await getJson<CodeEntity[]>(api, '/api/charge-target-types');
  const match = types.find((t) => t.name === target);
  if (!match) throw new Error(`No se encontró ChargeTargetType "${target}"`);
  return match.uuid;
}

export async function firstRecurrenceTypeUuid(api: APIRequestContext): Promise<string> {
  return firstUuid(api, '/api/recurrence-types');
}

export async function firstChargeTargetTypeUuid(api: APIRequestContext): Promise<string> {
  return firstUuid(api, '/api/charge-target-types');
}

export async function firstIncomeCategoryUuid(api: APIRequestContext): Promise<string> {
  return firstUuid(api, '/api/income-categories');
}

export async function firstExpenseReasonUuid(api: APIRequestContext): Promise<string> {
  return firstUuid(api, '/api/expense-reasons');
}

async function firstUuid(api: APIRequestContext, path: string): Promise<string> {
  const entities = await getJson<CodeEntity[]>(api, path);
  if (entities.length === 0) throw new Error(`Catálogo vacío: ${path}`);
  return entities[0].uuid;
}
