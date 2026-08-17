# Historias de Usuario — Sistema de Gestión de Caja (SGA Caja)

> Documento guía para construir el frontend flujo a flujo, cubriendo la totalidad de
> endpoints expuestos por `sga-caja-backend`. Marca cada historia con `[x]` cuando su vista esté completada.
>
> **Backend completo:** la especificación definitiva (request/response, roles, errores) es
> [`API.md`](API.md); los archivos de [`docs/epics/`](epics/) resumen por epic los contratos exactos.
>
> **Desarrollo:** la estructura de carpetas, convención de componentes (4 archivos) y el orden
> de implementación están definidos en [`PLAN-IMPLEMENTACION.md`](PLAN-IMPLEMENTACION.md).
> Cada US se desarrolla de extremo a extremo (interface → service → page → spec) antes de
> marcarla con `[x]`.

---

## Convenciones

- **Contrato de cada epic:** el JSON exacto que envía/recibe cada endpoint (body, headers y parámetros) está documentado en [`docs/epics/`](epics/) — un `.md` por epic.
- **Formato de respuestas:** respuestas de error con envoltorio común `{ timestamp, status, error, message, path }` (status 400/401/403/404/409/500). Los listados paginados usan `PagedModel` de Spring → `{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`.
- **Autenticación:** todos los endpoints (excepto `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` y swagger) requieren header `Authorization: Bearer <accessToken>`.
- **Catálogos de solo lectura** devuelven `List<...>` simple (sin paginación) → ideales para *selects* en formularios.
- **Roles:** `Administrator` (configura maestros) y `CashierOperator` (opera caja). Los menús/vistas deben mostrarse según `roleName` de `/api/auth/me`.

### Endpoints base para cada vista de CRUD (patrón de maestros)
| Verbo | Ruta | Descripción |
|---|---|---|
| GET | `/api/{recurso}?search=&active=&page=&size=&sort=` | Listado paginado con búsqueda y filtro activo |
| GET | `/api/{recurso}/{uuid}` | Detalle |
| POST | `/api/{recurso}` | Crear |
| PUT | `/api/{recurso}/{uuid}` | Editar |
| PATCH | `/api/{recurso}/{uuid}/deactivate` | Desactivar (soft delete) |

---

## EPIC 1 — Autenticación y sesión

### US-01 · Iniciar sesión, cerrar sesión y ver perfil
**Rol:** Ambos | **Prioridad:** Alta

- [x] Vista de **Login** con usuario y contraseña (UI split screen: `VistasPropuestas/sga_caja_login_propuesta1.html`).
- [x] Guard de rutas: redirige a login si no hay token; oculta menús según rol.
- [x] Manejo de expiración: refresh **proactivo** (timer con margen de 30 s usando `expiresIn`) + **reactivo** (401 → `POST /api/auth/refresh` → reintento con un único refresh en vuelo). En dev (`http://localhost`) la cookie `Secure` no se guarda → el fallo del refresh cierra sesión y redirige a `/login` (`devRefreshFallback`).
- [x] TTL: access token **15 min** (`expiresIn: 900`, refresh programado antes de vencer) · refresh token **60 min** (cookie `Max-Age=3600`, lo renueva el backend).
- [x] Cerrar sesión: `POST /api/auth/logout`.
- [x] Mostrar perfil del usuario autenticado (nombre, usuario, rol) desde `/me` (topbar).

**Endpoints:** `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout` · `GET /api/auth/me` — [contrato detallado](epics/epic-01-autenticacion-sesion.md)

---

## EPIC 2 — Catálogos de solo lectura (compartidos)

### US-02 · Seleccionar moneda en formularios
### US-03 · Seleccionar etapa de socio
### US-04 · Seleccionar tipo de recurrencia
### US-05 · Seleccionar tipo de comprobante
### US-06 · Seleccionar categoría de ingreso
### US-07 · Seleccionar motivo de egreso
### US-08 · Seleccionar destino de cobro (cargo a)
### US-09 · Consultar estados (CxC y egresos)

**Rol:** Ambos | **Prioridad:** Alta (prerequisito de selects en formularios)

