import { CatalogItem, Currency } from './catalog.interface';

/**
 * Servicio cobrable (US-15). `consumptionBased: true` → el monto se calcula con
 * lecturas (EPIC 5) y se usa `unitCost`; `false` → costo fijo con `cost`.
 * El campo no usado se envía como `null` (lo exige el CHECK `ck_service_cost_by_type`
 * en BD: costo fijo requiere `unitCost = NULL` y por consumo `cost = NULL`).
 */
export interface ServiceResponse {
  uuid: string;
  name: string;
  recurrenceType: CatalogItem;
  chargeTargetType: CatalogItem;
  currency: Currency;
  consumptionBased: boolean;
  cost: number | null;
  unitCost: number | null;
  active: boolean;
}

export interface ServiceRequest {
  name: string;
  recurrenceTypeUuid: string;
  chargeTargetTypeUuid: string;
  currencyUuid: string;
  consumptionBased: boolean;
  cost: number | null;
  unitCost: number | null;
}
