# EPIC 7 — Canjes bancarios (US-21)

> Contrato de comunicación **Front ↔ Back** para canjear CxC de socios por operaciones bancarias.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` y rol **`CashierOperator`** (si no → 403).
- **Requests** con `Content-Type: application/json`.
- **Paginación** en el listado (`PagedModel`): `{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.

### Forma de `BankExchangeResponse` (repetida en las respuestas)

```json
{
  "uuid": "f47ac10b-...",
  "accountReceivable": {
    "uuid": "f47ac10b-...",
    "service": { "uuid": "f47ac10b-...", "name": "Alquiler de puesto", "consumptionBased": false },
    "member": { "uuid": "f47ac10b-...", "fullName": "María Gómez" },
    "stall": null,
    "periodStartDate": "2026-08-01",
    "periodEndDate": "2026-08-31",
    "amount": 150.00,
    "status": { "uuid": "f47ac10b-...", "name": "Paid" }
  },
  "bank": { "uuid": "f47ac10b-...", "name": "Banco de la Nación" },
  "receipt": { "uuid": "f47ac10b-...", "receiptTypeName": "Recibo de ingreso", "correlativeNumber": 1025, "issueDate": "2026-08-13" },
  "depositDate": "2026-08-13",
  "amount": 150.00
}
```

> El canje equivale a liquidar la CxC (pasa a `status.name: "Paid"`) y emite su comprobante.
> El `receipt` embebido alimenta el **voucher** que se visualiza desde el listado (RF-31).

---

## GET /api/bank-exchanges?bankUuid=&date=&page=&size=

**Query params (todos opcionales):** `bankUuid`, `date` (formato `YYYY-MM-DD`), `page`, `size`.

**Respuesta 200:** `PagedModel<BankExchangeResponse>` (ver forma arriba).

## GET /api/bank-exchanges/{uuid}
**Respuesta 200:** `BankExchangeResponse` (objeto único). **Errores:** 404.

## POST /api/bank-exchanges

Canjea una CxC de socio por una operación bancaria (RF-24).

**Body request:**
```json
{
  "accountReceivableUuid": "f47ac10b-...",
  "bankUuid": "f47ac10b-...",
  "depositDate": "2026-08-13"
}
```

**Respuesta 201 Created:** `BankExchangeResponse`.

**Errores:** 404 (CxC o banco no existen) · 409 (CxC no pendiente, o no corresponde a un socio, o ya canjeada).
