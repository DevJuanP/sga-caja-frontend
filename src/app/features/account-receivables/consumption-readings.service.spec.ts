import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConsumptionReadingsService } from './consumption-readings.service';

describe('ConsumptionReadingsService', () => {
  let service: ConsumptionReadingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ConsumptionReadingsService],
    });
    service = TestBed.inject(ConsumptionReadingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByAccountReceivable llama GET con UUID correcto', () => {
    service.getByAccountReceivable('ar1').subscribe();

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/consumption-readings/by-account-receivable/ar1'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'cr1', accountReceivableUuid: 'ar1', initialReading: 100, finalReading: 200, unitCost: 0.5, calculatedAmount: 50 });
  });

  it('getByUuid llama GET con UUID correcto', () => {
    service.getByUuid('cr1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/consumption-readings/cr1'));
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'cr1', accountReceivableUuid: 'ar1', initialReading: 100, finalReading: 200, unitCost: 0.5, calculatedAmount: 50 });
  });

  it('register llama POST con body correcto', () => {
    const body = { accountReceivableUuid: 'ar1', initialReading: 100, finalReading: 200 };
    service.register(body).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/consumption-readings'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ uuid: 'cr1', accountReceivableUuid: 'ar1', initialReading: 100, finalReading: 200, unitCost: 0.5, calculatedAmount: 50 });
  });
});
