import { expect, Locator, Page } from '@playwright/test';

/**
 * Abre un `mat-select` y elige una opción, esperando a que el overlay se cierre del
 * todo antes de devolver el control.
 *
 * Dos problemas reales de Angular Material + Playwright motivan esto:
 * 1. El `mat-label` flotante (aún sin subir, campo vacío/sin foco) queda geométricamente
 *    sobre el trigger y Playwright lo detecta como "intercepta pointer events" — de ahí
 *    `{ force: true }` en el click de apertura.
 * 2. Si se encadena la apertura de un segundo `mat-select` inmediatamente después de
 *    cerrar el primero, el backdrop del overlay anterior puede seguir en su animación
 *    de salida (~200ms) y capturar el click real (el `force` de Playwright salta su
 *    propio chequeo, pero el navegador igual entrega el evento a lo que esté encima).
 *    Por eso se espera a que `role=listbox` desaparezca del todo antes de continuar.
 * 3. Bajo carga (varios workers en paralelo contra el mismo `ng serve` en modo dev), el
 *    `force: true` puede disparar el click antes de que Angular termine de posicionar el
 *    overlay — el click "se pierde" y el panel nunca abre. Se reintenta la apertura si
 *    `role=listbox` no aparece en una ventana corta, en vez de esperar los 30s completos
 *    del timeout por defecto y fallar. Si el trigger ya quedó `aria-expanded="true"` (el
 *    click sí abrió, pero el panel tarda en pintarse — p. ej. un `mat-select` con cientos
 *    de opciones, como el de CxC pendientes) NO se vuelve a hacer click: un segundo click
 *    solo cerraría el panel que ya estaba abriéndose.
 */
export async function selectMatOption(
  page: Page,
  trigger: Locator,
  optionName?: string | RegExp,
  exact = false,
): Promise<void> {
  const listbox = page.getByRole('listbox');
  for (let attempt = 1; attempt <= 3; attempt++) {
    const alreadyOpen = (await trigger.getAttribute('aria-expanded')) === 'true';
    if (!alreadyOpen) {
      await trigger.click({ force: true });
    }
    try {
      await expect(listbox).toBeVisible({ timeout: 5000 });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
  const option = optionName
    ? page.getByRole('option', { name: optionName, exact })
    : page.getByRole('option').first();
  await option.click();
  await expect(listbox).toHaveCount(0);
}
