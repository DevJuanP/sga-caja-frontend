# Plan Detallado de Implementación: Home por Rol (Admin + Cashier)

## Contexto y Decisiones Confirmadas

| Aspecto | Decisión |
|---|---|
| **Endpoint pagos** | No existe `GET /api/payments` — omitir KPI "Cobranza hoy" (Opción B) |
| **Datos** | Siempre fresco, sin caché, llamadas HTTP en cada visita |
| **Errores KPI** | Mostrar "—" en tarjeta si falla la llamada |
| **Navegación KPI** | Click → ruta destino con filtro pre-aplicado (ej. `?active=true`) |
| **Shortcuts** | Array estático por rol |
| **Responsive** | Mismo criterio Reports: `minmax(320px, 1fr)` / `minmax(260px, 1fr)` |
| **Acceso** | Desde sidebar (nueva sección "Principal"), `/home` ya existe |
| **Diseño** | **DESIGN-GUIDELINES.md** — Material 3 "Mercado", tokens, grid de cards, PageHeader |
| **Saludo** | "Buenos días/tardes/noches, {firstName}" + rol en subtítulo |

---

## Endpoints GET Disponibles (API_v2.md) por Rol

### Admin — KPIs de Gestión

| KPI | Endpoint | Params | Fallback | Navegación Click |
|---|---|---|---|---|
| Socios activos | `GET /api/members` | `active=true, size=1` | `—` | `/masters/members` |
| Puestos activos | `GET /api/stalls` | `active=true, size=1` | `—` | `/masters/stalls?active=true` |
| Puestos inactivos | `GET /api/stalls` | `active=false, size=1` | `—` | `/masters/stalls?active=false` |
| Servicios vigentes | `GET /api/services` | `active=true, size=1` | `—` | `/masters/services` |
| Bancos activos | `GET /api/banks` | `active=true, size=1` | `—` | `/masters/banks` |
| CxC Pendientes (top 5) | `GET /api/account-receivables` | `status=Pending, size=5` | `[]` | `/account-receivables/summary?...` |

### Cashier — KPIs Operativos

| KPI | Endpoint | Params | Fallback | Navegación Click |
|---|---|---|---|---|
| Ingresos hoy | `GET /api/incomes` | `date=today, size=20` | `—` | `/incomes` |
| Egresos hoy | `GET /api/expenses` | `date=today, size=20` | `—` | `/expenses` |
| Canjes hoy | `GET /api/bank-exchanges` | `depositDate=today, size=20` | `—` | `/bank-exchanges` |
| CxC Pendientes (top 5) | `GET /api/account-receivables` | `status=Pending, size=5` | `[]` | `/account-receivables/summary?...` |

> **Nota**: Sumar montos en cliente (sumar `amount` de cada página recibida).

---

## Estructura de Archivos

```
src/app/features/home/
├── home.component.ts
├── home.component.html
├── home.component.css
├── home.component.spec.ts
└── services/
    ├── home.service.ts              # Tipos base, utilidades
    ├── admin-home.service.ts        # KPIs Admin
    └── cashier-home.service.ts      # KPIs Cashier
```

---

## Paso 1: Servicio Base (`home.service.ts`)

**Archivo**: `src/app/features/home/services/home.service.ts`

