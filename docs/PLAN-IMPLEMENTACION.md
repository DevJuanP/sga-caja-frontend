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
| 3 | EPIC 3 | US-10 … US-15 | Maestros: giros → socios → puestos → bancos → proveedores → servicios |
| 4 | EPIC 4 | US-16, US-17, US-18 | Cuentas por cobrar: listado, generar, exonerar, summary |
| 5 | EPIC 5 | US-19 | Lecturas de consumo |
| 6 | EPIC 6 | US-20 | Cobranza (pestañas por puesto/socio): consulta RF-19, selección de CxC, exonerar, compute-total, recibo/voucher |
| 7 | EPIC 7, 8 | US-21, US-22 | Canjes bancarios e ingresos externos |
| 8 | EPIC 9 | US-23, US-24, US-25 | Egresos: registro, bulk-upload XLSX, anular/procesar |
| 9 | EPIC 10 | US-26 | Reportes XLSX (descarga blob) |

> El orden respeta las dependencias funcionales: catálogos → maestros → CxC → pagos →
> canjes/ingresos → egresos → reportes.

## 6. Pruebas y criterio de terminado

- `ng build` sin errores.
- `ng test` (Vitest) verde: **una spec por componente** y specs para servicios clave.
- Cada US queda **usable** contra la API (vertical slice completo) antes de marcar `[x]`.
- Vistas alineadas a `DESIGN-GUIDELINES.md` (tokens, chips de estado, montos tabular-nums).

## 7. Referencias

- [`API.md`](API.md) — especificación definitiva del backend.
- [`HISTORIAS-USUARIO.md`](HISTORIAS-USUARIO.md) — historias y estado de cobertura.
- [`DESIGN-GUIDELINES.md`](DESIGN-GUIDELINES.md) — lineamientos de diseño (Material 3 "Mercado").
- `docs/epics/` — contratos detallados por epic.
