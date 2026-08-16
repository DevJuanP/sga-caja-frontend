export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedModel<T> {
  content: T[];
  page: PageInfo;
}

/** Parámetros planos que `ApiService` convierte a `HttpParams` (omite vacíos). */
export type HttpParamsInput = Record<string, string | number | boolean | null | undefined>;

/** Parámetros de listado paginado de maestros (`GET /api/{recurso}`). */
export interface PagedListParams extends HttpParamsInput {
  search?: string;
  active?: 'true' | 'false';
  page?: number;
  size?: number;
  sort?: string;
}
