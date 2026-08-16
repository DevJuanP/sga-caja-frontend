# EPIC 3 — Configuración de maestros — Administrator (US-10 … US-15)

> Contrato de comunicación **Front ↔ Back** para los CRUD de maestros.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>`.
- **Crear/editar/desactivar exigen rol `Administrator`** (si no → 403).
- Listar/detalle están disponibles para cualquier rol autenticado.
- **Requests** con `Content-Type: application/json`.
- **Paginación** — los listados paginados devuelven `PagedModel` de Spring (formato real):

```json
{
  "content": [ "… elementos …" ],
  "page": { "size": 20, "number": 0, "totalElements": 57, "totalPages": 3 }
}
```

Query params del listado: `search` (texto opcional), `active` (`true`/`false` opcional),
`page` (0-based, opcional), `size` (opcional, default 20), `sort` (p. ej. `sort=name,asc`).

- **Error estándar:** `{ "timestamp", "status", "error", "message", "path" }`
  (400 validación · 404 no existe · 409 conflicto · 403 sin rol).

---

## US-10 · Giros comerciales (`/api/business-types`)

### GET /api/business-types
Sin paginación → arreglo simple:

```json
[ { "uuid": "f47ac10b-...", "name": "Alimentos" } ]
```

### GET /api/business-types/{uuid}
**Respuesta 200:** `{ "uuid": "f47ac10b-...", "name": "Alimentos" }`

### POST /api/business-types — crear
**Body:**
```json
{ "name": "Alimentos" }
```
**Respuesta 201:** `{ "uuid": "f47ac10b-...", "name": "Alimentos" }`

### PUT /api/business-types/{uuid} — editar
**Body:** `{ "name": "Abarrotes" }` · **Respuesta 200:** objeto igual al de POST.

### DELETE /api/business-types/{uuid} — eliminar (único maestro con DELETE)
**Respuesta 204 No Content** (sin body). Errores: 409 si el giro está en uso.

---

## US-11 · Socios (`/api/members`)

### GET /api/members?search=&active=&page=&size=
Elemento de `content`:

```json
{
  "uuid": "f47ac10b-...",
  "code": "S-001",
  "firstName": "María",
  "lastName": "Gómez",
  "shareNumber": "A-12",
  "stage": { "uuid": "f47ac10b-...", "name": "Socio activo" },
  "birthDate": "1990-05-14",
  "active": true
}
```

### GET /api/members/{uuid} — **Respuesta 200:** mismo objeto.

### POST /api/members — crear (Administrator)
**Body:**
```json
{
  "code": "S-001",
  "firstName": "María",
  "lastName": "Gómez",
  "shareNumber": "A-12",
  "stageUuid": "f47ac10b-...",
  "birthDate": "1990-05-14"
}
```
**Respuesta 201:** `MemberResponse` (objeto de detalle, incluye `uuid` y `stage` expandido).

### PUT /api/members/{uuid} — editar (Administrator)
Mismo body que POST · **Respuesta 200:** `MemberResponse`.

### PATCH /api/members/{uuid}/deactivate — desactivar (soft delete)
Sin body · **Respuesta 200:** `MemberResponse` con `active: false`.

---

## US-12 · Puestos (`/api/stalls`)

### GET /api/stalls?search=&active=&page=&size=
Elemento de `content`:

```json
{
  "uuid": "f47ac10b-...",
  "number": "A-01",
  "businessType": { "uuid": "f47ac10b-...", "name": "Alimentos" },
  "member": { "uuid": "f47ac10b-...", "fullName": "María Gómez" },
  "tenantName": "Juan Pérez",
  "tenantDocument": "12345678",
  "validityStartDate": "2026-01-01",
  "validityEndDate": "2026-12-31",
  "active": true
}
```

> `member` es `null` cuando el puesto no está asociado a un socio (es de un no socio / inquilino).
> `tenantName`/`tenantDocument` son opcionales.

### GET /api/stalls/{uuid} — **Respuesta 200:** mismo objeto.

### POST /api/stalls — crear (Administrator)
**Body:**
```json
{
  "number": "A-01",
  "businessTypeUuid": "f47ac10b-...",
  "memberUuid": "f47ac10b-...",
  "tenantName": "Juan Pérez",
  "tenantDocument": "12345678",
  "validityStartDate": "2026-01-01",
  "validityEndDate": "2026-12-31"
}
```
**Respuesta 201:** `StallResponse` (incluye `uuid`, refs expandidas y `active`).

### PUT /api/stalls/{uuid} — editar (Administrator)
Mismo body que POST · **Respuesta 200:** `StallResponse`.

### PATCH /api/stalls/{uuid}/deactivate — desactivar
Sin body · **Respuesta 200:** `StallResponse` con `active: false`.

---

## US-13 · Bancos (`/api/banks`)

### GET /api/banks?search=&active=&page=&size=
Elemento de `content`:

```json
{
  "uuid": "f47ac10b-...",
  "name": "Banco de la Nación",
  "accountNumber": "000123456",
  "cci": "00012345678901234567",
  "currency": { "uuid": "f47ac10b-...", "code": "PEN", "name": "Sol Peruano" },
  "active": true
}
```

### GET /api/banks/{uuid} — **Respuesta 200:** mismo objeto.

### POST /api/banks — crear (Administrator)
**Body:**
```json
{
  "name": "Banco de la Nación",
  "accountNumber": "000123456",
  "cci": "00012345678901234567",
  "currencyUuid": "f47ac10b-..."
}
```
**Respuesta 201:** `BankResponse`.

### PUT /api/banks/{uuid} — editar (Administrator)
Mismo body que POST · **Respuesta 200:** `BankResponse`.

### PATCH /api/banks/{uuid}/deactivate — desactivar
Sin body · **Respuesta 200:** `BankResponse` con `active: false`.

---

## US-14 · Proveedores (`/api/providers`)

### GET /api/providers?search=&active=&page=&size=
Elemento de `content`:

```json
{ "uuid": "f47ac10b-...", "name": "Luz del Sur", "document": "20100123456", "active": true }
```

### GET /api/providers/{uuid} — **Respuesta 200:** mismo objeto.

### POST /api/providers — crear (Administrator)
**Body:**
```json
{ "name": "Luz del Sur", "document": "20100123456" }
```
**Respuesta 201:** `ProviderResponse`.

### PUT /api/providers/{uuid} — editar (Administrator)
Mismo body que POST · **Respuesta 200:** `ProviderResponse`.

### PATCH /api/providers/{uuid}/deactivate — desactivar
Sin body · **Respuesta 200:** `ProviderResponse` con `active: false`.

---

## US-15 · Servicios cobrables (`/api/services`)

### GET /api/services?search=&active=&page=&size=
Elemento de `content`:

```json
{
  "uuid": "f47ac10b-...",
  "name": "Energía eléctrica",
  "recurrenceType": { "uuid": "f47ac10b-...", "name": "Mensual" },
  "chargeTargetType": { "uuid": "f47ac10b-...", "name": "Por puesto" },
  "currency": { "uuid": "f47ac10b-...", "code": "PEN", "name": "Sol Peruano" },
  "consumptionBased": false,
  "cost": 150.00,
  "unitCost": null,
  "active": true
}
```

> `consumptionBased: true` → servicio por consumo: el monto se calcula con lecturas (EPIC 5);
> se usa `unitCost` y `cost` viene como `null`. `consumptionBased: false` → costo fijo con `cost`
> y `unitCost` como `null`. **El campo no usado se envía como `null` (no `0`)**: lo exige el
> `CHECK ck_service_cost_by_type` de `018_service.sql`; enviar `0` provoca `400`.

### GET /api/services/{uuid} — **Respuesta 200:** mismo objeto.

### POST /api/services — crear (Administrator)
**Body:**
```json
{
  "name": "Energía eléctrica",
  "recurrenceTypeUuid": "f47ac10b-...",
  "chargeTargetTypeUuid": "f47ac10b-...",
  "currencyUuid": "f47ac10b-...",
  "consumptionBased": false,
  "cost": 150.00,
  "unitCost": null
}
```
**Respuesta 201:** `ServiceResponse`.

### PUT /api/services/{uuid} — editar (Administrator)
Mismo body que POST · **Respuesta 200:** `ServiceResponse`.

### PATCH /api/services/{uuid}/deactivate — desactivar
Sin body · **Respuesta 200:** `ServiceResponse` con `active: false`.
