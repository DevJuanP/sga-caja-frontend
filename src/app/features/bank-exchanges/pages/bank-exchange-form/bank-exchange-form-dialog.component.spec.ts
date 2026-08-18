import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { BankExchangeFormDialogComponent } from './bank-exchange-form-dialog.component';

describe('BankExchangeFormDialogComponent', () => {
  let fixture: ComponentFixture<BankExchangeFormDialogComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BankExchangeFormDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BankExchangeFormDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Registrar canje bancario"', () => {
    const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
    expect(title?.textContent).toContain('Registrar canje bancario');
  });

  it('muestra el formulario con 3 campos', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBe(3);
  });

  it('tiene el botón de registrar canje deshabilitado al inicio', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const submitButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Registrar canje'),
    ) as HTMLButtonElement | undefined;
    expect(submitButton).toBeTruthy();
    expect(submitButton!.disabled).toBe(true);
  });

  it('cierra el diálogo al cancelar', () => {
    fixture.componentInstance.close();
    expect(fixture.componentInstance.dialogRef.close).toHaveBeenCalledWith(false);
  });
});
