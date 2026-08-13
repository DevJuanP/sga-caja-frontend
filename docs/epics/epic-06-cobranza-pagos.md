# EPIC 6 — Cobranza / Pagos (US-20)

> Contrato de comunicación **Front ↔ Back** para calcular totales, procesar pagos y emitir recibos.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` y rol **`CashierOperator`** (si no → 403).
- **Requests** con `Content-Type: application/json`.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.
- Flujo esperado en pantalla de cobro (RF-22/RF-23):
  1. Seleccionar CxC pendientes (checkboxes).
  2. `POST /api/payments/compute-total` con las CxC seleccionadas → muestra el total a cobrar.
  3. Confirmar → `POST /api/payments` (mismo body) → el back emite el recibo y responde el detalle.
  4. Para reimprimir/ver detalle → `GET /api/payments/{uuid}`.

---

## POST /api/payments/compute-total

Calcula el total de las CxC seleccionadas, **sin** crear nada (RF-22).

**Body request:**
```json
{
  "accountReceivableUuids": ["f47ac10b-...", "f47ac10b-..."]
}
```

**Respuesta 200 OK:**
```json
{
  "items": [
    { "accountReceivableUuid": "f47ac10b-...", "amount": 150.00 },
    { "accountReceivableUuid": "f47ac10b-...", "amount": 80.00 }
  ],
  "total": 230.00
}
```

**Errores:** 400 (lista vacía o UUID inválido) · 409 (alguna CxC no está pendiente).

---

## POST /api/payments

Procesa el pago de las CxC seleccionadas y emite el recibo (RF-23).

**Body request:** igual que compute-total:
```json
{
  "accountReceivableUuids": ["f47ac10b-...", "f47ac10b-..."]
}
```

**Respuesta 201 Created:**
```json
{
  "uuid": "f47ac10b-...",
  "receipt": {
    "uuid": "f47ac10b-...",
    "receiptTypeName": "Recibo de ingreso",
    "correlativeNumber": 1024,
    "issueDate": "2026-08-13",
    "amount": 230.00
  },
  "paymentDate": "2026-08-13",
  "totalAmount": 230.00,
  "details": [
    { "accountReceivableUuid": "f47ac10b-...", "amount": 150.00 },
    { "accountReceivableUuid": "f47ac10b-...", "amount": 80.00 }
  ]
}
```

> El `receipt` es lo que se muestra/imprime como comprobante (RF-23). Las CxC pagadas pasan a `status.name: "Paid"`.

**Errores:** 400 · 409 (alguna CxC no pendiente o ya pagada) · 422/conflictos de correlativo.

---

## GET /api/payments/{uuid}

Obtiene un pago por uuid (para reimprimir/ver detalle).

**Respuesta 200 OK:** `PaymentResponse` (misma forma que la respuesta de `POST /api/payments`).

**Errores:** 404 (pago no existe).
