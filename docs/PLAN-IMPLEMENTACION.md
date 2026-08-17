# Plan de Implementación — SGA Caja Frontend

> Plan de acción para construir el frontend (Angular 22, standalone, Material 3 "Mercado")
> a partir de [`API.md`](API.md) y las [`HISTORIAS-USUARIO.md`](HISTORIAS-USUARIO.md),
> siguiendo los lineamientos de [`DESIGN-GUIDELINES.md`](DESIGN-GUIDELINES.md).

---

## 1. Objetivo

Definir la arquitectura de carpetas del frontend y el flujo de desarrollo para avanzar
los 10 epics de `docs/epics/` en orden, entregando funcionalidad **usable y testeable
por cada historia de usuario (US)**.

## 2. Decisiones clave

- **Desarrollo por vertical slices por US, en orden de epic.**
  - *Epic* = agrupación lógica de pantallas que comparten dominio y contrato de API.
  - *Vista (US)* = unidad real de entrega.
  - No se implementa un epic completo "de golpe", ni se define primero un
    scaffolding horizontal de páginas vacías (anti-patrón).
- **Navegación definida por epic, entrega por vista.**
  - Primero se define la IA de navegación (rutas + menú según rol) con placeholders.
  - Luego cada US se completa de extremo a extremo antes de pasar a la siguiente.
- **Estado con Signals + servicios** (`inject()`, sin NgRx ni dependencias extra).
- **Componentes CRUD genéricos en `shared/`**, creados en el epic donde aparecen por
  primera vez (YAGNI) y reutilizados en los siguientes.
- **Convención de 4 archivos por componente** (igual que `ng generate component` por defecto):
  `.component.ts` · `.component.html` · `.component.css` · `.component.spec.ts`.
  - CSS plano por componente, consumiendo tokens de `styles.scss`.
  - HTML externo (no inline template).
  - Spec obligatorio con Vitest y mocks de servicios.
  - Excepción única: el root `app.ts`/`app.html` del bootstrap.

## 3. Estructura de carpetas

