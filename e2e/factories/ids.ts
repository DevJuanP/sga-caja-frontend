/** Prefijo que marca todo dato creado por la suite E2E, para poder identificarlo y
 * limpiarlo a simple vista en la base de datos (ver plan §3.3.2). */
export const E2E_PREFIX = 'E2E-';

/** ms desde epoch (13 dígitos) + 4 caracteres aleatorios: colisión prácticamente
 * imposible incluso con workers en paralelo. */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Código único truncado a `maxLength` (para campos con límite de formulario). */
export function uniqueCode(prefix: string = E2E_PREFIX, maxLength = 20): string {
  const suffix = uniqueSuffix();
  return `${prefix}${suffix}`.slice(0, maxLength);
}

/** Nombre visible único, sin límite de longitud práctico (razón social, servicio, etc.). */
export function uniqueName(label: string): string {
  return `${E2E_PREFIX}${label} ${uniqueSuffix()}`;
}

/** Fecha de hoy en formato `yyyy-MM-dd`, para períodos/documentos dinámicos (nunca fijos).
 *
 * Usa componentes de fecha LOCAL, no `toISOString()` (UTC): cerca de medianoche, UTC ya
 * puede haber rodado al día siguiente mientras el navegador/backend (misma máquina, hora
 * local) siguen en "hoy" — un filtro por fecha comparado contra `toISOString()` fallaba
 * por un día exacto en ese margen (hallazgo real de esta sesión, ver income date filter).
 */
export function todayIso(): string {
  return dateToIso(new Date());
}

function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