```typescript
import { HttpParams } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';

export interface KpiCard {
  label: string;
  value: string | number;
  icon: string;
  route?: string;
  routeQueryParams?: Record<string, string>;
}

export interface Shortcut {
  label: string;
  route: string;
  icon: string;
}

export interface PendingCxc {
  uuid: string;
  serviceName: string;
  memberName?: string;
  stallNumber?: string;
  amount: number;
  period: string;          // "YYYY-MM-DD → YYYY-MM-DD"
  route: string;           // ej. /account-receivables/summary?memberUuid=...
}

/** Llama a un endpoint y devuelve fallback si falla (nunca rompe la UI). */
export function safeGet<T>(obs: Observable<T>, fallback: T): Observable<T> {
  return obs.pipe(catchError(() => of(fallback)));
}

/** Construye HttpParams desde un objeto plano. */
export function toHttpParams(obj: Record<string, string | number | boolean | undefined>): HttpParams {
  return Object.entries(obj).reduce(
    (params, [k, v]) => (v === undefined ? params : params.set(k, String(v))),
    new HttpParams()
  );
}

/** Formatea fecha YYYY-MM-DD para params de API. */
export function todayParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

---

## Paso 2: Servicio Admin (`admin-home.service.ts`)

**Archivo**: `src/app/features/home/services/admin-home.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AdminHomeService {
  private readonly api = inject(ApiService);

  // ── KPIs individuales (devuelven Observable con fallback "—") ──

  getMembersCount(): Observable<string | number> {
    return safeGet(
      this.api.getPage<MemberResponse>('members', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.totalElements)),
      '—'
    );
  }

  getStallsActive(): Observable<string | number> {
    return safeGet(
      this.api.getPage<StallResponse>('stalls', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.totalElements)),
      '—'
    );
  }

  getStallsInactive(): Observable<string | number> {
    return safeGet(
      this.api.getPage<StallResponse>('stalls', toHttpParams({ active: false, size: 1 }))
        .pipe(map(p => p.totalElements)),
      '—'
    );
  }

  getServicesCount(): Observable<string | number> {
    return safeGet(
      this.api.getPage<ServiceResponse>('services', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.totalElements)),
      '—'
    );
  }

  getBanksCount(): Observable<string | number> {
    return safeGet(
      this.api.getPage<BankResponse>('banks', toHttpParams({ active: true, size: 1 }))
        .pipe(map(p => p.totalElements)),
      '—'
    );
  }

  // ── CxC Pendientes (top 5) ──

  getPendingCxcs(limit = 5): Observable<PendingCxc[]> {
    return safeGet(
      this.api.getPage<AccountReceivableResponse>('account-receivables', 
        toHttpParams({ status: 'Pending', size: limit }))
        .pipe(map(page => page.content.map(this.mapToPendingCxc))),
      []
    );
  }

  // ── Carga paralela de todos los KPIs ──

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
      { label: 'Puestos inactivos', value: stallsInactive, icon: 'store_outline', route: '/masters/stalls', routeQueryParams: { active: 'false' } },
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
    period: `${c.periodStartDate} → ${c.periodEndDate}`,
    route: `/account-receivables/summary${c.member?.uuid ? `?memberUuid=${c.member.uuid}` : c.stall?.uuid ? `?stallUuid=${c.stall.uuid}` : ''}`,
  });
}
```

---

## Paso 3: Servicio Cashier (`cashier-home.service.ts`)

**Archivo**: `src/app/features/home/services/cashier-home.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class CashierHomeService {
  private readonly api = inject(ApiService);

  // ── Helpers de suma en cliente ──

  private sumAmounts<T>(items: T[], getter: (i: T) => number): number {
    return items.reduce((acc, i) => acc + (getter(i) ?? 0), 0);
  }

  // ── KPIs del día (suman montos en cliente) ──

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

  // ── Carga paralela ──

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
```

---

## Paso 4: Componente Home (`home.component.ts`)

**Archivo**: `src/app/features/home/home.component.ts`

```typescript
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
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

  // ── Estado reactivo ──────────────────────────────────────────────────
  readonly user = this.auth.user;                    // UserProfileResponse | null
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

  // ── Shortcuts estáticos por rol (respuesta 4) ────────────────────────
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

  // ── Ciclo de vida ────────────────────────────────────────────────────
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
```

---

## Paso 5: Template (`home.component.html`)

```html
<!-- =====================================================================
     HEADER — Saludo personalizado + rol
     DESIGN-GUIDELINES §5.5: Page header (headline-small, subtitle, actions right)
     ===================================================================== -->
<app-page-header 
  [title]="greeting()" 
  [subtitle]="roleLabel()"
/>

<!-- =====================================================================
     SECCIÓN 1 — KPIs principales (grid responsive, 5 tarjetas Admin / 4 Cashier)
     DESIGN-GUIDELINES §5.1 space-4/5, §5.2 radius-md, §5.3 elevation-1
     §3.2 montos con tabular-nums y alineados derecha
     ===================================================================== -->
@if (loading()) {
  <!-- Skeleton loading — evita layout shift -->
  <div class="home-grid" aria-busy="true" role="status" aria-label="Cargando indicadores">
    @for (_ of [1,2,3,4,5]; track $index) {
      <mat-card class="kpi-card skeleton">
        <div class="skeleton-icon"></div>
        <div class="skeleton-value"></div>
        <div class="skeleton-label"></div>
      </mat-card>
    }
  </div>
} @else {
  <div class="home-grid">
    @for (kpi of kpis(); track kpi.label) {
      <mat-card 
        class="kpi-card" 
        [class.clickable]="!!kpi.route"
        [routerLink]="kpi.route"
        [queryParams]="kpi.routeQueryParams"
      >
        <mat-icon aria-hidden="true" class="kpi-icon">{{ kpi.icon }}</mat-icon>
        <div class="kpi-value" [class.amount]="typeof kpi.value === 'number'">{{ kpi.value }}</div>
        <div class="kpi-label">{{ kpi.label }}</div>
      </mat-card>
    }
  </div>
}

<!-- =====================================================================
     SECCIÓN 2 — Accesos rápidos (grid responsive, minmax 260px)
     DESIGN-GUIDELINES §199-200: Tarjetas surface + elevation-1 + radius-md
     ===================================================================== -->
<div class="home-grid shortcuts">
  @for (shortcut of shortcuts(); track shortcut.route) {
    <a mat-card class="shortcut-card" [routerLink]="shortcut.route" routerLinkActive="active">
      <mat-icon aria-hidden="true">{{ shortcut.icon }}</mat-icon>
      <span>{{ shortcut.label }}</span>
    </a>
  </div>
</div>

<!-- =====================================================================
     SECCIÓN 3 — Cuentas por cobrar urgentes (top 5)
     DESIGN-GUIDELINES §195-198: chips de estado si aplica, tabla densa si crece
     ===================================================================== -->
@if (pendingCxcs().length > 0) {
  <section class="recent-panel">
    <h2 class="panel-title">
      <mat-icon aria-hidden="true">schedule</mat-icon>
      Cuentas por cobrar urgentes
    </h2>
    <ul class="pending-list">
      @for (cxc of pendingCxcs(); track cxc.uuid) {
        <li class="pending-item">
          <a [routerLink]="cxc.route" class="pending-link">
            <div class="pending-main">
              <span class="pending-service">{{ cxc.serviceName }}</span>
              <span class="pending-amount amount">{{ cxc.amount | currency:'PEN' }}</span>
            </div>
            <div class="pending-meta">
              @if (cxc.memberName) {
                <span class="pending-member">{{ cxc.memberName }}</span>
              }
              @if (cxc.stallNumber) {
                <span class="pending-stall">Puesto {{ cxc.stallNumber }}</span>
              }
              <span class="pending-period">{{ cxc.period }}</span>
            </div>
          </a>
        </li>
      }
    </ul>
  </section>
}
```

---

## Paso 6: Estilos (`home.component.css`)

```css
/* ========================================================================
   DESIGN-GUIDELINES §2 — Tokens "Mercado" (usar variables CSS, NO hex)
   §3 — Tipografía Inter + tabular-nums para montos
   §5 — Espaciado base 4px, radius-md 10px, elevation-1
   §6.5 — Page header headline-small, subtitle
   §6.4 — Tarjetas surface + elevation-1 + radius-md + padding space-4/5
   ======================================================================== */

:host {
  display: block;
  padding: var(--space-5);              /* 24px — §5.1 space-5 */
  font-family: 'Inter', sans-serif;     /* §3.1 */
}

/* -----------------------------------------------------------------------
   Grid principal — igual que Reports (§6.4 grid)
   minmax(320px, 1fr) para KPIs, minmax(260px, 1fr) para shortcuts
   ----------------------------------------------------------------------- */
.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);                  /* 16px — §5.1 space-4 */
  margin-bottom: var(--space-5);        /* 24px — §5.1 space-5 */
}

