import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccessTokenResponse } from '../../interfaces/auth.interface';
import { DEV_REFRESH_FALLBACK } from './refresh.token';
import { AuthService } from './auth.service';

describe('AuthService (dev · devRefreshFallback=true)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const tokenResponse: AccessTokenResponse = {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      uuid: 'u1',
      username: 'cajero1',
      firstName: 'Luis',
      lastName: 'Torres',
      roleName: 'CashierOperator',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: DEV_REFRESH_FALLBACK, useValue: true },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    httpMock.verify();
  });

  it('redirige a /login cuando el refresh proactivo falla en dev', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.login({ username: 'cajero1', password: 'Secreto123!' }).subscribe();
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
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
