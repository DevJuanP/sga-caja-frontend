import { HttpParamsInput } from '../../../interfaces/common.interface';
import { catchError, Observable, of } from 'rxjs';

export interface KpiCard {
  label: string;
  value: string | number;
  icon: string;
  route?: string;
  routeQueryParams?: Record<string, string>;
}

export interface Shortcut {
  label: string;
  route: string;
  icon: string;
}

export interface PendingCxc {
  uuid: string;
  serviceName: string;
  memberName?: string;
  stallNumber?: string;
  amount: number;
  period: string;
  route: string;
}

/** Llama a un endpoint y devuelve fallback si falla (nunca rompe la UI). */
export function safeGet<T, F = T>(obs: Observable<T>, fallback: F): Observable<T | F> {
  return obs.pipe(catchError(() => of(fallback)));
}

/** Construye HttpParamsInput desde un objeto plano (omite undefined). */
export function toHttpParams(obj: Record<string, string | number | boolean | undefined>): HttpParamsInput {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

/** Formatea fecha YYYY-MM-DD para params de API. */
export function todayParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
