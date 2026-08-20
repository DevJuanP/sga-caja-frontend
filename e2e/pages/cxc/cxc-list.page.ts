import { expect, Locator, Page } from '@playwright/test';
import { selectMatOption } from '../masters/mat-select.util';

const PATH = '/account-receivables';

export class CxcListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(PATH);
  }

  async openGenerate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Generar CxC' }).click();
  }

  async filterByService(serviceName: string): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Servicio' }),
      serviceName,
    );
  }

  async filterByMember(memberFullNameRegex: RegExp): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Socio' }),
      memberFullNameRegex,
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

  async clearFilters(): Promise<void> {
    await this.page.getByRole('button', { name: 'Limpiar' }).click();
  }

  row(uniqueText: string): Locator {
    return this.page.getByRole('row', { name: uniqueText });
  }

  async expectRowVisible(uniqueText: string): Promise<void> {
    await expect(this.row(uniqueText)).toBeVisible();
  }

  async expectRowHidden(uniqueText: string): Promise<void> {
    await expect(this.row(uniqueText)).toHaveCount(0);
  }

  async openReading(uniqueText: string): Promise<void> {
    await this.row(uniqueText).getByRole('button', { name: 'Lectura' }).click();
  }

  async exempt(uniqueText: string): Promise<void> {
    await this.row(uniqueText).getByRole('button', { name: 'Exonerar' }).click();
  }

  /** `openSummary()` en el componente usa `window.open(..., '_blank')` — hay que
   * capturar el evento `popup` de Playwright, no una navegación normal. */
  async openSummaryInNewTab(): Promise<Page> {
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.page.getByRole('button', { name: 'Ver resumen' }).click(),
    ]);
    await popup.waitForLoadState();
    return popup;
  }

  async clickSummaryWithoutFilter(): Promise<void> {
    await this.page.getByRole('button', { name: 'Ver resumen' }).click();
  }
}
