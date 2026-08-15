# EPIC 2 — Catálogos de solo lectura (US-02 … US-09)

> Contrato de comunicación **Front ↔ Back** para los catálogos que alimentan los *selects*.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` (cualquier rol).
- **Respuesta de listado** → arreglo JSON simple, **sin paginación**:

```json
[ { "uuid": "...", "name": "..." } ]
```

- **Respuesta de detalle** `GET /{uuid}` → objeto único en el body (idéntico al elemento del arreglo).
- **Ninguno envía body** en las peticiones (solo GET).
- `GET /{uuid}` es **opcional**: no se necesita para alimentar selects; útil para precargar un valor guardado.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.

---

## GET /api/currencies — Monedas (US-02)

Forma del elemento:

```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "code": "PEN",
  "name": "Sol Peruano"
}
```

- `code`: código corto (PEN / USD) — útil para etiquetas y formato de moneda.

## GET /api/stages — Etapas de socio (US-03)

Forma del elemento (¡incluye `code` numérico!):

```json
{
  "uuid": "f47ac10b-...",
  "code": 1,
  "name": "Socio activo"
}
```

- `code`: valor `short` — **se usa para el filtro `stageCodes`** al generar CxC por socios (ver EPIC 4).

## GET /api/recurrence-types — Tipos de recurrencia (US-04)

```json
{ "uuid": "f47ac10b-...", "name": "Mensual" }
```

## GET /api/receipt-types — Tipos de comprobante (US-05)

```json
{ "uuid": "f47ac10b-...", "name": "Recibo de ingreso" }
```

## GET /api/income-categories — Categorías de ingreso (US-06)

```json
{ "uuid": "f47ac10b-...", "name": "Arbitrios" }
```

## GET /api/expense-reasons — Motivos de egreso (US-07)

```json
{ "uuid": "f47ac10b-...", "name": "Mantenimiento" }
```

## GET /api/charge-target-types — Destino de cobro / Cargo a (US-08)

```json
{ "uuid": "f47ac10b-...", "name": "Por puesto" }
```

## GET /api/account-receivable-statuses — Estados de CxC (US-09)

```json
{ "uuid": "f47ac10b-...", "name": "Pending" }
```

Valores esperados (sembrados por migración, RN-03): `Pending` · `Paid` · `Exempt`.

## GET /api/expense-statuses — Estados de egreso (US-09)

```json
{ "uuid": "f47ac10b-...", "name": "Pending" }
```

Valores esperados: `Pending` · `Processed` · `Voided` (ver EPIC 9).

---

## GET /{uuid} — Detalle (común a todos los catálogos)

**Headers request:** `Authorization: Bearer <accessToken>`

**Respuesta 200 OK** — objeto único (misma forma que el elemento del listado).

**Errores:** 404 (uuid no existe) · 401 (sin token).
