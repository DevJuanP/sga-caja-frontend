import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { ExpenseBulkUploadResponse } from '../../../../interfaces/expense.interface';
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
  readonly result = signal<ExpenseBulkUploadResponse | null>(null);
  readonly errorColumns = ['row', 'message'];

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
        next: (response) => {
          this.result.set(response);
          const createdCount = response.created.length;
          const errorCount = response.errors.length;
          this.snackBar.open(
            `Carga completada: ${createdCount} creado(s), ${errorCount} error(es)`,
            'Cerrar',
            { duration: 5000 },
          );
        },
        error: (error: ApiError) => {
          const validationErrors = this.parseBulkValidationError(error.message);
          if (validationErrors.length > 0) {
            this.result.set({ created: [], errors: validationErrors });
            this.snackBar.open(
              `Carga completada: 0 creado(s), ${validationErrors.length} error(es de validación)`,
              'Cerrar',
              { duration: 5000 },
            );
          } else {
            this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
          }
        },
      });
  }

  downloadTemplate(): void {
    const headers = [
      'DocumentNumber',
      'ProviderName',
      'ExpenseDate',
      'Amount',
      'AssociatedDocument',
      'ExpenseReason',
    ];
    const exampleRow = [
      'F001-000123',
      'Proveedor Ejemplo',
      '2026-08-18',
      '250.00',
      'OC-001',
      'Servicios generales',
    ];

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_egresos.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  close(): void {
    this.dialogRef.close(this.result() !== null);
  }

  private parseBulkValidationError(
    message: string,
  ): Array<{ row: number; message: string; fields: Record<string, unknown> }> {
    const errors: Array<{ row: number; message: string; fields: Record<string, unknown> }> = [];
    const segments = message.split('; ');

    for (const segment of segments) {
      const match = segment.match(/^Fila (\d+):\s*(.+)$/);
      if (match) {
        errors.push({
          row: parseInt(match[1], 10),
          message: match[2],
          fields: {},
        });
      }
    }

    return errors;
  }
}
