# EPIC 1 — Autenticación y sesión (US-01)

> Contrato de comunicación **Front ↔ Back** para Login, refresco de sesión, logout y perfil.
> Base URL: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
> Especificación definitiva del backend: [`API.md`](../API.md).

## Convenciones

- **Estos 3 endpoints son públicos** (no requieren `Authorization`): `login`, `refresh`, `logout`.
- El `refreshToken` se entrega/renueva vía **cookie httpOnly** (nunca viaja en el body):
  - Nombre: `refreshToken` · Path: `/api/auth` · `HttpOnly` · `Secure` · `SameSite=Lax`.
  - En dev sobre `http://localhost` la cookie **no se guarda** por el flag `Secure`. Implementado:
    el front hace refresh **proactivo** (margen 30 s antes de `expiresIn`) y **reactivo** (401 → refresh → reintento);
    si el refresh falla y `devRefreshFallback` está activo (dev), cierra sesión y redirige a `/login`;
    en prod el fallo proactivo se ignora y el flujo reactivo resuelve la sesión.
- TTL: access token **15 min** (`expiresIn: 900`) · refresh token **60 min** (cookie `Max-Age=3600`).
- Respuesta de error estándar (siempre con el status HTTP correspondiente):

```json
{ "timestamp": "2026-08-13T18:00:00Z", "status": 401, "error": "AUTH_INVALID_CREDENTIALS",
  "message": "Credenciales inválidas", "path": "/api/auth/login" }
```

---

## POST /api/auth/login

Inicia sesión con usuario y contraseña.

**Headers request:** `Content-Type: application/json`

**Body request:**

```json
{
  "username": "cajero1",
  "password": "Secreto123!"
}
```

**Respuesta 200 OK** — body (JSON directo, sin envoltorio):

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "uuid": "3f2c0a1b-...",
    "username": "cajero1",
    "firstName": "Luis",
    "lastName": "Torres",
    "roleName": "CashierOperator"
  }
}
```

**Headers response:** `Set-Cookie: refreshToken=<valor>; Path=/api/auth; Max-Age=3600; Expires=...; HttpOnly; Secure; SameSite=Lax`

**Errores:** 401 (credenciales inválidas) · 400 (body inválido).

> El front debe guardar `accessToken` (p. ej. en memoria/localStorage) y usarlo como
> `Authorization: Bearer <accessToken>` en el resto de la app. El `user` sirve para guard de rutas.

---

## POST /api/auth/refresh

Renueva el access token usando el refresh token de la cookie.

**Headers request:** la cookie `refreshToken` se envía automáticamente por el navegador (path `/api/auth`). Sin body.

**Respuesta 200 OK** — misma estructura que login:

```json
{
  "accessToken": "<nuevo-jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": { "uuid": "3f2c0a1b-...", "username": "cajero1", "firstName": "Luis", "lastName": "Torres", "roleName": "CashierOperator" }
}
```

**Headers response:** `Set-Cookie: refreshToken=<nuevo valor>` (renueva la cookie).

**Errores:** 401 (cookie ausente/vencida/expirada).

> Uso: interceptor HTTP que, ante `401` en una petición, llama a `/refresh` y reintenta la original.

---

## POST /api/auth/logout

Cierra sesión y revoca el refresh token.

**Headers request:** la cookie `refreshToken` (si existe). Sin body.

**Respuesta 204 No Content** — sin body.

**Headers response:** `Set-Cookie: refreshToken=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax` (elimina la cookie).

**Errores:** 401 (refresh token inválido).

---

## GET /api/auth/me

Obtiene la identidad del usuario autenticado.

**Headers request:** `Authorization: Bearer <accessToken>`

**Respuesta 200 OK** — body:

```json
{
  "uuid": "3f2c0a1b-...",
  "username": "cajero1",
  "firstName": "Luis",
  "lastName": "Torres",
  "roleName": "CashierOperator"
}
```

**Errores:** 401 (sin token / token inválido) · 404 (usuario no encontrado).

> `roleName` permite: `Administrator` (configuración y maestros) y `CashierOperator` (caja).
> Se usa para ocultar/mostrar menús y redirigir según rol.
