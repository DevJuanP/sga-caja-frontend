import { test as setup } from '@playwright/test';
import { API_URL, BASE_URL, CREDENTIALS, Role } from './env';
import { loginViaApi } from './fixtures/api-client.fixture';

/**
 * Autentica por API (no por UI) y siembra `localStorage` con el access token antes de
 * guardar el `storageState` por rol. `sessionStorage` (perfil de usuario) no forma parte
 * de `storageState` — no hace falta inyectarlo a mano: `authGuard` llama a `/auth/me` y
 * lo hidrata solo en la primera navegación protegida de cada test (ver auth.guard.ts).
 */
for (const role of Object.keys(CREDENTIALS) as Role[]) {
  setup(`authenticate as ${role}`, async ({ page, request }) => {
    const { accessToken, expiresIn } = await loginViaApi(request, role);
    const expiresAt = Date.now() + expiresIn * 1000;

    await page.addInitScript(
      ([token, expiry]) => {
        localStorage.setItem('sga_caja.accessToken', token as string);
        localStorage.setItem('sga_caja.accessTokenExpiresAt', String(expiry));
      },
      [accessToken, expiresAt],
    );
    await page.goto(BASE_URL);

    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}

void API_URL;
