import { expect, Page } from '@playwright/test';
import { selectMatOption } from '../masters/mat-select.util';

export class BankExchangeListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/bank-exchanges');
  }

  async openCreate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Nuevo canje' }).click();
  }

  async filterByBank(bankName: string): Promise<void> {
    await selectMatOption(this.page, this.page.getByRole('combobox', { name: 'Banco' }), bankName);
  }

  async filterByDate(date: string): Promise<void> {
    await this.page.getByLabel('Fecha de depósito').fill(date);
  }

  row(uniqueText: string) {
    return this.page.getByRole('row', { name: uniqueText });
  }

  async expectRowVisible(uniqueText: string): Promise<void> {
    await expect(this.row(uniqueText)).toBeVisible();
  }

  async viewVoucher(uniqueText: string): Promise<void> {
    await this.row(uniqueText).getByRole('button', { name: 'Ver voucher' }).click();
  }
}