.home-grid.shortcuts {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

/* -----------------------------------------------------------------------
   Tarjetas KPI — surface + elevation-1 + radius-md
   §5.2 radius-md = 10px, §5.3 elevation-1
   Montos con tabular-nums y alineados derecha (§3.2, §240 Don't)
   ----------------------------------------------------------------------- */
.kpi-card {
  background: var(--mat-sys-surface);
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-shape-corner-medium);  /* 10px — §5.2 radius-md */
  box-shadow: var(--mat-sys-level-1);                 /* §5.3 elevation-1 */
  padding: var(--space-4);                            /* 16px — §5.1 space-4 */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);                                /* 8px — §5.1 space-2 */
  transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), 
              transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-card.clickable {
  cursor: pointer;
}

.kpi-card.clickable:hover {
  box-shadow: var(--mat-sys-level-2);                 /* §5.3 elevation-2 */
  transform: translateY(-2px);
}

.kpi-icon {
  font-size: 2.5rem;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--mat-sys-primary);                      /* #1E5A3A — §2.1 primary */
}

.kpi-value {
  font: var(--mat-sys-headline-large);                /* 36px/700 — §3.2 Display */
  color: var(--mat-sys-on-surface);
  line-height: 1;
}

.kpi-value.amount {
  font-variant-numeric: tabular-nums;                 /* §3.1 obligatorio */
  font-family: 'Inter', sans-serif;
  text-align: right;
  width: 100%;
}