```
src/
├── environments/
│   ├── environment.ts                 # prod: apiUrl, devRefreshFallback: false
│   └── environment.development.ts     # dev: apiUrl = http://localhost:8080, devRefreshFallback: true
├── app/
│   ├── app.config.ts                  # provideHttpClient(withInterceptors, withCredentials), router, animaciones
│   ├── app.routes.ts                  # layout shell + lazy loading por feature
│   ├── app.ts / app.html              # root del bootstrap
│   │
│   ├── interfaces/                    # DTOs espejo de API.md (requests y responses)
│   │   ├── common.interface.ts        # ErrorResponse, PagedModel<T>, Pageable, PageParams
│   │   ├── auth.interface.ts          # LoginRequest, AccessTokenResponse, UserProfileResponse, UserRole
│   │   ├── catalog.interface.ts       # CatalogItem, Currency{code,name}, Stage{code,name}, ...
│   │   ├── receipt.interface.ts       # Receipt compartido (pagos/ingresos/egresos/canjes)
│   │   ├── member.interface.ts        # MemberResponse/Request + StageRef
│   │   ├── stall.interface.ts         # StallResponse/Request + refs (businessType, member)
│   │   ├── service.interface.ts       # ServiceResponse/Request (consumptionBased, cost, unitCost)
│   │   ├── business-type.interface.ts
│   │   ├── bank.interface.ts
│   │   ├── provider.interface.ts
│   │   ├── account-receivable.interface.ts   # + GenerateByStall/MemberRequest, Summary/Movement
│   │   ├── consumption-reading.interface.ts  # + calculatedAmount
│   │   ├── payment.interface.ts       # ProcessPaymentRequest, PaymentTotalResponse, PaymentResponse
│   │   ├── bank-exchange.interface.ts
│   │   ├── income.interface.ts
│   │   └── expense.interface.ts       # + bulkUpload ref
│   │
│   ├── core/                          # singletons (una instancia de app)
│   │   ├── http/
│   │   │   └── api.service.ts         # baseUrl + helpers (listPage, get, post, patch, upload, downloadBlob)
│   │   ├── auth/
│   │   │   ├── auth.service.ts        # signals: user, accessToken, isAuthenticated
│   │   │   ├── token-storage.service.ts   # localStorage + fallback dev (cookie Secure)
│   │   │   ├── auth.interceptor.ts    # Bearer; en 401 → /refresh → reintenta
│   │   │   ├── error.interceptor.ts   # mapea ErrorResponse estándar
│   │   │   ├── auth.guard.ts          # redirige a /login sin token
│   │   │   └── role.guard.ts          # rol requerido por ruta
│   │   └── theme/
│   │       └── theme.service.ts       # toggle claro/oscuro + localStorage
│   │
│   ├── shared/                        # UI reutilizable, sin lógica de negocio
│   │   ├── components/
│   │   │   ├── page-header/           # headline-small + acciones (DESIGN §6)
│   │   │   ├── status-chip/           # paleta semántica §2.3 (Pending/Paid/Exempt/Voided/Processed)
│   │   │   ├── amount-text/           # tabular-nums, alineación derecha, PEN/USD
│   │   │   ├── filter-bar/            # búsqueda + filtros + paginación (dense)
│   │   │   ├── crud-table/            # tabla densa reutilizable (hover, checkbox, columnas numéricas)
│   │   │   ├── confirm-dialog/        # confirmación destructiva (anular/exonerar)
│   │   │   ├── empty-state/
│   │   │   ├── catalog-select/        # select alimentado por un catálogo cacheado (EPIC 2)
│   │   │   └── receipt-viewer/        # modal que renderiza el `receipt` embebido (pagos/ingresos/egresos/canjes, RF-29/30/31)
│   │   ├── pipes/                     # currency.pipe, date.pipe
│   │   └── directives/
│   │
│   ├── layout/                        # shell principal
│   │   ├── main-shell/                # sidebar + topbar + <router-outlet>
│   │   ├── sidebar/                   # menú según roleName
│   │   └── topbar/                    # toggle tema, perfil, logout
│   │
│   └── features/                      # lazy-loaded, 1 por epic
│       ├── auth/                      # EPIC 1 · login
│       ├── catalogs/                  # EPIC 2 · catalog.service cacheado + catalog-select
│       ├── masters/                   # EPIC 3 · members, stalls, services, banks, providers, business-types
│       ├── account-receivables/       # EPIC 4 · listado, generar (stall/member), exonerar, summary
│       ├── consumption-readings/      # EPIC 5
│       ├── payments/                  # EPIC 6 · cobranza (checkboxes → compute-total → recibo)
│       ├── bank-exchanges/            # EPIC 7
│       ├── incomes/                   # EPIC 8
│       ├── expenses/                  # EPIC 9 · listado, formulario, bulk-upload, anular/procesar
│       └── reports/                   # EPIC 10 · descarga XLSX (blob)
│
├── index.html
├── main.ts
└── styles.scss                        # tema "Mercado" (tokens Material 3, paleta, tipografía)
```

### Convención por feature

```
features/<feature>/
├── <feature>.routes.ts      # lazy routes
├── <feature>.service.ts     # métodos HTTP → interfaces/
└── pages/                   # list.component.ts|html|css|spec, form.component.ts|html|css|spec
```

En `masters/`, cada entidad agrupa su `service` + `pages/list` + `pages/form` y reutiliza
los componentes `shared/`.

### Convención de 4 archivos por componente

Todo componente generado (fuera del root) cumple:

```
features/<feature>/pages/<page>/
├── <page>.component.ts
├── <page>.component.html
├── <page>.component.css
└── <page>.component.spec.ts
```

## 4. Flujo de desarrollo por US (vertical slice)

```
interface (DTO) → service (HTTP) → page (list/form/detail) → spec → verificación
```

1. Declarar los tipos en `app/interfaces/` según el contrato del epic.
2. Crear/actualizar el `service` de la feature (métodos HTTP con `api.service`).
3. Crear la página (componentes de 4 archivos) con los componentes `shared/` disponibles.
4. Escribir el spec con mocks de servicios.
5. Verificar contra el backend y marcar la US en `HISTORIAS-USUARIO.md`.

## 5. Fases / orden de implementación

