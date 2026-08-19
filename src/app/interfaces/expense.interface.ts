export interface ExpenseResponse {
  uuid: string;
  documentNumber: string;
  provider: { uuid: string; name: string };
  expenseDate: string;
  amount: number;
  associatedDocument: string;
  expenseReason: { uuid: string; name: string };
  status: { uuid: string; name: 'Pending' | 'Processed' | 'Voided' };
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
    amount: number;
  } | null;
  bulkUpload: {
    uuid: string;
    fileName: string;
  } | null;
  createdBy: { uuid: string; username: string };
}

export interface RegisterExpenseRequest {
  documentNumber: string;
  providerUuid: string;
  expenseDate: string;
  amount: number;
  associatedDocument: string;
  expenseReasonUuid: string;
}

export type ExpenseBulkUploadResult = ExpenseResponse[];
