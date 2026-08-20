import { expect, Page } from '@playwright/test';

/**
 * RNF-06 transversal (plan §5): abre un campo requerido y lo desenfoca sin llenarlo,
 * y confirma que el propio patrón de estos diálogos (`[disabled]="loading() || form.invalid"`)
 * deja "Guardar" deshabilitado — lo cual además garantiza que ningún POST/PUT puede
 * dispararse por UI, sin necesidad de interceptar la red.
 */
export async function expectRequiredFieldBlocksSave(page: Page, fieldLabel: string): Promise<void> {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(fieldLabel).click();
  await dialog.getByRole('heading').click();
  await expect(dialog.locator('mat-error').first()).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
}

export async function closeDialogIfOpen(page: Page): Promise<void> {
  const cancelButton = page.getByRole('dialog').getByRole('button', { name: 'Cancelar' });
  if (await cancelButton.isVisible().catch(() => false)) {
    await cancelButton.click();
  }
}