| Fase | Epic | Historias | Descripción |
|------|------|-----------|-------------|
| 0 | — | — | Bootstrap: environments, api.service, interceptors/guards, theme, layout shell, rutas + menú por rol con placeholders |
| 1 | EPIC 1 | US-01 | Login, sesión, refresh, logout, perfil (UI: `VistasPropuestas/sga_caja_login_propuesta1.html`) |
| 2 | EPIC 2 | US-02 … US-09 | Catálogos de solo lectura (selects): `CatalogService` cacheado + `catalog-select` (demo `/dev/catalogs` solo dev) |
| 3 | EPIC 3 | US-10 … US-15 | Maestros: giros → socios → puestos → bancos → proveedores → servicios. Shared nuevos: `filter-bar`, `crud-table`, `confirm-dialog` (+`confirm-dialog.service`), `page-header`, `empty-state`, `status-chip`, `currency.pipe` |
| 4 | EPIC 4 | US-16, US-17, US-18 | Cuentas por cobrar: listado paginado, generar (por puesto/socio), exonerar, resumen en nueva pestaña |
| 5 | EPIC 5 | US-19 | Lecturas de consumo |
| 6 | EPIC 6 | US-20 | Cobranza (pestañas por puesto/socio): consulta RF-19, selección de CxC, exonerar, compute-total, recibo/voucher |
| 7 | EPIC 7, 8 | US-21, US-22 | Canjes bancarios e ingresos externos |
| 8 | EPIC 9 | US-23, US-24, US-25 | Egresos: registro, bulk-upload XLSX, anular/procesar |
| 9 | EPIC 10 | US-26 | Reportes XLSX (descarga blob) |

> El orden respeta las dependencias funcionales: catálogos → maestros → CxC → pagos →
> canjes/ingresos → egresos → reportes.

## 6. Fase 4 — Cuentas por cobrar (EPIC 4, US-16/17/18)

### 6.1 Archivos a crear

| # | Archivo | Tipo |
|---|---|---|
| 1 | `src/app/interfaces/account-receivable.interface.ts` | Interface |
| 2 | `src/app/features/account-receivables/account-receivables.service.ts` | Service |
| 3 | `src/app/features/account-receivables/account-receivables.service.spec.ts` | Spec |
| 4 | `src/app/features/account-receivables/pages/cxc-list/cxc-list.component.ts` | Component |
| 5 | `src/app/features/account-receivables/pages/cxc-list/cxc-list.component.html` | Template |
| 6 | `src/app/features/account-receivables/pages/cxc-list/cxc-list.component.css` | Styles |
| 7 | `src/app/features/account-receivables/pages/cxc-list/cxc-list.component.spec.ts` | Spec |
| 8 | `src/app/features/account-receivables/pages/cxc-generate/cxc-generate-dialog.component.ts` | Dialog |
| 9 | `src/app/features/account-receivables/pages/cxc-generate/cxc-generate-dialog.component.html` | Template |
| 10 | `src/app/features/account-receivables/pages/cxc-generate/cxc-generate-dialog.component.css` | Styles |
| 11 | `src/app/features/account-receivables/pages/cxc-generate/cxc-generate-dialog.component.spec.ts` | Spec |
| 12 | `src/app/features/account-receivables/pages/cxc-summary/cxc-summary.component.ts` | Component |
| 13 | `src/app/features/account-receivables/pages/cxc-summary/cxc-summary.component.html` | Template |
| 14 | `src/app/features/account-receivables/pages/cxc-summary/cxc-summary.component.css` | Styles |
| 15 | `src/app/features/account-receivables/pages/cxc-summary/cxc-summary.component.spec.ts` | Spec |
| 16 | Actualizar `app.routes.ts` | Route |
| 17 | Actualizar `docs/PLAN-IMPLEMENTACION.md` | Doc |

### 6.2 Interfaces (`account-receivable.interface.ts`)

```ts
export interface AccountReceivableResponse {
  uuid: string;
  service: { uuid: string; name: string; consumptionBased: boolean };
  member: { uuid: string; fullName: string } | null;
  stall: { uuid: string; number: string } | null;
  periodStartDate: string;   // 'YYYY-MM-DD'
  periodEndDate: string;
  amount: number;
  status: { uuid: string; name: 'Pending' | 'Paid' | 'Exempt' };
}

export interface GenerateByStallRequest {
  serviceUuid: string;
  periodStartDate: string;
  periodEndDate: string;
  amount?: number;            // requerido si costo fijo, omitido si consumo
}

export interface GenerateByMemberRequest {
  serviceUuid: string;
  periodStartDate: string;
  periodEndDate: string;
  amount?: number;
  stageCodes: number[];       // [1,2,3]
  uniqueMembers: boolean;
}

export interface AccountReceivableMovementResponse {
  accountReceivable: AccountReceivableResponse;
  settlementMethod: 'PAYMENT' | 'BANK_EXCHANGE' | null;
  settledDate: string | null;
  receiptCorrelative: number | null;
}
```

