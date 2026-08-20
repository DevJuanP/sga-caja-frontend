import { Page } from '@playwright/test';
import { CURRENCY_NAMES } from '../../factories/catalogs';
import { selectMatOption } from './mat-select.util';

export interface BankFormData {
  name: string;
  accountNumber: string;
  cci: string;
  currencyCode: 'PEN' | 'USD';
}

export class BankFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fill(data: BankFormData): Promise<void> {
    await this.dialog.getByLabel('Nombre').fill(data.name);
    await this.dialog.getByLabel('Nº de cuenta').fill(data.accountNumber);
    await this.dialog.getByLabel('CCI').fill(data.cci);
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Moneda' }),
      CURRENCY_NAMES[data.currencyCode],
    );
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  }

  async create(data: BankFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
