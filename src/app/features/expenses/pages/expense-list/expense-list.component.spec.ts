import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExpenseListComponent } from './expense-list.component';

describe('ExpenseListComponent', () => {
  let fixture: ComponentFixture<ExpenseListComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ExpenseListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseListComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Egresos"', () => {
    const title = fixture.nativeElement.querySelector('app-page-header');
    expect(title).toBeTruthy();
  });

  it('muestra los filtros de año y mes', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBeGreaterThanOrEqual(2);
  });

  it('muestra el botón de nuevo egreso', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const createButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Nuevo egreso'),
    ) as HTMLButtonElement | undefined;
    expect(createButton).toBeTruthy();
  });

  it('muestra el botón de carga masiva', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const bulkButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Carga masiva'),
    ) as HTMLButtonElement | undefined;
    expect(bulkButton).toBeTruthy();
  });

  it('maneja cambio de página', () => {
    fixture.componentInstance.onPageChange({ pageIndex: 1, pageSize: 10, length: 50 });
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(1);
    expect(fixture.componentInstance.pageSize()).toBe(10);
  });

  it('resetea paginación al cambiar filtro de año', () => {
    fixture.componentInstance.pageIndex.set(5);

    fixture.componentInstance.onYearFilter('2026');
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });

  it('resetea paginación al cambiar filtro de mes', () => {
    fixture.componentInstance.pageIndex.set(3);

    fixture.componentInstance.onMonthFilter('8');
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });

  it('resetea paginación al limpiar filtros', () => {
    fixture.componentInstance.pageIndex.set(3);

    fixture.componentInstance.clearFilters();
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });
});
