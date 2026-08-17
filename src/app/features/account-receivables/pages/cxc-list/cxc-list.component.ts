import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { finalize, forkJoin } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  AccountReceivableResponse,
  AccountReceivableStatus,
} from '../../../../interfaces/account-receivable.interface';
import { ServiceResponse } from '../../../../interfaces/service.interface';
import { MemberResponse } from '../../../../interfaces/member.interface';
import { StallResponse } from '../../../../interfaces/stall.interface';
import {
  CrudTableComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../../../shared/components/crud-table/crud-table.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

import { ServicesService } from '../../../masters/services/services.service';
import { MembersService } from '../../../masters/members/members.service';
import { StallsService } from '../../../masters/stalls/stalls.service';
import { AccountReceivablesService } from '../../account-receivables.service';
import { CxcGenerateDialogComponent } from '../cxc-generate/cxc-generate-dialog.component';
import { ConsumptionReadingDialogComponent } from '../cxc-reading/consumption-reading-dialog.component';

const STATUS_CHIP: Record<
  AccountReceivableStatus,
  { label: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  Pending: { label: 'Pendiente', tone: 'warning' },
  Paid: { label: 'Pagado', tone: 'success' },
  Exempt: { label: 'Exonerado', tone: 'neutral' },
};

@Component({
  selector: 'app-cxc-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    PageHeaderComponent,
    CrudTableComponent,
  ],
  templateUrl: './cxc-list.component.html',
  styleUrl: './cxc-list.component.css',
})
export class CxcListComponent {
  @ViewChild('serviceSelect') serviceSelect!: MatSelect;
  @ViewChild('memberSelect') memberSelect!: MatSelect;
  @ViewChild('stallSelect') stallSelect!: MatSelect;

  private readonly cxcService = inject(AccountReceivablesService);
  private readonly servicesService = inject(ServicesService);
  private readonly membersService = inject(MembersService);
  private readonly stallsService = inject(StallsService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<AccountReceivableResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly serviceFilter = signal<string | null>(null);
  readonly memberFilter = signal<string | null>(null);
  readonly stallFilter = signal<string | null>(null);

  readonly services = signal<ServiceResponse[]>([]);
  readonly members = signal<MemberResponse[]>([]);
  readonly stalls = signal<StallResponse[]>([]);

  readonly rows = computed(() => this.items().map((item) => this.toRow(item)));
  readonly isCashier = computed(
    () => this.authService.user()?.roleName === 'CashierOperator',
  );

  readonly columns: TableColumn[] = [
    { key: 'serviceName', header: 'Servicio' },
    { key: 'destination', header: 'Socio / Puesto' },
    { key: 'period', header: 'Período' },
    { key: 'amountFormatted', header: 'Monto', type: 'number', align: 'end' },
    { key: 'statusChip', header: 'Estado', type: 'chip' },
  ];

  readonly rowActions: RowAction[] = [
    { id: 'reading', label: 'Lectura', icon: 'speed', visible: (row) => row['consumptionBased'] === true },
    { id: 'exempt', label: 'Exonerar', icon: 'block', danger: true },
  ];

  constructor() {
    this.loadCatalogs();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.cxcService
      .list({
        serviceUuid: this.serviceFilter(),
        memberUuid: this.memberFilter(),
        stallUuid: this.stallFilter(),
        page: this.pageIndex(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content);
          this.totalElements.set(page.page.totalElements);
        },
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
      });
  }

  onServiceFilter(value: string | null): void {
    this.serviceFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onMemberFilter(value: string | null): void {
    this.memberFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onStallFilter(value: string | null): void {
    this.stallFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  clearFilters(): void {
    this.serviceFilter.set(null);
    this.memberFilter.set(null);
    this.stallFilter.set(null);
    this.serviceSelect.value = null;
    this.memberSelect.value = null;
    this.stallSelect.value = null;
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSortChange(_sort: Sort): void {
    this.load();
  }

  openGenerate(): void {
    const ref = this.dialog.open(CxcGenerateDialogComponent, {
      width: '720px',
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.load();
      }
    });
  }

  openSummary(): void {
    const memberUuid = this.memberFilter();
    const stallUuid = this.stallFilter();
    if (!memberUuid && !stallUuid) {
      this.snackBar.open('Seleccione un socio o puesto para ver el resumen', 'Cerrar', { duration: 3000 });
      return;
    }
    const params = memberUuid ? `memberUuid=${memberUuid}` : `stallUuid=${stallUuid}`;
    window.open(`/account-receivables/summary?${params}`, '_blank');
  }

  openReading(item: AccountReceivableResponse): void {
    const ref = this.dialog.open(ConsumptionReadingDialogComponent, {
      width: '480px',
      data: { accountReceivableUuid: item.uuid },
    });
    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) this.load();
    });
  }

  onAction(event: RowActionEvent): void {
    const item = this.items().find((i) => i.uuid === event.row['uuid']);
    if (!item) return;
    switch (event.actionId) {
      case 'reading':
        this.openReading(item);
        break;
      case 'exempt':
        this.exemptItem(item);
        break;
    }
  }

  private loadCatalogs(): void {
    forkJoin({
      services: this.servicesService.list({ page: 0, size: 999 }),
      members: this.membersService.list({ page: 0, size: 999 }),
      stalls: this.stallsService.list({ page: 0, size: 999 }),
    }).subscribe({
      next: ({ services, members, stalls }) => {
        this.services.set(services.content);
        this.members.set(members.content);
        this.stalls.set(stalls.content);
      },
    });
  }

  private exemptItem(item: AccountReceivableResponse): void {
    this.confirm
      .confirm({
        title: 'Exonerar cuenta por cobrar',
        message: `¿Exonerar la CxC de ${item.service.name} por ${item.amount}?`,
        confirmLabel: 'Exonerar',
        danger: true,
      })
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.cxcService.exempt(item.uuid).subscribe({
          next: () => {
            this.snackBar.open('CxC exonerada', 'Cerrar', { duration: 3000 });
            this.load();
          },
          error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
        });
      });
  }

  private toRow(item: AccountReceivableResponse): Record<string, unknown> {
    const status = STATUS_CHIP[item.status.name];
    const destination = item.member?.fullName ?? item.stall?.number ?? '—';
    const start = item.periodStartDate;
    const end = item.periodEndDate;
    return {
      uuid: item.uuid,
      serviceName: item.service.name,
      consumptionBased: item.service.consumptionBased,
      destination,
      period: `${start} – ${end}`,
      amountFormatted: item.amount,
      statusChip: status,
    };
  }
}
