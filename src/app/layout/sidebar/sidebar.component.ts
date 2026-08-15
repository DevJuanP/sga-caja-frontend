import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../interfaces/auth.interface';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavSection {
  title: string;
  roles: UserRole[];
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [MatIcon, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;

  readonly sections: NavSection[] = [
    {
      title: 'Caja',
      roles: ['CashierOperator'],
      items: [
        { label: 'Cobranza', route: '/payments', icon: 'point_of_sale' },
        { label: 'Canjes bancarios', route: '/bank-exchanges', icon: 'account_balance' },
        { label: 'Ingresos', route: '/incomes', icon: 'south_west' },
        { label: 'Egresos', route: '/expenses', icon: 'north_east' },
      ],
    },
    {
      title: 'Gestión',
      roles: ['Administrator', 'CashierOperator'],
      items: [
        { label: 'Cuentas por cobrar', route: '/account-receivables', icon: 'receipt_long' },
        { label: 'Lecturas de consumo', route: '/consumption-readings', icon: 'speed' },
      ],
    },
    {
      title: 'Maestros',
      roles: ['Administrator'],
      items: [
        { label: 'Giros comerciales', route: '/masters/business-types', icon: 'storefront' },
        { label: 'Socios', route: '/masters/members', icon: 'group' },
        { label: 'Puestos', route: '/masters/stalls', icon: 'store' },
        { label: 'Servicios cobrables', route: '/masters/services', icon: 'receipt' },
        { label: 'Bancos', route: '/masters/banks', icon: 'account_balance' },
        { label: 'Proveedores', route: '/masters/providers', icon: 'local_shipping' },
      ],
    },
    {
      title: 'Informes',
      roles: ['Administrator', 'CashierOperator'],
      items: [{ label: 'Reportes', route: '/reports', icon: 'assessment' }],
    },
  ];

  visibleSections(): NavSection[] {
    const role = this.user()?.roleName;
    return this.sections.filter((section) => section.roles.includes(role as UserRole));
  }
}
