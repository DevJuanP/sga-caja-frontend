import { expect, Page } from '@playwright/test';

export class TopbarPage {
  constructor(private readonly page: Page) {}

  async expectUserName(fullName: string): Promise<void> {
    await expect(this.page.locator('.topbar__user-name')).toHaveText(fullName);
  }

  async logout(): Promise<void> {
    await this.page.getByRole('button', { name: 'Cerrar sesión' }).click();
  }
}
