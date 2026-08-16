# Mapeo del modelo de datos → Requisitos del sistema

**Sistema de Gestión Administrativa y de Caja**

Documento que relaciona, tabla por tabla, el esquema definido en `migrations/`
con los requisitos de `docs/Documento_Requisitos_Sistema_Gestion.md` y con lo
que el usuario final verá en la aplicación, apoyándose en los contratos de la API
descritos en `docs/API.md`.

| Dato | Valor |
|---|---|
| Alcance | Migraciones `001_role.sql` … `028_refresh_token.sql` |
| Requisitos fuente | `docs/Documento_Requisitos_Sistema_Gestion.md` (RF, RN, RNF) |
| Contratos de servicio | `docs/API.md` |
| Fuera de alcance | `seed/dev_seed.sql` (no analizado) |

---

## 1. Cómo leer este documento

Para cada tabla se describe:

1. **Qué representa** en el dominio del negocio.
2. **Qué requisitos ayuda a cumplir** (IDs de `RF-XX`, `RN-XX`, `RNF-XX`).
3. **Cómo se refleja en la aplicación final** (pantallas, listados, formularios, vouchers, reportes).
4. **Un ejemplo concreto** de su uso.
5. **Si lleva o no valores sembrados en su propia migración** (los `INSERT` contenidos en el archivo SQL de la migración, no el seed).

---

## 2. Resumen: ¿qué tablas tienen datos en su migración y cuáles quedan vacías?

De las 28 migraciones, **9 tablas** traen sus propios datos sembrados (valores fijos que la API expone como catálogos de solo lectura o de configuración) y **19 tablas** quedan vacías tras aplicar las migraciones (se llenan por CRUD de la API o dependerán del seed que se construya aparte).

### 2.1 Tablas con valores sembrados en su migración

| Migración | Tabla | Valores insertados |
|---|---|---|
| `001_role.sql` | `Role` | `Administrator`, `CashierOperator` |
| `003_currency.sql` | `Currency` | `PEN` (Peruvian Sol), `USD` (US Dollar) |
| `004_stage.sql` | `Stage` | `Stage 1`, `Stage 2`, `Stage 3` |
| `006_recurrence_type.sql` | `RecurrenceType` | `Monthly`, `Yearly`, `OneTime` |
| `007_receipt_type.sql` | `ReceiptType` | `Income`, `Expense`, `BankTransaction` (+ 3 secuencias de correlativo y trigger) |
| `010_charge_target_type.sql` | `ChargeTargetType` | `Member`, `Stall` |
| `011_account_receivable_status.sql` | `AccountReceivableStatus` | `Pending`, `Paid`, `Exempt` |
| `012_expense_status.sql` | `ExpenseStatus` | `Pending`, `Voided`, `Processed` |
| `013_expense_bulk_upload_status.sql` | `ExpenseBulkUploadStatus` | `Received`, `Processed`, `Failed` |

### 2.2 Tablas vacías tras las migraciones (sin datos sembrados)

| Migración | Tabla | Cómo se llena |
|---|---|---|
| `002_user.sql` | `User` | Seed (no hay `POST /api/users` en `API.md`) |
| `005_business_type.sql` | `BusinessType` | CRUD `POST/PUT/DELETE /api/business-types` |
| `008_income_category.sql` | `IncomeCategory` | **Catálogo de solo lectura en la API** → depende del seed |
| `009_expense_reason.sql` | `ExpenseReason` | **Catálogo de solo lectura en la API** → depende del seed |
| `014_bank.sql` | `Bank` | CRUD `POST/PUT/PATCH /api/banks` |
| `015_member.sql` | `Member` | CRUD `POST/PUT/PATCH /api/members` |
| `016_stall.sql` | `Stall` | CRUD `POST/PUT/PATCH /api/stalls` |
| `017_provider.sql` | `Provider` | CRUD `POST/PUT/PATCH /api/providers` |
| `018_service.sql` | `Service` | CRUD `POST/PUT/PATCH /api/services` |
| `019_account_receivable.sql` | `AccountReceivable` | Generación `POST /api/account-receivables/generate-by-*` |
| `020_consumption_reading.sql` | `ConsumptionReading` | `POST /api/consumption-readings` |
| `021_receipt.sql` | `Receipt` | Automático al pagar, registrar ingreso, procesar egreso o canjear |
| `022_payment.sql` | `Payment` | `POST /api/payments` |
| `023_payment_detail.sql` | `PaymentDetail` | Automático junto con el pago |
| `024_income.sql` | `Income` | `POST /api/incomes` |
| `025_bank_exchange.sql` | `BankExchange` | `POST /api/bank-exchanges` |
| `026_expense_bulk_upload.sql` | `ExpenseBulkUpload` | `POST /api/expenses/bulk-upload` |
| `027_expense.sql` | `Expense` | `POST /api/expenses` y carga masiva |
| `028_refresh_token.sql` | `RefreshToken` | En tiempo de ejecución por el flujo de sesión |

