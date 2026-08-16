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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../../core/auth/error.interceptor';
import { CatalogKey } from '../../../../../features/catalogs/catalog.service';
import { ServiceRequest, ServiceResponse } from '../../../../../interfaces/service.interface';
import { CatalogSelectComponent } from '../../../../../shared/components/catalog-select/catalog-select.component';
import { ServicesService } from '../../services.service';

/** Valida que exista monto según el tipo de cobro (US-15). */
export function serviceAmountValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, boolean> | null => {
    const group = control as FormGroup;
    const consumptionBased = group.get('consumptionBased')?.value as boolean;
    const amount = Number(group.get(consumptionBased ? 'unitCost' : 'cost')?.value ?? 0);
    return amount > 0 ? null : { amountRequired: true };
  };
}

/**
 * Formulario de servicio cobrable (US-15). Recibe `null` para crear o el servicio a editar.
 */
@Component({
  selector: 'app-service-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CatalogSelectComponent,
  ],
  templateUrl: './service-form-dialog.component.html',
  styleUrl: './service-form-dialog.component.css',
})
export class ServiceFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ServiceFormDialogComponent>);
  private readonly data = inject<ServiceResponse | null>(MAT_DIALOG_DATA);
  private readonly service = inject(ServicesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly editing = !!this.data;
  readonly loading = signal(false);

  readonly recurrenceTypesKey: CatalogKey = 'recurrenceTypes';
  readonly chargeTargetTypesKey: CatalogKey = 'chargeTargetTypes';
  readonly currenciesKey: CatalogKey = 'currencies';

  readonly form = new FormGroup(
    {
      name: new FormControl(this.data?.name ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      recurrenceTypeUuid: new FormControl<string | null>(
        this.data?.recurrenceType.uuid ?? null,
        Validators.required,
      ),
      chargeTargetTypeUuid: new FormControl<string | null>(
        this.data?.chargeTargetType.uuid ?? null,
        Validators.required,
      ),
      currencyUuid: new FormControl<string | null>(this.data?.currency.uuid ?? null, Validators.required),
      consumptionBased: new FormControl(this.data?.consumptionBased ?? false, { nonNullable: true }),
      cost: new FormControl(this.data?.cost ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
      unitCost: new FormControl(this.data?.unitCost ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    },
    { validators: serviceAmountValidator() },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: ServiceRequest = {
      name: value.name,
      recurrenceTypeUuid: value.recurrenceTypeUuid!,
      chargeTargetTypeUuid: value.chargeTargetTypeUuid!,
      currencyUuid: value.currencyUuid!,
      consumptionBased: value.consumptionBased,
      cost: value.consumptionBased ? null : value.cost,
      unitCost: value.consumptionBased ? value.unitCost : null,
    };
    const request$ = this.data ? this.service.update(this.data.uuid, body) : this.service.create(body);

    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Servicio guardado', 'Cerrar');
        this.dialogRef.close(true);
      },
      error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar'),
    });
  }
}
