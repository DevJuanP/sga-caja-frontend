import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { CatalogItem } from '../../../../interfaces/catalog.interface';
import { ReceiptViewerComponent, ReceiptData } from '../../../../shared/components/receipt-viewer/receipt-viewer.component';
import { CatalogService } from '../../../catalogs/catalog.service';
import { IncomesService } from '../../incomes.service';

@Component({
  selector: 'app-income-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReceiptViewerComponent,
  ],
  templateUrl: './income-form-dialog.component.html',
  styleUrl: './income-form-dialog.component.css',
})
export class IncomeFormDialogComponent {
  private readonly incomesService = inject(IncomesService);
  private readonly catalogService = inject(CatalogService);
  readonly dialogRef = inject(MatDialogRef<IncomeFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly created = signal(false);
  readonly receipt = signal<ReceiptData | null>(null);

  readonly categories = signal<CatalogItem[]>([]);

  readonly form = new FormGroup({
    depositorName: new FormControl<string>('', Validators.required),
    incomeCategoryUuid: new FormControl<string | null>(null, Validators.required),
    concept: new FormControl<string>('', Validators.required),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });

  get receiptData(): ReceiptData | null {
    return this.receipt();
  }

  constructor() {
    this.loadCategories();
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    const formValue = this.form.value;

    this.incomesService
      .create({
        depositorName: formValue.depositorName!,
        incomeCategoryUuid: formValue.incomeCategoryUuid!,
        concept: formValue.concept!,
        amount: formValue.amount!,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.created.set(true);
          this.receipt.set({
            uuid: response.receipt.uuid,
            receiptTypeName: response.receipt.receiptTypeName,
            correlativeNumber: response.receipt.correlativeNumber,
            issueDate: response.receipt.issueDate,
            amount: response.amount,
          });
          this.snackBar.open('Ingreso registrado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error: ApiError) => {
          this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
        },
      });
  }

  close(): void {
    this.dialogRef.close(this.created());
  }

  private loadCategories(): void {
    this.catalogService.list('incomeCategories').subscribe({
      next: (categories: CatalogItem[]) => this.categories.set(categories),
    });
  }
}