> **Nota importante:** `API.md` (sección 15) declara a `IncomeCategory` y `ExpenseReason`
> como "catálogos sembrados por migración (lectura únicamente)", pero sus migraciones
> (`008` y `009`) **no contienen `INSERT`**. Por tanto, esos valores deberán llegar del
> seed (`dev_seed.sql`), que se construye aparte. Sin esos registros, el formulario de
> ingreso externo (RF-25) y el de egreso (RF-27) no tendrían valores que mostrar en sus
> desplegables.

---

## 3. Análisis tabla por tabla

---

### `Role` — `001_role.sql`

- **Qué representa:** los roles del sistema; definen los permisos que la API valida.
- **Requisitos:** RF-01, RF-02, RF-03, RF-04 (acceso y sesión); RNF-01, RNF-02 (seguridad: token Bearer y validación de permisos en el backend); RNF-03.
- **Reflejo en la app:** el menú y las acciones visibles dependen del rol. `Administrator` gestiona catálogos (socios, puestos, giros, servicios, bancos, proveedores); `CashierOperator` opera caja (cobranza, pagos, ingresos, egresos, canjes). El backend devuelve `403 Forbidden` si un rol no tiene permiso para un endpoint.
- **Ejemplo:** un `CashierOperator` no ve el botón "Nuevo socio"; si intenta `POST /api/members` de forma directa, la API responde `403`.
- **Datos en la migración:** **Sí** — `Administrator`, `CashierOperator`.

---

### `User` — `002_user.sql`

- **Qué representa:** los usuarios que inician sesión (operador de caja, administrador).
- **Requisitos:** RF-01 (inicio de sesión con usuario/contraseña), RF-03 (identidad en el encabezado), RF-04 (cierre de sesión); RNF-01, RNF-03.
- **Reflejo en la app:** pantalla de login (`POST /api/auth/login`); el encabezado muestra `FirstName`/`LastName` del token (`GET /api/auth/me`); el `RoleId` decide qué módulos se ven. La contraseña se guarda solo como hash (`PasswordHash`).
- **Ejemplo:** el usuario `admin` inicia sesión y ve los módulos de administración; un operador solo ve caja y cobranza.
- **Datos en la migración:** **No** — la tabla se crea vacía. La API no expone un `POST /api/users`, por lo que los usuarios de prueba provendrán del seed.

---

### `Currency` — `003_currency.sql`

- **Qué representa:** monedas (soles y dólares) usadas por servicios, bancos y comprobantes.
- **Requisitos:** RF-12 (administrar bancos con su moneda), RF-14 (configurar moneda del servicio).
- **Reflejo en la app:** desplegable de moneda en los formularios de banco y de servicio; se muestra el código (PEN/USD) en listados, recibos y reportes. La API lo expone como catálogo de solo lectura (`GET /api/currencies`).
- **Ejemplo:** al crear el servicio "Cuota de mantenimiento" el administrador elige `PEN`.
- **Datos en la migración:** **Sí** — `PEN` (Peruvian Sol), `USD` (US Dollar).

