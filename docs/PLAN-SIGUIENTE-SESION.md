# Plan de trabajo — Siguiente sesión
opencode -s ses_005b59272ffej68eb6C1OgrOqf

> Objetivo de la sesión: definir la estructura del frontend, crear el **esqueleto de rutas con vistas
> placeholder** y dejar montada la **base técnica** (core/shared/layout) para implementar los epics.
> Se empieza con el proyecto ya vacío y con el tema Material 3 **"Caja Segura"** instalado
> (`@angular/material` + tokens en `src/styles.scss`).

---

## Estado actual (antes de empezar la sesión)

- [x] `@angular/material` / `@angular/cdk` / `@angular/animations` instalados.
- [x] Tema Material 3 "Caja Segura" (claro/oscuro) en `src/styles.scss` + fuentes (Public Sans, Material Icons) en `index.html`.
- [x] Vistas por defecto eliminadas: `app.html` solo tiene `<router-outlet />`, `app.routes.ts` vacío.
- [x] `app.config.ts` con `provideRouter`, `provideAnimationsAsync()`.
- [ ] ~~Nada más~~ → todo lo de abajo.

---

## Paso 1 — Definir la estructura de carpetas

Base de trabajo (propuesta inicial; ajustar antes de crear archivos):

```
src/app/
├── core/                        # singleton: solo se instancia una vez
│   ├── guards/
│   │   ├── auth.guard.ts        # ¿hay token? -> /login si no
│   │   └── role.guard.ts        # ¿rol permitido? (Administrator / CashierOperator)
│   ├── interceptors/
│   │   └── auth.interceptor.ts  # Bearer token + refresh en 401 (epic 1)
│   ├── services/
│   │   ├── auth.service.ts      # login/refresh/logout/me (epic 1)
│   │   ├── token.service.ts     # gestión del accessToken (+ fallback dev)
│   │   ├── theme.service.ts     # toggle claro/oscuro persistido (DESIGN-GUIDELINES §8)
│   │   └── catalogo.service.ts  # catálogos cacheados (epic 2)
│   └── models/                  # interfaces de dominio (PagedModel, responses, dto)
├── layout/
│   └── app-layout/              # shell: sidenav + topbar + <router-outlet>
│       ├── app-layout.ts
│       ├── app-layout.html
│       ├── app-layout.scss
│       └── menu.config.ts       # items de menú por rol
├── shared/                      # reutilizables (sin estado global)
│   ├── components/
│   │   ├── page-header/         # título de módulo + acciones (DESIGN-GUIDELINES §6)
│   │   ├── status-chip/         # chip de estado semántico (§2.3)
│   │   └── confirm-dialog/      # confirmación para acciones destructivas (§6)
│   ├── pipes/
│   │   └── monto.pipe.ts        # formateo PEN/USD, tabular-nums (§3.1)
│   └── directives/
│       └── ...
└── features/                    # una carpeta por epic (lazy loading)
    ├── auth/
    │   └── pages/
    │       └── login/
    ├── inicio/                  # landing post-login (dashboard simple) — opcional
    │   └── pages/
    │       └── dashboard/
    ├── maestros/
    │   └── pages/
    │       ├── business-types/  # giros (US-10)
    │       ├── members/         # socios (US-11)
    │       ├── stalls/          # puestos (US-12)
    │       ├── banks/           # bancos (US-13)
    │       ├── providers/       # proveedores (US-14)
    │       └── services/        # servicios cobrables (US-15)
    ├── cxc/
    │   └── pages/
    │       ├── account-receivables/  # listado + detalle (US-16, US-18)
    │       ├── generate/             # por puestos / por socios (US-17)
    │       └── summary/              # resumen de movimientos (RF-26)
    ├── lecturas/
    │   └── pages/
    │       └── consumption-readings/ # (US-19)
    ├── cobranza/
    │   └── pages/
    │       ├── collection/           # pantalla de cobro (US-20)
    │       └── receipt/              # recibo / detalle de pago (US-20)
    ├── canjes/
    │   └── pages/
    │       └── bank-exchanges/       # (US-21)
    ├── ingresos/
    │   └── pages/
    │       └── incomes/              # (US-22)
    ├── egresos/
    │   └── pages/
    │       ├── expenses/             # listado + registro + anular/procesar (US-23, US-25)
    │       └── bulk-upload/          # carga masiva XLSX (US-24)
    └── reportes/
        └── pages/
            └── reports/              # (US-26)
```