- [x] `CatalogService` (`features/catalogs/`) que carga y **cachea** cada catálogo (una sola petición por catálogo); `getDetail(uuid)` no cacheado.
- [x] `CatalogSelectComponent` (`shared/components/catalog-select/`) reutilizable: consume el catálogo por `catalogKey`, escribe el `uuid` en un `FormControl` del padre y soporta opción "Sin asignar".
- [x] Verificación en dev: página `/dev/catalogs` (solo `environment.development`) con un select por catálogo.

**Endpoints (todos con `GET /{uuid}` opcional):**
`GET /api/currencies` · `GET /api/stages` · `GET /api/recurrence-types` · `GET /api/receipt-types` · `GET /api/income-categories` · `GET /api/expense-reasons` · `GET /api/charge-target-types` · `GET /api/account-receivable-statuses` · `GET /api/expense-statuses` — [contrato detallado](epics/epic-02-catalogos.md)

---

## EPIC 3 — Configuración de maestros (Administrator)

### US-10 · Gestionar giros comerciales
- [x] Listado, crear, editar y **eliminar** (único maestro con `DELETE`).
- [x] Formulario: campo `name` (obligatorio).

**Endpoints:** `GET /api/business-types` · `GET /{uuid}` · `POST` · `PUT /{uuid}` · `DELETE /{uuid}` — [contrato detallado](epics/epic-03-maestros.md)

### US-11 · Gestionar socios
- [x] Listado paginado con búsqueda (código/nombre/apellido) y filtro por activo.
- [x] Crear/editar socio: `code`, `firstName`, `lastName`, `shareNumber`, `stageUuid`, `birthDate` (fecha pasada).
- [x] Desactivar socio (soft delete).
- [x] Detalle por uuid.

**Endpoints:** `GET /api/members?search&active` · `GET /{uuid}` · `POST` · `PUT /{uuid}` · `PATCH /{uuid}/deactivate` — [contrato detallado](epics/epic-03-maestros.md)

### US-12 · Gestionar puestos
- [x] Listado con búsqueda (número/inquilino) y filtro por activo.
- [x] Crear/editar puesto: `number`, `businessTypeUuid`, `memberUuid`, `tenantName`, `tenantDocument`, `validityStartDate`, `validityEndDate`.
- [x] Desactivar puesto.

**Endpoints:** `GET /api/stalls?search&active` · `GET /{uuid}` · `POST` · `PUT /{uuid}` · `PATCH /{uuid}/deactivate` — [contrato detallado](epics/epic-03-maestros.md)

### US-13 · Gestionar bancos
- [x] Listado con búsqueda (nombre/número de cuenta) y filtro por activo.
- [x] Crear/editar banco: `name`, `accountNumber`, `cci`, `currencyUuid`.
- [x] Desactivar banco.

**Endpoints:** `GET /api/banks?search&active` · `GET /{uuid}` · `POST` · `PUT /{uuid}` · `PATCH /{uuid}/deactivate` — [contrato detallado](epics/epic-03-maestros.md)

### US-14 · Gestionar proveedores
- [x] Listado con búsqueda (nombre/documento) y filtro por activo.
- [x] Crear/editar proveedor: `name`, `document`.
- [x] Desactivar proveedor.

**Endpoints:** `GET /api/providers?search&active` · `GET /{uuid}` · `POST` · `PUT /{uuid}` · `PATCH /{uuid}/deactivate` — [contrato detallado](epics/epic-03-maestros.md)

### US-15 · Gestionar servicios cobrables
- [x] Listado con búsqueda (nombre) y filtro por activo.
- [x] Crear/editar servicio: `name`, `recurrenceTypeUuid`, `chargeTargetTypeUuid`, `currencyUuid`, `consumptionBased`, `cost`, `unitCost`.
  - `cost`/`unitCost`: solo uno va con valor; el campo no usado se envía como `null` (no `0`), según el `CHECK ck_service_cost_by_type` de BD.
- [x] Desactivar servicio.
- [x] Selects alimentados por los catálogos de US-04, US-08 y US-02.

**Endpoints:** `GET /api/services?search&active` · `GET /{uuid}` · `POST` · `PUT /{uuid}` · `PATCH /{uuid}/deactivate` — [contrato detallado](epics/epic-03-maestros.md)

---

## EPIC 4 — Cuentas por cobrar (CxC)

### US-16 · Consultar cuentas por cobrar y su detalle
**Rol:** Ambos | **Prioridad:** Alta

