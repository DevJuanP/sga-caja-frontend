# EPIC 10 — Reportes XLSX (US-26)

> Contrato de comunicación **Front ↔ Back** para descarga de reportes en Excel.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Todos requieren** `Authorization: Bearer <accessToken>` (ambos roles).
- Son **descargas de archivo binario**, NO responden JSON:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="<nombre>.xlsx"`
- El front debe consumirlos como `responseType: 'blob'` y disparar la descarga con el
  `filename` del header `Content-Disposition` (o uno propio).
- **No envían body**: solo query params.
- Todos los params son **opcionales** (si se omiten, el reporte usa el periodo vigente).
- Formato de fechas: `YYYY-MM-DD`. `month`: 1–12.
- Si ocurre error de negocio, la respuesta **también es binaria** (XLSX vacío) o un error estándar
  `{ "timestamp", "status", "error", "message", "path" }` según el caso.

---

## GET /api/reports/movements/daily?date=2026-08-13
Reporte de movimientos diarios (RF-32). `date` opcional.
Archivo: `movimientos-diarios-<fecha>.xlsx`.

## GET /api/reports/movements/monthly?year=2026&month=8
Reporte de movimientos mensuales (RF-32). `year` y `month` opcionales.
Archivo: `movimientos-mensuales-<año>-<mes>.xlsx`.

## GET /api/reports/movements/totals?date=2026-08-13
Reporte de **totales** de movimientos por día (RN-07). También acepta `?year=&month=` para totales mensuales.
Archivo: `totales-movimientos-<periodo>.xlsx`.

## GET /api/reports/members?year=2026&month=8
Reporte de CxC de **socios** (RF-33).
Archivo: `reporte-socios-<año>-<mes>.xlsx`.

## GET /api/reports/non-members?year=2026&month=8
Reporte de CxC de **no socios** (RF-33).
Archivo: `reporte-no-socios-<año>-<mes>.xlsx`.

## GET /api/reports/expenses?year=2026&month=8
Reporte de **egresos** (RF-33).
Archivo: `reporte-egresos-<año>-<mes>.xlsx`.

## GET /api/reports/banks?year=2026&month=8
Reporte de **canjes bancarios** (RF-33).
Archivo: `reporte-bancos-<año>-<mes>.xlsx`.

---

## Ejemplo de consumo en Angular (blob)

```ts
this.http.get('/api/reports/movements/daily', {
  params: { date: '2026-08-13' },
  headers: { Authorization: `Bearer ${token}` },
  responseType: 'blob',
  observe: 'response'
}).subscribe(res => {
  const filename = /* parsear 'Content-Disposition' o usar uno fijo */;
  const url = URL.createObjectURL(res.body!);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});
```
