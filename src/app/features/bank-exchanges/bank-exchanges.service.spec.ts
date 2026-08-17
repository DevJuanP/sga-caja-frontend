import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BankExchangesService } from './bank-exchanges.service';

describe('BankExchangesService', () => {
  let service: BankExchangesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BankExchangesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista canjes bancarios con filtros', () => {
    service.list({ bankUuid: 'b1', date: '2026-08-13', page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/bank-exchanges'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('bankUuid')).toBe('b1');
    expect(req.request.params.get('date')).toBe('2026-08-13');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('obtiene un canje por uuid', () => {
    service.getByUuid('ex1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/bank-exchanges/ex1'));
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'ex1' });
  });

  it('crea un canje bancario', () => {
    const body = { accountReceivableUuid: 'ar1', bankUuid: 'b1', depositDate: '2026-08-13' };
    service.create(body).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/bank-exchanges'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ uuid: 'ex1', ...body });
  });
});