### 6.3 Service (`account-receivables.service.ts`)

| Método | HTTP | Path |
|---|---|---|
| `list(params)` | GET | `account-receivables?serviceUuid=&memberUuid=&stallUuid=&page=&size=` |
| `get(uuid)` | GET | `account-receivables/{uuid}` |
| `generateByStall(body)` | POST | `account-receivables/generate-by-stall` |
| `generateByMember(body)` | POST | `account-receivables/generate-by-member` |
| `exempt(uuid)` | PATCH | `account-receivables/{uuid}/exempt` |
| `summary(params)` | GET | `account-receivables/summary?memberUuid=&stallUuid=` |

### 6.4 US-16 — CxC List (`cxc-list`)

- Filtros custom (3× mat-select): servicio (`GET /api/services?page=0&size=999`), socio (`GET /api/members?page=0&size=999`), puesto (`GET /api/stalls?page=0&size=999`). Cada filtro tiene opción "Todos" (null).
- Tabla: servicio, socio/puesto, período, monto (tabular-nums, pipe currency), estado (chip).
- Acción "Exonerar" visible solo si `status.name === 'Pending'` AND `role === 'CashierOperator'`.
- Botón "Generar CxC" en PageHeader → abre CxcGenerateDialog.
- Botón "Ver resumen" → `window.open('/account-receivables/summary?memberUuid=...')`.

### 6.5 US-17 — Generate Dialog (`cxc-generate-dialog`)

- MatDialog con 2 tabs: "Por puestos" / "Por socios".
- Compartido: select servicio, fechas, monto condicional (solo si `consumptionBased === false`).
- Tab "Por socios": 3 checkboxes etapa (1/2/3, fijos) + toggle "Solo socios únicos".
- Resultado: tabla embebida scrollable con las CxC generadas.

### 6.6 US-17 — Summary Page (`cxc-summary`)

- Ruta `/account-receivables/summary` (nueva pestaña).
- Lee `memberUuid` o `stallUuid` de query params.
- Tabla: servicio, período, monto, estado (chip), liquidado por, fecha liquidación, correlativo.

### 6.7 Cambios en routes

Reemplazar placeholder con rutas reales de CxC list y summary.

---

## 7. Fase 5 — Lecturas de consumo (EPIC 5, US-19)

### 7.1 Archivos a crear

| # | Archivo | Tipo |
|---|---|---|
| 1 | `src/app/interfaces/consumption-reading.interface.ts` | Interface |
| 2 | `src/app/features/account-receivables/consumption-readings.service.ts` | Service |
| 3 | `src/app/features/account-receivables/consumption-readings.service.spec.ts` | Spec |
| 4 | `src/app/features/account-receivables/pages/cxc-reading/consumption-reading-dialog.component.ts` | Dialog |
| 5 | `src/app/features/account-receivables/pages/cxc-reading/consumption-reading-dialog.component.html` | Template |
| 6 | `src/app/features/account-receivables/pages/cxc-reading/consumption-reading-dialog.component.css` | Styles |
| 7 | `src/app/features/account-receivables/pages/cxc-reading/consumption-reading-dialog.component.spec.ts` | Spec |

### 7.2 Archivos modificados

| # | Archivo | Cambio |
|---|---|---|
| 8 | `src/app/shared/components/crud-table/crud-table.component.ts` | Agregar `visible?: (row) => boolean` a `RowAction` + método `getRowActions(row)` |
| 9 | `src/app/shared/components/crud-table/crud-table.component.html` | Usar `getRowActions(row)` en vez de `actions()` |
| 10 | `src/app/features/account-receivables/pages/cxc-list/cxc-list.component.ts` | Acción "Lectura" condicional + `openReading()` + `consumptionBased` en `toRow()` |
| 11 | `src/app/features/account-receivables/pages/cxc-list/cxc-list.component.spec.ts` | Test de apertura de dialog de lectura |

### 7.3 Interfaces (`consumption-reading.interface.ts`)

```ts
export interface ConsumptionReadingResponse {
  uuid: string;
  accountReceivableUuid: string;
  initialReading: number;
  finalReading: number;
  unitCost: number;
  calculatedAmount: number;
}

export interface RegisterConsumptionReadingRequest {
  accountReceivableUuid: string;
  initialReading: number;
  finalReading: number;
}
```

### 7.4 Service (`consumption-readings.service.ts`)

