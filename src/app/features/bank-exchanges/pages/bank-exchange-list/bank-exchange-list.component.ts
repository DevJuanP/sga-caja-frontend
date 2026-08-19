import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { BankExchangeResponse } from '../../../../interfaces/bank-exchange.interface';
import { BankResponse } from '../../../../interfaces/bank.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CrudTableComponent, TableColumn, RowAction, RowActionEvent } from '../../../../shared/components/crud-table/crud-table.component';
import { ReceiptViewerComponent, ReceiptData } from '../../../../shared/components/receipt-viewer/receipt-viewer.component';
import { formatAmount } from '../../../../shared/pipes/amount-format.util';
import { BanksService } from '../../../masters/banks/banks.service';
import { BankExchangesService } from '../../bank-exchanges.service';
import { BankExchangeFormDialogComponent } from '../bank-exchange-form/bank-exchange-form-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bank-exchange-list',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    PageHeaderComponent,
    CrudTableComponent,
  ],
  templateUrl: './bank-exchange-list.component.html',
  styleUrl: './bank-exchange-list.component.css',
})
export class BankExchangeListComponent {
  @ViewChild('bankSelect') bankSelect!: MatSelect;

  private readonly bankExchangesService = inject(BankExchangesService);
  private readonly banksService = inject(BanksService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<BankExchangeResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly PAGE_SIZE_OPTIONS = [10, 20, 50];

  readonly banks = signal<BankResponse[]>([]);
  readonly bankFilter = signal<string | null>(null);
  readonly dateFilter = signal<string | null>(null);

  readonly columns: TableColumn[] = [
    { key: 'depositDate', header: 'Fecha depósito' },
    { key: 'cxcInfo', header: 'CxC' },
    { key: 'bankName', header: 'Banco' },
    { key: 'currency', header: 'Moneda' },
    { key: 'amount', header: 'Monto', align: 'end', type: 'number' },
    { key: 'status', header: 'Estado' },
  ];

  readonly actions: RowAction[] = [
    { id: 'view-receipt', label: 'Ver voucher', icon: 'receipt' },
  ];

  readonly rows = computed(() =>
    this.items().map((item) => ({
      uuid: item.uuid,
      depositDate: item.depositDate,
      cxcInfo: `${item.accountReceivable.service.name} - ${item.accountReceivable.member?.fullName ?? item.accountReceivable.stall?.number ?? '—'}`,
      bankName: item.bank.name,
      currency: item.currency.code,
      amount: formatAmount(item.amount),
      status: 'Pagado',
    }))
  );

  constructor() {
    this.loadCatalogs();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.bankExchangesService
      .list({
        bankUuid: this.bankFilter(),
        date: this.dateFilter(),
        page: this.pageIndex(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content);
          this.totalElements.set(page.page.totalElements);
        },
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onAction(event: RowActionEvent): void {
    if (event.actionId === 'view-receipt') {
      this.viewReceipt(event.row);
    }
  }

  onBankFilter(value: string | null): void {
    this.bankFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onDateFilter(value: string | null): void {
    this.dateFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  clearFilters(): void {
    this.bankFilter.set(null);
    this.dateFilter.set(null);
    if (this.bankSelect) this.bankSelect.value = null;
    this.pageIndex.set(0);
    this.load();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(BankExchangeFormDialogComponent, {
      width: '600px',
    });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.pageIndex.set(0);
        this.load();
      }
    });
  }

  private viewReceipt(row: Record<string, unknown>): void {
    const item = this.items().find((i) => i.uuid === row['uuid']);
    if (!item) return;

    const receiptData: ReceiptData = {
      uuid: item.receipt.uuid,
      receiptTypeName: item.receipt.receiptTypeName,
      correlativeNumber: item.receipt.correlativeNumber,
      issueDate: item.receipt.issueDate,
      amount: item.amount,
      currencyCode: item.currency.code,
    };

    const dialogRef = this.dialog.open(ReceiptViewerComponent, {
      width: '480px',
    });
    dialogRef.componentRef?.setInput('receipt', receiptData);
  }

  private loadCatalogs(): void {
    this.banksService.list({ page: 0, size: 999 }).subscribe({
      next: (page) => this.banks.set(page.content),
    });
  }
}
