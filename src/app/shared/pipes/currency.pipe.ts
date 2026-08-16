import { Pipe, PipeTransform } from '@angular/core';

const SYMBOLS: Record<string, string> = { PEN: 'S/', USD: 'US$' };

/**
 * Formatea un monto con la moneda indicada (PEN/USD). Montos siempre con
 * `tabular-nums` (ver DESIGN §3.1) — el pipe devuelve el texto formateado.
 */
@Pipe({ name: 'currency' })
export class CurrencyPipe implements PipeTransform {
  private readonly numberFormat = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(value: number | null | undefined, code = 'PEN'): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return `${SYMBOLS[code] ?? code} ${this.numberFormat.format(value)}`;
  }
}
