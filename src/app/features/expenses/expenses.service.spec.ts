import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpensesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista egresos con filtros de año y mes', () => {
    service.list({ year: 2026, month: 8, page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expenses'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('8');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('obtiene un egreso por uuid', () => {
    service.getByUuid('exp1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expenses/exp1'));
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'exp1' });
  });

  it('crea un egreso', () => {
    const body = {
      documentNumber: 'F001-000123',
      providerUuid: 'prov1',
      expenseDate: '2026-08-18',
      amount: 250.0,
      associatedDocument: 'OC-001',
      expenseReasonUuid: 'reason1',
      currencyUuid: 'cur1',
    };
    service.create(body).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expenses'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ uuid: 'exp1', ...body });
  });

  it('anula un egreso', () => {
    service.voidExpense('exp1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expenses/exp1/void'));
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('procesa un egreso', () => {
    service.processExpense('exp1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expenses/exp1/process'));
    expect(req.request.method).toBe('PATCH');
    req.flush({ uuid: 'exp1', status: { uuid: 's1', name: 'Processed' } });
  });
});
