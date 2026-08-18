import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CxcSelectionComponent } from './cxc-selection.component';

describe('CxcSelectionComponent', () => {
  let fixture: ComponentFixture<CxcSelectionComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CxcSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CxcSelectionComponent);
    fixture.componentRef.setInput('data', [
      {
        uuid: 'ar1',
        serviceName: 'Agua',
        destination: 'Puesto A-01',
        period: '2026-08-01 – 2026-08-31',
        amount: 50.0,
        statusChip: { label: 'Pendiente', tone: 'warning' },
        pending: true,
      },
      {
        uuid: 'ar2',
        serviceName: 'Luz',
        destination: 'Socio Juan Pérez',
        period: '2026-08-01 – 2026-08-31',
        amount: 100.0,
        statusChip: { label: 'Pendiente', tone: 'warning' },
        pending: true,
      },
    ]);
    fixture.componentRef.setInput('totalElements', 2);
    fixture.componentRef.setInput('pageIndex', 0);
    fixture.componentRef.setInput('pageSize', 20);
    fixture.componentRef.setInput('preSelected', []);
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra las filas de datos', () => {
    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(2);
  });

  it('muestra checkboxes de selección', () => {
    const checkboxes = fixture.nativeElement.querySelectorAll('mat-checkbox');
    expect(checkboxes.length).toBe(3);
  });

  it('emite selección al cambiar checkbox', () => {
    const receivedUuids: string[] = [];
    fixture.componentInstance.selectionChange.subscribe((uuids: string[]) => {
      receivedUuids.push(...uuids);
    });

    const firstCheckbox = fixture.nativeElement.querySelector('mat-checkbox input[type="checkbox"]');
    firstCheckbox.click();
    fixture.detectChanges();

    expect(receivedUuids.length).toBeGreaterThan(0);
  });

  it('muestra mat-paginator', () => {
    const paginator = fixture.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeTruthy();
  });

  it('emite pageChange al interactuar con paginador', () => {
    const receivedEvent: unknown[] = [];
    fixture.componentInstance.pageChange.subscribe((event: unknown) => {
      receivedEvent.push(event);
    });

    const paginator = fixture.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeTruthy();
  });

  it('preselecciona filas según preSelected', () => {
    fixture.componentRef.setInput('preSelected', ['ar1']);
    fixture.detectChanges();

    expect(fixture.componentInstance.selection.isSelected(fixture.componentInstance.data()[0])).toBe(true);
    expect(fixture.componentInstance.selection.isSelected(fixture.componentInstance.data()[1])).toBe(false);
  });

  it('limpia selección al cambiar data', () => {
    fixture.componentRef.setInput('preSelected', ['ar1']);
    fixture.detectChanges();
    expect(fixture.componentInstance.selection.isSelected(fixture.componentInstance.data()[0])).toBe(true);

    fixture.componentRef.setInput('data', [
      {
        uuid: 'ar3',
        serviceName: 'Gas',
        destination: 'Puesto B-02',
        period: '2026-08-01 – 2026-08-31',
        amount: 75.0,
        statusChip: { label: 'Pendiente', tone: 'warning' },
      },
    ]);
    fixture.componentRef.setInput('preSelected', []);
    fixture.detectChanges();

    expect(fixture.componentInstance.selection.selected.length).toBe(0);
  });

  describe('marca de exoneración (RF-21)', () => {
    it('no muestra la columna "Exonerar" cuando exemptEnabled es false', () => {
      const headers = Array.from(fixture.nativeElement.querySelectorAll('th')).map(
        (th: unknown) => (th as HTMLElement).textContent?.trim(),
      );
      expect(headers).not.toContain('Exonerar');
    });

    it('muestra checkbox de exonerar sólo para cuentas pendientes cuando exemptEnabled es true', () => {
      fixture.componentRef.setInput('exemptEnabled', true);
      fixture.componentRef.setInput('data', [
        {
          uuid: 'ar1',
          serviceName: 'Agua',
          destination: 'Puesto A-01',
          period: '2026-08-01 – 2026-08-31',
          amount: 50.0,
          statusChip: { label: 'Pendiente', tone: 'warning' },
          pending: true,
        },
        {
          uuid: 'ar2',
          serviceName: 'Luz',
          destination: 'Socio Juan Pérez',
          period: '2026-08-01 – 2026-08-31',
          amount: 100.0,
          statusChip: { label: 'Pagado', tone: 'success' },
          pending: false,
        },
      ]);
      fixture.detectChanges();

      const exemptCells = fixture.nativeElement.querySelectorAll('td.checkbox-cell mat-checkbox');
      // 2 filas × checkbox de pago = 2, + 1 checkbox de exonerar sólo en la fila pendiente
      expect(exemptCells.length).toBe(3);
    });

    it('marcar una cuenta como exonerada la quita de la selección de pago y viceversa', () => {
      fixture.componentRef.setInput('exemptEnabled', true);
      fixture.detectChanges();

      const row = fixture.componentInstance.data()[0];
      fixture.componentInstance.toggleRow(row);
      expect(fixture.componentInstance.selection.isSelected(row)).toBe(true);

      fixture.componentInstance.toggleExempt(row);
      expect(fixture.componentInstance.exemptSelection.isSelected(row)).toBe(true);
      expect(fixture.componentInstance.selection.isSelected(row)).toBe(false);

      fixture.componentInstance.toggleRow(row);
      expect(fixture.componentInstance.selection.isSelected(row)).toBe(true);
      expect(fixture.componentInstance.exemptSelection.isSelected(row)).toBe(false);
    });

    it('emite exemptSelectionChange con los uuids marcados', () => {
      fixture.componentRef.setInput('exemptEnabled', true);
      fixture.detectChanges();

      const received: string[][] = [];
      fixture.componentInstance.exemptSelectionChange.subscribe((uuids: string[]) => received.push(uuids));

      fixture.componentInstance.toggleExempt(fixture.componentInstance.data()[0]);

      expect(received.at(-1)).toEqual(['ar1']);
    });

    it('preselecciona exoneradas según preSelectedExempt', () => {
      fixture.componentRef.setInput('exemptEnabled', true);
      fixture.componentRef.setInput('preSelectedExempt', ['ar2']);
      fixture.detectChanges();

      expect(fixture.componentInstance.exemptSelection.isSelected(fixture.componentInstance.data()[1])).toBe(true);
      expect(fixture.componentInstance.exemptSelection.isSelected(fixture.componentInstance.data()[0])).toBe(false);
    });
  });
});