**Tareas del paso 1**
- [ ] Validar la estructura con el equipo/profesor (criterios: feature-first, standalone, lazy loading, core/shared).
- [ ] Decidir nomenclatura: kebab-case en archivos/carpetas, sufijos `.service.ts`, `.guard.ts`, `.pipe.ts`, `*.component.ts`.
- [ ] Confirmar si se incluye `features/inicio/dashboard` o se redirige `/` directamente a otra vista (p. ej. `/cxc`).
- [ ] Confirmar nombres de ruta (es/plural) con la tabla del Paso 2.

---

## Paso 2 — Crear la estructura con placeholders y probar las rutas

Definir el **mapa de rutas** (lazy loading con `loadComponent`, guardado por `auth.guard` y `role.guard`).

| Ruta | Vista (placeholder) | Epic | Rol |
|---|---|---|---|
| `/login` | `features/auth/pages/login` | 1 | público |
| `/inicio` | `features/inicio/pages/dashboard` | — | autenticado |
| `/maestros/giros` | `features/maestros/pages/business-types` | 3 | Administrator |
| `/maestros/socios` | `features/maestros/pages/members` | 3 | Administrator |
| `/maestros/puestos` | `features/maestros/pages/stalls` | 3 | Administrator |
| `/maestros/bancos` | `features/maestros/pages/banks` | 3 | Administrator |
| `/maestros/proveedores` | `features/maestros/pages/providers` | 3 | Administrator |
| `/maestros/servicios` | `features/maestros/pages/services` | 3 | Administrator |
| `/cxc` | `features/cxc/pages/account-receivables` | 4 | ambos |
| `/cxc/generar` | `features/cxc/pages/generate` | 4 | ambos |
| `/cxc/resumen` | `features/cxc/pages/summary` | 4 | ambos |
| `/cxc/:uuid` | detalle (dentro de `account-receivables`) | 4 | ambos |
| `/lecturas` | `features/lecturas/pages/consumption-readings` | 5 | ambos |
| `/caja` | `features/cobranza/pages/collection` | 6 | CashierOperator |
| `/caja/pagos/:uuid` | `features/cobranza/pages/receipt` | 6 | CashierOperator |
| `/canjes` | `features/canjes/pages/bank-exchanges` | 7 | CashierOperator |
| `/ingresos` | `features/ingresos/pages/incomes` | 8 | CashierOperator |
| `/egresos` | `features/egresos/pages/expenses` | 9 | CashierOperator |
| `/egresos/carga-masiva` | `features/egresos/pages/bulk-upload` | 9 | CashierOperator |
| `/reportes` | `features/reportes/pages/reports` | 10 | ambos |
| `**` | redirect a `/inicio` o 404 | — | — |

**Tareas del paso 2**
- [ ] Crear la estructura del Paso 1 (a mano o con `ng generate component`). Cada vista con `*.ts`, `*.html`, `*.scss`.
- [ ] Cada vista placeholder: solo un `<p>` describiendo lo que irá ahí. Ejemplo:

  ```html
  <p>Vista: Socios — listado, crear, editar y desactivar socios (US-11).</p>
  ```

- [ ] Definir `app.routes.ts` con lazy loading. Estructura base esperada:

  ```ts
  export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) },
    {
      path: '',
      canActivate: [authGuard],
      loadComponent: () => import('./layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'inicio' },
        { path: 'inicio', loadComponent: () => import('.../dashboard.component').then(m => m.DashboardComponent) },
        { path: 'maestros/giros', canActivate: [roleGuard], data: { roles: ['Administrator'] }, loadComponent: ... },
        // ... resto de la tabla
      ],
    },
    { path: '**', redirectTo: 'inicio' },
  ];
  ```

- [ ] Crear `layout/app-layout` (sidenav + toolbar de Material) con:
  - [ ] Toolbar con título "SGA Caja", botón de toggle claro/oscuro y menú de usuario (nombre + rol).
  - [ ] Sidenav con el menú según rol (usa `menu.config.ts`).
- [ ] Crear **stubs** de `auth.guard` y `role.guard` que por ahora devuelvan `true` (o que lean una constante), para no bloquear las pruebas de rutas. Dejar TODO claro para el Paso 4.
- [ ] Probar con `ng serve` (o `npm start`): navegar a cada ruta de la tabla y confirmar que renderiza el `<p>` y que el layout aparece.
- [ ] Probar ruta inexistente → redirige a `/inicio`.
- [ ] `npm run build` y `npm test` en verde (actualizar `app.spec.ts` y añadir un test simple de rutas si aplica).

---

