import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import {
  AccountReceivableResponse,
  AccountReceivableStatus,
} from '../../../../interfaces/account-receivable.interface';
import { ServiceResponse } from '../../../../interfaces/service.interface';
import {
  CrudTableComponent,
  TableColumn,
} from '../../../../shared/components/crud-table/crud-table.component';

import { ServicesService } from '../../../masters/services/services.service';
import { AccountReceivablesService } from '../../account-receivables.service';

const STATUS_CHIP: Record<
  AccountReceivableStatus,
  { label: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  Pending: { label: 'Pendiente', tone: 'warning' },
  Paid: { label: 'Pagado', tone: 'success' },
  Exempt: { label: 'Exonerado', tone: 'neutral' },
};

@Component({
  selector: 'app-cxc-generate-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTabsModule,
    CrudTableComponent,
  ],
  templateUrl: './cxc-generate-dialog.component.html',
  styleUrl: './cxc-generate-dialog.component.css',
})
export class CxcGenerateDialogComponent {
  private readonly cxcService = inject(AccountReceivablesService);
  private readonly servicesService = inject(ServicesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CxcGenerateDialogComponent>);

  readonly services = signal<ServiceResponse[]>([]);
  readonly servicesForStall = computed(() =>
    this.services().filter((s) => this.isStallTarget(s.chargeTargetType.name)),
  );
  readonly servicesForMember = computed(() =>
    this.services().filter((s) => this.isMemberTarget(s.chargeTargetType.name)),
  );
  readonly loading = signal(false);
  readonly generated = signal(false);
  readonly result = signal<AccountReceivableResponse[]>([]);
  readonly selectedTabIndex = signal(0);

  readonly form = new FormGroup({
    serviceUuid: new FormControl<string | null>(null, Validators.required),
    periodStartDate: new FormControl<string | null>(null, Validators.required),
    periodEndDate: new FormControl<string | null>(null, Validators.required),
    amount: new FormControl<number | null>(null),
    stage1: new FormControl(false),
    stage2: new FormControl(false),
    stage3: new FormControl(false),
    uniqueMembers: new FormControl(true),
  });

  readonly resultColumns: TableColumn[] = [
    { key: 'serviceName', header: 'Servicio' },
    { key: 'destination', header: 'Puesto / Socio' },
    { key: 'currency', header: 'Moneda' },
    { key: 'amountFormatted', header: 'Monto', type: 'number', align: 'end' },
    { key: 'statusChip', header: 'Estado', type: 'chip' },
  ];

  readonly resultRows = signal<Record<string, unknown>[]>([]);

  private selectedService = signal<ServiceResponse | null>(null);
  readonly selectedServiceCurrencyCode = computed(() => this.selectedService()?.currency.code ?? null);

  constructor() {
    this.loadServices();
  }

  get showAmount(): boolean {
    const svc = this.selectedService();
    return svc !== null && !svc.consumptionBased;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    this.generated.set(false);
    this.result.set([]);
    this.resultRows.set([]);
    this.form.get('serviceUuid')?.reset();
  }

  onServiceChange(uuid: string): void {
    const svc = this.services().find((s) => s.uuid === uuid) ?? null;
    this.selectedService.set(svc);
    if (svc?.consumptionBased) {
      this.form.get('amount')?.clearValidators();
    } else {
      this.form.get('amount')?.setValidators(Validators.required);
    }
    this.form.get('amount')?.updateValueAndValidity();
  }

  get selectedStageCodes(): number[] {
    const codes: number[] = [];
    if (this.form.get('stage1')?.value) codes.push(1);
    if (this.form.get('stage2')?.value) codes.push(2);
    if (this.form.get('stage3')?.value) codes.push(3);
    return codes;
  }

  get isByStallTab(): boolean {
    return this.selectedTabIndex() === 0;
  }

  get canSubmit(): boolean {
    if (this.form.invalid) return false;
    if (!this.isByStallTab && this.selectedStageCodes.length === 0) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit) return;

    this.loading.set(true);
    const formValue = this.form.value;

    if (this.isByStallTab) {
      const body: Record<string, unknown> = {
        serviceUuid: formValue.serviceUuid!,
        periodStartDate: formValue.periodStartDate!,
        periodEndDate: formValue.periodEndDate!,
      };
      if (formValue.amount != null) {
        body['amount'] = formValue.amount;
      }
      this.cxcService
        .generateByStall(body as never)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (items) => this.handleSuccess(items),
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
        });
    } else {
      const body: Record<string, unknown> = {
        serviceUuid: formValue.serviceUuid!,
        periodStartDate: formValue.periodStartDate!,
        periodEndDate: formValue.periodEndDate!,
        stageCodes: this.selectedStageCodes,
        uniqueMembers: formValue.uniqueMembers ?? true,
      };
      if (formValue.amount != null) {
        body['amount'] = formValue.amount;
      }
      this.cxcService
        .generateByMember(body as never)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (items) => this.handleSuccess(items),
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
        });
    }
  }

  private handleSuccess(items: AccountReceivableResponse[]): void {
    this.result.set(items);
    this.generated.set(true);
    this.resultRows.set(
      items.map((item) => ({
        uuid: item.uuid,
        serviceName: item.service.name,
        destination: item.member?.fullName ?? item.stall?.number ?? '—',
        currency: item.currency.code,
        amountFormatted: item.amount,
        statusChip: STATUS_CHIP[item.status.name],
      })),
    );
    this.snackBar.open(`${items.length} CxC generadas`, 'Cerrar', { duration: 3000 });
  }

  private loadServices(): void {
    this.servicesService.list({ page: 0, size: 999 }).subscribe({
      next: (page) => this.services.set(page.content),
    });
  }

  private isStallTarget(name: string): boolean {
    const lower = name.toLowerCase();
    return lower.includes('puesto') || lower.includes('stall');
  }

  private isMemberTarget(name: string): boolean {
    const lower = name.toLowerCase();
    return lower.includes('socio') || lower.includes('member');
  }
}
