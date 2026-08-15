import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'sga_caja.accessToken';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string | null {
    return this.read(ACCESS_TOKEN_KEY);
  }

  set accessToken(token: string | null) {
    try {
      if (token === null) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      } else {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      }
    } catch {
      // storage no disponible (p. ej. modo privado): sesión en memoria únicamente
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // storage no disponible: nada que limpiar
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      // storage no disponible: se devuelve null
      return null;
    }
  }
}
