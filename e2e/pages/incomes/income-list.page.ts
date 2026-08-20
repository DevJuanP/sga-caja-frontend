import { expect, Page } from '@playwright/test';
import { selectMatOption } from '../masters/mat-select.util';

export class IncomeListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/incomes');
  }

  async openCreate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Nuevo ingreso' }).click();
  }

  async filterByCategory(categoryName: string): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Categoría' }),
      categoryName,
    );
  }

  async filterByDate(date: string): Promise<void> {
    await this.page.getByLabel('Fecha').fill(date);
  }

  row(uniqueText: string) {
    return this.page.getByRole('row', { name: uniqueText });
  }

  async expectRowVisible(uniqueText: string): Promise<void> {
    await expect(this.row(uniqueText)).toBeVisible();
  }
}
