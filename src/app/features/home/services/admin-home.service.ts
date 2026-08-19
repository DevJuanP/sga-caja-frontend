import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { AccountReceivableResponse } from '../../../interfaces/account-receivable.interface';
import { BankResponse } from '../../../interfaces/bank.interface';
import { MemberResponse } from '../../../interfaces/member.interface';
import { ServiceResponse } from '../../../interfaces/service.interface';
import { StallResponse } from '../../../interfaces/stall.interface';
import { KpiCard, PendingCxc, safeGet, toHttpParams } from './home.service';

@Injectable({ providedIn: 'root' })
export class AdminHomeService {
  private readonly api = inject(ApiService);

  getMembersCount(): Observable<string | number> {
    return safeGet(
      this.api.getPage<MemberResponse>('members', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.page.totalElements)),
      '—'
    );
  }

  getStallsActive(): Observable<string | number> {
    return safeGet(
      this.api.getPage<StallResponse>('stalls', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.page.totalElements)),
      '—'
    );
  }

  getStallsInactive(): Observable<string | number> {
    return safeGet(
      this.api.getPage<StallResponse>('stalls', toHttpParams({ active: false, size: 1 }))
        .pipe(map(p => p.page.totalElements)),
      '—'
    );
  }

  getServicesCount(): Observable<string | number> {
    return safeGet(
      this.api.getPage<ServiceResponse>('services', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.page.totalElements)),
      '—'
    );
  }

  getBanksCount(): Observable<string | number> {
    return safeGet(
      this.api.getPage<BankResponse>('banks', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.page.totalElements)),
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
      members: this.getMembersCount(),
      stallsActive: this.getStallsActive(),
      stallsInactive: this.getStallsInactive(),
      services: this.getServicesCount(),
      banks: this.getBanksCount(),
    }).pipe(map(({ members, stallsActive, stallsInactive, services, banks }) => [
      { label: 'Socios activos', value: members, icon: 'group', route: '/masters/members' },
      { label: 'Puestos activos', value: stallsActive, icon: 'store', route: '/masters/stalls', routeQueryParams: { active: 'true' } },
      { label: 'Puestos inactivos', value: stallsInactive, icon: 'store', route: '/masters/stalls', routeQueryParams: { active: 'false' } },
      { label: 'Servicios vigentes', value: services, icon: 'receipt', route: '/masters/services' },
      { label: 'Bancos activos', value: banks, icon: 'account_balance', route: '/masters/banks' },
    ]));
  }

  private mapToPendingCxc = (c: AccountReceivableResponse): PendingCxc => ({
    uuid: c.uuid,
    serviceName: c.service.name,
    memberName: c.member?.fullName,
    stallNumber: c.stall?.number,
    amount: c.amount,
    currencyCode: c.currency.code,
    period: `${c.periodStartDate} → ${c.periodEndDate}`,
    route: `/account-receivables/summary${c.member?.uuid ? `?memberUuid=${c.member.uuid}` : c.stall?.uuid ? `?stallUuid=${c.stall.uuid}` : ''}`,
  });
}
