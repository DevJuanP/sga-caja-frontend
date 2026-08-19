import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { AccountReceivableResponse } from '../../../interfaces/account-receivable.interface';
import { BankExchangeResponse } from '../../../interfaces/bank-exchange.interface';
import { ExpenseResponse } from '../../../interfaces/expense.interface';
import { IncomeResponse } from '../../../interfaces/income.interface';
import { KpiCard, PendingCxc, safeGet, toHttpParams, todayParam } from './home.service';

@Injectable({ providedIn: 'root' })
export class CashierHomeService {
  private readonly api = inject(ApiService);

  private sumAmounts<T>(items: T[], getter: (i: T) => number): number {
    return items.reduce((acc, i) => acc + (getter(i) ?? 0), 0);
  }

  getTodayIncomes(): Observable<string | number> {
    return safeGet(
      this.api.getPage<IncomeResponse>('incomes', toHttpParams({ date: todayParam(), size: 50 }))
        .pipe(map(p => this.sumAmounts(p.content, i => i.amount))),
      '—'
    );
  }

  getTodayExpenses(): Observable<string | number> {
    return safeGet(
      this.api.getPage<ExpenseResponse>('expenses', toHttpParams({ date: todayParam(), size: 50 }))
        .pipe(map(p => this.sumAmounts(p.content, i => i.amount))),
      '—'
    );
  }

  getTodayExchanges(): Observable<string | number> {
    return safeGet(
      this.api.getPage<BankExchangeResponse>('bank-exchanges', toHttpParams({ depositDate: todayParam(), size: 50 }))
        .pipe(map(p => this.sumAmounts(p.content, i => i.amount))),
      '—'
    );
  }

  getPendingCxcs(limit = 5): Observable<PendingCxc[]> {
    return safeGet(
      this.api.getPage<AccountReceivableResponse>('account-receivables',
        toHttpParams({ status: 'Pending', size: limit }))
        .pipe(map(page => page.content.map(this.mapToPendingCxc))),
      []
    );
  }

  loadAllKpis(): Observable<KpiCard[]> {
    return forkJoin({
      incomes: this.getTodayIncomes(),
      expenses: this.getTodayExpenses(),
      exchanges: this.getTodayExchanges(),
    }).pipe(map(({ incomes, expenses, exchanges }) => [
      { label: 'Ingresos hoy', value: incomes, icon: 'south_west', route: '/incomes' },
      { label: 'Egresos hoy', value: expenses, icon: 'north_east', route: '/expenses' },
      { label: 'Canjes hoy', value: exchanges, icon: 'account_balance', route: '/bank-exchanges' },
      {
        label: 'Saldo neto',
        value: typeof incomes === 'number' && typeof expenses === 'number' ? incomes - expenses : '—',
        icon: 'balance',
        route: '/reports'
      },
    ]));
  }

  private mapToPendingCxc = (c: AccountReceivableResponse): PendingCxc => ({
    uuid: c.uuid,
    serviceName: c.service.name,
    memberName: c.member?.fullName,
    stallNumber: c.stall?.number,
    amount: c.amount,
    period: `${c.periodStartDate} → ${c.periodEndDate}`,
    route: `/account-receivables/summary${c.member?.uuid ? `?memberUuid=${c.member.uuid}` : c.stall?.uuid ? `?stallUuid=${c.stall.uuid}` : ''}`,
  });
}
