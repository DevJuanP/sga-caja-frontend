import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { BusinessType, BusinessTypeRequest } from '../../../interfaces/business-type.interface';

/** Giro comercial (US-10). Único maestro con listado simple; "eliminar" desactiva (soft delete). */
@Injectable({ providedIn: 'root' })
export class BusinessTypesService {
  private readonly api = inject(ApiService);

  list(): Observable<BusinessType[]> {
    return this.api.get<BusinessType[]>('business-types');
  }

  get(uuid: string): Observable<BusinessType> {
    return this.api.get<BusinessType>(`business-types/${uuid}`);
  }

  create(body: BusinessTypeRequest): Observable<BusinessType> {
    return this.api.post<BusinessType>('business-types', body);
  }

  update(uuid: string, body: BusinessTypeRequest): Observable<BusinessType> {
    return this.api.put<BusinessType>(`business-types/${uuid}`, body);
  }

  deactivate(uuid: string): Observable<BusinessType> {
    return this.api.patch<BusinessType>(`business-types/${uuid}/deactivate`);
  }
}