.kpi-label {
  font: var(--mat-sys-body-medium);                   /* 14px/400 — §3.2 Body */
  color: var(--mat-sys-on-surface-variant);
}

/* -----------------------------------------------------------------------
   Tarjetas Shortcuts — misma base, centradas
   ----------------------------------------------------------------------- */
.shortcut-card {
  background: var(--mat-sys-surface);
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-shape-corner-medium);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-2);
  text-decoration: none;
  color: var(--mat-sys-on-surface);
  transition: box-shadow 200ms, border-color 200ms;
}

.shortcut-card:hover {
  box-shadow: var(--mat-sys-level-1);
  border-color: var(--mat-sys-primary);
}

.shortcut-card:focus-visible {                        /* §223 focus visible */
  outline: 2px solid var(--mat-sys-primary);
  outline-offset: 2px;
}

.shortcut-card mat-icon {
  font-size: 3rem;
  width: 3rem;
  height: 3rem;
  color: var(--mat-sys-primary);
}

.shortcut-card span {
  font: var(--mat-sys-title-medium);                  /* 16px/600 — §3.2 Title */
}

/* -----------------------------------------------------------------------
   Panel de CxC pendientes — lista densa (§183-188 tablas)
   ----------------------------------------------------------------------- */
.recent-panel {
  background: var(--mat-sys-surface);
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-shape-corner-medium);
  padding: var(--space-4);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font: var(--mat-sys-title-large);                   /* 20px/600 — §3.2 Title */
  color: var(--mat-sys-on-surface);
  margin: 0 0 var(--space-3);
}

.panel-title mat-icon {
  color: var(--mat-sys-primary);
}

.pending-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pending-item {
  border-bottom: 1px solid var(--mat-sys-outline-variant);
  padding-bottom: var(--space-2);
}

.pending-item:last-child {
  border-bottom: none;
}

.pending-link {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-decoration: none;
  color: var(--mat-sys-on-surface);
  border-radius: var(--mat-sys-shape-corner-small);
  padding: var(--space-2);
  transition: background 150ms;
}

.pending-link:hover {
  background: var(--mat-sys-surface-variant);
}

.pending-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.pending-service {
  font: var(--mat-sys-title-medium);
}

.pending-amount.amount {
  font-variant-numeric: tabular-nums;                 /* §3.1 obligatorio */
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: var(--mat-sys-tertiary);                     /* #E0A526 — §2.1 tertiary para dinero */
}

.pending-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font: var(--mat-sys-body-small);                    /* 12px/400 — §3.2 Caption */
  color: var(--mat-sys-on-surface-variant);
}

/* -----------------------------------------------------------------------
   Skeleton loading — evita layout shift, usa tokens
   ----------------------------------------------------------------------- */
.skeleton-icon, .skeleton-value, .skeleton-label {
  background: linear-gradient(90deg, 
    var(--mat-sys-surface-variant) 25%, 
    var(--mat-sys-surface) 50%, 
    var(--mat-sys-surface-variant) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--mat-sys-shape-corner-small);
}

