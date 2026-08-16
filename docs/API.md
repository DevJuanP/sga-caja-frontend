# Documentación de la API — SGA Caja Backend

API REST (Java / Spring Boot) para la gestión de caja: socios, puestos, servicios,
cuentas por cobrar, pagos, ingresos, egresos, canjes bancarios y reportes.

- **Base URL:** `/api`
- **Formato:** JSON (`application/json`), salvo la carga masiva de egresos
  (`multipart/form-data`) y los reportes (binario XLSX).
- **Swagger UI:** `/swagger-ui.html` · **OpenAPI JSON:** `/v3/api-docs/**`

---

## Autenticación general (aplica a todos los endpoints)

La API es stateless y usa **JWT Bearer**. Excepto `login`, `refresh` y `logout`, **todos**
los endpoints requieren el header:

```
Authorization: Bearer <accessToken>
```

- Sin token o token inválido → `401 Unauthorized` (body `ErrorResponse`).
- Con token válido pero sin el rol requerido por el endpoint → `403 Forbidden`.
- El refresh token se maneja mediante **cookie httpOnly** `refreshToken`, no por header.
- Códigos de error estándar en todas las respuestas de error (`ErrorResponse`):

```json
{
  "timestamp": "2026-08-15T12:00:00Z",
  "status": 400,
  "error": "CODIGO_ERROR",
  "message": "Descripción del error",
  "path": "/api/..."
}
```

| Estatus | Significado |
|---------|-------------|
| `200 OK` | Consulta o actualización exitosa |
| `201 Created` | Recurso creado exitosamente |
| `204 No Content` | Operación exitosa sin cuerpo (logout / eliminar giro) |
| `400 Bad Request` | Validación fallida (`VALIDATION`) o archivo ilegible |
| `401 Unauthorized` | Credenciales inválidas o sin sesión |
| `403 Forbidden` | Rol sin permiso |
| `404 Not Found` | Recurso inexistente |
| `409 Conflict` | Conflicto de negocio (duplicado, estado inválido, etc.) |
| `500 Internal Server Error` | Error interno |

**Paginación:** los listados paginados aceptan `page` (base 0), `size` (default `20`) y `sort`
p.ej. `?page=0&size=20&sort=name,asc`. Responden con `PagedModel<T>` (contenido, `page`,
`totalElements`, etc.).

---

## Índice de clasificación de endpoints

