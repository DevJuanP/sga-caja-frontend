import { APIRequestContext } from '@playwright/test';

/** Lanza con el cuerpo de la respuesta si el status no es 2xx — evita fallos silenciosos
 * en el setup de un test (una factory que falla debe romper el test, no seguir con `undefined`). */
export async function postJson<T>(
  api: APIRequestContext,
  path: string,
  data: unknown,
): Promise<T> {
  const response = await api.post(path, { data });
  if (!response.ok()) {
    throw new Error(`POST ${path} → ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}

export async function patchJson<T = void>(api: APIRequestContext, path: string): Promise<T> {
  const response = await api.patch(path);
  if (!response.ok()) {
    throw new Error(`PATCH ${path} → ${response.status()}: ${await response.text()}`);
  }
  return response.status() === 204 ? (undefined as T) : response.json();
}

export async function getJson<T>(api: APIRequestContext, path: string): Promise<T> {
  const response = await api.get(path);
  if (!response.ok()) {
    throw new Error(`GET ${path} → ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}
