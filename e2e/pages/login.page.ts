import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.getByLabel('Usuario').fill(username);
    await this.page.getByLabel('Contraseña').fill(password);
    await this.page.getByRole('button', { name: 'Ingresar al Sistema' }).click();
  }

  async expectErrorMessage(): Promise<void> {
    await expect(this.page.getByRole('alert')).toBeVisible();
  }
}
