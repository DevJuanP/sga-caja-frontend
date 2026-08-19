import { Component, computed, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { ServiceResponse } from '../../../../../interfaces/service.interface';
import {
  CrudTableComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../../../../shared/components/crud-table/crud-table.component';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FilterBarComponent, CatalogFilter } from '../../../../../shared/components/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CurrencyPipe } from '../../../../../shared/pipes/currency.pipe';
import { ServicesService } from '../../services.service';
import { ServiceFormDialogComponent } from '../service-form/service-form-dialog.component';

/**
 * Servicios cobrables (US-15): listado paginado con búsqueda y filtro por estado,
 * crear/editar en modal y desactivación (soft delete).
 */
@Component({
  selector: 'app-service-list',
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent, FilterBarComponent, CrudTableComponent],
  templateUrl: './service-list.component.html',
  styleUrl: './service-list.component.css',
})
export class ServiceListComponent {
  private readonly service = inject(ServicesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly currency = new CurrencyPipe();

  readonly loading = signal(false);
  readonly items = signal<ServiceResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly filter = signal<CatalogFilter | null>(null);
  readonly sort = signal<Sort | null>(null);

  readonly rows = computed(() => this.items().map((item) => this.toRow(item)));

  readonly columns: TableColumn[] = [
    { key: 'name', header: 'Servicio', sortable: true },
    { key: 'recurrenceType', header: 'Recurrencia' },
    { key: 'chargeTargetType', header: 'Tipo de cobro' },
    { key: 'billingChip', header: 'Cobro', type: 'chip' },
    { key: 'amount', header: 'Monto', align: 'end' },
    { key: 'activeChip', header: 'Estado', type: 'chip' },
  ];
  readonly rowActions: RowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'edit' },
    { id: 'deactivate', label: 'Desactivar', icon: 'block', danger: true, visible: (row) => row['active'] === true },
    { id: 'activate', label: 'Reactivar', icon: 'restart_alt', visible: (row) => row['active'] === false },
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
    const item = this.items().find((service) => service.uuid === event.row['uuid']);
    if (!item) {
      return;
    }
    if (event.actionId === 'edit') {
      this.openForm(item);
    } else if (event.actionId === 'deactivate') {
      this.deactivate(item);
    } else if (event.actionId === 'activate') {
      this.activate(item);
    }
  }

  private sortValue(): string | undefined {
    const sort = this.sort();
    return sort ? `${sort.active},${sort.direction}` : 'name,asc';
  }

  private toRow(item: ServiceResponse): Record<string, unknown> {
    const amount = item.consumptionBased ? item.unitCost : item.cost;
    return {
      uuid: item.uuid,
      name: item.name,
      recurrenceType: item.recurrenceType.name,
      chargeTargetType: item.chargeTargetType.name,
      billingChip: item.consumptionBased
        ? { label: 'Medido', tone: 'neutral' }
        : { label: 'Fijo', tone: 'neutral' },
      amount: this.currency.transform(amount, item.currency.code),
      active: item.active,
      activeChip: item.active
        ? { label: 'Activo', tone: 'success' }
        : { label: 'Inactivo', tone: 'neutral' },
    };
  }

  private openForm(item: ServiceResponse | null): void {
    const ref = this.dialog.open(ServiceFormDialogComponent, {
      data: item,
      width: '600px',
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.load();
      }
    });
  }

  private deactivate(item: ServiceResponse): void {
    this.confirm
      .confirm({
        title: 'Desactivar servicio',
        message: `¿Desactivar el servicio ${item.name}?`,
        confirmLabel: 'Desactivar',
        danger: true,
      })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.deactivate(item.uuid).subscribe({
          next: () => {
            this.snackBar.open('Servicio desactivado', 'Cerrar');
            this.load();
          },
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
        });
      });
  }

  private activate(item: ServiceResponse): void {
    this.confirm
      .confirm({
        title: 'Reactivar servicio',
        message: `¿Reactivar el servicio ${item.name}?`,
        confirmLabel: 'Reactivar',
      })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.activate(item.uuid).subscribe({
          next: () => {
            this.snackBar.open('Servicio reactivado', 'Cerrar');
            this.load();
          },
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
        });
      });
  }
}
