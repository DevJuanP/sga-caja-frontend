import { Page } from '@playwright/test';

export class ConsumptionReadingDialogPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async register(initialReading: number, finalReading: number): Promise<void> {
    await this.dialog.getByLabel('Lectura inicial').fill(String(initialReading));
    await this.dialog.getByLabel('Lectura final').fill(String(finalReading));
    await this.dialog.getByRole('button', { name: 'Registrar', exact: true }).click();
  }

  fieldValue(label: string) {
    return this.dialog.locator('.reading-field', { hasText: label }).locator('.reading-value');
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cerrar' }).click();
  }
}
