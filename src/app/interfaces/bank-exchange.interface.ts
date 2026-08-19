import { Currency } from './catalog.interface';

export interface BankExchangeResponse {
  uuid: string;
  accountReceivable: {
    uuid: string;
    service: { uuid: string; name: string; consumptionBased: boolean };
    member: { uuid: string; fullName: string } | null;
    stall: { uuid: string; number: string } | null;
    periodStartDate: string;
    periodEndDate: string;
    amount: number;
    status: { uuid: string; name: 'Paid' };
  };
  bank: { uuid: string; name: string };
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
  };
  depositDate: string;
  amount: number;
  currency: Currency;
}

export interface CreateBankExchangeRequest {
  accountReceivableUuid: string;
  bankUuid: string;
  depositDate: string;
}
