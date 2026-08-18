import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { PaymentsListComponent } from './payments-list.component';

describe('PaymentsListComponent', () => {
  let fixture: ComponentFixture<PaymentsListComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PaymentsListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsListComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra las pestañas "Por puestos" y "Por socios"', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Por puestos');
    expect(tabs[1].textContent).toContain('Por socios');
  });

  it('muestra los filtros de servicio y puesto en la pestaña de puestos', () => {
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBeGreaterThanOrEqual(2);
  });

  it('muestra el botón de calcular total deshabilitado al inicio', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const calcButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Calcular total'),
    ) as HTMLButtonElement | undefined;
    expect(calcButton).toBeTruthy();
    expect(calcButton!.disabled).toBe(true);
  });

  it('resetea paginación al cambiar de pestaña', () => {
    fixture.componentInstance.stallPageIndex.set(3);
    fixture.componentInstance.memberPageIndex.set(2);

    fixture.componentInstance.onTabChange(1);
    flushAll();

    expect(fixture.componentInstance.memberPageIndex()).toBe(0);
    expect(fixture.componentInstance.memberPageSize()).toBe(20);
  });

  it('resetea paginación al cambiar filtro de servicio', () => {
    fixture.componentInstance.stallPageIndex.set(5);

    fixture.componentInstance.onServiceFilter('svc-1');
    flushAll();

    expect(fixture.componentInstance.stallPageIndex()).toBe(0);
    expect(fixture.componentInstance.memberPageIndex()).toBe(0);
  });

  it('resetea paginación al limpiar filtros', () => {
    fixture.componentInstance.stallPageIndex.set(3);
    fixture.componentInstance.memberPageIndex.set(2);

    fixture.componentInstance.clearFilters();
    flushAll();

    expect(fixture.componentInstance.stallPageIndex()).toBe(0);
    expect(fixture.componentInstance.memberPageIndex()).toBe(0);
  });

  it('maneja cambio de página de puestos', () => {
    fixture.componentInstance.onStallPageChange({ pageIndex: 2, pageSize: 50, length: 100 });

    expect(fixture.componentInstance.stallPageIndex()).toBe(2);
    expect(fixture.componentInstance.stallPageSize()).toBe(50);
  });

  it('maneja cambio de página de socios', () => {
    fixture.componentInstance.onMemberPageChange({ pageIndex: 1, pageSize: 10, length: 100 });

    expect(fixture.componentInstance.memberPageIndex()).toBe(1);
    expect(fixture.componentInstance.memberPageSize()).toBe(10);
  });

  it('preserva selección entre páginas al cambiar selección', () => {
    fixture.componentInstance['items'].set([
      {
        uuid: 'ar1',
        service: { uuid: 's1', name: 'Agua', consumptionBased: false },
        member: null,
        stall: { uuid: 'st1', number: 'A-01' },
        periodStartDate: '2026-08-01',
        periodEndDate: '2026-08-31',
        amount: 50,
        status: { uuid: 'st1', name: 'Pending' },
      },
      {
        uuid: 'ar2',
        service: { uuid: 's2', name: 'Luz', consumptionBased: false },
        member: { uuid: 'm1', firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez', dni: '12345678', active: true },
        stall: null,
        periodStartDate: '2026-08-01',
        periodEndDate: '2026-08-31',
        amount: 100,
        status: { uuid: 'st2', name: 'Pending' },
      },
    ] as any);

    fixture.componentInstance.selectedUuids.set(['ar1']);
    fixture.componentInstance.onSelectionChange(['ar1']);

    expect(fixture.componentInstance.selectedUuids()).toEqual(['ar1']);
  });

  describe('exoneración de cuentas (RF-21)', () => {
    it('hasExemptSelection es false sin selección y true con selección', () => {
      expect(fixture.componentInstance.hasExemptSelection()).toBe(false);

      fixture.componentInstance.onExemptSelectionChange(['ar1']);

      expect(fixture.componentInstance.hasExemptSelection()).toBe(true);
    });

    it('el botón "Exonerar seleccionadas" está deshabilitado sin selección', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const exemptButton = Array.from(buttons).find((btn: unknown) =>
        (btn as HTMLElement).textContent?.includes('Exonerar seleccionadas'),
      ) as HTMLButtonElement | undefined;

      expect(exemptButton).toBeTruthy();
      expect(exemptButton!.disabled).toBe(true);
    });

    it('exemptSelected() llama al endpoint de exoneración por cada cuenta y recarga', () => {
      fixture.componentInstance.onExemptSelectionChange(['ar1', 'ar2']);

      fixture.componentInstance.exemptSelected();

      const req1 = httpMock.expectOne((r) => r.url.endsWith('/api/account-receivables/ar1/exempt'));
      const req2 = httpMock.expectOne((r) => r.url.endsWith('/api/account-receivables/ar2/exempt'));
      expect(req1.request.method).toBe('PATCH');
      expect(req2.request.method).toBe('PATCH');
      req1.flush({});
      req2.flush({});

      expect(fixture.componentInstance.selectedExemptUuids()).toEqual([]);
      flushAll();
    });

    it('exemptSelected() no hace nada sin cuentas seleccionadas', () => {
      fixture.componentInstance.exemptSelected();
      httpMock.expectNone((r) => r.url.includes('/exempt'));
    });
  });

  describe('resumen en otra ventana (RF-26)', () => {
    it('abre una ventana nueva cuando hay un filtro de socio o puesto activo', () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fixture.componentInstance.onStallFilter('st1');
      flushAll();

      fixture.componentInstance.openSummary();

      expect(openSpy).toHaveBeenCalledWith('/account-receivables/summary?stallUuid=st1', '_blank');
    });

    it('no abre ventana y avisa si no hay socio ni puesto seleccionado', () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      fixture.componentInstance.openSummary();

      expect(openSpy).not.toHaveBeenCalled();
    });
  });
});
