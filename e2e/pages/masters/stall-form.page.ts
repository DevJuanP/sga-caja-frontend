import { Page } from '@playwright/test';
import { selectMatOption } from './mat-select.util';

export interface StallFormData {
  number: string;
  businessTypeName: string;
  /** Texto único a buscar entre las opciones de "Socio" (p. ej. el código del socio). Si
   * se omite, se deja "Sin socio". */
  memberSearchText?: string;
  validityStartDate: string;
  validityEndDate: string;
}

export class StallFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fill(data: StallFormData): Promise<void> {
    await this.dialog.getByLabel('Número').fill(data.number);

    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Giro comercial' }),
      data.businessTypeName,
    );

    if (data.memberSearchText) {
      await selectMatOption(
        this.page,
        this.dialog.getByRole('combobox', { name: 'Socio' }),
        new RegExp(data.memberSearchText),
      );
    }

    await this.dialog.getByLabel('Vigencia desde').fill(data.validityStartDate);
    await this.dialog.getByLabel('Vigencia hasta').fill(data.validityEndDate);
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  }

  async create(data: StallFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