| Método | HTTP | Path |
|---|---|---|
| `getByAccountReceivable(uuid)` | GET | `consumption-readings/by-account-receivable/{uuid}` |
| `getByUuid(uuid)` | GET | `consumption-readings/{uuid}` |
| `register(body)` | POST | `consumption-readings` |

### 7.5 CrudTableComponent — Acción condicional

Se agregó `visible?: (row: Record<string, unknown>) => boolean` a `RowAction`. El template filtra acciones por `getRowActions(row)`. Los componentes que no usan `visible` no se ven afectados (opcional por defecto).

### 7.6 US-19 — ConsumptionReadingDialog

- MatDialog que recibe `accountReceivableUuid` por `MAT_DIALOG_DATA`.
- Al abrir, llama `GET /by-account-receivable/{uuid}`:
  - **200**: muestra datos en solo lectura (initialReading, finalReading, unitCost, calculatedAmount).
  - **404**: muestra formulario con `initialReading` y `finalReading` (number, min=0, step=0.01).
- Submit: `POST /consumption-readings` → cierra dialog con `true` para refrescar la tabla.

### 7.7 US-19 — Integración en CxC List

- Acción "Lectura" con ícono `speed`, visible solo si `row.consumptionBased === true`.
- Handler `openReading(item)` abre el dialog con `accountReceivableUuid`.
- `toRow()` incluye `consumptionBased` para la condición de visibilidad.

---

## 8. Pruebas y criterio de terminado

- `ng build` sin errores.
- `ng test` (Vitest) verde: **una spec por componente** y specs para servicios clave.
- Cada US queda **usable** contra la API (vertical slice completo) antes de marcar `[x]`.
- Vistas alineadas a `DESIGN-GUIDELINES.md` (tokens, chips de estado, montos tabular-nums).

## 9. Referencias

- [`API.md`](API.md) — especificación definitiva del backend.
- [`HISTORIAS-USUARIO.md`](HISTORIAS-USUARIO.md) — historias y estado de cobertura.
- [`DESIGN-GUIDELINES.md`](DESIGN-GUIDELINES.md) — lineamientos de diseño (Material 3 "Mercado").
- `docs/epics/` — contratos detallados por epic.

---

## 10. Fase 6 — Cobranza / Pagos (EPIC 6, US-20)

### 10.1 Archivos a crear

| # | Archivo | Tipo |
|---|---|---|
| 1 | `src/app/interfaces/payment.interface.ts` | Interface |
| 2 | `src/app/features/payments/payments.service.ts` | Service |
| 3 | `src/app/features/payments/payments.service.spec.ts` | Spec |
| 4 | `src/app/features/payments/pages/payments-list/payments-list.component.ts` | Component |
| 5 | `src/app/features/payments/pages/payments-list/payments-list.component.html` | Template |
| 6 | `src/app/features/payments/pages/payments-list/payments-list.component.css` | Styles |
| 7 | `src/app/features/payments/pages/payments-list/payments-list.component.spec.ts` | Spec |
| 8 | `src/app/features/payments/pages/payment-dialog/payment-dialog.component.ts` | Dialog |
| 9 | `src/app/features/payments/pages/payment-dialog/payment-dialog.component.html` | Template |
| 10 | `src/app/features/payments/pages/payment-dialog/payment-dialog.component.css` | Styles |
| 11 | `src/app/features/payments/pages/payment-dialog/payment-dialog.component.spec.ts` | Spec |
| 12 | `src/app/shared/components/receipt-viewer/receipt-viewer.component.ts` | Component compartido |
| 13 | `src/app/shared/components/receipt-viewer/receipt-viewer.component.html` | Template |
| 14 | `src/app/shared/components/receipt-viewer/receipt-viewer.component.css` | Styles |
| 15 | `src/app/shared/components/receipt-viewer/receipt-viewer.component.spec.ts` | Spec |
| 16 | `src/app/shared/components/cxc-selection/cxc-selection.component.ts` | Component compartido |
| 17 | `src/app/shared/components/cxc-selection/cxc-selection.component.html` | Template |
| 18 | `src/app/shared/components/cxc-selection/cxc-selection.component.css` | Styles |
| 19 | `src/app/shared/components/cxc-selection/cxc-selection.component.spec.ts` | Spec |
| 20 | Actualizar `app.routes.ts` | Route |

### 10.2 Interfaces (`payment.interface.ts`)

