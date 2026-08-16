import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PagedListParams, PagedModel } from '../../../interfaces/common.interface';
import { StallRequest, StallResponse } from '../../../interfaces/stall.interface';

/** Puestos (US-12). */
@Injectable({ providedIn: 'root' })
export class StallsService {
  private readonly api = inject(ApiService);

  list(params: PagedListParams): Observable<PagedModel<StallResponse>> {
    return this.api.getPage<StallResponse>('stalls', params);
  }

  get(uuid: string): Observable<StallResponse> {
    return this.api.get<StallResponse>(`stalls/${uuid}`);
  }

  create(body: StallRequest): Observable<StallResponse> {
    return this.api.post<StallResponse>('stalls', body);
  }

  update(uuid: string, body: StallRequest): Observable<StallResponse> {
    return this.api.put<StallResponse>(`stalls/${uuid}`, body);
  }

  deactivate(uuid: string): Observable<StallResponse> {
    return this.api.patch<StallResponse>(`stalls/${uuid}/deactivate`);
  }
}
