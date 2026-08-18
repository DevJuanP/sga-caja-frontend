import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { IncomeListComponent } from './income-list.component';

const usdIncome = {
  uuid: 'inc1',
  receipt: { uuid: 'r1', receiptTypeName: 'Recibo de ingreso', correlativeNumber: 10, issueDate: '2026-08-13' },
  depositorName: 'Carlos Díaz',
  incomeCategory: { uuid: 'cat1', name: 'Donación' },
  currency: { uuid: 'cur-usd', code: 'USD', name: 'Dólares' },
  concept: 'Aporte extraordinario',
  amount: 120,
};

describe('IncomeListComponent', () => {
  let fixture: ComponentFixture<IncomeListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [IncomeListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomeListComponent);
    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Ingresos externos"', () => {
    const title = fixture.nativeElement.querySelector('app-page-header');
    expect(title).toBeTruthy();
  });

  it('muestra los filtros de categoría y fecha', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBeGreaterThanOrEqual(2);
  });

  it('muestra el botón de nuevo ingreso', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const createButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Nuevo ingreso'),
    ) as HTMLButtonElement | undefined;
    expect(createButton).toBeTruthy();
  });

  it('maneja cambio de página', () => {
    fixture.componentInstance.onPageChange({ pageIndex: 1, pageSize: 10, length: 50 });
    flushAll();

    expect(fixture.componentInstance.pageIndex()).toBe(1);
    expect(fixture.componentInstance.pageSize()).toBe(10);
  });

  it('resetea paginación al cambiar filtro de categoría', () => {
    fixture.componentInstance.pageIndex.set(5);

    fixture.componentInstance.onCategoryFilter('cat-1');
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

  describe('moneda del ingreso', () => {
    it('muestra la moneda real del ingreso en vez de un valor fijo', () => {
      fixture.componentInstance.load();
      httpMock.expectOne((r) => r.url.endsWith('/api/incomes')).flush({
        content: [usdIncome],
        page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
      });
      fixture.detectChanges();

      expect(fixture.componentInstance.rows()[0].currency).toBe('USD');
    });

    it('pasa el código de moneda del ingreso al ver el voucher', () => {
      fixture.componentInstance.load();
      httpMock.expectOne((r) => r.url.endsWith('/api/incomes')).flush({
        content: [usdIncome],
        page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
      });
      fixture.detectChanges();

      const setInputSpy = vi.fn();
      vi.spyOn(dialog, 'open').mockReturnValue({ componentRef: { setInput: setInputSpy } } as any);

      fixture.componentInstance.onAction({ actionId: 'view-receipt', row: { uuid: 'inc1' } });

      expect(setInputSpy).toHaveBeenCalledWith('receipt', expect.objectContaining({ currencyCode: 'USD' }));
    });
  });
});
