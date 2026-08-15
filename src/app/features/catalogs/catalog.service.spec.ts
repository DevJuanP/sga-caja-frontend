import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogItem } from '../../interfaces/catalog.interface';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carga un catálogo por su ruta', () => {
    let result: CatalogItem[] = [];
    service.list('currencies').subscribe((items) => (result = items));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/currencies'));
    expect(req.request.method).toBe('GET');
    req.flush([
      { uuid: 'pen', name: 'Sol Peruano', code: 'PEN' },
      { uuid: 'usd', name: 'Dólar Americano', code: 'USD' },
    ]);

    expect(result.length).toBe(2);
  });

  it('cachea el listado: una sola petición para varios suscriptores', () => {
    service.list('stages').subscribe();
    service.list('stages').subscribe();

    httpMock.expectOne((r) => r.url.endsWith('/api/stages')).flush([
      { uuid: 's1', code: 1, name: 'Socio activo' },
    ]);
    httpMock.expectNone((r) => r.url.endsWith('/api/stages'));
  });

  it('obtiene el detalle por uuid', () => {
    let item: CatalogItem | undefined;
    service.getDetail('expenseReasons', 'm1').subscribe((r) => (item = r));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/expense-reasons/m1'));
    req.flush({ uuid: 'm1', name: 'Mantenimiento' });

    expect(item?.name).toBe('Mantenimiento');
  });

  it('invalidate fuerza una nueva petición', () => {
    service.list('receiptTypes').subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/api/receipt-types')).flush([
      { uuid: 'r1', name: 'Recibo de ingreso' },
    ]);

    service.invalidate('receiptTypes');
    service.list('receiptTypes').subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/api/receipt-types')).flush([
      { uuid: 'r1', name: 'Recibo de ingreso' },
    ]);
  });
});
