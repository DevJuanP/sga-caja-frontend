import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'sga_caja.accessToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'sga_caja.accessTokenExpiresAt';

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

  /** Marca de tiempo (epoch ms) en la que expira el access token actual. */
  get accessTokenExpiresAt(): number | null {
    const value = this.read(ACCESS_TOKEN_EXPIRES_AT_KEY);
    return value === null ? null : Number(value);
  }

  set accessTokenExpiresAt(expiresAt: number | null) {
    try {
      if (expiresAt === null) {
        localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
      } else {
        localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
      }
    } catch {
      // storage no disponible: nada que persistir
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
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
