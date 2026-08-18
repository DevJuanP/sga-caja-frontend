import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ServiceFormDialogComponent } from './service-form-dialog.component';

describe('ServiceFormDialogComponent', () => {
  let fixture: ComponentFixture<ServiceFormDialogComponent>;
  let httpMock: HttpTestingController;

  async function setup(data: unknown): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ServiceFormDialogComponent, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ServiceFormDialogComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.endsWith('/api/recurrence-types')).flush([
      { uuid: 'r1', code: 'MONTHLY', name: 'Mensual' },
    ]);
    httpMock.expectOne((r) => r.url.endsWith('/api/charge-target-types')).flush([
      { uuid: 'c1', code: 'BY_STALL', name: 'Por puesto' },
    ]);
    httpMock.expectOne((r) => r.url.endsWith('/api/currencies')).flush([
      { uuid: 'cu1', code: 'PEN', name: 'Sol' },
    ]);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('valida el monto según el tipo de cobro', async () => {
    await setup(null);

    fixture.componentInstance.form.controls.consumptionBased.setValue(false);
    fixture.componentInstance.form.controls.cost.setValue(0);
    expect(fixture.componentInstance.form.hasError('amountRequired')).toBe(true);

    fixture.componentInstance.form.controls.cost.setValue(25);
    expect(fixture.componentInstance.form.hasError('amountRequired')).toBe(false);

    fixture.componentInstance.form.controls.consumptionBased.setValue(true);
    fixture.componentInstance.form.controls.unitCost.setValue(0);
    expect(fixture.componentInstance.form.hasError('amountRequired')).toBe(true);

    fixture.componentInstance.form.controls.unitCost.setValue(1.5);
    expect(fixture.componentInstance.form.hasError('amountRequired')).toBe(false);
  });

  it('crea un servicio con costo fijo al enviar', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.setValue({
      name: 'Luz',
      recurrenceTypeUuid: 'r1',
      chargeTargetTypeUuid: 'c1',
      currencyUuid: 'cu1',
      consumptionBased: false,
      cost: 25,
      unitCost: 0,
    });
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Luz',
      recurrenceTypeUuid: 'r1',
      chargeTargetTypeUuid: 'c1',
      currencyUuid: 'cu1',
      consumptionBased: false,
      cost: 25,
      unitCost: null,
    });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('crea un servicio medido con costo unitario', async () => {
    await setup(null);

    fixture.componentInstance.form.setValue({
      name: 'Luz',
      recurrenceTypeUuid: 'r1',
      chargeTargetTypeUuid: 'c1',
      currencyUuid: 'cu1',
      consumptionBased: true,
      cost: 0,
      unitCost: 1.5,
    });
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services'));
    expect(req.request.body).toMatchObject({ consumptionBased: true, cost: null, unitCost: 1.5 });
    req.flush({});
  });
});
