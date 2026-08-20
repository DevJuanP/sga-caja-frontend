import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { TopbarPage } from '../../pages/topbar.page';

test.describe('Epic 1 · Autenticación y sesión (RF-01–RF-04)', () => {
  test('4.1.1 login exitoso como admin redirige a maestros y muestra su nombre', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'Admin123!');

    await expect(page).toHaveURL(/\/masters\/members$/);
    await new TopbarPage(page).expectUserName('Admin Dev');
  });

  test('4.1.2 login exitoso como cashier redirige a cobranza', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('cashier', 'Cashier123!');

    await expect(page).toHaveURL(/\/payments$/);
    await new TopbarPage(page).expectUserName('Cashier Dev');
  });

  test('4.1.3 credenciales inválidas muestran error y no redirige ni guarda token', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'clave-incorrecta');

    await loginPage.expectErrorMessage();
    await expect(page).toHaveURL(/\/login$/);
    const accessToken = await page.evaluate(() => localStorage.getItem('sga_caja.accessToken'));
    expect(accessToken).toBeNull();
  });

  test('4.1.4 acceso sin sesión a ruta protegida redirige a login', async ({ page }) => {
    await page.goto('/masters/members');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('4.1.5 logout limpia la sesión y vuelve a proteger las rutas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'Admin123!');
    await expect(page).toHaveURL(/\/masters\/members$/);

    await new TopbarPage(page).logout();

    await expect(page).toHaveURL(/\/login$/);
    const accessToken = await page.evaluate(() => localStorage.getItem('sga_caja.accessToken'));
    expect(accessToken).toBeNull();

    await page.goto('/masters/members');
    await expect(page).toHaveURL(/\/login$/);
  });
});