```ts
export interface ProcessPaymentRequest {
  accountReceivableUuids: string[];
}

export interface PaymentTotalResponse {
  items: { accountReceivableUuid: string; amount: number }[];
  total: number;
}

export interface PaymentResponse {
  uuid: string;
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
    amount: number;
  };
  paymentDate: string;
  totalAmount: number;
  details: { accountReceivableUuid: string; amount: number }[];
  createdBy: { uuid: string; username: string };
}

export interface PaymentListResponse {
  uuid: string;
  receipt: {
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
    amount: number;
  };
  paymentDate: string;
  totalAmount: number;
}

export interface PaymentPageResponse {
  content: PaymentListResponse[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}
```

### 10.3 Service (`payments.service.ts`)

| Método | HTTP | Path |
|---|---|---|
| `computeTotal(body)` | POST | `/api/payments/compute-total` |
| `processPayment(body)` | POST | `/api/payments` |
| `getByUuid(uuid)` | GET | `/api/payments/{uuid}` |
| `list(params)` | GET | `/api/payments?page=&size=&sort=` |

### 10.4 US-20 — PaymentsListComponent (`payments-list`)

- **Ruta:** `/payments` (rol: `CashierOperator`)
- **Layout:**
  - PageHeader con título "Cobranza"
  - `mat-tab-group` con 2 pestañas: "Por puestos" (índice 0) y "Por socios" (índice 1)
  - En cada pestaña:
    - Filtros: servicio (`mat-select`) + socio/puesto (`mat-select`) + botón "Limpiar"
    - `app-cxc-selection` (componente compartido con checkboxes)
    - Acciones: botón "Calcular total" (disabled si no hay selección) + texto total
- **Funcionalidad:**
  - Al cambiar pestaña → limpia filtros y selecciones, recarga
  - `computeTotal()` llama `POST /api/payments/compute-total` con UUIDs seleccionados
  - Abre `PaymentDialogComponent` con el total calculado
  - Al cerrar dialog con éxito → recarga la lista

### 10.5 US-20 — PaymentDialogComponent (`payment-dialog`)

- **MatDialog** que recibe `{ uuids: string[], total: number }` por `MAT_DIALOG_DATA`.
- **Sin pagar:** muestra resumen (cantidad CxC + total formateado) + botones "Cancelar" / "Confirmar y pagar"
- **Pagado:** muestra `app-receipt-viewer` con el recibo emitido + botón "Cerrar"
- Submit: `POST /api/payments` → respuesta con `receipt` → cambia a vista de recibo

### 10.6 Componente compartido `receipt-viewer`

- **Input:** `receipt` (tipo `ReceiptData`: uuid, receiptTypeName, correlativeNumber, issueDate, amount, paymentDate?, createdBy?)
- **Layout:** Encabezado con tipo de recibo, correlativo, fecha de emisión, monto total (pipe currency custom), nota legal
- **Impresión:** botón "Imprimir" que llama `window.print()`, con `@media print` que oculta botones
- **Reutilizable** por ingresos, egresos y canjes bancarios

### 10.7 Componente compartido `cxc-selection`

- **Inputs:** `data` (CxcRow[]), `selectable` (boolean, default true)
- **Output:** `selectionChange` (string[] de UUIDs seleccionados)
- **Funcionalidad:** tabla con checkboxes (mat-checkbox), checkbox maestro en header, selección múltiple
- **Columnas:** Servicio, Socio/Puesto, Período, Monto (tabular-nums, end), Estado (chip)
- **Reutilizable** por cualquier vista que requiera selección de CxC

### 10.8 Cambios en routes

Reemplazar placeholder de `payments` en `app.routes.ts` con lazy-loaded component + `roleGuard('CashierOperator')`.

---

## 11. Fase 7 — Canjes bancarios e ingresos externos (EPIC 7, 8, US-21, US-22)

### 11.1 Archivos a crear

