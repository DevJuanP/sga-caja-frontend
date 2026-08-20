import { Page } from '@playwright/test';
import { CURRENCY_NAMES } from '../../factories/catalogs';
import { selectMatOption } from '../masters/mat-select.util';

export interface IncomeFormData {
  depositorName: string;
  concept: string;
  amount: number;
  currencyCode: 'PEN' | 'USD';
}

export class IncomeFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fill(data: IncomeFormData): Promise<void> {
    await this.dialog.getByLabel('Nombre del depositante').fill(data.depositorName);
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Categoría de ingreso' }),
    );
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Moneda' }),
      new RegExp(CURRENCY_NAMES[data.currencyCode]),
    );
    await this.dialog.getByLabel('Concepto').fill(data.concept);
    await this.dialog.getByLabel('Monto').fill(String(data.amount));
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Registrar ingreso' }).click();
  }

  async create(data: IncomeFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
