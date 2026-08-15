import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AccessTokenResponse,
  LoginRequest,
  UserProfileResponse,
} from '../../interfaces/auth.interface';
import { ApiService } from '../http/api.service';
import { TokenStorageService } from './token-storage.service';

/**
 * Gestiona la sesión del usuario: token de acceso, perfil y estado de autenticación.
 * Las señales exponen el estado para que los componentes se actualicen de forma reactiva.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly userSignal = signal<UserProfileResponse | null>(null);
  private readonly accessTokenSignal = signal<string | null>(this.tokenStorage.accessToken);

  readonly user = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

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
      tap((user) => this.userSignal.set(user)),
    );
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
  }

  private setSession(response: AccessTokenResponse): void {
    this.tokenStorage.accessToken = response.accessToken;
    this.accessTokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
  }
}
