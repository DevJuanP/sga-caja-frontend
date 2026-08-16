import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { BankRequest, BankResponse } from '../../../interfaces/bank.interface';
import { PagedListParams, PagedModel } from '../../../interfaces/common.interface';

/** Bancos (US-13). */
@Injectable({ providedIn: 'root' })
export class BanksService {
  private readonly api = inject(ApiService);

  list(params: PagedListParams): Observable<PagedModel<BankResponse>> {
    return this.api.getPage<BankResponse>('banks', params);
  }

  get(uuid: string): Observable<BankResponse> {
    return this.api.get<BankResponse>(`banks/${uuid}`);
  }

  create(body: BankRequest): Observable<BankResponse> {
    return this.api.post<BankResponse>('banks', body);
  }

  update(uuid: string, body: BankRequest): Observable<BankResponse> {
    return this.api.put<BankResponse>(`banks/${uuid}`, body);
  }

  deactivate(uuid: string): Observable<BankResponse> {
    return this.api.patch<BankResponse>(`banks/${uuid}/deactivate`);
  }
}
