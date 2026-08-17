import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
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
        provideAnimationsAsync(),
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

  it('muestra el formulario con 4 campos', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBe(4);
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
});
