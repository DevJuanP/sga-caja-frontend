import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { IncomeFormDialogComponent } from './income-form-dialog.component';

describe('IncomeFormDialogComponent', () => {
  let fixture: ComponentFixture<IncomeFormDialogComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [IncomeFormDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomeFormDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Registrar ingreso externo"', () => {
    const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
    expect(title?.textContent).toContain('Registrar ingreso externo');
  });

  it('muestra el formulario con 5 campos', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBe(5);
  });

  it('tiene el botón de registrar ingreso deshabilitado al inicio', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const submitButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Registrar ingreso'),
    ) as HTMLButtonElement | undefined;
    expect(submitButton).toBeTruthy();
    expect(submitButton!.disabled).toBe(true);
  });

  it('cierra el diálogo al cancelar', () => {
    fixture.componentInstance.close();
    expect(fixture.componentInstance.dialogRef.close).toHaveBeenCalledWith(false);
  });

  describe('moneda del ingreso (USD/PEN)', () => {
    it('el campo de moneda es requerido y el formulario es inválido sin él', () => {
      fixture.componentInstance.form.patchValue({
        depositorName: 'Carlos Díaz',
        incomeCategoryUuid: 'cat1',
        concept: 'Pago de arbitrios',
        amount: 50,
      });

      expect(fixture.componentInstance.form.controls.currencyUuid.invalid).toBe(true);
      expect(fixture.componentInstance.form.invalid).toBe(true);
    });

    it('envía currencyUuid al registrar el ingreso', () => {
      fixture.componentInstance.form.setValue({
        depositorName: 'Carlos Díaz',
        incomeCategoryUuid: 'cat1',
        currencyUuid: 'cur-usd',
        concept: 'Pago de arbitrios',
        amount: 50,
      });

      fixture.componentInstance.submit();

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/incomes'));
      expect(req.request.body.currencyUuid).toBe('cur-usd');
      req.flush({
        uuid: 'inc1',
        receipt: { uuid: 'r1', receiptTypeName: 'Recibo de ingreso', correlativeNumber: 1, issueDate: '2026-08-18' },
        depositorName: 'Carlos Díaz',
        incomeCategory: { uuid: 'cat1', name: 'Donación' },
        currency: { uuid: 'cur-usd', code: 'USD', name: 'Dólares' },
        concept: 'Pago de arbitrios',
        amount: 50,
      });

      expect(fixture.componentInstance.receiptData?.currencyCode).toBe('USD');
    });
  });
});