- [ ] Listado paginado con filtros por `serviceUuid`, `memberUuid`, `stallUuid`.
- [ ] Detalle por uuid (incluye estado: Pending/Paid/Exempt).
- [ ] Selects de servicio/socio/puesto para los filtros.

**Endpoints:** `GET /api/account-receivables?serviceUuid&memberUuid&stallUuid` · `GET /{uuid}` — [contrato detallado](epics/epic-04-cxc.md)

### US-17 · Generar CxC por puestos y por socios
**Rol:** Ambos | **Prioridad:** Alta

- [ ] Formulario **por puestos** (RF-16): `serviceUuid`, `periodStartDate`, `periodEndDate`, `amount` (obligatorio en servicio de costo fijo; **omitido** si es por consumo).
- [ ] Formulario **por socios** (RF-18): `serviceUuid`, `periodStartDate`, `periodEndDate`, `amount`, `stageCodes` (lista de códigos de etapa), `uniqueMembers` (limita repetidos por nombre y apellido).
- [ ] Mostrar resultado: lista de CxC generadas (respuesta de creación).
- [ ] Vista de **resumen de movimientos** de un socio o puesto (RF-26): `GET /summary?memberUuid` o `?stallUuid`; el resumen **abre en otra ventana/pestaña**.

**Endpoints:** `POST /api/account-receivables/generate-by-stall` · `POST /api/account-receivables/generate-by-member` · `GET /api/account-receivables/summary` — [contrato detallado](epics/epic-04-cxc.md)

### US-18 · Exonerar una CxC pendiente
**Rol:** CashierOperator | **Prioridad:** Media

- [ ] Acción "Exonerar" en una CxC pendiente (RF-21), con confirmación.

**Endpoints:** `PATCH /api/account-receivables/{uuid}/exempt` — [contrato detallado](epics/epic-04-cxc.md)

---

## EPIC 5 — Lecturas de consumo

### US-19 · Registrar y consultar lecturas de consumo
**Rol:** Ambos | **Prioridad:** Alta

- [x] Registro de lectura inicial/final de una CxC de servicio por consumo: `accountReceivableUuid`, `initialReading`, `finalReading`.
- [x] Consulta de lectura de una CxC: `GET /by-account-receivable/{accountReceivableUuid}`.
- [x] Visualizar lectura por uuid.

**Endpoints:** `POST /api/consumption-readings` · `GET /{uuid}` · `GET /by-account-receivable/{accountReceivableUuid}` — [contrato detallado](epics/epic-05-lecturas-consumo.md)

---

## EPIC 6 — Cobranza (Pagos)

### US-20 · Cobrar cuentas por cobrar y emitir recibo
**Rol:** CashierOperator | **Prioridad:** Alta

- [x] Consulta de CxC **por socio o por puesto** (RF-19), con pestañas "Por puesto" / "Por socio" que **separan las cuentas** (RF-20).
- [x] Selección de CxC pendientes (checkboxes) = cuentas **abonadas**; acción **Exonerar** desde la misma pantalla (RF-21, con confirmación).
- [x] Botón "Calcular total" → `POST /api/payments/compute-total` con `{ accountReceivableUuids: [...] }` (RF-22).
- [x] Confirmar pago → `POST /api/payments` (RF-23) → muestra el **voucher** del recibo emitido.
- [x] Consulta de un pago por uuid (para reimprimir/ver voucher).

**Endpoints:** `POST /api/payments/compute-total` · `POST /api/payments` · `GET /api/payments/{uuid}` — [contrato detallado](epics/epic-06-cobranza-pagos.md)

---

## EPIC 7 — Canjes bancarios

### US-21 · Canjear CxC de socio por operación bancaria
**Rol:** CashierOperator | **Prioridad:** Media

- [ ] Formulario de canje: `accountReceivableUuid`, `bankUuid`, `depositDate`.
- [ ] Listado de canjes con filtro por `bankUuid` y fecha de depósito.
- [ ] **Visualizar el voucher** del canje desde el listado (RF-31, `receipt` embebido).
- [ ] Detalle por uuid.

**Endpoints:** `GET /api/bank-exchanges?bankUuid&date` · `GET /{uuid}` · `POST /api/bank-exchanges` — [contrato detallado](epics/epic-07-canjes-bancarios.md)

