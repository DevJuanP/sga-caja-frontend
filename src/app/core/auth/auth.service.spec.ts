import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccessTokenResponse } from '../../interfaces/auth.interface';
import { DEV_REFRESH_FALLBACK } from './refresh.token';
import { TokenStorageService } from './token-storage.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;

  const tokenResponse: AccessTokenResponse = {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      uuid: 'u1',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'Root',
      roleName: 'Administrator',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: DEV_REFRESH_FALLBACK, useValue: false },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login guarda el access token y el usuario', () => {
    service.login({ username: 'admin', password: '123456' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: '123456' });
    req.flush(tokenResponse);

    expect(service.accessToken()).toBe('jwt-token');
    expect(service.user()?.roleName).toBe('Administrator');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('me() actualiza el usuario autenticado', () => {
    service.me().subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/auth/me'));
    req.flush(tokenResponse.user);

    expect(service.user()?.username).toBe('admin');
  });

  it('logout limpia la sesión', () => {
    service.login({ username: 'admin', password: '123456' }).subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/api/auth/login')).flush(tokenResponse);

    service.logout().subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/api/auth/logout')).flush(null);

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  describe('expiración y refresh proactivo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('login persiste la expiración y programa el refresh antes de vencer', () => {
      service.login({ username: 'admin', password: '123456' }).subscribe();
      httpMock.expectOne((r) => r.url.endsWith('/api/auth/login')).flush(tokenResponse);

      expect(tokenStorage.accessTokenExpiresAt).toBeGreaterThan(Date.now());

      vi.advanceTimersByTime(900_000 - 30_000);
      const refreshReq = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
      expect(refreshReq.request.method).toBe('POST');
      refreshReq.flush(tokenResponse);
    });

    it('refresh exitoso renueva el token y reprograma el timer', () => {
      service.login({ username: 'admin', password: '123456' }).subscribe();
      httpMock.expectOne((r) => r.url.endsWith('/api/auth/login')).flush(tokenResponse);

      vi.advanceTimersByTime(900_000 - 30_000);
      const refreshReq = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
      refreshReq.flush({ ...tokenResponse, accessToken: 'jwt-token-2' });

      expect(service.accessToken()).toBe('jwt-token-2');
    });

    it('un fallo del refresh proactivo en prod limpia la sesión sin navegar', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      service.login({ username: 'admin', password: '123456' }).subscribe();
      httpMock.expectOne((r) => r.url.endsWith('/api/auth/login')).flush(tokenResponse);

      vi.advanceTimersByTime(900_000 - 30_000);
      const refreshReq = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
      refreshReq.flush(
        {
          timestamp: '2026-08-15T12:00:00Z',
          status: 401,
          error: 'AUTH_INVALID_REFRESH',
          message: 'Sesión expirada',
          path: '/api/auth/refresh',
        },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(service.isAuthenticated()).toBe(false);
      expect(tokenStorage.accessToken).toBeNull();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('clearSession cancela el refresh programado', () => {
      service.login({ username: 'admin', password: '123456' }).subscribe();
      httpMock.expectOne((r) => r.url.endsWith('/api/auth/login')).flush(tokenResponse);

      service.clearSession();
      vi.advanceTimersByTime(10_000_000);

      httpMock.expectNone((r) => r.url.endsWith('/api/auth/refresh'));
    });

    it('restoreSession reprograma el refresh con la sesión vigente guardada', () => {
      tokenStorage.accessToken = 'stored-token';
      tokenStorage.accessTokenExpiresAt = Date.now() + 60_000;

      service.restoreSession();
      vi.advanceTimersByTime(60_000 - 1);
      httpMock.expectNone((r) => r.url.endsWith('/api/auth/refresh'));

      vi.advanceTimersByTime(1);
      const refreshReq = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
      refreshReq.flush(tokenResponse);
    });

    it('restoreSession limpia la sesión si la expiración ya venció', () => {
      tokenStorage.accessToken = 'stored-token';
      tokenStorage.accessTokenExpiresAt = Date.now() - 1_000;

      service.restoreSession();

      expect(service.isAuthenticated()).toBe(false);
      expect(tokenStorage.accessToken).toBeNull();
      expect(tokenStorage.accessTokenExpiresAt).toBeNull();
    });

    it('restoreSession no hace nada sin sesión persistida', () => {
      service.restoreSession();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
