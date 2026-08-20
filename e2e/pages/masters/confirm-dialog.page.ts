import { Page } from '@playwright/test';

/** `app-confirm-dialog` — usado por activar/desactivar/eliminar en las 6 pantallas de
 * maestros. Se acota a `getByRole('dialog')` porque el botón de la fila que abrió el
 * diálogo (mismo `label`, p. ej. "Desactivar") sigue en el DOM detrás del overlay. */
export class ConfirmDialogPage {
  constructor(private readonly page: Page) {}

  async confirm(confirmLabel: string): Promise<void> {
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: confirmLabel, exact: true })
      .click();
  }

  async cancel(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  }
}
