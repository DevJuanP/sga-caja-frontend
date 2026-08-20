import { APIRequestContext, request as playwrightRequest, test as base } from '@playwright/test';
import { API_URL, CREDENTIALS, Role } from '../env';

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: { uuid: string; username: string; firstName: string; lastName: string; roleName: string };
}

/** Login por API contra `/auth/login` — usado tanto por el setup de storageState
 * (§3.4) como por las factories que necesitan un `APIRequestContext` autenticado. */
export async function loginViaApi(ctx: APIRequestContext, role: Role): Promise<LoginResult> {
  const response = await ctx.post(`${API_URL}/api/auth/login`, {
    data: CREDENTIALS[role],
  });
  if (!response.ok()) {
    throw new Error(`Login como "${role}" falló: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

/** Crea un `APIRequestContext` con el `Authorization: Bearer` ya fijado para todas
 * las requests salientes, apuntando directo al backend (no a `baseURL` del front). */
async function newAuthenticatedContext(role: Role): Promise<APIRequestContext> {
  const anonymous = await playwrightRequest.newContext({ baseURL: API_URL });
  const { accessToken } = await loginViaApi(anonymous, role);
  await anonymous.dispose();
  return playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });
}

export const test = base.extend<{ apiAdmin: APIRequestContext; apiCashier: APIRequestContext }>({
  apiAdmin: async ({}, use) => {
    const ctx = await newAuthenticatedContext('admin');
    await use(ctx);
    await ctx.dispose();
  },
  apiCashier: async ({}, use) => {
    const ctx = await newAuthenticatedContext('cashier');
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
