import { Component, computed, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { ExpenseResponse } from '../../../../interfaces/expense.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import {
  CrudTableComponent,
  TableColumn,
  RowAction,
  RowActionEvent,
} from '../../../../shared/components/crud-table/crud-table.component';
import {
  ReceiptViewerComponent,
  ReceiptData,
} from '../../../../shared/components/receipt-viewer/receipt-viewer.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { formatAmount } from '../../../../shared/pipes/amount-format.util';
import { ExpensesService } from '../../expenses.service';
import { ExpenseFormDialogComponent } from '../expense-form/expense-form-dialog.component';
import { ExpenseBulkUploadDialogComponent } from '../expense-bulk-upload/expense-bulk-upload-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-expense-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PageHeaderComponent,
    CrudTableComponent,
  ],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.css',
})
export class ExpenseListComponent {
  private readonly expensesService = inject(ExpensesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<ExpenseResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly PAGE_SIZE_OPTIONS = [10, 20, 50];

  readonly yearFilter = signal<number | null>(null);
  readonly monthFilter = signal<number | null>(null);

  readonly columns: TableColumn[] = [
    { key: 'expenseDate', header: 'Fecha' },
    { key: 'documentNumber', header: 'N° Documento' },
    { key: 'providerName', header: 'Proveedor' },
    { key: 'expenseReasonName', header: 'Motivo' },
    { key: 'currency', header: 'Moneda' },
    { key: 'amount', header: 'Monto', align: 'end', type: 'number' },
    { key: 'status', header: 'Estado' },
  ];

  readonly actions: RowAction[] = [
    { id: 'view-receipt', label: 'Ver comprobante', icon: 'receipt' },
    {
      id: 'void',
      label: 'Anular',
      icon: 'block',
      visible: (row) => row['statusName'] === 'Pending',
    },
    {
      id: 'process',
      label: 'Procesar',
      icon: 'check_circle',
      visible: (row) => row['statusName'] === 'Pending',
    },
  ];

  readonly rows = computed(() =>
    this.items().map((item) => ({
      uuid: item.uuid,
      expenseDate: item.expenseDate,
      documentNumber: item.documentNumber,
      providerName: item.provider.name,
      expenseReasonName: item.expenseReason.name,
      currency: item.currency.code,
      amount: formatAmount(item.amount),
      status: this.getStatusLabel(item.status.name),
      statusName: item.status.name,
    })),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.expensesService
      .list({
        year: this.yearFilter(),
        month: this.monthFilter(),
        page: this.pageIndex(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content);
          this.totalElements.set(page.page.totalElements);
        },
        error: (error: ApiError) =>
          this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onAction(event: RowActionEvent): void {
    switch (event.actionId) {
      case 'view-receipt':
        this.viewReceipt(event.row);
        break;
      case 'void':
        this.voidExpense(event.row);
        break;
      case 'process':
        this.processExpense(event.row);
        break;
    }
  }

  onYearFilter(value: number | null): void {
    this.yearFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onMonthFilter(value: number | null): void {
    this.monthFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  clearFilters(): void {
    this.yearFilter.set(null);
    this.monthFilter.set(null);
    this.pageIndex.set(0);
    this.load();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ExpenseFormDialogComponent, {
      width: '600px',
    });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.pageIndex.set(0);
        this.load();
      }
    });
  }

  openBulkUploadDialog(): void {
    const ref = this.dialog.open(ExpenseBulkUploadDialogComponent, {
      width: '600px',
    });
    ref.afterClosed().subscribe((createdCount: number) => {
      if (createdCount > 0) {
        this.snackBar.open(`Se cargaron ${createdCount} egreso(s) correctamente`, 'Cerrar', { duration: 3000 });
        this.pageIndex.set(0);
        this.load();
      }
    });
  }

  private voidExpense(row: Record<string, unknown>): void {
    this.confirmDialog
      .confirm({
        title: 'Anular egreso',
        message: '¿Está seguro de anular este egreso? Esta acción no se puede deshacer.',
        confirmLabel: 'Anular',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const uuid = row['uuid'] as string;
        this.loading.set(true);
        this.expensesService
          .voidExpense(uuid)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.snackBar.open('Egreso anulado exitosamente', 'Cerrar', {
                duration: 3000,
              });
              this.load();
            },
            error: (error: ApiError) =>
              this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
          });
      });
  }

  private processExpense(row: Record<string, unknown>): void {
    this.confirmDialog
      .confirm({
        title: 'Procesar egreso',
        message:
          '¿Está seguro de procesar este egreso? Se emitirá el comprobante correspondiente.',
        confirmLabel: 'Procesar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const uuid = row['uuid'] as string;
        this.loading.set(true);
        this.expensesService
          .processExpense(uuid)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (response) => {
              this.snackBar.open('Egreso procesado exitosamente', 'Cerrar', {
                duration: 3000,
              });

              if (response.receipt) {
                const dialogRef = this.dialog.open(ReceiptViewerComponent, {
                  width: '480px',
                });
                dialogRef.componentRef?.setInput('receipt', {
                  uuid: response.receipt.uuid,
                  receiptTypeName: response.receipt.receiptTypeName,
                  correlativeNumber: response.receipt.correlativeNumber,
                  issueDate: response.receipt.issueDate,
                  amount: response.receipt.amount,
                  currencyCode: response.currency.code,
                });
              }

              this.load();
            },
            error: (error: ApiError) =>
              this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
          });
      });
  }

  private viewReceipt(row: Record<string, unknown>): void {
    const item = this.items().find((i) => i.uuid === row['uuid']);
    if (!item?.receipt) return;

    const receiptData: ReceiptData = {
      uuid: item.receipt.uuid,
      receiptTypeName: item.receipt.receiptTypeName,
      correlativeNumber: item.receipt.correlativeNumber,
      issueDate: item.receipt.issueDate,
      amount: item.receipt.amount,
      currencyCode: item.currency.code,
    };

    const dialogRef = this.dialog.open(ReceiptViewerComponent, {
      width: '480px',
    });
    dialogRef.componentRef?.setInput('receipt', receiptData);
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Processed: 'Procesado',
      Voided: 'Anulado',
    };
    return labels[status] ?? status;
  }
}
