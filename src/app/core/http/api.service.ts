import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpParamsInput, PagedModel } from '../../interfaces/common.interface';

/**
 * Wrapper sobre HttpClient que centraliza la URL base (`environment.apiUrl` + `/api`)
 * y la conversión de parámetros para todas las llamadas de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  get<T>(path: string, params?: HttpParamsInput): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  getPage<T>(path: string, params?: HttpParamsInput): Observable<PagedModel<T>> {
    return this.http.get<PagedModel<T>>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(this.url(path));
  }

  upload<T>(path: string, file: File): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<T>(this.url(path), formData);
  }

  download(path: string, params?: HttpParamsInput): Observable<HttpResponse<Blob>> {
    return this.http.get(this.url(path), {
      params: this.toParams(params),
      responseType: 'blob',
      observe: 'response',
    });
  }

  /** Normaliza el path garantizando una sola barra entre la base y la ruta. */
  private url(path: string): string {
    const separator = path.startsWith('/') ? '' : '/';
    return `${this.baseUrl}${separator}${path}`;
  }

  /**
   * Convierte un objeto plano en HttpParams, omitiendo valores vacíos
   * (null, undefined o cadena vacía) para no enviar filtros sin valor al backend.
   */
  private toParams(params?: HttpParamsInput): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
