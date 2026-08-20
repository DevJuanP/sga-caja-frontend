import { expect, Locator, Page } from '@playwright/test';
import { selectMatOption } from './mat-select.util';

/**
 * Page Object genérico para las 5 pantallas de maestros paginadas (member, stall,
 * service, bank, provider) — comparten `app-filter-bar` + `app-crud-table` con el mismo
 * comportamiento (plan §3.5: un Page Object por pantalla, pero estas 5 son idénticas en
 * mecánica y solo difieren en columnas/labels, así que una sola clase parametrizada
 * evita duplicar 5 veces el mismo código).
 *
 * Nunca asume "la tabla tiene N filas": todo método localiza filas por el texto único
 * (`E2E-...`) que trae el propio test (plan §3.3.4).
 */
export class CrudListPage {
  constructor(
    protected readonly page: Page,
    private readonly path: string,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  async clickCreate(buttonName: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonName }).click();
  }

  /** Espera el debounce de búsqueda (300ms) implícitamente vía auto-retry de `expect`. */
  async search(text: string): Promise<void> {
    await this.page.getByLabel('Buscar').fill(text);
  }

  async setActiveFilter(value: 'Todos' | 'Activos' | 'Inactivos'): Promise<void> {
    await selectMatOption(
      this.page,
      this.page.getByRole('combobox', { name: 'Estado' }),
      value,
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

  async clickRowAction(uniqueText: string, actionLabel: string): Promise<void> {
    await this.row(uniqueText).getByRole('button', { name: actionLabel }).click();
  }
}
