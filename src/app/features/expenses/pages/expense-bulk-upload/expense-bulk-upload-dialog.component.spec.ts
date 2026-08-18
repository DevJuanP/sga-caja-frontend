import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { ExpenseBulkUploadDialogComponent } from './expense-bulk-upload-dialog.component';

describe('ExpenseBulkUploadDialogComponent', () => {
  let fixture: ComponentFixture<ExpenseBulkUploadDialogComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ExpenseBulkUploadDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseBulkUploadDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Carga masiva de egresos"', () => {
    const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
    expect(title?.textContent).toContain('Carga masiva de egresos');
  });

  it('muestra el formato esperado de columnas', () => {
    const headers = fixture.nativeElement.querySelectorAll('.template-hint th');
    const headerNames = Array.from(headers).map((th: unknown) => (th as HTMLElement).textContent);
    expect(headerNames).toEqual([
      'DocumentNumber',
      'ProviderName',
      'ExpenseDate',
      'Amount',
      'AssociatedDocument',
      'ExpenseReason',
    ]);
  });

  it('muestra el botón de cargar deshabilitado inicialmente', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const uploadButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Cargar'),
    ) as HTMLButtonElement | undefined;
    expect(uploadButton?.disabled).toBeTruthy();
  });

  it('muestra el botón de cancelar', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Cancelar'),
    ) as HTMLButtonElement | undefined;
    expect(cancelButton).toBeTruthy();
  });
});
