import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IncomesService } from './incomes.service';

describe('IncomesService', () => {
  let service: IncomesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IncomesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista ingresos con filtros', () => {
    service.list({ incomeCategoryUuid: 'cat1', date: '2026-08-13', page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/incomes'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('incomeCategoryUuid')).toBe('cat1');
    expect(req.request.params.get('date')).toBe('2026-08-13');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('obtiene un ingreso por uuid', () => {
    service.getByUuid('inc1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/incomes/inc1'));
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'inc1' });
  });

  it('crea un ingreso externo', () => {
    const body = { depositorName: 'Carlos Díaz', incomeCategoryUuid: 'cat1', concept: 'Pago de arbitrios', amount: 50.00 };
    service.create(body).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/incomes'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ uuid: 'inc1', ...body });
  });
});
