import { Route, Routes } from '@angular/router';

import { environment } from '../environments/environment';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { UserRole } from './interfaces/auth.interface';
import { MainShellComponent } from './layout/main-shell/main-shell.component';

const placeholder = () =>
  import('./shared/components/page-placeholder/page-placeholder.component').then(
    (m) => m.PagePlaceholderComponent,
  );

/**
 * Ruta que carga el placeholder compartido con su título e ícono,
 * y opcionalmente restringe el acceso a un conjunto de roles.
 */
function placeholderRoute(path: string, title: string, icon: string, roles?: UserRole[]): Route {
  const route: Route = {
    path,
    loadComponent: placeholder,
    data: { title, icon },
  };
  if (roles && roles.length > 0) {
    route.canActivate = roles.map((role) => roleGuard(role));
  }
  return route;
}

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      placeholderRoute('home', 'Inicio', 'home'),

      // EPIC 2 · Catálogos (solo dev): demostración de catalog-select por catálogo.
      ...(environment.production
        ? []
        : [
            {
              path: 'dev/catalogs',
              loadComponent: () =>
                import('./features/catalogs/pages/catalog-demo/catalog-demo.component').then(
                  (m) => m.CatalogDemoComponent,
                ),
            },
          ]),

      // EPIC 3 · Maestros (Administrator)
      {
        path: 'masters/business-types',
        loadComponent: () =>
          import('./features/masters/business-types/pages/business-type-list/business-type-list.component').then(
            (m) => m.BusinessTypeListComponent,
          ),
        canActivate: [roleGuard('Administrator')],
        data: { title: 'Giros comerciales', icon: 'storefront' },
      },
      {
        path: 'masters/members',
        loadComponent: () =>
          import('./features/masters/members/pages/member-list/member-list.component').then(
            (m) => m.MemberListComponent,
          ),
        canActivate: [roleGuard('Administrator')],
        data: { title: 'Socios', icon: 'group' },
      },
      {
        path: 'masters/stalls',
        loadComponent: () =>
          import('./features/masters/stalls/pages/stall-list/stall-list.component').then(
            (m) => m.StallListComponent,
          ),
        canActivate: [roleGuard('Administrator')],
        data: { title: 'Puestos', icon: 'store' },
      },
      {
        path: 'masters/services',
        loadComponent: () =>
          import('./features/masters/services/pages/service-list/service-list.component').then(
            (m) => m.ServiceListComponent,
          ),
        canActivate: [roleGuard('Administrator')],
        data: { title: 'Servicios cobrables', icon: 'receipt' },
      },
      {
        path: 'masters/banks',
        loadComponent: () =>
          import('./features/masters/banks/pages/bank-list/bank-list.component').then(
            (m) => m.BankListComponent,
          ),
        canActivate: [roleGuard('Administrator')],
        data: { title: 'Bancos', icon: 'account_balance' },
      },
      {
        path: 'masters/providers',
        loadComponent: () =>
          import('./features/masters/providers/pages/provider-list/provider-list.component').then(
            (m) => m.ProviderListComponent,
          ),
        canActivate: [roleGuard('Administrator')],
        data: { title: 'Proveedores', icon: 'local_shipping' },
      },

      // EPIC 4 · Cuentas por cobrar (ambos roles)
      placeholderRoute('account-receivables', 'Cuentas por cobrar', 'receipt_long'),

      // EPIC 5 · Lecturas de consumo (ambos roles)
      placeholderRoute('consumption-readings', 'Lecturas de consumo', 'speed'),

      // EPIC 6 · Cobranza / Pagos (CashierOperator)
      placeholderRoute('payments', 'Cobranza', 'point_of_sale', ['CashierOperator']),

      // EPIC 7 · Canjes bancarios (CashierOperator)
      placeholderRoute('bank-exchanges', 'Canjes bancarios', 'account_balance', ['CashierOperator']),

      // EPIC 8 · Ingresos externos (CashierOperator)
      placeholderRoute('incomes', 'Ingresos', 'south_west', ['CashierOperator']),

      // EPIC 9 · Egresos (CashierOperator)
      placeholderRoute('expenses', 'Egresos', 'north_east', ['CashierOperator']),

      // EPIC 10 · Reportes (ambos roles)
      placeholderRoute('reports', 'Reportes', 'assessment'),
    ],
  },
  { path: '**', redirectTo: '' },
];
