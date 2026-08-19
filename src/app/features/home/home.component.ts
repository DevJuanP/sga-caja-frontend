import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AdminHomeService } from './services/admin-home.service';
import { CashierHomeService } from './services/cashier-home.service';
import { KpiCard, PendingCxc, Shortcut } from './services/home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    PageHeaderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly adminSvc = inject(AdminHomeService, { optional: true });
  private readonly cashierSvc = inject(CashierHomeService, { optional: true });

  readonly user = this.auth.user;
  readonly role = computed(() => this.user()?.roleName ?? 'Administrator');
  readonly isAdmin = computed(() => this.role() === 'Administrator');

  readonly greeting = computed(() => {
    const u = this.user();
    const h = new Date().getHours();
    const t = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    return u ? `${t}, ${u.firstName}` : t;
  });

  readonly roleLabel = computed(() => this.isAdmin() ? 'Administrador' : 'Operador de Caja');

  readonly kpis = signal<KpiCard[]>([]);
  readonly shortcuts = signal<Shortcut[]>([]);
  readonly pendingCxcs = signal<PendingCxc[]>([]);
  readonly loading = signal(true);

  private readonly ADMIN_SHORTCUTS: Shortcut[] = [
    { label: 'Socios', route: '/masters/members', icon: 'group' },
    { label: 'Puestos', route: '/masters/stalls', icon: 'store' },
    { label: 'Servicios', route: '/masters/services', icon: 'receipt' },
    { label: 'Bancos', route: '/masters/banks', icon: 'account_balance' },
    { label: 'Proveedores', route: '/masters/providers', icon: 'local_shipping' },
    { label: 'Giros', route: '/masters/business-types', icon: 'storefront' },
    { label: 'Cuentas por cobrar', route: '/account-receivables', icon: 'receipt_long' },
    { label: 'Reportes', route: '/reports', icon: 'assessment' },
  ];

  private readonly CASHIER_SHORTCUTS: Shortcut[] = [
    { label: 'Cobranza', route: '/payments', icon: 'point_of_sale' },
    { label: 'Canjes', route: '/bank-exchanges', icon: 'account_balance' },
    { label: 'Ingresos', route: '/incomes', icon: 'south_west' },
    { label: 'Egresos', route: '/expenses', icon: 'north_east' },
    { label: 'Cuentas por cobrar', route: '/account-receivables', icon: 'receipt_long' },
    { label: 'Reportes', route: '/reports', icon: 'assessment' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.shortcuts.set(this.isAdmin() ? this.ADMIN_SHORTCUTS : this.CASHIER_SHORTCUTS);

    const kpiObs = this.isAdmin()
      ? this.adminSvc!.loadAllKpis()
      : this.cashierSvc!.loadAllKpis();
    const cxcObs = (this.isAdmin() ? this.adminSvc! : this.cashierSvc!).getPendingCxcs(5);

    forkJoin({ kpis: kpiObs, cxcs: cxcObs })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ kpis, cxcs }) => {
        this.kpis.set(kpis);
        this.pendingCxcs.set(cxcs);
      });
  }
}
