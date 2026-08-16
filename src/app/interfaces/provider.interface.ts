/** Proveedor (US-14). */
export interface ProviderResponse {
  uuid: string;
  name: string;
  document: string;
  active: boolean;
}

export interface ProviderRequest {
  name: string;
  document: string;
}
