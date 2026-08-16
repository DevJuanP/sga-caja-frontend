import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ChipTone, StatusChipComponent } from '../status-chip/status-chip.component';

export interface ChipCell {
  label: string;
  tone: ChipTone;
}

export type TableColumnType = 'text' | 'number' | 'date' | 'chip';

export interface TableColumn {
  key: string;
  header: string;
  type?: TableColumnType;
  align?: 'start' | 'end';
  sortable?: boolean;
}

export interface RowAction {
  id: string;
  label: string;
  icon: string;
  danger?: boolean;
}

export interface RowActionEvent {
  actionId: string;
  row: Record<string, unknown>;
}

/**
 * Tabla de datos reutilizable (DESIGN §6): densidad media, encabezados con
 * `surface-variant`, hover, columnas numéricas a la derecha, chips de estado,
 * paginación opcional y acciones por fila. Las páginas entregan filas ya
 * mapeadas a `Record<string, unknown>` (incluyen `uuid` para las acciones).
 */
@Component({
  selector: 'app-crud-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    EmptyStateComponent,
    StatusChipComponent,
  ],
  templateUrl: './crud-table.component.html',
  styleUrl: './crud-table.component.css',
})
export class CrudTableComponent {
  readonly columns = input<TableColumn[]>([]);
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly totalElements = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(20);
  readonly loading = input(false);
  readonly paginated = input(true);
  readonly actions = input<RowAction[]>([]);
  readonly emptyMessage = input('Sin registros');

  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();
  readonly actionClick = output<RowActionEvent>();

  readonly displayedColumns = computed(() => {
    const keys = this.columns().map((c) => c.key);
    return this.actions().length > 0 ? [...keys, 'actions'] : keys;
  });

  cell(row: Record<string, unknown>, key: string): unknown {
    return row[key];
  }

  chipCell(row: Record<string, unknown>, key: string): ChipCell {
    return this.cell(row, key) as ChipCell;
  }

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSort(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onAction(actionId: string, row: Record<string, unknown>): void {
    this.actionClick.emit({ actionId, row });
  }
}
