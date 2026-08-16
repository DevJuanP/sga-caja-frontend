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
import {
  BusinessType,
  BusinessTypeRequest,
} from '../../../../../interfaces/business-type.interface';
import { BusinessTypesService } from '../../business-types.service';

/**
 * Formulario de giro comercial (US-10). Recibe `null` para crear o el giro a editar.
 */
@Component({
  selector: 'app-business-type-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './business-type-form-dialog.component.html',
  styleUrl: './business-type-form-dialog.component.css',
})
export class BusinessTypeFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BusinessTypeFormDialogComponent>);
  private readonly data = inject<BusinessType | null>(MAT_DIALOG_DATA);
  private readonly service = inject(BusinessTypesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly editing = !!this.data;
  readonly loading = signal(false);

  readonly form = new FormGroup({
    name: new FormControl(this.data?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const body: BusinessTypeRequest = { name: this.form.getRawValue().name };
    const request$ = this.data
      ? this.service.update(this.data.uuid, body)
      : this.service.create(body);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Giro guardado', 'Cerrar');
        this.dialogRef.close(true);
      },
      error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
    });
  }
}
