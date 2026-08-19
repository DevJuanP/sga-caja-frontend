const AMOUNT_FMT = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto sin símbolo de moneda (dos decimales, agrupado es-PE). */
export function formatAmount(value: number): string {
  return AMOUNT_FMT.format(value);
}
