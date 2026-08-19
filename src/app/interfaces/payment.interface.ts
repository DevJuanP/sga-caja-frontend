import { AccountReceivableResponse } from './account-receivable.interface';
import { Currency } from './catalog.interface';

/** Request para calcular total de pagos */
export interface ProcessPaymentRequest {
  accountReceivableUuids: string[];
}

/** Respuesta de cálculo de total */
export interface PaymentTotalResponse {
  items: { accountReceivableUuid: string; amount: number }[];
  total: number;
  currency: Currency;
}

/** Respuesta de procesamiento de pago */
export interface PaymentResponse {
  uuid: string;
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
    amount: number;
  };
  paymentDate: string;
  totalAmount: number;
  details: { accountReceivableUuid: string; amount: number }[];
  createdBy: { uuid: string; username: string };
  currency: Currency;
}

/** Respuesta de listado de pagos */
export interface PaymentListResponse {
  uuid: string;
  receipt: {
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
    amount: number;
  };
  paymentDate: string;
  totalAmount: number;
}

/** Modelo paginado para pagos */
export interface PaymentPageResponse {
  content: PaymentListResponse[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}