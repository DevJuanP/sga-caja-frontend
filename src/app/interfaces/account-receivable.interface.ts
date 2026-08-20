import { CatalogItem, Currency } from './catalog.interface';

/** Cuenta por cobrar (US-16, US-17, US-18). */
export interface AccountReceivableResponse {
  uuid: string;
  service: ServiceRef;
  member: MemberRef | null;
  stall: StallRef | null;
  periodStartDate: string;
  periodEndDate: string;
  amount: number;
  status: StatusRef;
  currency: Currency;
}

export interface ServiceRef {
  uuid: string;
  name: string;
  consumptionBased: boolean;
}

export interface MemberRef {
  uuid: string;
  fullName: string;
}

export interface StallRef {
  uuid: string;
  number: string;
}

export interface StatusRef {
  uuid: string;
  name: AccountReceivableStatus;
}

export type AccountReceivableStatus = 'Pending' | 'Paid' | 'Exempt';

/** Request para generar CxC por puestos (US-17). */
export interface GenerateByStallRequest {
  serviceUuid: string;
  periodStartDate: string;
  periodEndDate: string;
  amount?: number;
}

/** Request para generar CxC por socios (US-17). */
export interface GenerateByMemberRequest {
  serviceUuid: string;
  periodStartDate: string;
  periodEndDate: string;
  amount?: number;
  stageCodes: number[];
  uniqueMembers: boolean;
}

/** Movimiento en resumen de CxC (US-17, RF-26). */
export interface AccountReceivableMovementResponse {
  accountReceivable: AccountReceivableResponse;
  settlementMethod: 'Payment' | 'BankExchange' | null;
  settledDate: string | null;
  receiptCorrelative: number | null;
}
