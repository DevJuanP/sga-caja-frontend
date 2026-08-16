import { Component, computed, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { StallResponse } from '../../../../../interfaces/stall.interface';
import {
  CrudTableComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../../../../shared/components/crud-table/crud-table.component';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { CatalogFilter, FilterBarComponent } from '../../../../../shared/components/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { StallsService } from '../../stalls.service';
import { StallFormDialogComponent } from '../stall-form/stall-form-dialog.component';

/**
 * Puestos (US-12): listado paginado con búsqueda y filtro por estado, crear/editar
 * en modal y desactivación.
 */
@Component({
  selector: 'app-stall-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    FilterBarComponent,
    CrudTableComponent,
  ],
  templateUrl: './stall-list.component.html',
  styleUrl: './stall-list.component.css',
})
export class StallListComponent {
  private readonly service = inject(StallsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<StallResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly filter = signal<CatalogFilter | null>(null);
  readonly sort = signal<Sort | null>(null);

  readonly rows = computed(() => this.items().map((item) => this.toRow(item)));

  readonly columns: TableColumn[] = [
    { key: 'number', header: 'Número', sortable: true },
    { key: 'businessType', header: 'Giro' },
    { key: 'occupant', header: 'Ocupante' },
    { key: 'validityStartDate', header: 'Vigencia desde', type: 'date' },
    { key: 'validityEndDate', header: 'Vigencia hasta', type: 'date' },
    { key: 'activeChip', header: 'Estado', type: 'chip' },
  ];
  readonly rowActions: RowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'edit' },
    { id: 'deactivate', label: 'Desactivar', icon: 'block', danger: true },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .list({
        search: this.filter()?.search || undefined,
        active: this.filter()?.active ?? undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: this.sortValue(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content);
          this.totalElements.set(page.page.totalElements);
        },
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
      });
  }

  onFilterChange(filter: CatalogFilter): void {
    this.filter.set(filter);
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sort.set(sort.direction ? sort : null);
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  onAction(event: RowActionEvent): void {
    const stall = this.items().find((item) => item.uuid === event.row['uuid']);
    if (!stall) {
      return;
    }
    if (event.actionId === 'edit') {
      this.openForm(stall);
    } else if (event.actionId === 'deactivate') {
      this.deactivate(stall);
    }
  }

  private sortValue(): string | undefined {
    const sort = this.sort();
    return sort ? `${sort.active},${sort.direction}` : 'number,asc';
  }

  private toRow(stall: StallResponse): Record<string, unknown> {
    return {
      uuid: stall.uuid,
      number: stall.number,
      businessType: stall.businessType.name,
      occupant: stall.member?.fullName ?? stall.tenantName ?? '—',
      validityStartDate: stall.validityStartDate,
      validityEndDate: stall.validityEndDate,
      activeChip: stall.active
        ? { label: 'Activo', tone: 'success' }
        : { label: 'Inactivo', tone: 'neutral' },
    };
  }

  private openForm(stall: StallResponse | null): void {
    const ref = this.dialog.open(StallFormDialogComponent, {
      data: stall,
      width: '600px',
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.load();
      }
    });
  }

  private deactivate(stall: StallResponse): void {
    this.confirm
      .confirm({
        title: 'Desactivar puesto',
        message: `¿Desactivar el puesto ${stall.number}?`,
        confirmLabel: 'Desactivar',
        danger: true,
      })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.deactivate(stall.uuid).subscribe({
          next: () => {
            this.snackBar.open('Puesto desactivado', 'Cerrar');
            this.load();
          },
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
        });
      });
  }
}
