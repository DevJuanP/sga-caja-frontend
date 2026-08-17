import { Component, computed, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { ProviderResponse } from '../../../../../interfaces/provider.interface';
import {
  CrudTableComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../../../../shared/components/crud-table/crud-table.component';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FilterBarComponent, CatalogFilter } from '../../../../../shared/components/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ProvidersService } from '../../providers.service';
import { ProviderFormDialogComponent } from '../provider-form/provider-form-dialog.component';

/**
 * Proveedores (US-14): listado paginado con búsqueda y filtro por estado, crear/editar
 * en modal y desactivación (soft delete).
 */
@Component({
  selector: 'app-provider-list',
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent, FilterBarComponent, CrudTableComponent],
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.css',
})
export class ProviderListComponent {
  private readonly service = inject(ProvidersService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<ProviderResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly filter = signal<CatalogFilter | null>(null);
  readonly sort = signal<Sort | null>(null);

  readonly rows = computed(() => this.items().map((item) => this.toRow(item)));

  readonly columns: TableColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'document', header: 'Documento' },
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
    const provider = this.items().find((item) => item.uuid === event.row['uuid']);
    if (!provider) {
      return;
    }
    if (event.actionId === 'edit') {
      this.openForm(provider);
    } else if (event.actionId === 'deactivate') {
      this.deactivate(provider);
    }
  }

  private sortValue(): string | undefined {
    return undefined;
  }

  private toRow(provider: ProviderResponse): Record<string, unknown> {
    return {
      uuid: provider.uuid,
      name: provider.name,
      document: provider.document,
      activeChip: provider.active
        ? { label: 'Activo', tone: 'success' }
        : { label: 'Inactivo', tone: 'neutral' },
    };
  }

  private openForm(provider: ProviderResponse | null): void {
    const ref = this.dialog.open(ProviderFormDialogComponent, {
      data: provider,
      width: '560px',
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.load();
      }
    });
  }

  private deactivate(provider: ProviderResponse): void {
    this.confirm
      .confirm({
        title: 'Desactivar proveedor',
        message: `¿Desactivar al proveedor ${provider.name}?`,
        confirmLabel: 'Desactivar',
        danger: true,
      })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.deactivate(provider.uuid).subscribe({
          next: () => {
            this.snackBar.open('Proveedor desactivado', 'Cerrar');
            this.load();
          },
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
        });
      });
  }
}
