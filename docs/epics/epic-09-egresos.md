# EPIC 9 — Egresos (US-23, US-24, US-25)

> Contrato de comunicación **Front ↔ Back** para registrar, consultar, cargar en masa, anular y procesar egresos.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` y rol **`CashierOperator`** (si no → 403).
- **JSON** con `Content-Type: application/json`; la **carga masiva** usa `multipart/form-data`.
- **Paginación** en el listado (`PagedModel`): `{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.

### Forma de `ExpenseResponse` (repetida en las respuestas)

```json
{
  "uuid": "f47ac10b-...",
  "documentNumber": "F001-000123",
  "provider": { "uuid": "f47ac10b-...", "name": "Luz del Sur" },
  "expenseDate": "2026-08-13",
  "amount": 120.50,
  "associatedDocument": "Recibo N° 2026-00001",
  "expenseReason": { "uuid": "f47ac10b-...", "name": "Mantenimiento" },
  "status": { "uuid": "f47ac10b-...", "name": "Pending" },
  "receipt": { "uuid": "f47ac10b-...", "receiptTypeName": "Comprobante de egreso", "correlativeNumber": 5001, "issueDate": "2026-08-13" },
  "bulkUpload": { "uuid": "f47ac10b-...", "fileName": "egresos-2026-08.xlsx" },
  "createdBy": { "uuid": "f47ac10b-...", "username": "cajero1" }
}
```

> - `status.name` ∈ `Pending` · `Processed` · `Voided`.
> - `receipt` solo existe tras **procesar** el egreso (null mientras esté pendiente) y alimenta
>   el **voucher**/comprobante que se visualiza desde el listado (RF-30).
> - `bulkUpload` solo existe para egresos creados por **carga masiva** (null en registro individual).

---

## US-23 · Registrar y consultar egresos

### GET /api/expenses?year=&month=&page=&size=

**Query params (todos opcionales):** `year` (p. ej. 2026), `month` (1–12), `page`, `size`.

**Respuesta 200:** `PagedModel<ExpenseResponse>` (ver forma arriba).

### GET /api/expenses/{uuid}
**Respuesta 200:** `ExpenseResponse` (objeto único). **Errores:** 404.

### POST /api/expenses

Registra un egreso individual (RF-27).

**Body request:**
```json
{
  "documentNumber": "F001-000123",
  "providerUuid": "f47ac10b-...",
  "expenseDate": "2026-08-13",
  "amount": 120.50,
  "associatedDocument": "Recibo N° 2026-00001",
  "expenseReasonUuid": "f47ac10b-..."
}
```

**Respuesta 201 Created:** `ExpenseResponse` con `status.name: "Pending"` (aún **sin** `receipt`).

**Errores:** 400 (validación/monto ≤ 0) · 404 (proveedor o motivo no existen).

---

## US-24 · Carga masiva desde XLSX

### POST /api/expenses/bulk-upload

Sube un archivo XLSX con egresos (RF-28).

**Headers request:** `Authorization: Bearer <accessToken>` · `Content-Type: multipart/form-data`

**Form data:** campo `file` (obligatorio) con el archivo XLSX (campo **archivo binario**, no JSON).

**Respuesta 201 Created** — arreglo de `ExpenseResponse` (todas con `bulkUpload` poblado):

```json
[ { "uuid": "f47ac10b-...", "documentNumber": "F001-000123", "provider": { "uuid": "f47ac10b-...", "name": "Luz del Sur" },
    "expenseDate": "2026-08-13", "amount": 120.50, "associatedDocument": null,
    "expenseReason": { "uuid": "f47ac10b-...", "name": "Mantenimiento" },
    "status": { "uuid": "f47ac10b-...", "name": "Pending" }, "receipt": null,
    "bulkUpload": { "uuid": "f47ac10b-...", "fileName": "egresos-2026-08.xlsx" },
    "createdBy": { "uuid": "f47ac10b-...", "username": "cajero1" } } ]
```

**Errores:** 400 (`EXPENSE_FILE_READ_ERROR` si no se puede leer el archivo) · errores por fila se reportan en `message`.

---

## US-25 · Anular y procesar egresos

### PATCH /api/expenses/{uuid}/void
Anula un egreso **pendiente** (RF-30). Sin body.

**Respuesta 200:** `ExpenseResponse` con `status.name: "Voided"`.

**Errores:** 409 si el egreso no está `Pending`.

### PATCH /api/expenses/{uuid}/process
Procesa un egreso **pendiente** y emite su comprobante (RF-30). Sin body.

**Respuesta 200:** `ExpenseResponse` con `status.name: "Processed"` y `receipt` poblado.

**Errores:** 409 si el egreso no está `Pending`.
