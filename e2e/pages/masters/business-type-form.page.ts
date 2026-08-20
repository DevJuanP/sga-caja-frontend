import { Page } from '@playwright/test';

export class BusinessTypeFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fillName(name: string): Promise<void> {
    await this.dialog.getByLabel('Nombre').fill(name);
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  }

  async create(name: string): Promise<void> {
    await this.fillName(name);
    await this.submit();
  }
}