.skeleton-icon { height: 3rem; width: 3rem; }
.skeleton-value { height: 2.5rem; width: 60%; }
.skeleton-label { height: 1rem; width: 40%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* -----------------------------------------------------------------------
   Responsive — desktop-first, breakpoints consistentes
   ----------------------------------------------------------------------- */
@media (max-width: 768px) {
  :host { padding: var(--space-4); }
  .home-grid { grid-template-columns: 1fr; }
}
```

---

## Paso 7: Actualizar Rutas (`app.routes.ts`)

```typescript
// src/app/app.routes.ts — línea 42
// ANTES:
placeholderRoute('home', 'Inicio', 'home'),

// DESPUÉS:
{
  path: 'home',
  loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  data: { title: 'Inicio', icon: 'home' },
},
```

---

## Paso 8: Actualizar Sidebar (`sidebar.component.ts`)

```typescript
// src/app/layout/sidebar/sidebar.component.ts — insertar al inicio de sections[]
readonly sections: NavSection[] = [
  {
    title: 'Principal',
    roles: ['Administrator', 'CashierOperator'],
    items: [{ label: 'Inicio', route: '/home', icon: 'home' }],
  },
  // ... secciones existentes sin cambios
];
```

---

## Paso 9: Tests (`home.component.spec.ts`)

| Caso | Descripción |
|---|---|
| 1 | Renderiza saludo con `firstName` y rol correcto |
| 2 | Admin: 5 KPIs con valores / "—" en error |
| 3 | Cashier: 4 KPIs (Ingresos, Egresos, Canjes, Saldo neto) |
| 4 | Shortcuts correctos por rol (8 Admin / 6 Cashier) |
| 5 | Click en KPI con `route` navega con `queryParams` |
| 6 | Click en shortcut navega a ruta correcta |
| 7 | Muestra "—" en KPI cuando servicio devuelve error (mock `throwError`) |
| 8 | Muestra skeleton mientras `loading=true` |
| 9 | Lista pendientes mapea `serviceName`, `amount`, `memberName`/`stallNumber`, `period` |
| 10 | Montos usan `currency:'PEN'` pipe y clase `.amount` (tabular-nums) |
| 11 | Focus visible en shortcuts (`:focus-visible` anillo primary) |
| 12 | Responsive: grid colapsa a 1 columna en ≤768px |

---

## Paso 10: Verificación Final

```bash
# TypeScript strict
npx tsc --noEmit

# Tests unitarios home
npx ng test --include=**/home/** --watch=false --code-coverage=false

# Lint (si configurado)
npx ng lint 2>/dev/null || echo "lint no configurado"
```

---

## Checklist de Cumplimiento DESIGN-GUIDELINES.md

| Sección | Requisito | Implementación |
|---|---|---|
| §2.1/2.2 | Tokens "Mercado" (primary `#1E5A3A`, tertiary `#E0A526`) | Variables CSS `var(--mat-sys-primary)`, `var(--mat-sys-tertiary)` |
| §3.1 | Inter + tabular-nums obligatorio en montos | `font-family: 'Inter'`, `.amount { font-variant-numeric: tabular-nums }` |
| §3.2 | Escala tipográfica Material 3 | `var(--mat-sys-*)` tokens en CSS |
| §5.1 | Espaciado base 4px (space-1..7) | `var(--space-1..5)` en todo el CSS |
| §5.2 | radius-md 10px en cards | `var(--mat-sys-shape-corner-medium)` |
| §5.3 | elevation-1 en cards, elevation-2 en hover | `var(--mat-sys-level-1/2)` |
| §6.4 | Tarjetas surface + elevation-1 + radius-md + space-4/5 | `.kpi-card`, `.shortcut-card`, `.recent-panel` |
| §6.5 | PageHeader headline-small + subtitle | `<app-page-header [title]="greeting()" [subtitle]="roleLabel()">` |
| §6.2 | Tablas densas, hover, montos tabular-nums derecha | `.pending-list` + `.amount` class |
| §6.3 | Formularios outlined, labels, hints | N/A (home no tiene formularios) |
| §7 | Material Icons 20-24px, estilo consistente | `<mat-icon>` size via font-size, filled style |
| §8 | Focus visible 2px primary, contraste WCAG AA | `:focus-visible { outline: 2px solid var(--mat-sys-primary) }` |
| §9 Do | Tokens siempre, montos con moneda, chips estado | `currency:'PEN'`, `var(--mat-sys-*)`, "—" fallback |
| §9 Don't | No hex hardcoded, no rojo excepto error, no alinear montos izquierda | Cumplido |

---

## Estimación y Orden de Ejecución

```
1. home.service.ts (tipos base)                                    [30 min]
2. admin-home.service.ts + cashier-home.service.ts (paralelo)      [2 h]
3. home.component.ts + .html + .css                                [3 h]
4. home.component.spec.ts                                          [1.5 h]
5. app.routes.ts (cambio placeholder → lazy)                       [10 min]
6. sidebar.component.ts (agregar "Inicio")                         [10 min]
7. Verificación: tsc + tests + lint                                [30 min]
─────────────────────────────────────────────────────────────────
TOTAL: ~7-8 horas / 1 día completo
```

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| `GET /api/payments` no existe → KPI saldo neto incorrecto | Cashier usa solo Ingresos - Egresos + Canjes; no hay endpoint pagos lista |
| Endpoint `/api/account-receivables/summary` requiere `memberUuid` o `stallUuid` | `mapToPendingCxc` construye queryParams dinámicos según datos disponibles |
| `safeGet` oculta errores reales en desarrollo | Log `console.warn` en catchError solo en `!environment.production` |
| Skeleton flash en carga rápida | `loading` signal + `@if (loading())` block + skeleton idéntico a card real |