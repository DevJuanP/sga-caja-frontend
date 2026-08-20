import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './e2e/env';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testDir: './e2e', testMatch: /.*\.setup\.ts/ },
    // Epic 1 (RF-01–RF-04) ejercita el login/logout real por UI — nunca arranca
    // con storageState, es el único lugar donde el formulario se somete de verdad.
    { name: 'auth', testDir: './e2e/tests/auth' },
    // El resto de specs vive bajo `e2e/tests/<epic>/` y reutiliza sesión ya
    // autenticada. A medida que se agreguen specs de maestros (solo Administrator)
    // o de cobranza/canjes/ingresos/egresos (solo CashierOperator) en fases
    // siguientes, cada project deberá acotar `testMatch` a su carpeta para no
    // correr specs restringidos por rol bajo el project equivocado.
    {
      name: 'admin',
      // Cobranza/canjes/ingresos/egresos son exclusivos de CashierOperator (roleGuard)
      // — admin no puede ejercitarlos (redirige a /home antes de hacer nada útil).
      testIgnore: [
        /tests[\\/]auth[\\/]/,
        /tests[\\/]payments[\\/]/,
        /tests[\\/]bank-exchanges[\\/]/,
        /tests[\\/]incomes[\\/]/,
        /tests[\\/]expenses[\\/]/,
      ],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'cashier',
      // Epic 3 · Maestros es exclusivo de Administrator (roleGuard) — cashier no puede
      // ejercitarlo (redirige a /home antes de que el spec pueda hacer nada útil).
      testIgnore: [/tests[\\/]auth[\\/]/, /tests[\\/]masters[\\/]/],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/cashier.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run start',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
