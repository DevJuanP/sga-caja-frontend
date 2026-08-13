# EPIC 5 — Lecturas de consumo (US-19)

> Contrato de comunicación **Front ↔ Back** para registrar/consultar lecturas de servicios por consumo.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` (cualquier rol).
- **Requests** con `Content-Type: application/json`.
- Error estándar: `{ "timestamp", "status", "error", "message", "path" }`.

### Forma de `ConsumptionReadingResponse` (repetida en las 3 respuestas)

```json
{
  "uuid": "f47ac10b-...",
  "accountReceivableUuid": "f47ac10b-...",
  "initialReading": 100.0,
  "finalReading": 450.0,
  "unitCost": 0.50,
  "calculatedAmount": 175.00
}
```

> `calculatedAmount` = (final − inicial) × `unitCost` del servicio (RN-05). El registro de la
> lectura es lo que **fija el monto** de la CxC de servicio por consumo.

---

## POST /api/consumption-readings

Registra la lectura inicial/final de una CxC de consumo (RF-17).

**Body request:**
```json
{
  "accountReceivableUuid": "f47ac10b-...",
  "initialReading": 100.0,
  "finalReading": 450.0
}
```

**Respuesta 201 Created:** `ConsumptionReadingResponse` (incluye `unitCost` y `calculatedAmount`).

**Errores:** 400 (lectura final < inicial, valores negativos) · 409 (la CxC ya tiene lectura registrada
o no es un servicio por consumo).

## GET /api/consumption-readings/{uuid}

**Respuesta 200:** `ConsumptionReadingResponse`.

**Errores:** 404 (lectura no existe).

## GET /api/consumption-readings/by-account-receivable/{accountReceivableUuid}

**Respuesta 200:** `ConsumptionReadingResponse` (lectura de la CxC indicada).

**Errores:** 404 (la CxC no existe o aún no tiene lectura registrada).

> Uso en front: al abrir una CxC por consumo, llamar a este endpoint para precargar la lectura
> (o mostrar "sin lectura registrada" si responde 404).