---

### `Stage` — `004_stage.sql`

- **Qué representa:** la etapa del socio (clasificación), clave para filtrar la generación de cuentas por cobrar.
- **Requisitos:** RF-06 (etapa del socio al crear/editar), RF-18 y RN-06 (generar cuentas por cobrar de socios filtrando por etapas 1, 2, 3 y "socios únicos").
- **Reflejo en la app:** desplegable "Etapa" en el formulario de socio; en la pantalla de generación de cargos por socio, checkboxes de etapas y el filtro de duplicados (`uniqueMembers`). La API lo expone como catálogo de solo lectura (`GET /api/stages`).
- **Ejemplo:** generar cuotas solo para socios de etapa 1 y 2, sin repetir por nombre y apellido (`stageCodes: [1, 2]`, `uniqueMembers: true`).
- **Datos en la migración:** **Sí** — `Stage 1`, `Stage 2`, `Stage 3`.

---

### `BusinessType` — `005_business_type.sql`

- **Qué representa:** el giro comercial de un puesto (Restaurante, Bodega, etc.).
- **Requisitos:** RF-08 (listar, crear, editar y eliminar giros), RF-10 / RN-01 (cada puesto se asocia a un giro).
- **Reflejo en la app:** listado de giros comerciales con opciones de crear/editar/eliminar; desplegable "Giro" en el formulario de puesto. La API permite alta, edición y eliminación física (`POST`, `PUT`, `DELETE /api/business-types`).
- **Ejemplo:** el administrador crea el giro "Restaurante" y luego lo asigna al puesto A-01.
- **Datos en la migración:** **No** — la tabla se crea vacía; el administrador los da de alta desde la app.

---

### `RecurrenceType` — `006_recurrence_type.sql`

- **Qué representa:** la periodicidad de facturación de un servicio (mensual, anual o única vez).
- **Requisitos:** RF-14 (configurar la recurrencia del servicio).
- **Reflejo en la app:** desplegable "Recurrencia" en el formulario de servicio. La API lo expone como catálogo de solo lectura (`GET /api/recurrence-types`).
- **Ejemplo:** el servicio "Cuota de mantenimiento" con recurrencia `Monthly` se cobra cada período mensual.
- **Datos en la migración:** **Sí** — `Monthly`, `Yearly`, `OneTime`.

---

### `ReceiptType` — `007_receipt_type.sql`

- **Qué representa:** los tipos de comprobante correlativo (ingreso, egreso y movimiento bancario). Es la columna vertebral de los recibos.
- **Requisitos:** RF-23, RF-25, RF-27, RF-29, RF-30, RF-31 (emisión y listado de recibos/comprobantes); RN-04 y RNF-05 (correlativos únicos aun con operaciones simultáneas).
- **Reflejo en la app:** cada recibo que el usuario visualiza o imprime muestra su tipo y su número correlativo. El correlativo no se calcula en la aplicación: lo asigna la base de datos de forma atómica vía la secuencia de cada tipo (trigger `trg_receipt_assign_correlative`).
- **Ejemplo:** al confirmar un pago se emite un recibo de tipo `Income`; el siguiente pago del día obtiene el correlativo siguiente, sin riesgo de duplicado.
- **Datos en la migración:** **Sí** — `Income`, `Expense`, `BankTransaction`, más las secuencias `seq_receipt_income_correlative`, `seq_receipt_expense_correlative`, `seq_receipt_bank_correlative`.

---

### `IncomeCategory` — `008_income_category.sql`

- **Qué representa:** la clasificación de un ingreso externo (ej. donación, alquiler, otros).
- **Requisitos:** RF-25 (registrar ingresos externos con su categoría).
- **Reflejo en la app:** desplegable "Categoría" en el formulario de ingreso externo y filtro en la lista de ingresos (`GET /api/incomes?incomeCategoryUuid=...`).
- **Ejemplo:** al registrar una donación de S/ 100.00, el operador elige la categoría "Donación".
- **Datos en la migración:** **No** — se crea vacía. Aunque `API.md` la lista como catálogo de solo lectura, los valores deben venir del seed; sin ellos el formulario de ingreso no tendría opciones.