## Paso 3 — Base técnica antes de los epics (core/shared)

- [ ] `src/environments/environment.ts` con `apiUrl: 'http://localhost:8080/api'` (y `.development.ts` si aplica).
- [ ] Proxy dev `proxy.conf.json` (`/api` → `http://localhost:8080`) y registrarlo en `angular.json` (`serve.options.proxyConfig`), para evitar CORS en desarrollo.
- [ ] `core/services/token.service.ts`: guardar/leer/limpiar `accessToken` (memoria/localStorage).
- [ ] `core/services/auth.service.ts` (stub): firmas `login`, `refresh`, `logout`, `me`, con llamadas HTTP comentadas.
- [ ] `core/interceptors/auth.interceptor.ts`: adjuntar `Authorization: Bearer`; esqueleto de manejo 401 → `/refresh` → reintento.
- [ ] `core/guards/auth.guard.ts` + `role.guard.ts` reales (leyendo token + `roleName`).
- [ ] `core/services/theme.service.ts`: toggle claro/oscuro que persista en `localStorage('theme')` y setee `data-theme` en `<html>` (sincronizado con `prefers-color-scheme`, §8).
- [ ] `shared/components/page-header`: título `headline-small`, subtítulo, acciones a la derecha.
- [ ] `shared/components/status-chip`: chip con fondo/texto semántico usando los tokens `--status-*` definidos en `styles.scss` (Pending/Paid/Exempt/Processed/Voided).
- [ ] `shared/components/confirm-dialog`: diálogo de confirmación para anular/exonerar (danger → `mat-dialog`).
- [ ] `shared/pipes/monto.pipe.ts`: formato moneda PEN/USD, 2 decimales, clase `tabular-nums` (§3.1).
- [ ] `core/services/catalogo.service.ts` (stub): métodos para cada catálogo del epic 2 (currencies, stages, recurrence-types, receipt-types, income-categories, expense-reasons, charge-target-types, account-receivable-statuses, expense-statuses) con caché en memoria.
- [ ] Añadir script de formato si se desea: `prettier --write` (ya está instalado).

---

## Paso 4 — Implementar el EPIC 1 (Autenticación) — si alcanza el tiempo

Siguiendo `docs/epics/epic-01-autenticacion-sesion.md` y `US-01`:

- [ ] Vista de login (form `outlined`, validación, botón filled deshabilitado mientras inválido).
- [ ] `auth.service.login()` → guardar `accessToken` + `user`; navegar según rol (`Administrator` → `/maestros/socios`, `CashierOperator` → `/caja`).
- [ ] `auth.interceptor` con refresh en 401 (cookie httpOnly; en dev sobre `http://localhost` contemplar fallback).
- [ ] `auth.service.logout()` → `/api/auth/logout` + limpiar sesión local.
- [ ] Mostrar perfil (nombre, usuario, rol) en el menú del layout desde `/me`.
- [ ] Activar `auth.guard`/`role.guard` reales en las rutas.
- [ ] Marcar `US-01` en `docs/HISTORIAS-USUARIO.md`.

---

## Roadmap posterior (referencia de orden)

Siguiendo el orden sugerido de `docs/HISTORIAS-USUARIO.md`:

1. Epic 2 — Catálogos: completar `catalogo.service` y selects reutilizables (US-02…09).
2. Epic 3 — Maestros CRUD (US-10…15): patrón listado paginado + formulario + desactivar.
3. Epic 4 — CxC: listado/filtros, generar (por puestos y por socios), resumen, exonerar (US-16…18).
4. Epic 5 — Lecturas de consumo (US-19).
5. Epic 6 — Cobranza y recibo (US-20) + vista de impresión del recibo (`@media print`, §6).
6. Epic 7/8 — Canjes e ingresos (US-21, US-22).
7. Epic 9 — Egresos: individual, carga masiva XLSX, anular/procesar (US-23…25).
8. Epic 10 — Reportes XLSX (US-26): descarga `blob`.

Ir marcando `[x]` cada historia en `docs/HISTORIAS-USUARIO.md` al completarla.

---

## Cierre de sesión (Definition of Done)

- [ ] `npm run build` sin errores (vigilar budgets: inicial < 500 kB warning).
- [ ] `npm test` en verde.
- [ ] Prettier aplicado (`npx prettier --write .` o sobre `src/`).
- [ ] `docs/HISTORIAS-USUARIO.md` con las historias implementadas marcadas.
- [ ] Actualizar este archivo: tachar lo completado y dejar pendientes claros.
