import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { ConsumptionReadingResponse } from '../../../../interfaces/consumption-reading.interface';
import { ConsumptionReadingsService } from '../../consumption-readings.service';

@Component({
  selector: 'app-consumption-reading-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './consumption-reading-dialog.component.html',
  styleUrl: './consumption-reading-dialog.component.css',
})
export class ConsumptionReadingDialogComponent implements OnInit {
  private readonly readingsService = inject(ConsumptionReadingsService);
  readonly dialogRef = inject(MatDialogRef<ConsumptionReadingDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly accountReceivableUuid: string = inject(MAT_DIALOG_DATA).accountReceivableUuid;

  readonly loading = signal(false);
  readonly hasReading = signal(false);
  readonly reading = signal<ConsumptionReadingResponse | null>(null);

  readonly form = new FormGroup({
    initialReading: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    finalReading: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.readingsService
      .getByAccountReceivable(this.accountReceivableUuid)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reading) => {
          this.reading.set(reading);
          this.hasReading.set(true);
        },
        error: () => {
          this.hasReading.set(false);
        },
      });
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.loading();
  }

  submit(): void {
    if (!this.canSubmit) return;
    const formValue = this.form.value;

    this.loading.set(true);
    this.readingsService
      .register({
        accountReceivableUuid: this.accountReceivableUuid,
        initialReading: formValue.initialReading!,
        finalReading: formValue.finalReading!,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reading) => {
          this.reading.set(reading);
          this.hasReading.set(true);
          this.snackBar.open('Lectura registrada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error: ApiError) => {
          this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
        },
      });
  }
}
