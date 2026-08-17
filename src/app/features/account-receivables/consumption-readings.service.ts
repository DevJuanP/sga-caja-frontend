import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import {
  ConsumptionReadingResponse,
  RegisterConsumptionReadingRequest,
} from '../../interfaces/consumption-reading.interface';

/** Lecturas de consumo (US-19). */
@Injectable({ providedIn: 'root' })
export class ConsumptionReadingsService {
  private readonly api = inject(ApiService);

  getByAccountReceivable(accountReceivableUuid: string): Observable<ConsumptionReadingResponse> {
    return this.api.get<ConsumptionReadingResponse>(
      `consumption-readings/by-account-receivable/${accountReceivableUuid}`,
    );
  }

  getByUuid(uuid: string): Observable<ConsumptionReadingResponse> {
    return this.api.get<ConsumptionReadingResponse>(`consumption-readings/${uuid}`);
  }

  register(body: RegisterConsumptionReadingRequest): Observable<ConsumptionReadingResponse> {
    return this.api.post<ConsumptionReadingResponse>('consumption-readings', body);
  }
}
