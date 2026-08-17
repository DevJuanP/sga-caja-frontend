import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { finalize, forkJoin } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { AccountReceivableResponse } from '../../../../interfaces/account-receivable.interface';
import { ServiceResponse } from '../../../../interfaces/service.interface';
import { MemberResponse } from '../../../../interfaces/member.interface';
import { StallResponse } from '../../../../interfaces/stall.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CxcSelectionComponent, CxcRow } from '../../../../shared/components/cxc-selection/cxc-selection.component';

import { ServicesService } from '../../../masters/services/services.service';
import { MembersService } from '../../../masters/members/members.service';
import { StallsService } from '../../../masters/stalls/stalls.service';
import { AccountReceivablesService } from '../../../account-receivables/account-receivables.service';
import { PaymentsService } from '../../payments.service';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

@Component({
  selector: 'app-payments-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    PageHeaderComponent,
    CxcSelectionComponent,
  ],
  templateUrl: './payments-list.component.html',
  styleUrl: './payments-list.component.css',
})
export class PaymentsListComponent {
  @ViewChild('serviceSelect') serviceSelect!: MatSelect;
  @ViewChild('memberSelect') memberSelect!: MatSelect;
  @ViewChild('stallSelect') stallSelect!: MatSelect;

  private readonly cxcService = inject(AccountReceivablesService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly servicesService = inject(ServicesService);
  private readonly membersService = inject(MembersService);
  private readonly stallsService = inject(StallsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;
  readonly loading = signal(false);
  readonly items = signal<AccountReceivableResponse[]>([]);
  readonly selectedTabIndex = signal(0);
  readonly selectedUuids = signal<string[]>([]);
  readonly totalAmount = signal<number | null>(null);

  readonly services = signal<ServiceResponse[]>([]);
  readonly members = signal<MemberResponse[]>([]);
  readonly stalls = signal<StallResponse[]>([]);

  readonly serviceFilter = signal<string | null>(null);
  readonly memberFilter = signal<string | null>(null);
  readonly stallFilter = signal<string | null>(null);

  readonly stallPageIndex = signal(0);
  readonly stallPageSize = signal(20);
  readonly memberPageIndex = signal(0);
  readonly memberPageSize = signal(20);

  readonly allStallRows = computed(() =>
    this.items()
      .filter((item) => item.stall !== null)
      .map((item) => this.toRow(item)),
  );

  readonly allMemberRows = computed(() =>
    this.items()
      .filter((item) => item.member !== null)
      .map((item) => this.toRow(item)),
  );

  readonly stallTotalElements = computed(() => this.allStallRows().length);
  readonly memberTotalElements = computed(() => this.allMemberRows().length);

  readonly stallPageRows = computed(() => {
    const start = this.stallPageIndex() * this.stallPageSize();
    return this.allStallRows().slice(start, start + this.stallPageSize());
  });

  readonly memberPageRows = computed(() => {
    const start = this.memberPageIndex() * this.memberPageSize();
    return this.allMemberRows().slice(start, start + this.memberPageSize());
  });

  readonly stallPreSelected = computed(() => {
    const pageUuids = this.stallPageRows().map((r) => r.uuid);
    return this.selectedUuids().filter((uuid) => pageUuids.includes(uuid));
  });

  readonly memberPreSelected = computed(() => {
    const pageUuids = this.memberPageRows().map((r) => r.uuid);
    return this.selectedUuids().filter((uuid) => pageUuids.includes(uuid));
  });

  readonly hasSelection = computed(() => this.selectedUuids().length > 0);
  readonly hasPendingSelection = computed(() => {
    const uuids = this.selectedUuids();
    return this.items().some((item) => uuids.includes(item.uuid) && item.status.name === 'Pending');
  });

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
        page: 0,
        size: 999,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content);
        },
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
      });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    this.clearFiltersInternal();
    this.selectedUuids.set([]);
    this.totalAmount.set(null);
    this.stallPageIndex.set(0);
    this.memberPageIndex.set(0);
    if (index === 0) {
      this.stallFilter.set(null);
    } else {
      this.memberFilter.set(null);
    }
    this.load();
  }

  onServiceFilter(value: string | null): void {
    this.serviceFilter.set(value);
    this.stallPageIndex.set(0);
    this.memberPageIndex.set(0);
    this.load();
  }

  onMemberFilter(value: string | null): void {
    this.memberFilter.set(value);
    this.memberPageIndex.set(0);
    this.load();
  }

  onStallFilter(value: string | null): void {
    this.stallFilter.set(value);
    this.stallPageIndex.set(0);
    this.load();
  }

  clearFilters(): void {
    this.serviceFilter.set(null);
    this.memberFilter.set(null);
    this.stallFilter.set(null);
    if (this.serviceSelect) this.serviceSelect.value = null;
    if (this.memberSelect) this.memberSelect.value = null;
    if (this.stallSelect) this.stallSelect.value = null;
    this.selectedUuids.set([]);
    this.totalAmount.set(null);
    this.stallPageIndex.set(0);
    this.memberPageIndex.set(0);
    this.load();
  }

  private clearFiltersInternal(): void {
    this.serviceFilter.set(null);
    if (this.serviceSelect) this.serviceSelect.value = null;
  }

  onStallPageChange(event: PageEvent): void {
    this.stallPageIndex.set(event.pageIndex);
    this.stallPageSize.set(event.pageSize);
  }

  onMemberPageChange(event: PageEvent): void {
    this.memberPageIndex.set(event.pageIndex);
    this.memberPageSize.set(event.pageSize);
  }

  onSelectionChange(uuids: string[]): void {
    const isStallTab = this.selectedTabIndex() === 0;
    const pageUuids = (isStallTab ? this.stallPageRows() : this.memberPageRows()).map((r) => r.uuid);
    const preservedUuids = this.selectedUuids().filter((uuid) => !pageUuids.includes(uuid));
    this.selectedUuids.set([...preservedUuids, ...uuids]);
    this.totalAmount.set(null);
  }

  computeTotal(): void {
    const pendingUuids = this.selectedUuids().filter((uuid) => {
      const item = this.items().find((i) => i.uuid === uuid);
      return item?.status.name === 'Pending';
    });

    if (pendingUuids.length === 0) {
      this.snackBar.open('Seleccione al menos una CxC pendiente', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.paymentsService
      .computeTotal({ accountReceivableUuids: pendingUuids })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.totalAmount.set(response.total);
          this.openPaymentDialog(pendingUuids, response.total);
        },
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
      });
  }

  private openPaymentDialog(uuids: string[], total: number): void {
    const ref = this.dialog.open(PaymentDialogComponent, {
      width: '480px',
      data: { uuids, total },
    });
    ref.afterClosed().subscribe((paid: boolean) => {
      if (paid) {
        this.selectedUuids.set([]);
        this.totalAmount.set(null);
        this.stallPageIndex.set(0);
        this.memberPageIndex.set(0);
        this.load();
      }
    });
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

  private toRow(item: AccountReceivableResponse): CxcRow {
    return {
      uuid: item.uuid,
      serviceName: item.service.name,
      destination: item.member?.fullName ?? item.stall?.number ?? '—',
      period: `${item.periodStartDate} – ${item.periodEndDate}`,
      amount: item.amount,
      statusChip: {
        label: item.status.name === 'Pending' ? 'Pendiente' : item.status.name === 'Paid' ? 'Pagado' : 'Exonerado',
        tone: item.status.name === 'Pending' ? 'warning' : item.status.name === 'Paid' ? 'success' : 'neutral',
      },
      consumptionBased: item.service.consumptionBased,
    };
  }
}