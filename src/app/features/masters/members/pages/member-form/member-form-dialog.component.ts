import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { MemberRequest, MemberResponse } from '../../../../../interfaces/member.interface';
import { CatalogKey } from '../../../../../features/catalogs/catalog.service';
import { CatalogSelectComponent } from '../../../../../shared/components/catalog-select/catalog-select.component';
import { MembersService } from '../../members.service';

/** Valida que la fecha esté en el pasado (US-11: fecha de nacimiento). */
export function pastDateValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, boolean> | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(`${value}T00:00:00`);
    return date >= today ? { pastDate: true } : null;
  };
}

/**
 * Formulario de socio (US-11). Recibe `null` para crear o el socio a editar.
 */
@Component({
  selector: 'app-member-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CatalogSelectComponent,
  ],
  templateUrl: './member-form-dialog.component.html',
  styleUrl: './member-form-dialog.component.css',
})
export class MemberFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MemberFormDialogComponent>);
  private readonly data = inject<MemberResponse | null>(MAT_DIALOG_DATA);
  private readonly service = inject(MembersService);
  private readonly snackBar = inject(MatSnackBar);

  readonly editing = !!this.data;
  readonly loading = signal(false);

  readonly stagesKey: CatalogKey = 'stages';

  readonly form = new FormGroup({
    code: new FormControl(this.data?.code ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    firstName: new FormControl(this.data?.firstName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    lastName: new FormControl(this.data?.lastName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    shareNumber: new FormControl(this.data?.shareNumber ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    stageUuid: new FormControl<string | null>(this.data?.stage.uuid ?? null, Validators.required),
    birthDate: new FormControl(this.data?.birthDate ?? '', {
      nonNullable: true,
      validators: [Validators.required, pastDateValidator()],
    }),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: MemberRequest = {
      code: value.code,
      firstName: value.firstName,
      lastName: value.lastName,
      shareNumber: value.shareNumber,
      stageUuid: value.stageUuid!,
      birthDate: value.birthDate,
    };
    const request$ = this.data
      ? this.service.update(this.data.uuid, body)
      : this.service.create(body);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Socio guardado', 'Cerrar');
        this.dialogRef.close(true);
      },
      error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
    });
  }
}
