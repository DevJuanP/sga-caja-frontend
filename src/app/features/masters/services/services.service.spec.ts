import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ServicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista servicios', () => {
    service.list({ search: 'Energía', page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('crea un servicio', () => {
    service
      .create({
        name: 'Energía eléctrica',
        recurrenceTypeUuid: 'rt1',
        chargeTargetTypeUuid: 'ct1',
        currencyUuid: 'pen',
        consumptionBased: false,
        cost: 150,
        unitCost: null,
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services'));
    expect(req.request.body).toEqual({
      name: 'Energía eléctrica',
      recurrenceTypeUuid: 'rt1',
      chargeTargetTypeUuid: 'ct1',
      currencyUuid: 'pen',
      consumptionBased: false,
      cost: 150,
      unitCost: null,
    });
    req.flush({});
  });

  it('desactiva un servicio', () => {
    service.deactivate('sv1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services/sv1/deactivate'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