---

### `ExpenseReason` — `009_expense_reason.sql`

- **Qué representa:** el motivo/categoría registrado en un egreso (servicios, compras, reparaciones, etc.).
- **Requisitos:** RF-27 (registrar egresos indicando el motivo).
- **Reflejo en la app:** desplegable "Motivo" en el formulario de egreso individual y columna de motivo en la lista de comprobantes.
- **Ejemplo:** al registrar el egreso F001-000123, el operador selecciona el motivo "Servicios".
- **Datos en la migración:** **No** — se crea vacía. Mismo caso que `IncomeCategory`: la API lo expone de solo lectura (`GET /api/expense-reasons`), por lo que los valores dependerán del seed.

---

### `ChargeTargetType` — `010_charge_target_type.sql`

- **Qué representa:** el destino de cobro de un servicio: a un socio (`Member`) o a un puesto (`Stall`).
- **Requisitos:** RF-14 y RN-02 (el formulario de servicio contiene "Cargo a"); condiciona la generación de cuentas (RF-16 vs RF-18).
- **Reflejo en la app:** campo "Cargo a" en el formulario de servicio; según el valor, la pantalla de generación de cargos usa "por puesto" (`generate-by-stall`) o "por socio" (`generate-by-member`). La API lo expone como catálogo de solo lectura (`GET /api/charge-target-types`).
- **Ejemplo:** el servicio "Cuota de mantenimiento" se carga a `Stall`; el servicio "Cuota de socio" se carga a `Member`.
- **Datos en la migración:** **Sí** — `Member`, `Stall`.

---

### `AccountReceivableStatus` — `011_account_receivable_status.sql`

- **Qué representa:** el estado del ciclo de vida de una cuenta por cobrar: pendiente, pagada o exonerada.
- **Requisitos:** RF-21, RF-22, RF-23 (marcar cuentas abonadas/exoneradas y procesar pago), RF-24 (canje), RN-03; RNF-04 (consistencia entre cuentas, recibos y caja).
- **Reflejo en la app:** el estado aparece como etiqueta (badge) en las listas de cuentas por cobrar; las cuentas exoneradas (`Exempt`) dejan de sumar al total; al pagar pasan a `Paid`.
- **Ejemplo:** una cuenta `Pending` se marca `Exempt` desde la pantalla de ingresos (PATCH `/exempt`); si el operador la incluye en un pago, pasa a `Paid`.
- **Datos en la migración:** **Sí** — `Pending`, `Paid`, `Exempt`.

---

### `ExpenseStatus` — `012_expense_status.sql`

- **Qué representa:** el estado de un comprobante de egreso: pendiente, anulado o procesado.
- **Requisitos:** RF-30 (listar comprobantes por mes y poder visualizar, anular o procesar); RNF-14 (auditoría de anulaciones).
- **Reflejo en la app:** lista de egresos por mes con acciones habilitadas según el estado: "Anular" y "Procesar" solo si está `Pending`; al procesar se emite el comprobante de egreso (se asocia el recibo).
- **Ejemplo:** egreso F001-000123 en `Pending`; el operador lo procesa → `Processed` y queda asociado a su comprobante; un egreso `Processed` ya no se puede anular (la API responde `409`).
- **Datos en la migración:** **Sí** — `Pending`, `Voided`, `Processed`.

---

### `ExpenseBulkUploadStatus` — `013_expense_bulk_upload_status.sql`

- **Qué representa:** el estado de procesamiento de un lote de egresos cargado por archivo.
- **Requisitos:** RF-28 (registrar egresos masivos mediante carga de archivo).
- **Reflejo en la app:** al subir un XLSX de egresos se registra el lote y su estado; los egresos del lote lo referencian. (La API lo usa internamente; no figura en la sección 15 de catálogos de solo lectura de `API.md`.)
- **Ejemplo:** el archivo `egresos_agosto.xlsx` se recibe (`Received`), se procesa (`Processed`), o si el archivo es ilegible la carga falla (`Failed`, error `EXPENSE_FILE_READ_ERROR`).
- **Datos en la migración:** **Sí** — `Received`, `Processed`, `Failed`.

