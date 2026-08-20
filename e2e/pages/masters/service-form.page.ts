import { Page } from '@playwright/test';
import { CURRENCY_NAMES } from '../../factories/catalogs';
import { selectMatOption } from './mat-select.util';

export interface ServiceFormData {
  name: string;
  currencyCode: 'PEN' | 'USD';
  consumptionBased: boolean;
  /** Costo fijo (si `consumptionBased` es `false`) o costo por unidad (si es `true`). */
  amount: number;
}

export class ServiceFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fill(data: ServiceFormData): Promise<void> {
    await this.dialog.getByLabel('Nombre').fill(data.name);

    await selectMatOption(this.page, this.dialog.getByRole('combobox', { name: 'Recurrencia' }));
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Tipo de cobro' }),
    );
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Moneda' }),
      CURRENCY_NAMES[data.currencyCode],
    );

    const checkbox = this.dialog.getByRole('checkbox', { name: /Cobro por consumo/ });
    if ((await checkbox.isChecked()) !== data.consumptionBased) {
      await checkbox.click();
    }

    const amountLabel = data.consumptionBased ? 'Costo por unidad' : 'Costo fijo';
    await this.dialog.getByLabel(amountLabel).fill(String(data.amount));
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  }

  async create(data: ServiceFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
