import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('construye la URL con el prefijo /api', () => {
    service.get('members').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('filtra parámetros nulos o vacíos', () => {
    service.getPage('members', { search: 'maria', active: null, size: 20 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.params.has('active')).toBe(false);
    expect(req.request.params.get('search')).toBe('maria');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('sube un archivo como multipart/form-data', () => {
    service.upload('expenses/bulk-upload', new File(['x'], 'egresos.xlsx')).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expenses/bulk-upload'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush([]);
  });

  it('descarga un blob con observación de la respuesta', () => {
    service.download('reports/movements/daily', { date: '2026-08-13' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/reports/movements/daily'));
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('date')).toBe('2026-08-13');
    req.flush(new Blob([]));
  });
});