---

### `Bank` — `014_bank.sql`

- **Qué representa:** una cuenta bancaria disponible para registrar o canjear operaciones.
- **Requisitos:** RF-12 (listar, crear, editar y eliminar bancos con nombre, cuenta, CCI y moneda), RF-24 (canje indicando banco), RF-31 (recibos bancarios), RF-33 (reporte de bancos).
- **Reflejo en la app:** CRUD de bancos en el módulo de administración; desplegable "Banco" en la pantalla de canje; origen de datos del reporte de bancos. El `IsActive` permite desactivar sin borrar (soft delete, `PATCH /api/banks/{uuid}/deactivate`).
- **Ejemplo:** el administrador registra BCP con cuenta `191-1234567-0-00`, CCI y moneda `PEN`.
- **Datos en la migración:** **No** — se crea vacía; la llena el administrador desde la app (o el seed).

---

### `Member` — `015_member.sql`

- **Qué representa:** el socio: persona asociada con código, nombres, apellidos, acción, etapa y fecha de nacimiento.
- **Requisitos:** RF-05, RF-06, RF-07 (CRUD de socios), RF-16 / RF-18 (generar cuentas por socio), RF-19 y RF-26 (consulta y resumen por socio), RN-06 (filtro de socios únicos por nombre y apellido).
- **Reflejo en la app:** listado paginado de socios con búsqueda por código/nombre/apellido y filtro de activos; formulario con código, nombres, apellidos, "Acción" (`ShareNumber`), etapa y fecha de nacimiento; eliminación lógica (desactivar). El índice `idx_member_last_name_first_name` agiliza la búsqueda y el filtro de duplicados.
- **Ejemplo:** crear el socio S001 "Juan Pérez", etapa `Stage 1`; aparece en la tabla y puede ser seleccionado al generar cargos por socio o al cobrar.
- **Datos en la migración:** **No** — se crea vacía.

---

### `Stall` — `016_stall.sql`

- **Qué representa:** el puesto: unidad o local asociado a un giro y, opcionalmente, a un socio, con inquilino y vigencia.
- **Requisitos:** RF-09, RF-10, RF-11 (CRUD de puestos; asociar giro y socio; registrar número, inquilino y vigencia), RN-01; RF-16 (generar cuentas por puesto), RF-19 / RF-26 (consulta y resumen por puesto).
- **Reflejo en la app:** listado de puestos; formulario con número, giro (obligatorio), socio (opcional), datos de inquilino y fechas de vigencia. El `CHECK ck_stall_validity_period` garantiza que la fecha fin no sea anterior a la inicio; el número es único.
- **Ejemplo:** el puesto A-01 se asigna al giro "Restaurante" y al socio Juan Pérez, con vigencia 2026; al generar "Cuota de mantenimiento" por puesto se crea una cuenta para A-01.
- **Datos en la migración:** **No** — se crea vacía.

---

### `Provider` — `017_provider.sql`

- **Qué representa:** el proveedor o vendedor asociado a un egreso.
- **Requisitos:** RF-27 (registrar egresos indicando proveedor), RF-33 (reporte de egresos).
- **Reflejo en la app:** CRUD de proveedores (nombre y documento) en el módulo de administración; desplegable "Proveedor" en el formulario de egreso y en la carga masiva.
- **Ejemplo:** crear el proveedor "Proveedor X" (documento `20123456789`) y asociarlo al egreso F001-000123.
- **Datos en la migración:** **No** — se crea vacía.

---

### `Service` — `018_service.sql`

