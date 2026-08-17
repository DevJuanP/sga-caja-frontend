import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { AccountReceivableResponse } from '../../../../interfaces/account-receivable.interface';
import { BankResponse } from '../../../../interfaces/bank.interface';
import { ReceiptViewerComponent, ReceiptData } from '../../../../shared/components/receipt-viewer/receipt-viewer.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { AccountReceivablesService } from '../../../account-receivables/account-receivables.service';
import { BanksService } from '../../../masters/banks/banks.service';
import { BankExchangesService } from '../../bank-exchanges.service';

@Component({
  selector: 'app-bank-exchange-form-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReceiptViewerComponent,
    CurrencyPipe,
  ],
  templateUrl: './bank-exchange-form-dialog.component.html',
  styleUrl: './bank-exchange-form-dialog.component.css',
})
export class BankExchangeFormDialogComponent {
  @ViewChild('bankSelect') bankSelect!: MatSelect;

  private readonly bankExchangesService = inject(BankExchangesService);
  private readonly accountReceivablesService = inject(AccountReceivablesService);
  private readonly banksService = inject(BanksService);
  readonly dialogRef = inject(MatDialogRef<BankExchangeFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly created = signal(false);
  readonly receipt = signal<ReceiptData | null>(null);

  readonly pendingCxc = signal<AccountReceivableResponse[]>([]);
  readonly banks = signal<BankResponse[]>([]);

  readonly form = new FormGroup({
    accountReceivableUuid: new FormControl<string | null>(null, Validators.required),
    bankUuid: new FormControl<string | null>(null, Validators.required),
    depositDate: new FormControl<string>(new Date().toISOString().split('T')[0], Validators.required),
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

    this.bankExchangesService
      .create({
        accountReceivableUuid: formValue.accountReceivableUuid!,
        bankUuid: formValue.bankUuid!,
        depositDate: formValue.depositDate!,
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
          this.snackBar.open('Canje registrado exitosamente', 'Cerrar', { duration: 3000 });
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
      pendingCxc: this.accountReceivablesService.list({
        page: 0,
        size: 999,
      }),
      banks: this.banksService.list({ page: 0, size: 999 }),
    }).subscribe({
      next: ({ pendingCxc, banks }) => {
        this.pendingCxc.set(
          pendingCxc.content.filter(
            (item) => item.status.name === 'Pending' && item.member !== null
          )
        );
        this.banks.set(banks.content);
      },
    });
  }
}
