# Plan de Implementación: Suite E2E con Playwright

## 1. Contexto y objetivo

Este documento define cómo construir una suite de pruebas end-to-end (E2E) con
[Playwright](https://playwright.dev/) que cubra el 100% de los flujos funcionales del
frontend (`sga-caja-frontend`) descritos en `Documento_Requisitos_Sistema_Gestion.md`
(RF-01–RF-33), ejercitando la aplicación real contra el backend real
(`sga-caja-backend`) y una base de datos real (`sga-caja-db`) — sin mocks de red.

**Requisito no negociable del usuario: cada test debe poder ejecutarse un número
arbitrario de veces, en cualquier orden, sin fallar por colisión de datos ni dejar el
entorno en un estado que rompa la corrida siguiente.** La sección 3.3 es el núcleo de
este plan y de ella se derivan casi todas las decisiones de diseño posteriores.

Este plan **no incluye código de test completo** — es la especificación de arquitectura,
convenciones y el inventario de flujos a cubrir, para implementarse de forma incremental
(ver §6, fases).

## 2. Alcance

Cobertura 1:1 con las 10 épicas del frontend (`docs/epics/epic-0X-*.md`) y las rutas de
`app.routes.ts`:

| Épica | Ruta(s) | RF cubiertos |
|---|---|---|
| 1. Autenticación y sesión | `/login` | RF-01–RF-04 |
| 2. Catálogos | (sin pantalla propia en prod; `dev/catalogs` es demo) | — (soporte de otras épicas) |
| 3. Maestros | `/masters/*` | RF-05–RF-12 |
| 4. Cuentas por cobrar | `/account-receivables`, `/account-receivables/summary` | RF-13–RF-19, RF-20, RF-26 |
| 5. Lecturas de consumo | (diálogo desde CxC) | RF-17 |
| 6. Cobranza / Pagos | `/payments` | RF-19–RF-23, RF-21 |
| 7. Canjes bancarios | `/bank-exchanges` | RF-24, RF-31 |
| 8. Ingresos externos | `/incomes` | RF-25, RF-29 |
| 9. Egresos | `/expenses` | RF-27, RF-28, RF-30 |
| 10. Reportes | `/reports` | RF-32, RF-33 |

Fuera de alcance explícito (ver §8): validación del **contenido** de los XLSX
descargados (RF-32/33) más allá de "el archivo se descargó y no está vacío"; pruebas de
concurrencia real de correlativos (RNF-05, requiere orquestar requests paralelos fuera
del modelo página-por-página de Playwright); accesibilidad exhaustiva (RNF-15, se cubre
parcialmente vía selectores por rol/label, no con un auditor axe dedicado en esta fase).

## 3. Arquitectura de pruebas

### 3.1 Instalación y configuración base

```bash
npm init playwright@latest -- --quiet --lang=ts
```

Estructura de carpetas propuesta (nueva, no toca `src/`):

```
e2e/
  playwright.config.ts
  fixtures/
    auth.fixture.ts          # login + storageState por rol
    api-client.fixture.ts    # cliente HTTP autenticado hacia el backend
  factories/                 # generadores de datos únicos (§3.3)
    ids.ts
    member.factory.ts
    stall.factory.ts
    bank.factory.ts
    business-type.factory.ts
    provider.factory.ts
    service.factory.ts
    account-receivable.factory.ts
  pages/                     # Page Object Model (§3.6)
    login.page.ts
    masters/
      member-list.page.ts
      member-form.page.ts
      ... (uno por pantalla)
    account-receivables/
    payments/
    ...
  tests/
    auth/
      login.spec.ts
    masters/
      business-types.spec.ts
      members.spec.ts
      stalls.spec.ts
      services.spec.ts
      banks.spec.ts
      providers.spec.ts
    account-receivables/
      generate-by-stall.spec.ts
      generate-by-member.spec.ts
      consumption-reading.spec.ts
      list-and-filter.spec.ts
      summary.spec.ts
      exempt.spec.ts
    payments/
      compute-total-and-pay.spec.ts
    bank-exchanges/
      register-and-list.spec.ts
    incomes/
      register-and-list.spec.ts
    expenses/
      register-individual.spec.ts
      bulk-upload.spec.ts
      void-and-process.spec.ts
    reports/
      download-reports.spec.ts
  fixtures-data/
    expense-bulk-upload-valid.xlsx   # generado por script, no versionado a mano (§4.9)
```

`playwright.config.ts` — puntos clave:

```ts
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,          // los tests deben ser independientes entre sí (§3.3)
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'admin',
      use: { storageState: '.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'cashier',
      use: { storageState: '.auth/cashier.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    // opcional: levantar `ng serve` automáticamente si no hay uno corriendo.
    // El backend y la base de datos NO se levantan aquí — ver §3.2.
    { command: 'npm run start', url: 'http://localhost:4200', reuseExistingServer: true },
  ],
});
```

`@playwright/test` se agrega a `devDependencies`; se añade el script
`"e2e": "playwright test"` en `package.json`. No se toca la config de `vitest`
existente (los unit tests siguen corriendo con `ng test`).

### 3.2 Entorno y base de datos

Dos modos soportados, elegidos vía variable de entorno `E2E_DB_MODE`:

**Modo A — Base de datos desechable (recomendado para CI).**
Antes de la corrida completa, un script (`e2e/scripts/reset-db.sh`) recrea la base desde
cero:

```bash
dropdb --if-exists sga_caja_e2e
createdb sga_caja_e2e
psql -d sga_caja_e2e -f ../sga-caja-db/migrations/000_run_all.sql
psql -d sga_caja_e2e -f ../sga-caja-db/seed/dev_seed.sql
psql -d sga_caja_e2e -f ../sga-caja-db/seed/002_maestros_epic3.sql
```

El backend se levanta apuntando a `sga_caja_e2e` (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
como variables de entorno, ver `application-dev.properties`). Con esto la suite completa
arranca siempre desde el mismo estado conocido — sirve tanto para la primera corrida
como para cualquier corrida posterior, porque el reset se hace *antes* de cada corrida
del pipeline, no una sola vez.

**Modo B — Base de datos compartida persistente (desarrollo local, sin reset).**
Se corre contra el Postgres de desarrollo tal cual está. En este modo **toda** la
responsabilidad de "rerunnable" recae en la estrategia de datos únicos + limpieza de
§3.3 — ningún test puede asumir una tabla vacía, un contador en cero, ni la ausencia de
filas de corridas anteriores.

El plan está diseñado para que **cada test individual sea correcto en ambos modos**
(nunca depender de "la tabla está vacía"), de forma que Modo A sea una optimización de
velocidad/limpieza y no un requisito para que las pruebas pasen.

### 3.3 Estrategia de datos e idempotencia (núcleo del plan)

#### 3.3.1 Restricciones únicas relevantes (de `sga-caja-db/migrations`)

| Tabla | Columna(s) únicas | Longitud máx. en formulario | Implicación para el test |
|---|---|---|---|
| `Member` | `Code` | 20 (`maxLength` en el form) | generar código único por corrida |
| `Stall` | `Number` | 20 | generar número único por corrida |
| `Bank` | `AccountNumber` | 40 | generar número de cuenta único por corrida |
| `BusinessType` | `Name` | — | generar nombre único por corrida |
| `Provider` | *(solo `Uuid`)* | — | sin restricción técnica, pero se recomienda nombre único para aserciones limpias |
| `Service` | *(solo `Uuid`)* | — | ídem |
| `Currency`, `IncomeCategory`, `ExpenseReason`, etc. | `Name`/`Code` | — | son catálogos sembrados, **nunca se crean desde un test** |
| `User` | `Username` | — | **nunca se crean desde un test**; se reutilizan `admin`/`cashier` del seed |
| `ConsumptionReading` | `AccountReceivableId` (1:1) | — | cada test de lectura necesita una CxC propia y nueva |
| `BankExchange` | `AccountReceivableId` (1:1) | — | cada test de canje necesita una CxC propia y nueva |
| `PaymentDetail` | (`PaymentId`, `AccountReceivableId`) | — | una CxC pagada no puede volver a pagarse (además el estado `Paid` lo impide a nivel de negocio) |
| `Receipt` | (`ReceiptTypeId`, `CorrelativeNumber`) | — | autogenerado por trigger/secuencia; **nunca asumir un valor esperado**, siempre leerlo del DOM/response tras la operación |

Consecuencia directa: **ningún test puede hardcodear** un código de socio, número de
puesto, número de cuenta bancaria, nombre de giro comercial, ni un correlativo de
recibo. Todo dato con restricción de unicidad se genera en tiempo de ejecución.

#### 3.3.2 Generador de identificadores únicos

```ts
// e2e/factories/ids.ts
export function uniqueSuffix(): string {
  // ms desde epoch (13 dígitos) + 4 caracteres aleatorios → colisión
  // prácticamente imposible incluso con workers en paralelo.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueCode(prefix: string, maxLength: number): string {
  const suffix = uniqueSuffix();
  return `${prefix}${suffix}`.slice(0, maxLength);
}
```

Todas las factories (`member.factory.ts`, `stall.factory.ts`, etc.) usan
`uniqueCode('E2E-', 20)` o equivalente para cada campo con restricción de unicidad, y
prefijan **todos** los nombres visibles (razón social, nombre de servicio, nombre de
banco, etc.) con `E2E-` — no solo los campos técnicamente únicos — para que:

1. Sea trivial identificar y limpiar datos de prueba a simple vista en la base.
2. Las aserciones puedan filtrar/buscar por ese prefijo en vez de asumir "la lista tiene
   N elementos" (ver §3.3.4).

#### 3.3.3 Regla de oro para flujos transaccionales (CxC, pagos, canjes, lecturas)

**Cada test que necesita una cuenta por cobrar en estado `Pending` la genera desde cero
dentro del propio test** (vía API, ver §3.3.5), nunca reutiliza una CxC creada por otro
test ni asume que existe una en la base. Esto es obligatorio porque:

- `Payment` y `BankExchange` son transiciones de un solo sentido (`Pending → Paid` /
  `Pending → Paid`+registro de canje) — una CxC ya pagada no sirve para un segundo test
  de pago.
- `ConsumptionReading` y `BankExchange` tienen relación 1:1 con la CxC — reusar una
  CxC ya "leída" o "canjeada" rompe el test.
- Generar con período (`periodStartDate`/`periodEndDate`) dinámico basado en la fecha de
  ejecución evita cualquier ambigüedad sobre qué corrida generó qué fila al inspeccionar
  la base.

Patrón: el test crea (vía API) un `Service` propio con `E2E-` en el nombre y la moneda
que el escenario necesite, luego genera la CxC (`generate-by-stall` o
`generate-by-member`) apuntando a un `Member`/`Stall` también creado en el mismo test.
Nunca se depende de los maestros sembrados por `002_maestros_epic3.sql` para los flujos
transaccionales — sólo los flujos de "gestión de maestros" (épica 3) los usan como punto
de partida, y aun así crean sus propias filas para no interferir con las de otros tests.

#### 3.3.4 Aserciones que no dependen de conteos globales

Ninguna aserción usa "la tabla tiene N filas" ni "el primer elemento de la lista es X"
salvo en el propio test que acaba de crear ese elemento y lo ubica **filtrando por su
identificador único** (código, nombre con prefijo `E2E-`, o UUID devuelto por la API de
setup). Los filtros de búsqueda que ya expone cada listado (RNF-07) se usan
precisamente para esto: crear con nombre único → buscar por ese nombre → afirmar sobre
el resultado filtrado, no sobre la tabla completa.

#### 3.3.5 Capa de API para setup/teardown

Playwright permite hacer requests HTTP autenticados sin pasar por la UI
(`request` fixture / `APIRequestContext`). Se usa para:

- **Setup rápido de prerrequisitos** que no son el objeto bajo prueba: p. ej. el test de
  "pagar una CxC de puesto" no necesita probar la UI de creación de puestos ni de
  servicios — los crea por API en `test.beforeEach` y navega directo a `/payments`.
- **Teardown determinístico**: al terminar cada test, se desactivan (soft-delete, no
  hay hard-delete para estas entidades) los maestros creados —
  `PATCH /api/members/{uuid}/deactivate` y equivalentes para `stalls`, `services`,
  `banks`, `providers` (endpoints ya existentes, ver commits
  "implementar endpoints de activación... siguiendo el patrón de miembros y puestos").
  Esto evita que listados filtrados por "activos" (p. ej. el KPI "Puestos activos" del
  home) crezcan indefinidamente entre corridas. Las filas transaccionales (CxC, Income,
  Expense, BankExchange, Payment, Receipt) **no se borran ni desactivan** — no tienen
  mecanismo para ello y no es necesario: no tienen restricciones de unicidad que
  choquen con corridas futuras.

```ts
// e2e/fixtures/api-client.fixture.ts (esbozo)
export const test = base.extend<{ apiAdmin: APIRequestContext; apiCashier: APIRequestContext }>({
  apiAdmin: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:8080' });
    const { accessToken } = await login(ctx, 'admin', 'Admin123!');
    await use(withBearer(ctx, accessToken));
    await ctx.dispose();
  },
  // apiCashier: análogo con 'cashier' / 'Cashier123!'
});
```

Cada factory expone `createViaApi(apiContext, overrides?)` y
`deactivateViaApi(apiContext, uuid)`, de forma que un test típico se ve así:

```ts
test('el operador de caja procesa el pago de una CxC de puesto', async ({ page, apiAdmin, apiCashier }) => {
  const stall = await stallFactory.createViaApi(apiAdmin);
  const service = await serviceFactory.createViaApi(apiAdmin, { chargeTargetType: 'Stall', cost: 150, currencyCode: 'PEN' });
  const cxc = await accountReceivableFactory.generateByStallViaApi(apiCashier, { serviceUuid: service.uuid });

  await loginAsCashier(page); // o storageState del proyecto "cashier"
  await page.goto('/payments');
  // ... interacción real por UI con el elemento identificado por stall.number ...

  await stallFactory.deactivateViaApi(apiAdmin, stall.uuid);
  await serviceFactory.deactivateViaApi(apiAdmin, service.uuid);
});
```

Este híbrido (API para preparar el terreno + UI para el flujo bajo prueba) es el patrón
recomendado por el propio equipo de Playwright para E2E de aplicaciones con flujos
largos, y es lo que hace viable cubrir "cada flujo" sin que cada test dependa de
recorrer manualmente 4 pantallas previas.

### 3.4 Autenticación y roles

- Un `*.setup.ts` (proyecto `setup` en la config) hace login una vez por rol
  (`admin`/`Admin123!`, `cashier`/`Cashier123!` — credenciales del seed dev, ver
  `sga-caja-db/seed/dev_seed.sql`) y guarda `storageState` en `.auth/admin.json` /
  `.auth/cashier.json`. El resto de los tests declara su rol requerido con
  `test.use({ storageState: '.auth/cashier.json' })` o corriendo bajo el `project`
  correspondiente — evita repetir el login (que además consume el flujo de
  access/refresh token) en cada test.
- El propio módulo `epic-01-autenticacion-sesion` (RF-01–RF-04) **sí** prueba el login
  real por UI, sin storageState — es el único lugar donde el formulario de login se
  ejercita explícitamente.
- Dato de sesión: `AuthService` guarda el perfil en `sessionStorage` (por pestaña) y el
  access token en `localStorage`. `storageState` de Playwright captura ambos si se
  configura `storageState` con `origins` incluyendo `localStorage` — confirmar que la
  captura post-login espera a que `sessionStorage` tenga el usuario antes de guardar el
  estado (si no, usar el helper de login por API descrito abajo en vez de UI para el
  `setup`).
- Alternativa más rápida para el `setup`: loguear vía API (`POST /auth/login`) e
  inyectar manualmente `localStorage`/`sessionStorage` con
  `page.addInitScript`/`context.addCookies` antes de la primera navegación, evitando
  aún el primer submit de formulario. Se decide en implementación según qué tan
  confiable resulte capturar `storageState` tras un login por UI.

### 3.5 Selectores y Page Object Model

- Angular Material genera DOM profundo y con clases internas inestables — **no usar
  selectores CSS de Material** (`.mat-mdc-*`). Usar exclusivamente:
  - `getByRole` (botones, campos, diálogos — Material ya expone roles ARIA correctos).
  - `getByLabel` (los `mat-form-field` con `mat-label` exponen `aria-label`/`for`
    correctamente).
  - `getByText` para encabezados de columna/mensajes.
  - `data-testid` **añadido puntualmente** en el código de producción donde no haya
    forma limpia de distinguir un elemento por rol/label (p. ej. filas de una tabla que
    repiten la misma estructura, o el botón de acción de una fila específica en
    `crud-table`). Esto implica tocar componentes de `src/app` — se lista como tarea
    explícita en la Fase 1 (§6), no un efecto secundario silencioso.
- Un Page Object por pantalla, con métodos que expresan intención de negocio, no
  mecánica de UI: `memberListPage.createMember(data)`,
  `paymentsListPage.selectPendingCxcAndPay(stallNumber)` — nunca
  `page.click('#submit')` disperso en los specs.

## 4. Inventario de flujos a cubrir

Cada fila es un caso de prueba (o una familia pequeña de casos). "Idempotencia" resume
la estrategia específica de §3.3 aplicada a ese flujo. El detalle de aserciones de
error/validación transversal está en §5.

### 4.1 Autenticación y sesión (RF-01–RF-04)

| # | Flujo | Precondición | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|---|
| 4.1.1 | Login exitoso (admin) | usuario `admin` sembrado | ir a `/login`, completar credenciales, enviar | redirige a `/masters/members`; header muestra nombre | credenciales fijas del seed, sin crear datos |
| 4.1.2 | Login exitoso (cashier) | usuario `cashier` sembrado | ídem con `cashier` | redirige a `/payments` | ídem |
| 4.1.3 | Login con credenciales inválidas | — | credenciales erróneas | mensaje de error, sin redirigir, sin token en storage | sin efectos persistentes |
| 4.1.4 | Acceso sin sesión a ruta protegida | sin login | ir directo a `/masters/members` | redirige a `/login` | sin efectos |
| 4.1.5 | Logout | sesión iniciada | click en logout | redirige a `/login`; token eliminado; reintentar ruta protegida redirige de nuevo | sin efectos |

### 4.2 Maestros (RF-05–RF-12) — rol Administrator

Un bloque por entidad (`business-types`, `members`, `stalls`, `services`, `banks`,
`providers`); cada uno repite el mismo esqueleto:

| # | Flujo | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|
| 4.2.x.1 | Listar | ir al listado | tabla visible con columnas esperadas | sin creación de datos |
| 4.2.x.2 | Crear | abrir formulario, completar con datos únicos (§3.3.2), guardar | fila nueva visible al buscar/filtrar por el nombre único creado | nombre/código único por corrida; teardown desactiva al final |
| 4.2.x.3 | Editar | crear una fila propia, abrirla, modificar un campo, guardar | cambio reflejado al reconsultar esa fila específica | opera sobre una fila creada por el propio test |
| 4.2.x.4 | Validación de campos requeridos (RNF-06) | abrir formulario, enviar vacío | errores inline, sin request de guardado, botón deshabilitado o error de servidor claro | sin efectos |
| 4.2.x.5 | Activar/Desactivar (donde aplique) | crear fila propia, desactivar, verificar que desaparece del filtro "activos" | reaparece si se filtra por "inactivos" | opera sobre fila propia |

Particularidades por entidad:

- **`business-types`**: sin campos adicionales relevantes a moneda/monto.
- **`members`**: `code`, `stage` (select), fecha de nacimiento pasada
  (`pastDateValidator`) — caso de error: fecha futura rechazada.
- **`stalls`**: asociación a `businessType` y opcionalmente a `member` (RF-10) — probar
  ambas combinaciones (con y sin socio asociado) y que el formulario ofrezca ambas
  referencias existentes (usar las creadas por el propio test, no las del seed).
- **`services`**: caso "costo fijo" vs. "por consumo" (RF-15) — el formulario exige
  `cost` XOR `unitCost` según el toggle; probar que seleccionar "por consumo" oculta
  `cost` y viceversa; **moneda obligatoria** (`currencyUuid`, catálogo `currencies` —
  usar los códigos `PEN`/`USD` ya sembrados, un test por cada uno para tener cobertura
  multi-moneda que luego reutilizan los flujos transaccionales de §4.3+).
- **`banks`**: `accountNumber` (único), `cci`, moneda obligatoria.
- **`providers`**: sin unicidad técnica, pero mismo patrón de nombre único para
  aserciones limpias.

### 4.3 Cuentas por cobrar — generación (RF-16–RF-18) — ambos roles

| # | Flujo | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|
| 4.3.1 | Generar CxC por puestos, servicio de costo fijo | crear puesto + servicio (costo fijo, PEN) propios vía API; en UI, abrir "Generar CxC", pestaña "Por puestos", elegir el servicio creado, período dinámico (fecha de hoy), monto opcional, generar | tabla de resultado muestra 1 fila con el puesto creado, columna Moneda = PEN, monto correcto | servicio/puesto propios; período = fecha de ejecución, nunca fijo |
| 4.3.2 | Generar CxC por puestos, servicio por consumo | ídem con servicio `consumptionBased: true` | campo "Monto" no visible en el formulario (RF-15); CxC generada con monto inicial (a completar por lectura, §4.4) | ídem |
| 4.3.3 | Generar CxC por socios, filtrando etapas | crear 2 socios propios con etapas distintas (`stage1`/`stage2`); generar por socios marcando solo una etapa | solo el socio de la etapa marcada aparece en el resultado | socios propios; nunca usar socios del seed compartido |
| 4.3.4 | Generar CxC por socios, "solo socios únicos" | crear 2 socios propios con mismo nombre/apellido | con el toggle activo, solo se genera una CxC; desactivado, se generan ambas | ídem |
| 4.3.5 | Moneda visible junto al campo Monto | seleccionar un servicio en USD | label del campo Monto muestra "(USD)" | servicio propio en USD |
| 4.3.6 | Servicio con moneda distinta a PEN se refleja en el resultado | generar con servicio USD | columna Moneda del resultado = USD, nunca PEN | cubre directamente el hallazgo de la sesión anterior (no forzar PEN) |

### 4.4 Lecturas de consumo (RF-17)

| # | Flujo | Precondición | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|---|
| 4.4.1 | Registrar lectura, consumo positivo | CxC de servicio por consumo propia, sin lectura previa (relación 1:1) | abrir "Lectura" desde la fila de CxC, ingresar inicial/final, registrar | importe calculado = `(final - inicial) * unitCost`; moneda mostrada = la de la CxC (no PEN por defecto) | CxC recién generada por el propio test, nunca reutilizada |
| 4.4.2 | Consumo no positivo (final ≤ inicial) | ídem | ingresar final < inicial | importe calculado = 0 (RN-05) | ídem |
| 4.4.3 | Reintentar lectura sobre CxC ya leída | tras 4.4.1 | reabrir "Lectura" sobre la misma CxC | la vista muestra la lectura ya registrada (modo lectura), no el formulario de captura | válido por diseño (1:1); no es un bug, es el criterio de aceptación |

### 4.5 Consulta y filtros de CxC, resumen, exoneración (RF-19–RF-21, RF-26)

| # | Flujo | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|
| 4.5.1 | Listar y filtrar CxC por servicio/socio/puesto | generar 2 CxC propias con servicios distintos; filtrar por uno | solo la fila esperada aparece; columna Moneda presente en todas las filas | filtra por UUID/nombre único, no por posición |
| 4.5.2 | Exonerar una CxC pendiente | CxC propia pendiente | acción "Exonerar" desde el listado, confirmar | diálogo de confirmación incluye moneda + monto (no solo el monto pelado); estado pasa a "Exonerado" | CxC propia; la transición es de un solo sentido, no reintentar sobre la misma fila |
| 4.5.3 | Resumen de movimientos por socio | CxC propia de un socio propio, luego pagada (ver 4.6) | abrir "Ver resumen" filtrando por ese socio | fila del movimiento con método de liquidación, fecha, correlativo | filtra por socio propio |
| 4.5.4 | Resumen de movimientos por puesto | análogo con puesto | ídem | ídem |
| 4.5.5 | Resumen sin socio ni puesto seleccionado | — | click "Ver resumen" sin filtro activo | mensaje pidiendo seleccionar socio o puesto, no navega | sin efectos |

### 4.6 Cobranza / Pagos (RF-19–RF-23) — rol CashierOperator

| # | Flujo | Precondición | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|---|
| 4.6.1 | Calcular total y pagar CxC de puesto | puesto + servicio + CxC pendiente propios | tab "Por puestos", seleccionar la CxC propia, "Calcular total", confirmar diálogo, "Confirmar y pagar" | preview inline y diálogo muestran moneda correcta (no `S/` fijo); recibo final muestra moneda y correlativo; CxC pasa a Pagado | CxC propia y pendiente; no reutilizable tras este test |
| 4.6.2 | Calcular total y pagar CxC de socio | ídem con socio | ídem | ídem | ídem |
| 4.6.3 | Pagar múltiples CxC en un solo recibo | 2 CxC pendientes propias, mismo puesto/socio | seleccionar ambas, calcular total = suma, pagar | recibo único cubre ambas; ambas CxC pasan a Pagado | 2 CxC propias |
| 4.6.4 | Pagar CxC en moneda distinta a PEN | CxC propia generada desde servicio USD | flujo de pago completo | total, diálogo y recibo muestran USD en todo momento, nunca PEN | cubre directamente el caso reportado en la sesión anterior |
| 4.6.5 | Exonerar en lote desde Cobranza | 2 CxC pendientes propias | seleccionar ambas en la columna "Exonerar", confirmar | ambas pasan a Exonerado; ya no aparecen como pagables | CxC propias |
| 4.6.6 | Selección se preserva entre páginas | ≥ `pageSize` CxC propias pendientes | seleccionar una fila, cambiar de página, volver | la selección original sigue marcada | genera suficientes CxC propias para forzar paginación, no depende de datos preexistentes |

### 4.7 Canjes bancarios (RF-24, RF-31) — rol CashierOperator

| # | Flujo | Precondición | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|---|
| 4.7.1 | Registrar canje bancario | banco propio (moneda X) + CxC de **socio** propia y pendiente (el flujo solo lista CxC con `member != null`) | abrir "Registrar canje", elegir la CxC (el dropdown ya debe mostrar moneda+monto reales, no `S/` fijo), elegir banco, fecha, registrar | recibo muestra moneda correcta; CxC pasa a Pagado | CxC de socio propia; banco propio |
| 4.7.2 | Listar canjes y ver voucher | tras 4.7.1 | filtrar por banco/fecha propios, abrir voucher | columna Moneda en el listado = moneda real del canje (ya no se infiere del banco); voucher coincide | filtra por banco propio |

### 4.8 Ingresos externos (RF-25, RF-29)

| # | Flujo | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|
| 4.8.1 | Registrar ingreso en PEN | completar depositante único, categoría, moneda PEN, concepto, monto; registrar | recibo con moneda PEN; aparece en el listado filtrando por depositante único | depositante con prefijo único |
| 4.8.2 | Registrar ingreso en USD | ídem con moneda USD | recibo y fila de listado muestran USD, columna Moneda visible junto al Monto | ídem |
| 4.8.3 | Listar y filtrar ingresos por fecha | tras 4.8.1/4.8.2 | filtrar por la fecha de hoy | ambos ingresos visibles con su moneda correcta cada uno (no ambos PEN) | filtra por fecha de ejecución, no fecha fija |
| 4.8.4 | Validación de campos requeridos | enviar formulario vacío | errores inline, sin request | sin efectos |

### 4.9 Egresos (RF-27, RF-28, RF-30)

| # | Flujo | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|
| 4.9.1 | Registrar egreso individual en PEN | proveedor propio, documento único, moneda PEN, motivo, monto; registrar | **el submit ya no falla** (bug corregido esta sesión: antes el form no enviaba `currencyUuid`); recibo con moneda PEN | documento único; proveedor propio |
| 4.9.2 | Registrar egreso individual en USD | ídem con moneda USD | recibo y fila del listado muestran USD | ídem |
| 4.9.3 | Carga masiva de egresos, archivo válido | generar en runtime un `.xlsx` con columnas `DocumentNumber, ProviderName, ExpenseDate, Amount, AssociatedDocument, ExpenseReason, Moneda` (ver formato en `ExpenseBulkFileParser.java`), usando `ProviderName`/`ExpenseReason` ya sembrados o creados por el test, y `DocumentNumber` únicos por fila | tabla de resultado con columna `currencyCode` por fila, coincide con lo declarado en el archivo | el `.xlsx` se genera con `exceljs` (o similar) dentro del test/fixture, con números de documento únicos — **nunca un archivo estático versionado con valores fijos**, para poder correr el test N veces sin chocar con `DocumentNumber` de corridas previas si el backend llegara a validarlo como único a futuro; hoy no hay esa restricción pero es la práctica más segura |
| 4.9.4 | Carga masiva, archivo con filas inválidas | archivo con una fila sin motivo de egreso válido | errores reportados por fila, filas válidas sí se procesan | ídem, archivo generado en runtime |
| 4.9.5 | Listar y filtrar egresos por mes | tras 4.9.1 | filtrar por año/mes de hoy | fila visible con su moneda correcta | filtra por fecha de ejecución |
| 4.9.6 | Anular egreso pendiente | egreso propio recién creado, estado Pending | acción "Anular", confirmar | estado pasa a Voided; ya no ofrece "Procesar" | egreso propio |
| 4.9.7 | Procesar egreso pendiente | egreso propio, estado Pending | acción "Procesar" | se emite comprobante; voucher muestra moneda correcta (bug corregido: antes `ReceiptData` no llevaba `currencyCode`) | egreso propio |

### 4.10 Reportes (RF-32, RF-33)

| # | Flujo | Pasos clave | Aserciones | Idempotencia |
|---|---|---|---|---|
| 4.10.1 | Descargar reporte diario | seleccionar fecha de hoy, descargar | evento de descarga dispara, archivo no vacío (`> 0` bytes), nombre/extensión `.xlsx` | fecha dinámica; no se valida contenido (fuera de alcance, §2) |
| 4.10.2 | Descargar reporte mensual | seleccionar año/mes actual, descargar | ídem | mes/año dinámicos |
| 4.10.3 | Descargar reporte total (por fecha) | opción "por fecha" | ídem | fecha dinámica |
| 4.10.4 | Descargar reporte total (por mes) | opción "por mes" | ídem | mes/año dinámicos |
| 4.10.5 | Descargar reportes de socios/no socios/egresos/bancos | uno por tipo | ídem | mes/año dinámicos |

### 4.11 Navegación y layout transversal

| # | Flujo | Pasos clave | Aserciones |
|---|---|---|---|
| 4.11.1 | Guard de rol: cashier no accede a `/masters/members` | login cashier, navegar directo a la URL | redirige o bloquea, no muestra el listado |
| 4.11.2 | Guard de rol: admin no accede a `/payments` | login admin, navegar directo | ídem |
| 4.11.3 | Header muestra identidad del usuario (RF-03) | login cualquiera | nombre/usuario visible en el encabezado |

## 5. Casos de error y validación transversal

Aplicar sistemáticamente a **cada** formulario de creación/edición del inventario
anterior, como variante adicional del mismo spec (no specs separados por pantalla):

- **RNF-06** — campos requeridos vacíos: error inline visible, sin request de red
  disparado (interceptar y afirmar que no hay `POST`/`PUT`).
- **RNF-13** — error del backend (simulable forzando un conflicto real, p. ej. dos
  pestañas creando el mismo código de socio a propósito en un test dedicado) se muestra
  como mensaje claro y **el formulario conserva los datos ingresados** (no se limpia
  silenciosamente).
- **RNF-08** — feedback de éxito/error/carga visible tras cada operación relevante
  (spinner o estado deshabilitado durante el request, snackbar de confirmación al
  terminar) — se afirma como parte de cada spec funcional, no como suite aparte.

## 6. Fases de implementación sugeridas

1. **Fase 0 — Andamiaje**: instalar Playwright, `playwright.config.ts`, script de
   reset de base (Modo A), fixtures de API client, factories base (`ids.ts` +
   `member`/`stall`/`service`/`bank`/`business-type`/`provider`), `auth.fixture.ts`.
   Entregable: un solo spec de humo (`login.spec.ts`, §4.1) corriendo en verde,
   repetido 3 veces seguidas sin fallar.
2. **Fase 1 — Maestros** (§4.2): agregar los `data-testid` puntuales que falten en
   `crud-table` y los diálogos de formulario; Page Objects + specs de las 6 entidades.
3. **Fase 2 — CxC y lecturas** (§4.3–4.5): factory de `account-receivable` (vía API,
   `generate-by-stall`/`generate-by-member`), specs de generación, lectura, listado,
   resumen, exoneración.
4. **Fase 3 — Transaccional core** (§4.6–4.8): pagos, canjes, ingresos — son los flujos
   de mayor prioridad de negocio (RF con prioridad "Alta") y los que motivaron la
   auditoría de moneda de esta sesión; cubrir explícitamente los casos multi-moneda
   (4.6.4, 4.7.1, 4.8.2) como regresión permanente de esos bugs.
5. **Fase 4 — Egresos** (§4.9): incluye el generador de `.xlsx` en runtime para la carga
   masiva — es la pieza más laboriosa de infraestructura de esta fase.
6. **Fase 5 — Reportes y transversales** (§4.10–4.11, §5): cierre de cobertura.
7. **Fase 6 — CI**: integrar en pipeline (ver §7), con Modo A de base de datos.

Cada fase termina con **la suite completa hasta ese punto corrida 3 veces seguidas en
modo `fullyParallel` sin resets manuales entre corridas**, como criterio de aceptación
de "rerunnable" antes de avanzar a la siguiente fase.

## 7. Integración continua

- Job dedicado (`e2e`) separado del job de `ng test` (unit) existente.
- Levanta Postgres (contenedor efímero) → corre migraciones + seed (Modo A, §3.2) →
  levanta backend (`mvn spring-boot:run` o el jar empaquetado) → levanta frontend
  (`ng serve` o `ng build` + servidor estático) → corre `npx playwright test`.
- Publica el reporte HTML de Playwright y trazas/video de fallos como artefacto.
- Ejecuta en cada PR contra `main`; opcionalmente un cron nocturno contra un ambiente
  persistente (Modo B) para detectar deriva de datos de prueba acumulados.

## 8. Riesgos y fuera de alcance

- **Contenido de los XLSX de reportes** (RF-32/33): no se abre/parsea el archivo
  descargado para validar sus datos en esta fase — requeriría una librería de lectura
  de XLSX en el lado del test y no está entre las prioridades "Alta" del documento de
  requisitos. Queda como extensión futura.
- **RNF-05 (correlativos únicos ante concurrencia real)**: Playwright puede simular
  clicks simultáneos desde dos `BrowserContext`, pero una prueba concluyente de la
  garantía transaccional de Postgres (`BEFORE INSERT` trigger) es responsabilidad del
  backend (`PaymentConcurrencyIntegrationTest.java` ya existe ahí) — se referencia, no
  se duplica.
- **RNF-09 (rendimiento, 3s bajo carga normal)**: fuera de alcance de una suite
  funcional; requiere herramientas de carga dedicadas.
- **RNF-10 (compatibilidad multi-navegador)**: el plan usa `projects` de Playwright, que
  soporta Chromium/Firefox/WebKit nativamente — se recomienda **activar los tres** en
  CI una vez la suite esté estable en Chromium, no desde la Fase 0.
- **Crecimiento de datos en Modo B**: con corridas frecuentes contra una base
  persistente, las tablas de maestros acumulan filas `E2E-*` inactivas indefinidamente
  (no hay hard-delete). Mitigación: un script de limpieza periódico opcional
  (`DELETE FROM "Member" WHERE "Code" LIKE 'E2E-%' AND ...`) fuera del propio pipeline
  de tests, a criterio del equipo — no se automatiza dentro de la suite para no
  arriesgar borrar datos reales por un filtro mal escrito.

## 9. Checklist de "hecho" para este plan

- [ ] `playwright.config.ts` + estructura de carpetas de §3.1 creada.
- [ ] Script de reset de base (Modo A) probado localmente.
- [ ] Factories con generación de identificadores únicos (§3.3.2) para las 6 entidades
      de maestros + CxC.
- [ ] Fixture de login por API y por UI, `storageState` por rol.
- [ ] `data-testid` agregados donde el rol/label no alcanza (documentar la lista exacta
      al implementar la Fase 1).
- [ ] Los 5 bloques de maestros (§4.2) en verde, corridos 3 veces seguidas en paralelo.
- [ ] CxC + lecturas (§4.3–4.5) en verde, incluyendo los 2 casos multi-moneda.
- [ ] Pagos + canjes + ingresos (§4.6–4.8) en verde, incluyendo los 3 casos multi-moneda
      que regresionan los bugs corregidos en esta sesión.
- [ ] Egresos + carga masiva (§4.9) en verde, con generador de `.xlsx` en runtime.
- [ ] Reportes (§4.10) en verde.
- [ ] Suite completa integrada en CI (Modo A), reporte HTML publicado como artefacto.
