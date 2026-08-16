import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { CatalogKey } from '../../../../../features/catalogs/catalog.service';
import { BankRequest, BankResponse } from '../../../../../interfaces/bank.interface';
import { CatalogSelectComponent } from '../../../../../shared/components/catalog-select/catalog-select.component';
import { BanksService } from '../../banks.service';

/**
 * Formulario de banco (US-13). Recibe `null` para crear o el banco a editar.
 */
@Component({
  selector: 'app-bank-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CatalogSelectComponent,
  ],
  templateUrl: './bank-form-dialog.component.html',
  styleUrl: './bank-form-dialog.component.css',
})
export class BankFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BankFormDialogComponent>);
  private readonly data = inject<BankResponse | null>(MAT_DIALOG_DATA);
  private readonly service = inject(BanksService);
  private readonly snackBar = inject(MatSnackBar);

  readonly editing = !!this.data;
  readonly loading = signal(false);

  readonly currenciesKey: CatalogKey = 'currencies';

  readonly form = new FormGroup({
    name: new FormControl(this.data?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    accountNumber: new FormControl(this.data?.accountNumber ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    cci: new FormControl(this.data?.cci ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    currencyUuid: new FormControl<string | null>(this.data?.currency.uuid ?? null, Validators.required),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: BankRequest = {
      name: value.name,
      accountNumber: value.accountNumber,
      cci: value.cci,
      currencyUuid: value.currencyUuid!,
    };
    const request$ = this.data ? this.service.update(this.data.uuid, body) : this.service.create(body);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Banco guardado', 'Cerrar');
        this.dialogRef.close(true);
      },
      error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
    });
  }
}
