import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StallsService } from './stalls.service';

describe('StallsService', () => {
  let service: StallsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StallsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista puestos', () => {
    service.list({ search: 'A-01', page: 1, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('A-01');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ content: [], page: { size: 20, number: 1, totalElements: 0, totalPages: 0 } });
  });

  it('crea un puesto', () => {
    service
      .create({
        number: 'A-01',
        businessTypeUuid: 'bt1',
        memberUuid: 'm1',
        tenantName: 'Juan Pérez',
        tenantDocument: '12345678',
        validityStartDate: '2026-01-01',
        validityEndDate: '2026-12-31',
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      number: 'A-01',
      businessTypeUuid: 'bt1',
      memberUuid: 'm1',
      tenantName: 'Juan Pérez',
      tenantDocument: '12345678',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
    });
    req.flush({});
  });

  it('desactiva un puesto', () => {
    service.deactivate('st1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls/st1/deactivate'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('reactiva un puesto (RF-11)', () => {
    service.activate('st1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls/st1/activate'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
