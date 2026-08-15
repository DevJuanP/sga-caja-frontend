# EPIC 4 — Cuentas por cobrar (CxC) (US-16, US-17, US-18)

> Contrato de comunicación **Front ↔ Back** para consulta, generación, exoneración y resumen de CxC.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>`.
- **Requests** con `Content-Type: application/json`.
- Listar/generar/summary: **cualquier rol** autenticado.
- `PATCH /{uuid}/exempt`: rol **`CashierOperator`** (si no → 403).
- **Paginación** en el listado (`PagedModel`): `{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.

### Forma de `AccountReceivableResponse` (repetida en varias respuestas)

```json
{
  "uuid": "f47ac10b-...",
  "service": { "uuid": "f47ac10b-...", "name": "Energía eléctrica", "consumptionBased": false },
  "member": { "uuid": "f47ac10b-...", "fullName": "María Gómez" },
  "stall": { "uuid": "f47ac10b-...", "number": "A-01" },
  "periodStartDate": "2026-08-01",
  "periodEndDate": "2026-08-31",
  "amount": 150.00,
  "status": { "uuid": "f47ac10b-...", "name": "Pending" }
}
```

> `member` o `stall` pueden ser `null` según a quién se cargó la CxC.
> `status.name` ∈ `Pending` · `Paid` · `Exempt` (RN-03).

---

## US-16 · Consultar CxC y su detalle

### GET /api/account-receivables?serviceUuid=&memberUuid=&stallUuid=&page=&size=

**Query params (todos opcionales):** `serviceUuid`, `memberUuid`, `stallUuid`, `page`, `size`.

**Respuesta 200:** `PagedModel<AccountReceivableResponse>` (ver forma arriba).

### GET /api/account-receivables/{uuid}
**Respuesta 200:** `AccountReceivableResponse` (objeto único).

---

## US-17 · Generar CxC

### POST /api/account-receivables/generate-by-stall
Genera CxC de un servicio para **todos los puestos activos**.

**Body:**
```json
{
  "serviceUuid": "f47ac10b-...",
  "periodStartDate": "2026-08-01",
  "periodEndDate": "2026-08-31",
  "amount": 150.00
}
```

> `amount` **obligatorio** si el servicio es de costo fijo; **omitirlo** (no enviar el campo)
> si el servicio es por consumo (se calcula con lecturas).

**Respuesta 201 Created** — arreglo de CxC generadas:

```json
[ { "uuid": "f47ac10b-...", "service": { "uuid": "f47ac10b-...", "name": "Energía eléctrica", "consumptionBased": false },
    "member": null, "stall": { "uuid": "f47ac10b-...", "number": "A-01" },
    "periodStartDate": "2026-08-01", "periodEndDate": "2026-08-31", "amount": 150.00,
    "status": { "uuid": "f47ac10b-...", "name": "Pending" } } ]
```

### POST /api/account-receivables/generate-by-member
Genera CxC para **socios activos**, filtrables por etapa.

**Body:**
```json
{
  "serviceUuid": "f47ac10b-...",
  "periodStartDate": "2026-08-01",
  "periodEndDate": "2026-08-31",
  "amount": 150.00,
  "stageCodes": [1, 2],
  "uniqueMembers": true
}
```

> - `amount`: obligatorio para costo fijo; **omitir** si es por consumo.
> - `stageCodes`: **obligatorio**, lista de códigos de etapa (usa `code` de `GET /api/stages`).
> - `uniqueMembers`: `true` limita socios repetidos por nombre y apellido (RN-06).

**Respuesta 201 Created** — arreglo de `AccountReceivableResponse` (idéntico al de stall).

### GET /api/account-receivables/summary?memberUuid=&stallUuid=
Resumen de CxC + movimientos que las liquidaron (RF-26).

**Query params:** `memberUuid` **o** `stallUuid` (al menos uno).

**Respuesta 200** — arreglo:

```json
[
  {
    "accountReceivable": { "uuid": "f47ac10b-...", "service": { "uuid": "f47ac10b-...", "name": "Energía eléctrica", "consumptionBased": false },
      "member": { "uuid": "f47ac10b-...", "fullName": "María Gómez" }, "stall": null,
      "periodStartDate": "2026-08-01", "periodEndDate": "2026-08-31", "amount": 150.00,
      "status": { "uuid": "f47ac10b-...", "name": "Paid" } },
    "settlementMethod": "PAYMENT",
    "settledDate": "2026-08-15",
    "receiptCorrelative": 1024
  }
]
```

> `settlementMethod`: `"PAYMENT"` (pago en caja) o `"BANK_EXCHANGE"` (canje bancario);
> `null` si la CxC sigue pendiente. `receiptCorrelative` es el correlativo del comprobante que la liquidó.

**Errores:** 400 (falta `memberUuid` y `stallUuid`) · 404 (no hay movimientos / recurso no existe).

---

## US-18 · Exonerar CxC pendiente (CashierOperator)

### PATCH /api/account-receivables/{uuid}/exempt
Sin body.

**Respuesta 200:** `AccountReceivableResponse` con `status.name: "Exempt"`.

**Errores:** 409 si la CxC no está `Pending` (no se puede exonerar una ya pagada/exonerada).