---

## EPIC 8 — Ingresos externos

### US-22 · Registrar y consultar ingresos externos a caja
**Rol:** CashierOperator | **Prioridad:** Media

- [ ] Formulario: `depositorName`, `incomeCategoryUuid`, `concept`, `amount`.
- [ ] Listado paginado con filtro por `incomeCategoryUuid` y `date`.
- [ ] **Visualizar el voucher** de un ingreso desde el listado (RF-29, `receipt` embebido).

**Endpoints:** `GET /api/incomes?incomeCategoryUuid&date` · `GET /{uuid}` · `POST /api/incomes` — [contrato detallado](epics/epic-08-ingresos-externos.md)

---

## EPIC 9 — Egresos

### US-23 · Registrar y consultar egresos
**Rol:** CashierOperator | **Prioridad:** Alta

- [ ] Formulario individual: `documentNumber`, `providerUuid`, `expenseDate`, `amount`, `associatedDocument`, `expenseReasonUuid` (RF-27).
- [ ] Listado paginado con filtro por `year` y `month` (RF-30).
- [ ] **Visualizar el comprobante** de un egreso procesado desde el listado (RF-30, `receipt` embebido).

**Endpoints:** `GET /api/expenses?year&month` · `GET /{uuid}` · `POST /api/expenses` — [contrato detallado](epics/epic-09-egresos.md)

### US-24 · Cargar egresos masivos desde XLSX
**Rol:** CashierOperator | **Prioridad:** Media

- [ ] Subida de archivo XLSX (multipart, campo `file`) (RF-28).
- [ ] Mostrar resultado: egresos creados y/o errores por fila.
- [ ] Estado de carga consultable (catálogo US-09 + migración `ExpenseBulkUpload`).

**Endpoints:** `POST /api/expenses/bulk-upload` (Content-Type: `multipart/form-data`) — [contrato detallado](epics/epic-09-egresos.md)

### US-25 · Anular y procesar egresos
**Rol:** CashierOperator | **Prioridad:** Media

- [ ] Acción "Anular" sobre egreso pendiente (RF-30).
- [ ] Acción "Procesar" sobre egreso pendiente → emite su comprobante (RF-30).
- [ ] **Visualizar el comprobante** emitido tras procesar (RF-30).

**Endpoints:** `PATCH /api/expenses/{uuid}/void` · `PATCH /api/expenses/{uuid}/process` — [contrato detallado](epics/epic-09-egresos.md)

---

## EPIC 10 — Reportes

### US-26 · Descargar reportes XLSX
**Rol:** Ambos | **Prioridad:** Baja

- [ ] Pantalla de reportes con selector de periodo (día, mes/año).
- [ ] Descarga de archivo XLSX (respuesta binaria con `Content-Disposition: attachment`).
- [ ] Reporte de movimientos diarios y mensuales (RF-32).
- [ ] Reporte de totales de movimientos, por día o por mes (RN-07).
- [ ] Reportes de socios, no socios, egresos y bancos (RF-33).

**Endpoints:**
`GET /api/reports/movements/daily?date` · `GET /api/reports/movements/monthly?year&month` · `GET /api/reports/movements/totals?date|year&month` · `GET /api/reports/members?year&month` · `GET /api/reports/non-members?year&month` · `GET /api/reports/expenses?year&month` · `GET /api/reports/banks?year&month` — [contrato detallado](epics/epic-10-reportes.md)

---

## Resumen de cobertura

| Epic | Historias | Estado |
|---|---|---|
| 1. Sesión | US-01 | [x] |
| 2. Catálogos | US-02 … US-09 | [x] |
| 3. Maestros | US-10 … US-15 | [x] |
| 4. CxC | US-16, US-17, US-18 | [x] |
| 5. Lecturas | US-19 | [x] |
| 6. Pagos | US-20 | [x] |
| 7. Canjes | US-21 | [ ] |
| 8. Ingresos | US-22 | [ ] |
| 9. Egresos | US-23, US-24, US-25 | [ ] |
| 10. Reportes | US-26 | [ ] |

**Orden sugerido:** US-01 → US-02…09 → US-10…15 → US-16/17/18 → US-19 → US-20 → US-21/22 → US-23/24/25 → US-26.
