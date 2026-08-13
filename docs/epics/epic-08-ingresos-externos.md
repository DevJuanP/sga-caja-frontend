# EPIC 8 — Ingresos externos (US-22)

> Contrato de comunicación **Front ↔ Back** para registrar/consultar ingresos externos a caja.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` y rol **`CashierOperator`** (si no → 403).
- **Requests** con `Content-Type: application/json`.
- **Paginación** en el listado (`PagedModel`): `{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.

### Forma de `IncomeResponse` (repetida en las respuestas)

```json
{
  "uuid": "f47ac10b-...",
  "receipt": { "uuid": "f47ac10b-...", "receiptTypeName": "Recibo de ingreso", "correlativeNumber": 1026, "issueDate": "2026-08-13" },
  "depositorName": "Carlos Díaz",
  "incomeCategory": { "uuid": "f47ac10b-...", "name": "Arbitrios" },
  "concept": "Pago de arbitrios",
  "amount": 50.00
}
```

> Registrar un ingreso externo **emite automáticamente un recibo** (`receipt`), que es lo que se
> muestra/imprime como comprobante (RF-25).

---

## GET /api/incomes?incomeCategoryUuid=&date=&page=&size=

**Query params (todos opcionales):** `incomeCategoryUuid`, `date` (formato `YYYY-MM-DD`), `page`, `size`.

**Respuesta 200:** `PagedModel<IncomeResponse>` (ver forma arriba).

## GET /api/incomes/{uuid}
**Respuesta 200:** `IncomeResponse` (objeto único). **Errores:** 404.

## POST /api/incomes

Registra un ingreso externo (RF-25).

**Body request:**
```json
{
  "depositorName": "Carlos Díaz",
  "incomeCategoryUuid": "f47ac10b-...",
  "concept": "Pago de arbitrios",
  "amount": 50.00
}
```

**Respuesta 201 Created:** `IncomeResponse` (incluye el `receipt` emitido).

**Errores:** 400 (validación de campos/monto ≤ 0) · 404 (categoría no existe).