| Grupo | Ruta base | Rol |
|-------|-----------|-----|
| 1. [Autenticación / Sesión](#1-autenticación--sesión) | `/api/auth` | Público (login/refresh/logout), autenticado (me) |
| 2. [Socios](#2-socios) | `/api/members` | Lectura: autenticado · Escritura: Administrador |
| 3. [Puestos](#3-puestos) | `/api/stalls` | Lectura: autenticado · Escritura: Administrador |
| 4. [Servicios cobrables](#4-servicios-cobrables) | `/api/services` | Lectura: autenticado · Escritura: Administrador |
| 5. [Giros comerciales](#5-giros-comerciales) | `/api/business-types` | Lectura: autenticado · Escritura: Administrador |
| 6. [Bancos](#6-bancos) | `/api/banks` | Lectura: autenticado · Escritura: Administrador |
| 7. [Proveedores](#7-proveedores) | `/api/providers` | Lectura: autenticado · Escritura: Administrador |
| 8. [Cuentas por cobrar](#8-cuentas-por-cobrar) | `/api/account-receivables` | Autenticado (excepto exonerar: Operador de Caja) |
| 9. [Lecturas de consumo](#9-lecturas-de-consumo) | `/api/consumption-readings` | Autenticado |
| 10. [Pagos](#10-pagos) | `/api/payments` | Operador de Caja |
| 11. [Ingresos externos](#11-ingresos-externos) | `/api/incomes` | Operador de Caja |
| 12. [Egresos](#12-egresos) | `/api/expenses` | Operador de Caja |
| 13. [Canjes bancarios](#13-canjes-bancarios) | `/api/bank-exchanges` | Operador de Caja |
| 14. [Reportes](#14-reportes) | `/api/reports` | Autenticado |
| 15. [Catálogos de solo lectura](#15-catálogos-de-solo-lectura) | varios | Autenticado |

> **Roles:** `Administrator` (admin) y `CashierOperator` (operador de caja).

---

## 1. Autenticación / Sesión

### `POST /api/auth/login`

- **Tipo:** POST
- **Headers:**
  - `Content-Type: application/json`
  - No requiere token. Debe permitir cookies (el `refreshToken` llega como cookie `Set-Cookie`).
- **Body esperado (LoginRequest):**

```json
{
  "username": "admin",
  "password": "123456"
}
```

- **Respuesta exitosa — `200 OK`** (AccessTokenResponse). Además, setea la cookie httpOnly
  `refreshToken` (path `/api/auth`, `SameSite=Lax`, `Secure`):

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 1800,
  "user": {
    "uuid": "uuid-uuid-uuid",
    "username": "admin",
    "firstName": "...",
    "lastName": "...",
    "roleName": "Administrator"
  }
}
```

- **Errores:** `401` credenciales inválidas · `400` body inválido.

---

### `POST /api/auth/refresh`

- **Tipo:** POST
- **Headers:** no requiere token. Requiere la **cookie `refreshToken`** enviada por el navegador
  (la cookie se envía automáticamente al mismo origen, path `/api/auth`).
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: misma estructura `AccessTokenResponse` del login y renueva
  la cookie `refreshToken`.
- **Errores:** `401` cookie ausente o refresh token inválido/expirado.

---

### `POST /api/auth/logout`

- **Tipo:** POST
- **Headers:** no requiere token. Requiere la cookie `refreshToken` (revoca la sesión).
- **Body:** ninguno.
- **Respuesta exitosa — `204 No Content`**: cuerpo vacío y **`Set-Cookie`** que limpia la cookie
  `refreshToken` (`Max-Age=0`).
- **Errores:** `401` refresh token inválido.

---

### `GET /api/auth/me`

- **Tipo:** GET
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`** (UserProfileResponse):

```json
{
  "uuid": "uuid-uuid-uuid",
  "username": "admin",
  "firstName": "...",
  "lastName": "...",
  "roleName": "Administrator"
}
```

- **Errores:** `401` sin sesión · `404` usuario no encontrado.

---

## 2. Socios

### `GET /api/members`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `search` (opcional, código/nombre/apellido) · `active` (opcional, `true`/`false`) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<MemberResponse>` (lista paginada). Cada ítem:
  `uuid, code, firstName, lastName, shareNumber, stage {uuid,name}, birthDate, active`.
- **Errores:** `401`, `403`.

---

### `GET /api/members/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `MemberResponse` (objeto socio).
- **Errores:** `404` no existe · `401`, `403`.

---

### `POST /api/members`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado (MemberRequest):**

```json
{
  "code": "S001",
  "firstName": "Juan",
  "lastName": "Pérez",
  "shareNumber": "ACC-001",
  "stageUuid": "uuid-etapa",
  "birthDate": "1990-01-01"
}
```

- **Respuesta exitosa — `201 Created`**: `MemberResponse` (socio creado).
- **Errores:** `400` validación · `404` etapa no existe · `409` código duplicado · `401`, `403`.

---

### `PUT /api/members/{uuid}`

- **Tipo:** PUT · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado:** igual que `POST /api/members` (MemberRequest completo).
- **Respuesta exitosa — `200 OK`**: `MemberResponse` (socio actualizado).
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PATCH /api/members/{uuid}/deactivate`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Administrador.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `MemberResponse` con `active: false` (soft delete).
- **Errores:** `404`, `409`, `401`, `403`.

---

## 3. Puestos

### `GET /api/stalls`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `search` (opcional, número/inquilino) · `active` (opcional) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<StallResponse>`. Cada ítem:
  `uuid, number, businessType {uuid,name}, member {uuid,fullName}, tenantName, tenantDocument,
  validityStartDate, validityEndDate, active`.
- **Errores:** `401`, `403`.

---

### `GET /api/stalls/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `StallResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/stalls`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado (StallRequest):**

```json
{
  "number": "A-01",
  "businessTypeUuid": "uuid-giro",
  "memberUuid": "uuid-socio",
  "tenantName": "Inquilino",
  "tenantDocument": "12345678",
  "validityStartDate": "2026-01-01",
  "validityEndDate": "2026-12-31"
}
```

- **Respuesta exitosa — `201 Created`**: `StallResponse`.
- **Errores:** `400`, `404` (giro/socio), `409` (número duplicado), `401`, `403`.

---

### `PUT /api/stalls/{uuid}`

- **Tipo:** PUT · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado:** `StallRequest` completo (igual que POST).
- **Respuesta exitosa — `200 OK`**: `StallResponse`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PATCH /api/stalls/{uuid}/deactivate`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Administrador.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `StallResponse` con `active: false`.
- **Errores:** `404`, `409`, `401`, `403`.

---

## 4. Servicios cobrables

### `GET /api/services`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `search` (opcional, nombre) · `active` (opcional) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<ServiceResponse>`. Cada ítem:
  `uuid, name, recurrenceType {uuid,name}, chargeTargetType {uuid,name}, currency {uuid,code,name},
  consumptionBased, cost, unitCost, active`.
  - `cost` y `unitCost` son **nullables**: solo uno tiene valor según `consumptionBased`
    (costo fijo → `cost`; por consumo → `unitCost`; el otro es `null`).
- **Errores:** `401`, `403`.

---

### `GET /api/services/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ServiceResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/services`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado (ServiceRequest):**

```json
{
  "name": "Cuota de mantenimiento",
  "recurrenceTypeUuid": "uuid-recurrencia",
  "chargeTargetTypeUuid": "uuid-destino",
  "currencyUuid": "uuid-moneda",
  "consumptionBased": false,
  "cost": 50.00,
  "unitCost": null
}
```

> **Regla de `cost`/`unitCost`:** el campo no usado debe ir como `null` (**no `0`**).
> Lo exige el `CHECK ck_service_cost_by_type` en BD: servicio fijo requiere
> `unitCost = NULL`; servicio por consumo requiere `cost = NULL`. Si se envía `0`
> en el campo no usado, el backend responde `400`.

- **Respuesta exitosa — `201 Created`**: `ServiceResponse`.
- **Errores:** `400`, `404` (catálogos referenciados), `409`, `401`, `403`.

---

### `PUT /api/services/{uuid}`

- **Tipo:** PUT · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado:** `ServiceRequest` completo.
- **Respuesta exitosa — `200 OK`**: `ServiceResponse`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PATCH /api/services/{uuid}/deactivate`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Administrador.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ServiceResponse` con `active: false`.
- **Errores:** `404`, `409`, `401`, `403`.

---

## 5. Giros comerciales

### `GET /api/business-types`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: lista `BusinessTypeResponse[]` (`uuid, name`).
- **Errores:** `401`, `403`.

---

### `GET /api/business-types/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `BusinessTypeResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/business-types`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado (BusinessTypeRequest):** `{ "name": "Restaurante" }`
- **Respuesta exitosa — `201 Created`**: `BusinessTypeResponse`.
- **Errores:** `400`, `409` (nombre duplicado), `401`, `403`.

---

### `PUT /api/business-types/{uuid}`

- **Tipo:** PUT · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado:** `{ "name": "Nuevo nombre" }`
- **Respuesta exitosa — `200 OK`**: `BusinessTypeResponse`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `DELETE /api/business-types/{uuid}`

- **Tipo:** DELETE · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Administrador.
- **Body:** ninguno.
- **Respuesta exitosa — `204 No Content`**: cuerpo vacío (eliminación física).
- **Errores:** `404`, `409` (en uso), `401`, `403`.

---

## 6. Bancos

### `GET /api/banks`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `search` (opcional, nombre/nº cuenta) · `active` (opcional) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<BankResponse>`. Cada ítem:
  `uuid, name, accountNumber, cci, currency {uuid,code,name}, active`.
- **Errores:** `401`, `403`.

---

### `GET /api/banks/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `BankResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/banks`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado (BankRequest):**

```json
{
  "name": "BCP",
  "accountNumber": "191-1234567-0-00",
  "cci": "00219100123456700000",
  "currencyUuid": "uuid-moneda"
}
```

- **Respuesta exitosa — `201 Created`**: `BankResponse`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PUT /api/banks/{uuid}`

- **Tipo:** PUT · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado:** `BankRequest` completo.
- **Respuesta exitosa — `200 OK`**: `BankResponse`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PATCH /api/banks/{uuid}/deactivate`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Administrador.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `BankResponse` con `active: false`.
- **Errores:** `404`, `409`, `401`, `403`.

---

## 7. Proveedores

### `GET /api/providers`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `search` (opcional, nombre/documento) · `active` (opcional) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<ProviderResponse>` (`uuid, name, document, active`).
- **Errores:** `401`, `403`.

---

### `GET /api/providers/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ProviderResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/providers`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado (ProviderRequest):** `{ "name": "Proveedor X", "document": "20123456789" }`
- **Respuesta exitosa — `201 Created`**: `ProviderResponse`.
- **Errores:** `400`, `409`, `401`, `403`.

---

### `PUT /api/providers/{uuid}`

- **Tipo:** PUT · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Rol:** Administrador.
- **Body esperado:** `ProviderRequest` completo.
- **Respuesta exitosa — `200 OK`**: `ProviderResponse`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PATCH /api/providers/{uuid}/deactivate`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Administrador.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ProviderResponse` con `active: false`.
- **Errores:** `404`, `409`, `401`, `403`.

---

## 8. Cuentas por cobrar

### `GET /api/account-receivables`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `serviceUuid`, `memberUuid`, `stallUuid` (todos opcionales) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<AccountReceivableResponse>`. Cada ítem:
  `uuid, service {uuid,name,consumptionBased}, member {uuid,fullName}, stall {uuid,number},
  periodStartDate, periodEndDate, amount, status {uuid,name}`.
- **Errores:** `401`, `403`.

---

### `GET /api/account-receivables/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `AccountReceivableResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/account-receivables/generate-by-stall`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (GenerateByStallRequest):**

```json
{
  "serviceUuid": "uuid-servicio",
  "periodStartDate": "2026-08-01",
  "periodEndDate": "2026-08-31",
  "amount": 50.00
}
```

> `amount` es obligatorio para servicios de costo fijo y se **omite** para servicios por consumo
> (el monto se calcula con las lecturas, ver sección 9).

- **Respuesta exitosa — `201 Created`**: lista `AccountReceivableResponse[]` (una por puesto activo).
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `POST /api/account-receivables/generate-by-member`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (GenerateByMemberRequest):**

```json
{
  "serviceUuid": "uuid-servicio",
  "periodStartDate": "2026-08-01",
  "periodEndDate": "2026-08-31",
  "amount": 30.00,
  "stageCodes": [1, 2, 3],
  "uniqueMembers": false
}
```

> `amount` obligatorio en servicios de costo fijo; omitir en servicios por consumo.

- **Respuesta exitosa — `201 Created`**: lista `AccountReceivableResponse[]` (una por socio activo
  que cumpla las etapas y reglas del filtro).
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `PATCH /api/account-receivables/{uuid}/exempt`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Rol:** Operador de Caja.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `AccountReceivableResponse` con estado `Exempt`.
- **Errores:** `404`, `409` (solo pendientes), `401`, `403`.

---

### `GET /api/account-receivables/summary`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `memberUuid` (opcional) · `stallUuid` (opcional) — al menos uno de los dos.
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: lista `AccountReceivableMovementResponse[]` con el detalle de
  liquidación de cada cuenta:
  `accountReceivable {AccountReceivableResponse}, settlementMethod, settledDate, receiptCorrelative`.
- **Errores:** `400` (sin parámetro), `404`, `401`, `403`.

> ⚠️ Nota: este path (`/summary`) debe declararse antes que `/api/account-receivables/{uuid}`
> solo conceptualmente; el controller usa rutas distintas sin conflicto real en Spring.

---

## 9. Lecturas de consumo

### `POST /api/consumption-readings`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (RegisterConsumptionReadingRequest):**

```json
{
  "accountReceivableUuid": "uuid-cuenta",
  "initialReading": 100.0,
  "finalReading": 150.0
}
```

- **Respuesta exitosa — `201 Created`**: `ConsumptionReadingResponse`:
  `uuid, accountReceivableUuid, initialReading, finalReading, unitCost, calculatedAmount`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `GET /api/consumption-readings/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ConsumptionReadingResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `GET /api/consumption-readings/by-account-receivable/{accountReceivableUuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ConsumptionReadingResponse` de la cuenta indicada.
- **Errores:** `404`, `401`, `403`.

---

## 10. Pagos

Todos los endpoints de pagos requieren rol **Operador de Caja**.

### `POST /api/payments/compute-total`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (ProcessPaymentRequest):**

```json
{
  "accountReceivableUuids": ["uuid-cuenta-1", "uuid-cuenta-2"]
}
```

- **Respuesta exitosa — `200 OK`** (PaymentTotalResponse):

```json
{
  "items": [{ "accountReceivableUuid": "uuid-cuenta-1", "amount": 50.0 }],
  "total": 100.0
}
```

- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `POST /api/payments`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado:** mismo `ProcessPaymentRequest` (lista de UUIDs).
- **Respuesta exitosa — `201 Created`** (PaymentResponse): `uuid, receipt {uuid, receiptTypeName,
  correlativeNumber, issueDate, amount}, paymentDate, totalAmount, details [{accountReceivableUuid,
  amount}], createdBy {uuid, username}` — emite el recibo.
- **Errores:** `400`, `404`, `409` (cuenta no pendiente), `401`, `403`.

---

### `GET /api/payments/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PaymentResponse`.
- **Errores:** `404`, `401`, `403`.

---

## 11. Ingresos externos

Rol: **Operador de Caja**.

### `GET /api/incomes`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `incomeCategoryUuid` (opcional) · `date` (opcional, `YYYY-MM-DD`) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<IncomeResponse>` (`uuid, receipt {…},
  depositorName, incomeCategory {uuid,name}, concept, amount`).
- **Errores:** `401`, `403`.

---

### `GET /api/incomes/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `IncomeResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/incomes`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (CreateIncomeRequest):**

```json
{
  "depositorName": "Juan Pérez",
  "incomeCategoryUuid": "uuid-categoria",
  "concept": "Donación",
  "amount": 100.00
}
```

- **Respuesta exitosa — `201 Created`**: `IncomeResponse` (emite recibo de ingreso).
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

## 12. Egresos

Rol: **Operador de Caja**.

### `GET /api/expenses`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `year` (opcional) · `month` (opcional) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<ExpenseResponse>`. Cada ítem incluye:
  `uuid, documentNumber, provider {uuid,name}, expenseDate, amount, associatedDocument,
  expenseReason {uuid,name}, status {uuid,name}, receipt {…}, bulkUpload {uuid,fileName},
  createdBy {uuid,username}`.
- **Errores:** `401`, `403`.

---

### `GET /api/expenses/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ExpenseResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/expenses`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (RegisterExpenseRequest):**

```json
{
  "documentNumber": "F001-000123",
  "providerUuid": "uuid-proveedor",
  "expenseDate": "2026-08-10",
  "amount": 250.00,
  "associatedDocument": "OC-001",
  "expenseReasonUuid": "uuid-motivo"
}
```

- **Respuesta exitosa — `201 Created`**: `ExpenseResponse` con estado `Pending`.
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

### `POST /api/expenses/bulk-upload`

- **Tipo:** POST
- **Headers:** `Authorization: Bearer <token>` · `Content-Type: multipart/form-data`
- **Body esperado:** form-data con el campo `file` (archivo **XLSX**).
- **Respuesta exitosa — `201 Created`**: lista `ExpenseResponse[]` de egresos registrados.
- **Errores:** `400` archivo ilegible/incorrecto (`EXPENSE_FILE_READ_ERROR`) · `404`, `409`,
  `401`, `403`.

---

### `PATCH /api/expenses/{uuid}/void`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ExpenseResponse` anulado.
- **Errores:** `404`, `409` (solo pendientes), `401`, `403`.

---

### `PATCH /api/expenses/{uuid}/process`

- **Tipo:** PATCH · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `ExpenseResponse` procesado (emite comprobante de egreso).
- **Errores:** `404`, `409` (solo pendientes), `401`, `403`.

---

## 13. Canjes bancarios

Rol: **Operador de Caja**.

### `GET /api/bank-exchanges`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `bankUuid` (opcional) · `date` (opcional, fecha de depósito) · `page` · `size` · `sort`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `PagedModel<BankExchangeResponse>` (`uuid,
  accountReceivable {…}, bank {uuid,name}, receipt {…}, depositDate, amount`).
- **Errores:** `401`, `403`.

---

### `GET /api/bank-exchanges/{uuid}`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Body:** ninguno.
- **Respuesta exitosa — `200 OK`**: `BankExchangeResponse`.
- **Errores:** `404`, `401`, `403`.

---

### `POST /api/bank-exchanges`

- **Tipo:** POST · **Headers:** `Authorization: Bearer <token>` · `Content-Type: application/json`
- **Body esperado (CreateBankExchangeRequest):**

```json
{
  "accountReceivableUuid": "uuid-cuenta",
  "bankUuid": "uuid-banco",
  "depositDate": "2026-08-12"
}
```

- **Respuesta exitosa — `201 Created`**: `BankExchangeResponse` (emite recibo del canje).
- **Errores:** `400`, `404`, `409`, `401`, `403`.

---

## 14. Reportes

Cualquier usuario autenticado. Todos devuelven un **archivo XLSX** (binario) en `200 OK` con
headers `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y
`Content-Disposition: attachment; filename="...xlsx"`.

### `GET /api/reports/movements/daily`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `date` (opcional, `YYYY-MM-DD`).
- **Respuesta exitosa — `200 OK`**: XLSX (`movimientos-diarios-<fecha>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

### `GET /api/reports/movements/monthly`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `year` (opcional) · `month` (opcional).
- **Respuesta exitosa — `200 OK`**: XLSX (`movimientos-mensuales-<año>-<mes>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

### `GET /api/reports/movements/totals`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `date` (opcional) **o** `year` + `month` (opcional).
- **Respuesta exitosa — `200 OK`**: XLSX (`totales-movimientos-<periodo>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

### `GET /api/reports/members`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `year` (opcional) · `month` (opcional).
- **Respuesta exitosa — `200 OK`**: XLSX (`reporte-socios-<año>-<mes>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

### `GET /api/reports/non-members`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `year` (opcional) · `month` (opcional).
- **Respuesta exitosa — `200 OK`**: XLSX (`reporte-no-socios-<año>-<mes>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

### `GET /api/reports/expenses`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `year` (opcional) · `month` (opcional).
- **Respuesta exitosa — `200 OK`**: XLSX (`reporte-egresos-<año>-<mes>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

### `GET /api/reports/banks`

- **Tipo:** GET · **Headers:** `Authorization: Bearer <token>`
- **Query params:** `year` (opcional) · `month` (opcional).
- **Respuesta exitosa — `200 OK`**: XLSX (`reporte-bancos-<año>-<mes>.xlsx`).
- **Errores:** `400`, `404`, `401`, `403`.

---

## 15. Catálogos de solo lectura

Catálogos sembrados por migración (lectura únicamente). Todos requieren
`Authorization: Bearer <token>`, sin body, y responden:

- **Listar** (`GET /{recurso}`) → `200 OK` con `List<T>[]` (todos los ítems, sin paginar).
- **Obtener** (`GET /{recurso}/{uuid}`) → `200 OK` con el objeto · `404` si no existe.

| Recurso | Ruta base | Campos de respuesta |
|---------|-----------|---------------------|
| Etapas de socio | `/api/stages` | `uuid, code, name` |
| Tipos de recurrencia | `/api/recurrence-types` | `uuid, name` |
| Destinos de cobro | `/api/charge-target-types` | `uuid, name` |
| Monedas | `/api/currencies` | `uuid, code, name` |
| Categorías de ingreso | `/api/income-categories` | `uuid, name` |
| Motivos de egreso | `/api/expense-reasons` | `uuid, name` |
| Estados de egreso | `/api/expense-statuses` | `uuid, name` |
| Tipos de comprobante | `/api/receipt-types` | `uuid, name` |
| Estados de cuenta por cobrar | `/api/account-receivable-statuses` | `uuid, name` |

**Errores comunes del grupo:** `401`, `403` y `404` en la búsqueda por UUID.
