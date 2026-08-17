import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import {
  CreateBankExchangeRequest,
  BankExchangeResponse,
} from '../../interfaces/bank-exchange.interface';
import { PagedModel } from '../../interfaces/common.interface';

@Injectable({ providedIn: 'root' })
export class BankExchangesService {
  private readonly api = inject(ApiService);

  list(params: {
    bankUuid?: string | null;
    date?: string | null;
    page?: number;
    size?: number;
  }): Observable<PagedModel<BankExchangeResponse>> {
    return this.api.get<PagedModel<BankExchangeResponse>>(
      'bank-exchanges',
      params
    );
  }

  getByUuid(uuid: string): Observable<BankExchangeResponse> {
    return this.api.get<BankExchangeResponse>(`bank-exchanges/${uuid}`);
  }

  create(body: CreateBankExchangeRequest): Observable<BankExchangeResponse> {
    return this.api.post<BankExchangeResponse>('bank-exchanges', body);
  }
}
