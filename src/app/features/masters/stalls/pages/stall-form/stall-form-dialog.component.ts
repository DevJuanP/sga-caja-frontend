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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { BusinessType } from '../../../../../interfaces/business-type.interface';
import { MemberResponse } from '../../../../../interfaces/member.interface';
import { StallRequest, StallResponse } from '../../../../../interfaces/stall.interface';
import { BusinessTypesService } from '../../../business-types/business-types.service';
import { MembersService } from '../../../members/members.service';
import { StallsService } from '../../stalls.service';

/** Valida que la fecha fin sea posterior o igual a la fecha inicio (US-12). */
export function validityRangeValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, boolean> | null => {
    const group = control as FormGroup;
    const start = group.get('validityStartDate')?.value as string | null;
    const end = group.get('validityEndDate')?.value as string | null;
    if (!start || !end) {
      return null;
    }
    return end < start ? { rangeInvalid: true } : null;
  };
}

/**
 * Formulario de puesto (US-12). Recibe `null` para crear o el puesto a editar.
 */
@Component({
  selector: 'app-stall-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './stall-form-dialog.component.html',
  styleUrl: './stall-form-dialog.component.css',
})
export class StallFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<StallFormDialogComponent>);
  private readonly data = inject<StallResponse | null>(MAT_DIALOG_DATA);
  private readonly service = inject(StallsService);
  private readonly businessTypesService = inject(BusinessTypesService);
  private readonly membersService = inject(MembersService);
  private readonly snackBar = inject(MatSnackBar);

  readonly editing = !!this.data;
  readonly loading = signal(false);
  readonly businessTypes = signal<BusinessType[]>([]);
  readonly members = signal<MemberResponse[]>([]);

  readonly form = new FormGroup(
    {
      number: new FormControl(this.data?.number ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20)],
      }),
      businessTypeUuid: new FormControl<string | null>(
        this.data?.businessType.uuid ?? null,
        Validators.required,
      ),
      memberUuid: new FormControl<string | null>(this.data?.member?.uuid ?? null),
      tenantName: new FormControl(this.data?.tenantName ?? '', {
        nonNullable: true,
        validators: [Validators.maxLength(100)],
      }),
      tenantDocument: new FormControl(this.data?.tenantDocument ?? '', {
        nonNullable: true,
        validators: [Validators.maxLength(20)],
      }),
      validityStartDate: new FormControl(this.data?.validityStartDate ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      validityEndDate: new FormControl(this.data?.validityEndDate ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: validityRangeValidator() },
  );

  constructor() {
    this.businessTypesService.list().subscribe({
      next: (items) => this.businessTypes.set(items),
      error: () => this.businessTypes.set([]),
    });
    this.membersService.list({ active: 'true', page: 0, size: 200 }).subscribe({
      next: (page) => this.members.set(page.content),
      error: () => this.members.set([]),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: StallRequest = {
      number: value.number,
      businessTypeUuid: value.businessTypeUuid!,
      memberUuid: value.memberUuid ?? '',
      tenantName: value.tenantName,
      tenantDocument: value.tenantDocument,
      validityStartDate: value.validityStartDate,
      validityEndDate: value.validityEndDate,
    };
    const request$ = this.data
      ? this.service.update(this.data.uuid, body)
      : this.service.create(body);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Puesto guardado', 'Cerrar');
        this.dialogRef.close(true);
      },
      error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
    });
  }
}
