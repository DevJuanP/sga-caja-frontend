import { expect, Page } from '@playwright/test';

export class PaymentDialogPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async expectSummary(currencyCode: string, total: string): Promise<void> {
    await expect(this.dialog.getByText(currencyCode, { exact: true })).toBeVisible();
    await expect(this.dialog.getByText(total, { exact: true })).toBeVisible();
  }

  async confirmAndPay(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Confirmar y pagar' }).click();
  }

  async expectReceiptCurrency(currencyCode: string): Promise<void> {
    await expect(this.dialog.getByText(currencyCode)).toBeVisible();
  }

  receiptCorrelative() {
    return this.dialog.locator('.receipt-number .value');
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cerrar' }).click();
  }
}
