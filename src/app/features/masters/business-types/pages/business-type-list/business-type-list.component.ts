import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { BusinessType } from '../../../../../interfaces/business-type.interface';
import {
  CrudTableComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../../../../shared/components/crud-table/crud-table.component';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BusinessTypesService } from '../../business-types.service';
import { BusinessTypeFormDialogComponent } from '../business-type-form/business-type-form-dialog.component';

/**
 * Giros comerciales (US-10). Único maestro sin paginación; "Eliminar" desactiva (soft delete)
 * y el giro deja de listarse.
 */
@Component({
  selector: 'app-business-type-list',
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent, CrudTableComponent],
  templateUrl: './business-type-list.component.html',
  styleUrl: './business-type-list.component.css',
})
export class BusinessTypeListComponent {
  private readonly service = inject(BusinessTypesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<BusinessType[]>([]);
  readonly rows = computed(() =>
    this.items().map((item) => ({ uuid: item.uuid, name: item.name })),
  );

  readonly columns: TableColumn[] = [{ key: 'name', header: 'Nombre', sortable: true }];
  readonly rowActions: RowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'edit' },
    { id: 'delete', label: 'Eliminar', icon: 'delete', danger: true },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
      });
  }

  openCreate(): void {
    this.openForm(null);
  }

  onAction(event: RowActionEvent): void {
    const businessType = this.items().find((item) => item.uuid === event.row['uuid']);
    if (!businessType) {
      return;
    }
    if (event.actionId === 'edit') {
      this.openForm(businessType);
    } else if (event.actionId === 'delete') {
      this.delete(businessType);
    }
  }

  private openForm(businessType: BusinessType | null): void {
    const ref = this.dialog.open(BusinessTypeFormDialogComponent, {
      data: businessType,
      width: '480px',
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.load();
      }
    });
  }

  private delete(businessType: BusinessType): void {
    this.confirm
      .confirm({
        title: 'Eliminar giro',
        message: `¿Eliminar el giro "${businessType.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.deactivate(businessType.uuid).subscribe({
          next: () => {
            this.snackBar.open('Giro eliminado', 'Cerrar');
            this.load();
          },
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
        });
      });
  }
}
