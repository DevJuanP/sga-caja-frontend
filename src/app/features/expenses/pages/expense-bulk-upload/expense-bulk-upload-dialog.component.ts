import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { ExpenseResponse } from '../../../../interfaces/expense.interface';
import { ExpensesService } from '../../expenses.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-expense-bulk-upload-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  templateUrl: './expense-bulk-upload-dialog.component.html',
  styleUrl: './expense-bulk-upload-dialog.component.css',
})
export class ExpenseBulkUploadDialogComponent {
  private readonly expensesService = inject(ExpensesService);
  readonly dialogRef = inject(MatDialogRef<ExpenseBulkUploadDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly result = signal<ExpenseResponse[] | null>(null);
  readonly resultColumns = ['documentNumber', 'providerName', 'expenseDate', 'amount', 'expenseReasonName', 'currencyCode'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !file.name.endsWith('.xlsx')) {
      this.snackBar.open('Solo se permiten archivos .xlsx', 'Cerrar', { duration: 3000 });
      input.value = '';
      return;
    }

    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.expensesService
      .bulkUpload(file)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (created) => {
          this.result.set(created);
          this.snackBar.open(
            `Carga masiva completada: ${created.length} egreso(s) creado(s)`,
            'Cerrar',
            { duration: 5000 },
          );
        },
        error: (error: ApiError) => {
          this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
        },
      });
  }

  /**
   * Columnas esperadas del XLSX, en orden (ver `ExpenseBulkFileParser` en el backend).
   * Se muestran como referencia en el diálogo: no se ofrece una plantilla descargable
   * porque el backend sólo acepta libros de Excel reales (formato binario XLSX), no un
   * archivo generado en el navegador con encabezado ".xlsx" pero contenido CSV.
   */
  readonly templateColumns = [
    { header: 'DocumentNumber', example: 'F001-000123' },
    { header: 'ProviderName', example: 'Proveedor Ejemplo' },
    { header: 'ExpenseDate', example: '2026-08-18' },
    { header: 'Amount', example: '250.00' },
    { header: 'AssociatedDocument', example: 'OC-001 (opcional)' },
    { header: 'ExpenseReason', example: 'Servicios generales' },
  ];

  close(): void {
    this.dialogRef.close(this.result()?.length ?? 0);
  }
}
