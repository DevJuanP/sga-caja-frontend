import { Page } from '@playwright/test';

export interface ProviderFormData {
  name: string;
  document: string;
}

export class ProviderFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fill(data: ProviderFormData): Promise<void> {
    await this.dialog.getByLabel('Nombre').fill(data.name);
    await this.dialog.getByLabel('Documento (RUC/DNI)').fill(data.document);
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  }

  async create(data: ProviderFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
