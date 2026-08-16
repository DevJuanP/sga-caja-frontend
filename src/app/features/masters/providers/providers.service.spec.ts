import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProvidersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista proveedores', () => {
    service.list({ search: 'Luz', page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/providers'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('crea un proveedor', () => {
    service.create({ name: 'Luz del Sur', document: '20100123456' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/providers'));
    expect(req.request.body).toEqual({ name: 'Luz del Sur', document: '20100123456' });
    req.flush({});
  });

  it('desactiva un proveedor', () => {
    service.deactivate('pv1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/providers/pv1/deactivate'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
