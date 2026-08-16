import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PagedListParams, PagedModel } from '../../../interfaces/common.interface';
import { MemberRequest, MemberResponse } from '../../../interfaces/member.interface';

/** Socios (US-11). */
@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly api = inject(ApiService);

  list(params: PagedListParams): Observable<PagedModel<MemberResponse>> {
    return this.api.getPage<MemberResponse>('members', params);
  }

  get(uuid: string): Observable<MemberResponse> {
    return this.api.get<MemberResponse>(`members/${uuid}`);
  }

  create(body: MemberRequest): Observable<MemberResponse> {
    return this.api.post<MemberResponse>('members', body);
  }

  update(uuid: string, body: MemberRequest): Observable<MemberResponse> {
    return this.api.put<MemberResponse>(`members/${uuid}`, body);
  }

  deactivate(uuid: string): Observable<MemberResponse> {
    return this.api.patch<MemberResponse>(`members/${uuid}/deactivate`);
  }
}
