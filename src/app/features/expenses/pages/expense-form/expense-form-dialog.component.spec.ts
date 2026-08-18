import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExpenseFormDialogComponent } from './expense-form-dialog.component';

describe('ExpenseFormDialogComponent', () => {
  let fixture: ComponentFixture<ExpenseFormDialogComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ExpenseFormDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseFormDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Registrar egreso"', () => {
    const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
    expect(title?.textContent).toContain('Registrar egreso');
  });

  it('muestra el botón de registrar egreso deshabilitado inicialmente', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const submitButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Registrar egreso'),
    ) as HTMLButtonElement | undefined;
    expect(submitButton?.disabled).toBeTruthy();
  });

  it('muestra el botón de cancelar', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Cancelar'),
    ) as HTMLButtonElement | undefined;
    expect(cancelButton).toBeTruthy();
  });

  it('muestra campos del formulario', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBeGreaterThanOrEqual(5);
  });
});
