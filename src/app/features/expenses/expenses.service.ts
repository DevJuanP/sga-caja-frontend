import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import {
  ExpenseResponse,
  RegisterExpenseRequest,
} from '../../interfaces/expense.interface';
import { PagedModel } from '../../interfaces/common.interface';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly api = inject(ApiService);

  list(params: {
    year?: number | null;
    month?: number | null;
    page?: number;
    size?: number;
  }): Observable<PagedModel<ExpenseResponse>> {
    return this.api.get<PagedModel<ExpenseResponse>>('expenses', params);
  }

  getByUuid(uuid: string): Observable<ExpenseResponse> {
    return this.api.get<ExpenseResponse>(`expenses/${uuid}`);
  }

  create(body: RegisterExpenseRequest): Observable<ExpenseResponse> {
    return this.api.post<ExpenseResponse>('expenses', body);
  }

  bulkUpload(file: File): Observable<ExpenseResponse[]> {
    return this.api.upload<ExpenseResponse[]>('expenses/bulk-upload', file);
  }

  voidExpense(uuid: string): Observable<void> {
    return this.api.patch<void>(`expenses/${uuid}/void`, null);
  }

  processExpense(uuid: string): Observable<ExpenseResponse> {
    return this.api.patch<ExpenseResponse>(`expenses/${uuid}/process`, null);
  }
}
