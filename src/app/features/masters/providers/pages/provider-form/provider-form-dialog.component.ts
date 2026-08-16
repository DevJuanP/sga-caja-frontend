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
import { ProviderRequest, ProviderResponse } from '../../../../../interfaces/provider.interface';
import { ProvidersService } from '../../providers.service';

/**
 * Formulario de proveedor (US-14). Recibe `null` para crear o el proveedor a editar.
 */
@Component({
  selector: 'app-provider-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './provider-form-dialog.component.html',
  styleUrl: './provider-form-dialog.component.css',
})
export class ProviderFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ProviderFormDialogComponent>);
  private readonly data = inject<ProviderResponse | null>(MAT_DIALOG_DATA);
  private readonly service = inject(ProvidersService);
  private readonly snackBar = inject(MatSnackBar);

  readonly editing = !!this.data;
  readonly loading = signal(false);

  readonly form = new FormGroup({
    name: new FormControl(this.data?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    document: new FormControl(this.data?.document ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: ProviderRequest = { name: value.name, document: value.document };
    const request$ = this.data ? this.service.update(this.data.uuid, body) : this.service.create(body);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Proveedor guardado', 'Cerrar');
        this.dialogRef.close(true);
      },
      error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
    });
  }
}