| # | Archivo | Tipo |
|---|---|---|
| 1 | `src/app/interfaces/bank-exchange.interface.ts` | Interface |
| 2 | `src/app/interfaces/income.interface.ts` | Interface |
| 3 | `src/app/features/bank-exchanges/bank-exchanges.service.ts` | Service |
| 4 | `src/app/features/bank-exchanges/bank-exchanges.service.spec.ts` | Spec |
| 5 | `src/app/features/bank-exchanges/pages/bank-exchange-list/bank-exchange-list.component.ts` | Component |
| 6 | `src/app/features/bank-exchanges/pages/bank-exchange-list/bank-exchange-list.component.html` | Template |
| 7 | `src/app/features/bank-exchanges/pages/bank-exchange-list/bank-exchange-list.component.css` | Styles |
| 8 | `src/app/features/bank-exchanges/pages/bank-exchange-list/bank-exchange-list.component.spec.ts` | Spec |
| 9 | `src/app/features/bank-exchanges/pages/bank-exchange-form/bank-exchange-form-dialog.component.ts` | Dialog |
| 10 | `src/app/features/bank-exchanges/pages/bank-exchange-form/bank-exchange-form-dialog.component.html` | Template |
| 11 | `src/app/features/bank-exchanges/pages/bank-exchange-form/bank-exchange-form-dialog.component.css` | Styles |
| 12 | `src/app/features/bank-exchanges/pages/bank-exchange-form/bank-exchange-form-dialog.component.spec.ts` | Spec |
| 13 | `src/app/features/incomes/incomes.service.ts` | Service |
| 14 | `src/app/features/incomes/incomes.service.spec.ts` | Spec |
| 15 | `src/app/features/incomes/pages/income-list/income-list.component.ts` | Component |
| 16 | `src/app/features/incomes/pages/income-list/income-list.component.html` | Template |
| 17 | `src/app/features/incomes/pages/income-list/income-list.component.css` | Styles |
| 18 | `src/app/features/incomes/pages/income-list/income-list.component.spec.ts` | Spec |
| 19 | `src/app/features/incomes/pages/income-form/income-form-dialog.component.ts` | Dialog |
| 20 | `src/app/features/incomes/pages/income-form/income-form-dialog.component.html` | Template |
| 21 | `src/app/features/incomes/pages/income-form/income-form-dialog.component.css` | Styles |
| 22 | `src/app/features/incomes/pages/income-form/income-form-dialog.component.spec.ts` | Spec |
| 23 | Actualizar `app.routes.ts` | Route |

### 11.2 Interfaces

#### `bank-exchange.interface.ts`
```ts
export interface BankExchangeResponse {
  uuid: string;
  accountReceivable: {
    uuid: string;
    service: { uuid: string; name: string; consumptionBased: boolean };
    member: { uuid: string; fullName: string } | null;
    stall: { uuid: string; number: string } | null;
    periodStartDate: string;
    periodEndDate: string;
    amount: number;
    status: { uuid: string; name: 'Paid' };
  };
  bank: { uuid: string; name: string };
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
  };
  depositDate: string;
  amount: number;
}

export interface CreateBankExchangeRequest {
  accountReceivableUuid: string;
  bankUuid: string;
  depositDate: string;
}
```

#### `income.interface.ts`
```ts
export interface IncomeResponse {
  uuid: string;
  receipt: {
    uuid: string;
    receiptTypeName: string;
    correlativeNumber: number;
    issueDate: string;
  };
  depositorName: string;
  incomeCategory: { uuid: string; name: string };
  concept: string;
  amount: number;
}

export interface CreateIncomeRequest {
  depositorName: string;
  incomeCategoryUuid: string;
  concept: string;
  amount: number;
}
```

### 11.3 Servicios

#### `bank-exchanges.service.ts`
| Método | HTTP | Path |
|---|---|---|
| `list(params)` | GET | `/api/bank-exchanges?bankUuid=&date=&page=&size=` |
| `getByUuid(uuid)` | GET | `/api/bank-exchanges/{uuid}` |
| `create(body)` | POST | `/api/bank-exchanges` |

#### `incomes.service.ts`
| Método | HTTP | Path |
|---|---|---|
| `list(params)` | GET | `/api/incomes?incomeCategoryUuid=&date=&page=&size=` |
| `getByUuid(uuid)` | GET | `/api/incomes/{uuid}` |
| `create(body)` | POST | `/api/incomes` |

### 11.4 US-21 — Bank Exchange List (`bank-exchange-list`)

- **Ruta:** `/bank-exchanges` (rol: `CashierOperator`)
- **Layout:**
  - PageHeader con título "Canjes bancarios" y acción "Nuevo canje" (abre dialog)
  - Barra de filtros: banco (`mat-select`), fecha de depósito (`mat-datepicker`), botón "Limpiar"
  - Tabla densa con columnas: Fecha de depósito, CxC (servicio + socio/puesto), Banco, Monto (tabular-nums, end), Estado (siempre "Paid" chip verde), Acciones (ver detalle)
  - Paginación en base de tabla
