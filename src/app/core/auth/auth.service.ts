import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Observable, shareReplay, tap } from 'rxjs';
import {
  AccessTokenResponse,
  LoginRequest,
  UserProfileResponse,
} from '../../interfaces/auth.interface';
import { ApiService } from '../http/api.service';
import { DEV_REFRESH_FALLBACK } from './refresh.token';
import { TokenStorageService } from './token-storage.service';

const REFRESH_MARGIN_MS = 30_000;
const USER_STORAGE_KEY = 'sga_caja.user';

/**
 * Gestiona la sesión del usuario: token de acceso, perfil y estado de autenticación.
 * Las señales exponen el estado para que los componentes se actualicen de forma reactiva.
 *
 * Los datos del usuario se almacenan en **sessionStorage** (por pestaña) para evitar
 * que múltiples sesiones activas (p. ej. admin + cashier en pestañas distintas) se
 * sobrescriban entre sí. El token de acceso se mantiene en localStorage (compartido)
 * porque la cookie httpOnly de refresh es compartida entre pestañas del mismo origen.
 *
 * Se suscribe al evento `storage` de window para que, si un usuario cierra sesión o
 * refresca en otra pestaña, esta pestaña también se actualice reactivamente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly devRefreshFallback = inject(DEV_REFRESH_FALLBACK);

  /**
   * Señal de usuario específica por pestaña.
   * Se hidrata desde sessionStorage al arrancar y se actualiza vía evento `storage`
   * cuando otra pestaña modifica el mismo valor.
   */
  private readonly userSignal = signal<UserProfileResponse | null>(
    this.loadUserFromSessionStorage(),
  );
  private readonly accessTokenSignal = signal<string | null>(this.tokenStorage.accessToken);

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInProgress: Observable<AccessTokenResponse> | null = null;

  readonly user = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

  constructor() {
    this.setupStorageListener();
  }

  login(credentials: LoginRequest): Observable<AccessTokenResponse> {
    return this.api.post<AccessTokenResponse>('/auth/login', credentials).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  refresh(): Observable<AccessTokenResponse> {
    return this.api.post<AccessTokenResponse>('/auth/refresh').pipe(
      tap((response) => this.setSession(response)),
    );
  }

  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout').pipe(tap(() => this.clearSession()));
  }

  me(): Observable<UserProfileResponse> {
    return this.api.get<UserProfileResponse>('/auth/me').pipe(
      tap((user) => {
        this.userSignal.set(user);
        this.saveUserToSessionStorage(user);
      }),
    );
  }

  /**
   * Devuelve un único refresh en vuelo: si varios flujos (interceptor HTTP o timer
   * proactivo) lo solicitan al mismo tiempo, todos comparten la misma petición.
   */
  ensureRefresh(): Observable<AccessTokenResponse> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = this.refresh().pipe(
        finalize(() => {
          this.refreshInProgress = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInProgress;
  }

  /**
   * Re-programa el refresh proactivo según la sesión persistida (arranque de la app).
   * Es síncrono: no hace ninguna llamada de red (el perfil lo hidrata el guard con /me).
   */
  restoreSession(): void {
    const expiresAt = this.tokenStorage.accessTokenExpiresAt;
    if (this.tokenStorage.accessToken === null || expiresAt === null) {
      return;
    }
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      this.clearSession();
      return;
    }
    this.scheduleRefreshIn(remaining);
  }

  clearSession(): void {
    this.cancelRefreshTimer();
    this.tokenStorage.clear();
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    this.saveUserToSessionStorage(null);
  }

  private setSession(response: AccessTokenResponse): void {
    this.tokenStorage.accessToken = response.accessToken;
    this.tokenStorage.accessTokenExpiresAt = Date.now() + response.expiresIn * 1000;
    this.accessTokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
    this.saveUserToSessionStorage(response.user);
    this.scheduleRefresh(response.expiresIn);
  }

  /** Programa el refresh proactivo con un margen antes de que expire el access token. */
  private scheduleRefresh(expiresIn: number): void {
    this.scheduleRefreshIn(Math.max(1_000, expiresIn * 1000 - REFRESH_MARGIN_MS));
  }

  private scheduleRefreshIn(delayMs: number): void {
    this.cancelRefreshTimer();
    this.expiryTimer = setTimeout(() => {
      this.ensureRefresh().subscribe({ error: () => this.handleRefreshFailure() });
    }, delayMs);
  }

  private cancelRefreshTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private handleRefreshFailure(): void {
    this.clearSession();
    if (this.devRefreshFallback) {
      // En dev (http://localhost) la cookie Secure del refresh no persiste:
      // el refresh no es viable → cerrar sesión y volver al login.
      this.router.navigate(['/login']);
      return;
    }
    // En prod el fallo proactivo puede ser transitorio; si el token expiró de
    // verdad, el flujo reactivo (401 → refresh → reintento) resolverá la sesión.
  }

  // ── sessionStorage helpers ───────────────────────────────────────────────
  // Cada pestaña mantiene sus propios datos de usuario en sessionStorage para
  // que múltiples sesiones (admin + cashier) no se sobrescriban entre sí.

  /** Lee los datos del usuario almacenados en sessionStorage (por pestaña). */
  private loadUserFromSessionStorage(): UserProfileResponse | null {
    try {
      const raw = sessionStorage.getItem(USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserProfileResponse) : null;
    } catch {
      return null;
    }
  }

  /** Persiste los datos del usuario en sessionStorage (por pestaña). */
  private saveUserToSessionStorage(user: UserProfileResponse | null): void {
    try {
      if (user === null) {
        sessionStorage.removeItem(USER_STORAGE_KEY);
      } else {
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
    } catch {
      // Storage no disponible (modo privado, cuota excedida, etc.): ignorar.
    }
  }

  /**
   * Escucha cambios de `sessionStorage` en otras pestañas.
   * El evento `storage` **no** se dispara en la pestaña que origina el cambio,
   * solo en las demás, lo cual es exactamente lo que necesitamos: cada pestaña
   * actualiza su propio estado cuando otra modifica el mismo valor.
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== USER_STORAGE_KEY) return;

      try {
        const user = event.newValue
          ? (JSON.parse(event.newValue) as UserProfileResponse)
          : null;
        this.userSignal.set(user);
      } catch {
        this.userSignal.set(null);
      }
    });
  }
}
