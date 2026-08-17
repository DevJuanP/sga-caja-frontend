import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { HttpParamsInput, PagedModel } from '../../interfaces/common.interface';
import {
  AccountReceivableMovementResponse,
  AccountReceivableResponse,
  GenerateByMemberRequest,
  GenerateByStallRequest,
} from '../../interfaces/account-receivable.interface';

/** Cuentas por cobrar (US-16, US-17, US-18). */
@Injectable({ providedIn: 'root' })
export class AccountReceivablesService {
  private readonly api = inject(ApiService);

  list(params: HttpParamsInput): Observable<PagedModel<AccountReceivableResponse>> {
    return this.api.getPage<AccountReceivableResponse>('account-receivables', params);
  }

  get(uuid: string): Observable<AccountReceivableResponse> {
    return this.api.get<AccountReceivableResponse>(`account-receivables/${uuid}`);
  }

  generateByStall(body: GenerateByStallRequest): Observable<AccountReceivableResponse[]> {
    return this.api.post<AccountReceivableResponse[]>('account-receivables/generate-by-stall', body);
  }

  generateByMember(body: GenerateByMemberRequest): Observable<AccountReceivableResponse[]> {
    return this.api.post<AccountReceivableResponse[]>('account-receivables/generate-by-member', body);
  }

  exempt(uuid: string): Observable<AccountReceivableResponse> {
    return this.api.patch<AccountReceivableResponse>(`account-receivables/${uuid}/exempt`);
  }

  summary(params: HttpParamsInput): Observable<AccountReceivableMovementResponse[]> {
    return this.api.get<AccountReceivableMovementResponse[]>('account-receivables/summary', params);
  }
}
