import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BankExchangeListComponent } from './bank-exchange-list.component';

describe('BankExchangeListComponent', () => {
  let fixture: ComponentFixture<BankExchangeListComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BankExchangeListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BankExchangeListComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Canjes bancarios"', () => {
    const title = fixture.nativeElement.querySelector('app-page-header');
    expect(title).toBeTruthy();
  });

  it('muestra los filtros de banco y fecha', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBeGreaterThanOrEqual(2);
  });

  it('muestra el botón de nuevo canje', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const createButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Nuevo canje'),
    ) as HTMLButtonElement | undefined;
    expect(createButton).toBeTruthy();
  });

  it('maneja cambio de página', () => {
    fixture.componentInstance.onPageChange({ pageIndex: 1, pageSize: 10, length: 50 });
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(1);
    expect(fixture.componentInstance.pageSize()).toBe(10);
  });

  it('resetea paginación al cambiar filtro de banco', () => {
    fixture.componentInstance.pageIndex.set(5);

    fixture.componentInstance.onBankFilter('bank-1');
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });

  it('resetea paginación al cambiar filtro de fecha', () => {
    fixture.componentInstance.pageIndex.set(3);

    fixture.componentInstance.onDateFilter('2026-08-13');
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
