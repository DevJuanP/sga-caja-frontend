import { expect, Page } from '@playwright/test';
import { selectMatOption } from '../masters/mat-select.util';

/** `/payments` — dos pestañas (Por puestos / Por socios) sobre `app-cxc-selection`
 * (checkboxes nativos sin `aria-label` propio para "seleccionar" — solo la columna
 * "Exonerar" lo tiene — así que la fila se localiza por texto único y el checkbox de
 * selección se toma por posición). */
export class PaymentsListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/payments');
  }

  async goToStallTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Por puestos' }).click();
  }

  async goToMemberTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Por socios' }).click();
  }

  async filterByService(serviceName: string): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Servicio' }),
      serviceName,
    );
  }

  async filterByStall(stallNumber: string): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Puesto' }),
      stallNumber,
      true,
    );
  }

  async filterByMember(memberFullNameRegex: RegExp): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Socio' }),
      memberFullNameRegex,
    );
  }

  row(uniqueText: string) {
    return this.page.getByRole('row', { name: uniqueText });
  }

  /** El checkbox de "seleccionar" es la primera celda de la fila (sin aria-label). */
  async selectRow(uniqueText: string): Promise<void> {
    await this.row(uniqueText).getByRole('checkbox').first().click();
  }

  async markExempt(uniqueText: string): Promise<void> {
    await this.row(uniqueText).getByLabel('Marcar cuenta como exonerada').click();
  }

  async computeTotal(): Promise<void> {
    await this.page.getByRole('button', { name: 'Calcular total' }).click();
  }

  async exemptSelected(): Promise<void> {
    await this.page.getByRole('button', { name: 'Exonerar seleccionadas' }).click();
  }

  async expectTotal(currencyCode: string, amount: string): Promise<void> {
    await expect(this.page.getByText(`Total a cobrar: ${currencyCode} ${amount}`)).toBeVisible();
  }
}
