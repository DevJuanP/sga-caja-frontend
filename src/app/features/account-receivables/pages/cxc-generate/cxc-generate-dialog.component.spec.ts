import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CxcGenerateDialogComponent } from './cxc-generate-dialog.component';

describe('CxcGenerateDialogComponent', () => {
  let fixture: ComponentFixture<CxcGenerateDialogComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CxcGenerateDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: undefined },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CxcGenerateDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga servicios al iniciar', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services'));
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('999');
    req.flush({
      content: [
        {
          uuid: 's1',
          name: 'Energía',
          consumptionBased: false,
          cost: 150,
          unitCost: null,
          active: true,
        },
      ],
      page: { size: 999, number: 0, totalElements: 1, totalPages: 1 },
    });
    expect(fixture.componentInstance.services().length).toBe(1);
  });

  it('genera CxC por puesto', () => {
    httpMock
      .expectOne((r) => r.url.endsWith('/api/services'))
      .flush({
        content: [
          {
            uuid: 's1',
            name: 'Energía',
            consumptionBased: false,
            cost: 150,
            unitCost: null,
            active: true,
          },
        ],
        page: { size: 999, number: 0, totalElements: 1, totalPages: 1 },
      });

    fixture.componentInstance.form.patchValue({
      serviceUuid: 's1',
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      amount: 150,
    });
    fixture.componentInstance.selectedTabIndex.set(0);

    fixture.componentInstance.submit();

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/generate-by-stall'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serviceUuid: 's1',
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      amount: 150,
    });
    req.flush([]);
  });

  it('no muestra monto si el servicio es por consumo', () => {
    httpMock
      .expectOne((r) => r.url.endsWith('/api/services'))
      .flush({
        content: [
          {
            uuid: 's2',
            name: 'Agua',
            consumptionBased: true,
            cost: null,
            unitCost: 5,
            active: true,
          },
        ],
        page: { size: 999, number: 0, totalElements: 1, totalPages: 1 },
      });

    fixture.componentInstance.onServiceChange('s2');
    expect(fixture.componentInstance.showAmount).toBeFalsy();
  });
});
