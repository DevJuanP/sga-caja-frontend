import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PagedListParams, PagedModel } from '../../../interfaces/common.interface';
import { ProviderRequest, ProviderResponse } from '../../../interfaces/provider.interface';

/** Proveedores (US-14). */
@Injectable({ providedIn: 'root' })
export class ProvidersService {
  private readonly api = inject(ApiService);

  list(params: PagedListParams): Observable<PagedModel<ProviderResponse>> {
    return this.api.getPage<ProviderResponse>('providers', params);
  }

  get(uuid: string): Observable<ProviderResponse> {
    return this.api.get<ProviderResponse>(`providers/${uuid}`);
  }

  create(body: ProviderRequest): Observable<ProviderResponse> {
    return this.api.post<ProviderResponse>('providers', body);
  }

  update(uuid: string, body: ProviderRequest): Observable<ProviderResponse> {
    return this.api.put<ProviderResponse>(`providers/${uuid}`, body);
  }

  deactivate(uuid: string): Observable<ProviderResponse> {
    return this.api.patch<ProviderResponse>(`providers/${uuid}/deactivate`);
  }

  activate(uuid: string): Observable<ProviderResponse> {
    return this.api.patch<ProviderResponse>(`providers/${uuid}/activate`);
  }
}
