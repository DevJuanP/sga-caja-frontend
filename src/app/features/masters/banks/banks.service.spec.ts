import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BanksService } from './banks.service';

describe('BanksService', () => {
  let service: BanksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BanksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista bancos', () => {
    service.list({ search: 'Banco', page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/banks'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('crea un banco con currencyUuid', () => {
    service
      .create({
        name: 'Banco de la Nación',
        accountNumber: '000123456',
        cci: '00012345678901234567',
        currencyUuid: 'pen',
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/banks'));
    expect(req.request.body).toEqual({
      name: 'Banco de la Nación',
      accountNumber: '000123456',
      cci: '00012345678901234567',
      currencyUuid: 'pen',
    });
    req.flush({});
  });

  it('desactiva un banco', () => {
    service.deactivate('bk1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/banks/bk1/deactivate'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