- **Qué representa:** el servicio cobrable: concepto con recurrencia, costo o costo unitario, moneda y destino del cargo.
- **Requisitos:** RF-13, RF-14, RF-15 (CRUD de servicios; configurar recurrencia, costo, moneda y destino; indicar si es costo fijo o por consumo).
- **Reflejo en la app:** formulario de servicio con nombre, recurrencia, "Cargo a", moneda y el indicador de consumo; si es fijo se pide `Cost` y si es por consumo se pide `UnitCost`. El `CHECK ck_service_cost_by_type` impone esta regla a nivel de base: un servicio fijo no puede tener costo unitario y viceversa.
- **Ejemplo:** el servicio "Luz" se configura como por consumo (`consumptionBased: true`) con costo unitario S/ 0.50; su monto se calculará con lecturas. El servicio "Cuota de mantenimiento" es fijo con costo S/ 50.00.
- **Datos en la migración:** **No** — se crea vacía.

---

### `AccountReceivable` — `019_account_receivable.sql`

- **Qué representa:** la cuenta por cobrar: cargo de un servicio a exactamente un socio o a exactamente un puesto, con período y monto.
- **Requisitos:** RF-16, RF-17, RF-18 (generación por puesto y por socio), RF-19, RF-20 (consulta y separación de cuentas de socios), RF-21, RF-22, RF-23 (marcas, total y pago), RF-24 (canje), RF-26 (resumen), RN-01, RN-02, RN-03.
- **Reflejo en la app:** es el corazón de la pantalla de cobranza: el operador busca por socio o puesto, ve sus cuentas con estado y período, marca cuentas, calcula el total y confirma el pago. El `CHECK ck_account_receivable_target` garantiza que cada cuenta se asocie a un socio **o** a un puesto, nunca a ambos ni a ninguno.
- **Ejemplo:** se genera "Cuota de mantenimiento" de agosto → una fila `Pending` de S/ 50.00 por cada puesto activo (A-01, A-02…).
- **Datos en la migración:** **No** — se crea vacía; se llena mediante `POST /api/account-receivables/generate-by-stall` o `generate-by-member`.

---

### `ConsumptionReading` — `020_consumption_reading.sql`

- **Qué representa:** las lecturas inicial y final de un servicio por consumo, junto con el monto calculado.
- **Requisitos:** RF-17 y RN-05 (el importe es la diferencia positiva de lecturas por el costo unitario; si no hay consumo positivo, es cero).
- **Reflejo en la app:** al registrar la cuenta de un servicio por consumo se ingresan lecturas inicial/final; el monto se calcula automáticamente. La columna `CalculatedAmount` es **generada por la base** (`GREATEST(FinalReading - InitialReading, 0) * UnitCost`), por lo que el cálculo es consistente para todos los flujos.
- **Ejemplo:** lectura inicial 100, final 150, costo unitario 0.50 → monto = (150 − 100) × 0.50 = S/ 25.00; si la final fuera menor, el monto sería 0.
- **Datos en la migración:** **No** — se crea vacía; se registra con `POST /api/consumption-readings`. Un solo registro por cuenta (`UNIQUE` sobre `AccountReceivableId`).

---

### `Receipt` — `021_receipt.sql`

- **Qué representa:** el comprobante correlativo de un ingreso, egreso o movimiento bancario (el "voucher" que ve el usuario).
- **Requisitos:** RF-23 (emitir recibos al pagar), RF-25 (recibo de ingreso), RF-27 / RF-30 (comprobante de egreso), RF-24 / RF-31 (recibo bancario), RF-29 (visualizar voucher), RN-04 y RNF-05 (correlativo único), RNF-04 (consistencia).
- **Reflejo en la app:** cada operación que "emite recibo" inserta aquí una fila con tipo, correlativo, fecha, monto y el usuario que lo emitió. El correlativo lo asigna la base de forma atómica (trigger + secuencia), garantizando unicidad ante operaciones simultáneas. Aparece embebido en las respuestas de pagos, ingresos, egresos y canjes.
- **Ejemplo:** al confirmar un pago se genera un recibo tipo `Income` con correlativo `0001`; el siguiente pago obtiene `0002` automáticamente.
- **Datos en la migración:** **No** — la tabla se crea vacía (solo se definen la función `fn_receipt_assign_correlative()` y el trigger).

