import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PagedListParams, PagedModel } from '../../../interfaces/common.interface';
import { ServiceRequest, ServiceResponse } from '../../../interfaces/service.interface';

/** Servicios cobrables (US-15). */
@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly api = inject(ApiService);

  list(params: PagedListParams): Observable<PagedModel<ServiceResponse>> {
    return this.api.getPage<ServiceResponse>('services', params);
  }

  get(uuid: string): Observable<ServiceResponse> {
    return this.api.get<ServiceResponse>(`services/${uuid}`);
  }

  create(body: ServiceRequest): Observable<ServiceResponse> {
    return this.api.post<ServiceResponse>('services', body);
  }

  update(uuid: string, body: ServiceRequest): Observable<ServiceResponse> {
    return this.api.put<ServiceResponse>(`services/${uuid}`, body);
  }

  deactivate(uuid: string): Observable<ServiceResponse> {
    return this.api.patch<ServiceResponse>(`services/${uuid}/deactivate`);
  }

  activate(uuid: string): Observable<ServiceResponse> {
    return this.api.patch<ServiceResponse>(`services/${uuid}/activate`);
  }
}
