import { APIRequestContext } from '@playwright/test';
import { postJson } from './api-helpers';

export interface Payment {
  uuid: string;
  receipt: { uuid: string; receiptTypeName: string; correlativeNumber: number; issueDate: string };
  paymentDate: string;
  totalAmount: number;
  currency: { uuid: string; code: string };
}

/** `POST /api/payments` — CashierOperator only. Usado como setup de terreno (plan
 * §3.3.5) por specs de fases anteriores (p. ej. resumen de movimientos, §4.5.3–4.5.4)
 * que necesitan una CxC ya liquidada sin ejercitar la UI de Cobranza — esa UI se prueba
 * en su propia fase (§4.6). */
export const paymentFactory = {
  async payViaApi(api: APIRequestContext, accountReceivableUuids: string[]): Promise<Payment> {
    return postJson<Payment>(api, '/api/payments', { accountReceivableUuids });
  },
};
