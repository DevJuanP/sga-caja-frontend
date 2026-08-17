import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import {
  ProcessPaymentRequest,
  PaymentTotalResponse,
  PaymentResponse,
  PaymentPageResponse,
} from '../../interfaces/payment.interface';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly api = inject(ApiService);

  computeTotal(body: ProcessPaymentRequest): Observable<PaymentTotalResponse> {
    return this.api.post<PaymentTotalResponse>('payments/compute-total', body);
  }

  processPayment(body: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.api.post<PaymentResponse>('payments', body);
  }

  getByUuid(uuid: string): Observable<PaymentResponse> {
    return this.api.get<PaymentResponse>(`payments/${uuid}`);
  }

  list(params: { page?: number; size?: number; sort?: string }): Observable<PaymentPageResponse> {
    return this.api.get<PaymentPageResponse>('payments', params);
  }
}