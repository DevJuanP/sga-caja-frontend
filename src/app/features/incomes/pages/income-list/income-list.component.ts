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
import { IncomeResponse } from '../../../../interfaces/income.interface';
import { CatalogItem } from '../../../../interfaces/catalog.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CrudTableComponent, TableColumn, RowAction, RowActionEvent } from '../../../../shared/components/crud-table/crud-table.component';
import { ReceiptViewerComponent, ReceiptData } from '../../../../shared/components/receipt-viewer/receipt-viewer.component';
import { CatalogService } from '../../../catalogs/catalog.service';
import { IncomesService } from '../../incomes.service';
import { IncomeFormDialogComponent } from '../income-form/income-form-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-income-list',
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
  templateUrl: './income-list.component.html',
  styleUrl: './income-list.component.css',
})
export class IncomeListComponent {
  @ViewChild('categorySelect') categorySelect!: MatSelect;

  private readonly incomesService = inject(IncomesService);
  private readonly catalogService = inject(CatalogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<IncomeResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly PAGE_SIZE_OPTIONS = [10, 20, 50];

  readonly categories = signal<CatalogItem[]>([]);
  readonly categoryFilter = signal<string | null>(null);
  readonly dateFilter = signal<string | null>(null);

  readonly columns: TableColumn[] = [
    { key: 'depositorName', header: 'Depositante' },
    { key: 'categoryName', header: 'Categoría' },
    { key: 'concept', header: 'Concepto' },
    { key: 'currency', header: 'Moneda' },
    { key: 'amount', header: 'Monto', align: 'end', type: 'number' },
  ];

  readonly actions: RowAction[] = [
    { id: 'view-receipt', label: 'Ver voucher', icon: 'receipt' },
  ];

  private readonly currencyFmt = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  readonly rows = computed(() =>
    this.items().map((item) => ({
      uuid: item.uuid,
      depositorName: item.depositorName,
      categoryName: item.incomeCategory.name,
      concept: item.concept,
      currency: item.currency.code,
      amount: this.currencyFmt.format(item.amount),
    }))
  );

  constructor() {
    this.loadCatalogs();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.incomesService
      .list({
        incomeCategoryUuid: this.categoryFilter(),
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

  onCategoryFilter(value: string | null): void {
    this.categoryFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onDateFilter(value: string | null): void {
    this.dateFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  clearFilters(): void {
    this.categoryFilter.set(null);
    this.dateFilter.set(null);
    if (this.categorySelect) this.categorySelect.value = null;
    this.pageIndex.set(0);
    this.load();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(IncomeFormDialogComponent, {
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
    this.catalogService.list('incomeCategories').subscribe({
      next: (categories: CatalogItem[]) => this.categories.set(categories),
    });
  }
}
