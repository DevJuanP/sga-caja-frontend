import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import {
  CreateIncomeRequest,
  IncomeResponse,
} from '../../interfaces/income.interface';
import { PagedModel } from '../../interfaces/common.interface';

@Injectable({ providedIn: 'root' })
export class IncomesService {
  private readonly api = inject(ApiService);

  list(params: {
    incomeCategoryUuid?: string | null;
    date?: string | null;
    page?: number;
    size?: number;
  }): Observable<PagedModel<IncomeResponse>> {
    return this.api.get<PagedModel<IncomeResponse>>('incomes', params);
  }

  getByUuid(uuid: string): Observable<IncomeResponse> {
    return this.api.get<IncomeResponse>(`incomes/${uuid}`);
  }

  create(body: CreateIncomeRequest): Observable<IncomeResponse> {
    return this.api.post<IncomeResponse>('incomes', body);
  }
}
