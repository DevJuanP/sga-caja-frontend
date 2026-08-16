import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CrudTableComponent, RowActionEvent } from './crud-table.component';

describe('CrudTableComponent', () => {
  let fixture: ComponentFixture<CrudTableComponent>;
  let element: HTMLElement;

  const rows = [
    { uuid: 'm1', code: 'S-001', name: 'María Gómez', activeChip: { label: 'Activo', tone: 'success' } },
    { uuid: 'm2', code: 'S-002', name: 'Juan Pérez', activeChip: { label: 'Inactivo', tone: 'neutral' } },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CrudTableComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(CrudTableComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('columns', [
      { key: 'code', header: 'Código', sortable: true },
      { key: 'name', header: 'Nombre' },
      { key: 'activeChip', header: 'Estado', type: 'chip' },
    ]);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('totalElements', 2);
    fixture.detectChanges();
  });

  it('renderiza las filas y columnas', () => {
    expect(element.textContent).toContain('S-001');
    expect(element.textContent).toContain('María Gómez');
    expect(element.textContent).toContain('Activo');
    expect(element.querySelectorAll('.mat-mdc-row').length).toBe(2);
  });

  it('muestra el estado vacío cuando no hay filas', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
    expect(element.textContent).toContain('Sin registros');
  });

  it('emite pageChange con la página y tamaño seleccionados', () => {
    const pages: PageEvent[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => pages.push(p));

    fixture.componentInstance.onPage({ pageIndex: 1, pageSize: 50, length: 40, previousPageIndex: 0 });
    expect(pages).toEqual([{ pageIndex: 1, pageSize: 50, length: 40, previousPageIndex: 0 }]);
    expect(element.querySelector('mat-paginator')).toBeTruthy();
  });

  it('emite sortChange al ordenar', () => {
    const sorts: Sort[] = [];
    fixture.componentInstance.sortChange.subscribe((s) => sorts.push(s));
    fixture.componentInstance.onSort({ active: 'code', direction: 'asc' });
    expect(sorts).toEqual([{ active: 'code', direction: 'asc' }]);
  });

  it('emite actionClick con la fila al pulsar una acción', () => {
    fixture.componentRef.setInput('actions', [{ id: 'edit', label: 'Editar', icon: 'edit' }]);
    fixture.detectChanges();

    const events: RowActionEvent[] = [];
    fixture.componentInstance.actionClick.subscribe((e) => events.push(e));
    fixture.componentInstance.onAction('edit', rows[0]!);
    expect(events).toEqual([{ actionId: 'edit', row: rows[0] }]);
  });
});
