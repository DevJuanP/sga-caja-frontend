import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('calcula el total de pagos', () => {
    service.computeTotal({ accountReceivableUuids: ['ar1', 'ar2'] }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/payments/compute-total'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ accountReceivableUuids: ['ar1', 'ar2'] });
    req.flush({ items: [], total: 0 });
  });

  it('procesa un pago', () => {
    service.processPayment({ accountReceivableUuids: ['ar1'] }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/payments'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ accountReceivableUuids: ['ar1'] });
    req.flush({
      uuid: 'p1',
      receipt: { uuid: 'r1', correlativeNumber: 101, amount: 150 },
      totalAmount: 150,
    });
  });

  it('obtiene un pago por uuid', () => {
    service.getByUuid('p1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/payments/p1'));
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'p1' });
  });

  it('lista pagos', () => {
    service.list({ page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/payments'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });
});