import { Component, inject, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { PaymentResponse } from '../../../../interfaces/payment.interface';
import { PaymentsService } from '../../payments.service';
import { ReceiptViewerComponent, ReceiptData } from '../../../../shared/components/receipt-viewer/receipt-viewer.component';

@Component({
  selector: 'app-payment-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReceiptViewerComponent,
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.css',
})
export class PaymentDialogComponent {
  private readonly paymentsService = inject(PaymentsService);
  readonly dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly uuids: string[] = inject(MAT_DIALOG_DATA).uuids;
  readonly total: number = inject(MAT_DIALOG_DATA).total;
  readonly currencyCode: string = inject(MAT_DIALOG_DATA).currencyCode;

  readonly loading = signal(false);
  readonly paid = signal(false);
  readonly receipt = signal<ReceiptData | null>(null);

  get receiptData(): ReceiptData | null {
    return this.receipt();
  }

  confirmPayment(): void {
    this.loading.set(true);
    this.paymentsService
      .processPayment({ accountReceivableUuids: this.uuids })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.paid.set(true);
          this.receipt.set({
            uuid: response.receipt.uuid,
            receiptTypeName: response.receipt.receiptTypeName,
            correlativeNumber: response.receipt.correlativeNumber,
            issueDate: response.receipt.issueDate,
            amount: response.receipt.amount,
            currencyCode: response.currency.code,
            paymentDate: response.paymentDate,
            createdBy: response.createdBy,
          });
          this.snackBar.open('Pago procesado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error: ApiError) => {
          this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
        },
      });
  }

  close(): void {
    this.dialogRef.close(this.paid());
  }
}