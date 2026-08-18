import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { CatalogItem } from '../../../../interfaces/catalog.interface';
import { ProviderResponse } from '../../../../interfaces/provider.interface';
import { ReceiptViewerComponent, ReceiptData } from '../../../../shared/components/receipt-viewer/receipt-viewer.component';
import { CatalogService } from '../../../catalogs/catalog.service';
import { ProvidersService } from '../../../masters/providers/providers.service';
import { ExpensesService } from '../../expenses.service';

@Component({
  selector: 'app-expense-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReceiptViewerComponent,
  ],
  templateUrl: './expense-form-dialog.component.html',
  styleUrl: './expense-form-dialog.component.css',
})
export class ExpenseFormDialogComponent {
  private readonly expensesService = inject(ExpensesService);
  private readonly catalogService = inject(CatalogService);
  private readonly providersService = inject(ProvidersService);
  readonly dialogRef = inject(MatDialogRef<ExpenseFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly created = signal(false);
  readonly receipt = signal<ReceiptData | null>(null);

  readonly providers = signal<ProviderResponse[]>([]);
  readonly expenseReasons = signal<CatalogItem[]>([]);

  readonly form = new FormGroup({
    documentNumber: new FormControl<string>('', Validators.required),
    providerUuid: new FormControl<string | null>(null, Validators.required),
    expenseDate: new FormControl<string>(new Date().toISOString().split('T')[0], Validators.required),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    associatedDocument: new FormControl<string>(''),
    expenseReasonUuid: new FormControl<string | null>(null, Validators.required),
  });

  get receiptData(): ReceiptData | null {
    return this.receipt();
  }

  constructor() {
    this.loadCatalogs();
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    const formValue = this.form.value;

    this.expensesService
      .create({
        documentNumber: formValue.documentNumber!,
        providerUuid: formValue.providerUuid!,
        expenseDate: formValue.expenseDate!,
        amount: formValue.amount!,
        associatedDocument: formValue.associatedDocument ?? '',
        expenseReasonUuid: formValue.expenseReasonUuid!,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.created.set(true);
          if (response.receipt) {
            this.receipt.set({
              uuid: response.receipt.uuid,
              receiptTypeName: response.receipt.receiptTypeName,
              correlativeNumber: response.receipt.correlativeNumber,
              issueDate: response.receipt.issueDate,
              amount: response.receipt.amount,
            });
          }
          this.snackBar.open('Egreso registrado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error: ApiError) => {
          this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
        },
      });
  }

  close(): void {
    this.dialogRef.close(this.created());
  }

  private loadCatalogs(): void {
    forkJoin({
      providers: this.providersService.list({ page: 0, size: 999 }),
      expenseReasons: this.catalogService.list('expenseReasons'),
    }).subscribe({
      next: ({ providers, expenseReasons }) => {
        this.providers.set(providers.content);
        this.expenseReasons.set(expenseReasons);
      },
    });
  }
}