- **Funcionalidad:**
  - Filtros aplican búsqueda en tiempo real (debounce 300ms)
  - Acción "Ver detalle" en cada fila abre el registro en modo solo lectura (o podría navegar a detalle, pero según RF-31 se visualiza voucher desde listado)
  - Al hacer clic en fila o usar acción "Ver detalle", mostrar voucher usando `receipt-viewer` compartido
  - Botón "Nuevo canje" abre `bank-exchange-form-dialog`
  - Al crear canje exitosamente → recarga lista

### 11.5 US-21 — Bank Exchange Form (`bank-exchange-form-dialog`)

- **MatDialog** que recibe `{ accountReceivableUuids?: string[] }` por `MAT_DIALOG_DATA` (para pre-seleccionar CxC desde lista de CxC pendientes)
- **Formulario:**
  - Select CxC pendiente de socio (filtrado por `status.name === 'Pending' AND memberUuid !== null`) - requiere carga previa de CxC pendientes
  - Select banco (activos)
  - Input fecha de depósito (`matInput [type]="date"`)
  - Validación: todos los campos requeridos
- **Funcionalidad:**
  - Al abrir, carga CxC pendientes de socio y bancos activos (usando services existentes)
  - Submit: `POST /api/bank-exchanges` → respuesta con `BankExchangeResponse`
  - Al cerrar dialog con éxito → muestra voucher en mismo dialog (cambia a vista de recibo) y notifica al componente padre para recargar lista
  - Usa `receipt-viewer` compartido para mostrar comprobante

### 11.6 US-22 — Income List (`income-list`)

- **Ruta:** `/incomes` (rol: `CashierOperator`)
- **Layout:**
  - PageHeader con título "Ingresos externos" y acción "Nuevo ingreso" (abre dialog)
  - Barra de filtros: categoría de ingreso (`mat-select`), fecha (`mat-datepicker`), botón "Limpiar"
  - Tabla densa con columnas: Fecha, Depositante, Categoría, Concepto, Monto (tabular-nums, end), Acciones (ver detalle)
  - Paginación en base de tabla
- **Funcionalidad:**
  - Filtros aplican búsqueda en tiempo real (debounce 300ms)
  - Acción "Ver detalle" en cada fila muestra voucher usando `receipt-viewer` compartido
  - Botón "Nuevo ingreso" abre `income-form-dialog`
  - Al crear ingreso exitosamente → recarga lista

### 11.7 US-22 — Income Form (`income-form-dialog`)

- **MatDialog** (sin datos de entrada específicos)
- **Formulario:**
  - Input nombre del depositante
  - Select categoría de ingreso (activos)
  - Input concepto
  - Input monto (number, min=0.01)
  - Validación: todos los campos requeridos, monto > 0
- **Funcionalidad:**
  - Submit: `POST /api/incomes` → respuesta con `IncomeResponse`
  - Al cerrar dialog con éxito → muestra voucher en mismo dialog (cambia a vista de recibo) y notifica al componente padre para recargar lista
  - Usa `receipt-viewer` compartido para mostrar comprobante

### 11.8 Componentes compartidos existentes (no requieren cambios)

- `receipt-viewer`: Ya creado en EPIC 6, reutilizable para mostrar vouchers de canjes e ingresos
- `confirm-dialog`: No necesario para estas operaciones (creación no es destructiva)
- Otros componentes de `shared/` (page-header, filter-bar, etc.) se usan tal cual

### 11.9 Cambios en routes

Reemplazar placeholders en `app.routes.ts` con:
- Lazy-loaded module para `bank-exchanges` con `roleGuard('CashierOperator')`
- Lazy-loaded module para `incomes` con `roleGuard('CashierOperator')`

### 11.10 Notas de implementación

- Ambos listados siguen el patrón de `filter-bar` + `crud-table` genérico (como en otras listas)
- Los formularios usan `MatDialog` con validación reactiva y estado de carga
- Los montos usan `currency.pipe` custom (PEN→`S/`, USD→`US$`) y `tabular-nums` para alineación
- Las fechas usan `matInput [type]="date"` (HTML5 native) como estándar del proyecto
- El rol requerido es `CashierOperator` para ambas features (conforme a documentos epic)
- Se aprovechan servicios existentes de catálogos para cargar selectores (bancos, categorías de ingreso, etc.)
- No se requiere componente de selección especializado (a diferencia de `cxc-selection` para pagos) ya que estas son listas de transacciones completadas, no selección para procesamiento
