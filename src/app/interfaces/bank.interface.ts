import { Currency } from './catalog.interface';

/** Banco (US-13). `currency` viene expandido en las respuestas. */
export interface BankResponse {
  uuid: string;
  name: string;
  accountNumber: string;
  cci: string;
  currency: Currency;
  active: boolean;
}

export interface BankRequest {
  name: string;
  accountNumber: string;
  cci: string;
  currencyUuid: string;
}
