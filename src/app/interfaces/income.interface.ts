import { Currency } from './catalog.interface';

export interface IncomeResponse {
  uuid: string;
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
  };
  depositorName: string;
  incomeCategory: { uuid: string; name: string };
  currency: Currency;
  concept: string;
  amount: number;
}

export interface CreateIncomeRequest {
  depositorName: string;
  incomeCategoryUuid: string;
  currencyUuid: string;
  concept: string;
  amount: number;
}
