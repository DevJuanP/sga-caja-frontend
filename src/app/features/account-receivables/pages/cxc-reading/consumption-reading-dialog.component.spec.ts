import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConsumptionReadingDialogComponent } from './consumption-reading-dialog.component';

describe('ConsumptionReadingDialogComponent', () => {
  let fixture: ComponentFixture<ConsumptionReadingDialogComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConsumptionReadingDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { accountReceivableUuid: 'ar1' } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConsumptionReadingDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('muestra formulario cuando no tiene lectura', () => {
    httpMock
      .expectOne((r) => r.url.endsWith('/api/consumption-readings/by-account-receivable/ar1'))
      .flush({}, { status: 404, statusText: 'Not Found' });

    fixture.detectChanges();
    expect(fixture.componentInstance.hasReading()).toBeFalsy();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('muestra datos en solo lectura cuando tiene lectura', () => {
    httpMock
      .expectOne((r) => r.url.endsWith('/api/consumption-readings/by-account-receivable/ar1'))
      .flush({
        uuid: 'cr1',
        accountReceivableUuid: 'ar1',
        initialReading: 100,
        finalReading: 200,
        unitCost: 0.5,
        calculatedAmount: 50,
      });

    fixture.detectChanges();
    expect(fixture.componentInstance.hasReading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('100');
    expect(fixture.nativeElement.textContent).toContain('200');
    expect(fixture.nativeElement.textContent).toContain('50');
  });

  it('submit llama POST y cierra dialog', () => {
    httpMock
      .expectOne((r) => r.url.endsWith('/api/consumption-readings/by-account-receivable/ar1'))
      .flush({}, { status: 404, statusText: 'Not Found' });

    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      initialReading: 100,
      finalReading: 200,
    });

    fixture.componentInstance.submit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/consumption-readings'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      accountReceivableUuid: 'ar1',
      initialReading: 100,
      finalReading: 200,
    });
    req.flush({
      uuid: 'cr1',
      accountReceivableUuid: 'ar1',
      initialReading: 100,
      finalReading: 200,
      unitCost: 0.5,
      calculatedAmount: 50,
    });

    expect(fixture.componentInstance.dialogRef.close).toHaveBeenCalledWith(true);
  });
});