---

### `Payment` — `022_payment.sql`

- **Qué representa:** una operación de pago confirmada, ligada al recibo que emitió.
- **Requisitos:** RF-21, RF-22, RF-23 (marcar cuentas, calcular total, procesar pago y emitir recibo), CU-01; RNF-04 (consistencia entre cuentas pagadas y recibo), RNF-14 (auditoría: quién y cuándo).
- **Reflejo en la app:** al confirmar el pago se registra el movimiento con su fecha, total y el recibo asociado; el detalle queda en `PaymentDetail`.
- **Ejemplo:** el operador marca dos cuentas por S/ 50.00 cada una; al confirmar se crea un `Payment` de S/ 100.00 ligado al recibo `Income 0001`.
- **Datos en la migración:** **No** — se crea vacía.

---

### `PaymentDetail` — `023_payment_detail.sql`

- **Qué representa:** la relación de cuentas por cobrar incluidas en cada pago, con el monto aplicado a cada una.
- **Requisitos:** RF-22 (el total equivale a la suma de cuentas), RF-23 (actualización de cuentas al pagar), RNF-14 (auditoría de qué cuentas se pagaron).
- **Reflejo en la app:** en el detalle del pago el usuario ve la lista de cuentas pagadas y sus montos (campo `details` en `PaymentResponse`).
- **Ejemplo:** el pago de S/ 100.00 tiene dos detalles: cuenta A-01 por S/ 50.00 y cuenta A-02 por S/ 50.00. El `UNIQUE (PaymentId, AccountReceivableId)` evita que una misma cuenta se pague dos veces en el mismo pago.
- **Datos en la migración:** **No** — se crea vacía.

---

### `Income` — `024_income.sql`

- **Qué representa:** un ingreso externo con depositante, categoría, concepto y monto.
- **Requisitos:** RF-25 (registrar ingresos externos y emitir su recibo), RF-29 (listar recibos de ingreso por fecha), RNF-14 (auditoría del usuario que registró).
- **Reflejo en la app:** formulario de ingreso externo; el movimiento queda en la lista de recibos de ingreso y alimenta los reportes de movimientos diarios/mensuales.
- **Ejemplo:** el operador registra una donación de S/ 100.00 de "Juan Pérez" con concepto "Donación" → se crea el recibo de ingreso correspondiente.
- **Datos en la migración:** **No** — se crea vacía.

---

### `BankExchange` — `025_bank_exchange.sql`

- **Qué representa:** el canje de una cuenta de socio por una operación bancaria (depósito).
- **Requisitos:** RF-24 (canjear cuenta indicando banco y fecha de depósito), RF-31 (recibos bancarios), RNF-14 (auditoría).
- **Reflejo en la app:** pantalla de canje donde se elige la cuenta del socio, el banco y la fecha de depósito; al confirmar se emite el recibo bancario y la cuenta queda liquidada. El `UNIQUE` sobre `AccountReceivableId` impide canjear dos veces la misma cuenta.
- **Ejemplo:** la cuenta de S/ 30.00 del socio S001 se canjea en el BCP con depósito del 12/08/2026.
- **Datos en la migración:** **No** — se crea vacía.

---

### `ExpenseBulkUpload` — `026_expense_bulk_upload.sql`

- **Qué representa:** el lote de un archivo cargado para registro masivo de egresos.
- **Requisitos:** RF-28 (carga de archivo), RNF-14 (auditoría del usuario que cargó).
- **Reflejo en la app:** el nombre del archivo y el estado del lote se pueden mostrar junto a los egresos cargados (campo `bulkUpload` en `ExpenseResponse`).
- **Ejemplo:** al subir `egresos_agosto.xlsx` se crea un lote con ese nombre; los egresos generados lo referencian.
- **Datos en la migración:** **No** — se crea vacía.

---

