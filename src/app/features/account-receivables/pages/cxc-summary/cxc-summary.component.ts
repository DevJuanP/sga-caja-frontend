import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/auth/error.interceptor';
import {
  AccountReceivableMovementResponse,
  AccountReceivableStatus,
} from '../../../../interfaces/account-receivable.interface';
import {
  CrudTableComponent,
  TableColumn,
} from '../../../../shared/components/crud-table/crud-table.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

import { AccountReceivablesService } from '../../account-receivables.service';

const STATUS_CHIP: Record<
  AccountReceivableStatus,
  { label: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  Pending: { label: 'Pendiente', tone: 'warning' },
  Paid: { label: 'Pagado', tone: 'success' },
  Exempt: { label: 'Exonerado', tone: 'neutral' },
};

const SETTLEMENT_LABEL: Record<string, string> = {
  Payment: 'Pago en caja',
  BankExchange: 'Canje bancario',
};

@Component({
  selector: 'app-cxc-summary',
  imports: [MatIconModule, PageHeaderComponent, CrudTableComponent],
  templateUrl: './cxc-summary.component.html',
  styleUrl: './cxc-summary.component.css',
})
export class CxcSummaryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cxcService = inject(AccountReceivablesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly items = signal<AccountReceivableMovementResponse[]>([]);
  readonly title = signal('Resumen de movimientos');

  readonly columns: TableColumn[] = [
    { key: 'serviceName', header: 'Servicio' },
    { key: 'period', header: 'Período' },
    { key: 'currency', header: 'Moneda' },
    { key: 'amountFormatted', header: 'Monto', type: 'number', align: 'end' },
    { key: 'statusChip', header: 'Estado', type: 'chip' },
    { key: 'settlement', header: 'Liquidado por' },
    { key: 'settledDate', header: 'Fecha liquidación' },
    { key: 'correlative', header: 'Correlativo' },
  ];

  readonly rows = signal<Record<string, unknown>[]>([]);

  ngOnInit(): void {
    const memberUuid = this.route.snapshot.queryParamMap.get('memberUuid');
    const stallUuid = this.route.snapshot.queryParamMap.get('stallUuid');

    if (!memberUuid && !stallUuid) {
      this.snackBar.open('Se requiere memberUuid o stallUuid', 'Cerrar', { duration: 3000 });
      return;
    }

    const params: Record<string, string> = {};
    if (memberUuid) params['memberUuid'] = memberUuid;
    if (stallUuid) params['stallUuid'] = stallUuid;

    this.loading.set(true);
    this.cxcService
      .summary(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.rows.set(items.map((item) => this.toRow(item)));
          if (memberUuid) {
            const name = items[0]?.accountReceivable.member?.fullName ?? memberUuid;
            this.title.set(`Resumen — ${name}`);
          } else if (stallUuid) {
            const number = items[0]?.accountReceivable.stall?.number ?? stallUuid;
            this.title.set(`Resumen — Puesto ${number}`);
          }
        },
        error: (error: ApiError) => this.snackBar.open(error.message, 'Cerrar', { duration: 3000 }),
      });
  }

  private toRow(item: AccountReceivableMovementResponse): Record<string, unknown> {
    const ar = item.accountReceivable;
    const status = STATUS_CHIP[ar.status.name];
    const settlement = item.settlementMethod
      ? (SETTLEMENT_LABEL[item.settlementMethod] ?? item.settlementMethod)
      : 'Pendiente';
    return {
      uuid: ar.uuid,
      serviceName: ar.service.name,
      period: `${ar.periodStartDate} – ${ar.periodEndDate}`,
      currency: ar.currency.code,
      amountFormatted: ar.amount,
      statusChip: status,
      settlement,
      settledDate: item.settledDate ?? '—',
      correlative: item.receiptCorrelative != null ? String(item.receiptCorrelative) : '—',
    };
  }
}
