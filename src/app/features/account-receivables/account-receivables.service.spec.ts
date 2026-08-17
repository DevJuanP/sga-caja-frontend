import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountReceivablesService } from './account-receivables.service';

describe('AccountReceivablesService', () => {
  let service: AccountReceivablesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountReceivablesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista cuentas por cobrar', () => {
    service.list({ page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/account-receivables'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('obtiene una cuenta por cobrar por uuid', () => {
    service.get('ar1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/account-receivables/ar1'));
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'ar1' });
  });

  it('genera CxC por puesto', () => {
    service
      .generateByStall({
        serviceUuid: 's1',
        periodStartDate: '2026-08-01',
        periodEndDate: '2026-08-31',
        amount: 150,
      })
      .subscribe();

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/generate-by-stall'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serviceUuid: 's1',
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      amount: 150,
    });
    req.flush([]);
  });

  it('genera CxC por socio', () => {
    service
      .generateByMember({
        serviceUuid: 's1',
        periodStartDate: '2026-08-01',
        periodEndDate: '2026-08-31',
        stageCodes: [1, 2],
        uniqueMembers: true,
      })
      .subscribe();

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/generate-by-member'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serviceUuid: 's1',
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      stageCodes: [1, 2],
      uniqueMembers: true,
    });
    req.flush([]);
  });

  it('exonera una cuenta por cobrar', () => {
    service.exempt('ar1').subscribe();

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/ar1/exempt'),
    );
    expect(req.request.method).toBe('PATCH');
    req.flush({ uuid: 'ar1' });
  });

  it('obtiene resumen de movimientos', () => {
    service.summary({ memberUuid: 'm1' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/account-receivables/summary'));
    expect(req.request.params.get('memberUuid')).toBe('m1');
    req.flush([]);
  });
});