### `Expense` — `027_expense.sql`

- **Qué representa:** el egreso: comprobante individual o de lote con documento, proveedor, fecha, importes, documento asociado y motivo.
- **Requisitos:** RF-27 (registro individual), RF-28 (masivo), RF-30 (listar por mes, visualizar, anular, procesar), RF-32 / RF-33 (reportes de egresos), RNF-14 (auditoría de quién registró/anuló).
- **Reflejo en la app:** formulario de egreso y lista de comprobantes por mes con acciones según estado; al "procesar" se asocia el comprobante de egreso (`ReceiptId`) y el estado pasa a `Processed`.
- **Ejemplo:** el operador registra el egreso F001-000123 por S/ 250.00 (proveedor X, motivo "Servicios") → queda `Pending`; luego lo procesa y queda con comprobante emitido.
- **Datos en la migración:** **No** — se crea vacía.

---

### `RefreshToken` — `028_refresh_token.sql`

- **Qué representa:** los tokens de refresco de sesión (rotativos), guardados como hash SHA-256.
- **Requisitos:** RF-01, RF-02, RF-03, RF-04 (sesión, protección, identidad y cierre), RNF-01, RNF-02, RNF-03 (seguridad de autenticación).
- **Reflejo en la app:** mantiene la sesión del usuario sin volver a pedir credenciales (`POST /api/auth/refresh`); al cerrar sesión se revoca (`logout` limpia la cookie). `RevokedAt` permite detectar reuso de un token ya rotado (replay).
- **Ejemplo:** mientras el usuario trabaja, la app renueva el `accessToken` usando la cookie `refreshToken` sin interrumpir la sesión; al salir, el token queda revocado.
- **Datos en la migración:** **No** — se crea vacía; es datos de ejecución generados por el flujo de autenticación.

---

## 4. Observaciones transversales

1. **Catálogos sembrados por la migración (9):** `Role`, `Currency`, `Stage`, `RecurrenceType`, `ReceiptType` (con secuencias y trigger), `ChargeTargetType`, `AccountReceivableStatus`, `ExpenseStatus`, `ExpenseBulkUploadStatus`. La API los expone mayormente como lectura (`API.md` §15) y no tienen endpoint de escritura, por lo que sus valores no deben cambiarse desde la aplicación.

2. **Catálogos "de solo lectura" que quedan vacíos:** `IncomeCategory` y `ExpenseReason` son listados por la API como catálogos de solo lectura, pero sus migraciones no insertan datos. Dependen del seed que se construirá aparte; sin esos registros los formularios de ingreso externo y de egreso no tendrían opciones.

3. **Tablas de catálogo con CRUD completo en la API:** `BusinessType` (con borrado físico vía `DELETE`), `Bank`, `Member`, `Stall`, `Provider`, `Service`. Se llenan desde la aplicación por el rol `Administrator`.

4. **Tablas operativas (todas vacías tras migrar):** `AccountReceivable`, `ConsumptionReading`, `Receipt`, `Payment`, `PaymentDetail`, `Income`, `BankExchange`, `ExpenseBulkUpload`, `Expense`, `User`, `RefreshToken`. Se llenan en tiempo de ejecución por los flujos de cobranza, ingresos, egresos, canjes y sesión.

5. **Integridad garantizada a nivel de base:** correlativos únicos por tipo (`Receipt` + secuencias + trigger, RNF-05), monto de consumo calculado en BD (`ConsumptionReading`, RN-05), cuenta ligada a un solo destino socio/puesto (`AccountReceivable`, RN-02), y costo coherente según tipo de servicio (`Service`). Esto respalda los requisitos RNF-04 y RNF-05 sin depender solo de la lógica del backend.

6. **Soft delete vs. borrado físico:** la mayoría de catálogos usan `IsActive` (desactivar): `User`, `Bank`, `Member`, `Stall`, `Provider`, `Service`. `BusinessType` es la excepción: su eliminación es física (`DELETE /api/business-types`), y la API responde `409` si está en uso.
