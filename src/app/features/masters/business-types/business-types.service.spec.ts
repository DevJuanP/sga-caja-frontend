import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BusinessTypesService } from './business-types.service';

describe('BusinessTypesService', () => {
  let service: BusinessTypesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BusinessTypesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista sin paginar', () => {
    service.list().subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types'));
    expect(req.request.method).toBe('GET');
    req.flush([{ uuid: 'b1', name: 'Alimentos' }]);
  });

  it('crea un giro', () => {
    service.create({ name: 'Alimentos' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Alimentos' });
    req.flush({ uuid: 'b1', name: 'Alimentos' });
  });

  it('actualiza un giro', () => {
    service.update('b1', { name: 'Abarrotes' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types/b1'));
    expect(req.request.method).toBe('PUT');
    req.flush({ uuid: 'b1', name: 'Abarrotes' });
  });

  it('elimina un giro (DELETE)', () => {
    service.delete('b1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types/b1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
