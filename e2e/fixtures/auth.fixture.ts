import { Page } from '@playwright/test';
import { CREDENTIALS } from '../env';
import { LoginPage } from '../pages/login.page';

/** Login real por UI (formulario) — usado únicamente por el spec de autenticación
 * (plan §3.4: es el único lugar donde se ejercita el submit del login). El resto de
 * specs evita repetir este flujo reutilizando el `storageState` por rol de los
 * proyectos `admin`/`cashier` (ver `e2e/auth.setup.ts` y `playwright.config.ts`). */
export async function loginAsAdminViaUi(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(CREDENTIALS.admin.username, CREDENTIALS.admin.password);
}

export async function loginAsCashierViaUi(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(CREDENTIALS.cashier.username, CREDENTIALS.cashier.password);
}
