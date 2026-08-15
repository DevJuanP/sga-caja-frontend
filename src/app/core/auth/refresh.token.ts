import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Indica si el fallo del refresh proactivo debe cerrar sesión y volver al login.
 * En dev (`http://localhost`) la cookie Secure del refresh no persiste, por lo que
 * el refresh no es viable; en prod el fallo puede ser transitorio y lo resuelve el
 * flujo reactivo (401 → refresh → reintento).
 */
export const DEV_REFRESH_FALLBACK = new InjectionToken<boolean>('DEV_REFRESH_FALLBACK', {
  factory: () => environment.devRefreshFallback,
});
