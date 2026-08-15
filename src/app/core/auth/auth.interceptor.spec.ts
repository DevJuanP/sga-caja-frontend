import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccessTokenResponse } from '../../interfaces/auth.interface';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { TokenStorageService } from './token-storage.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;
  let auth: AuthService;

  const tokenResponse: AccessTokenResponse = {
    accessToken: 'new-token',
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

  const unauthorizedBody = {
    timestamp: '2026-08-15T12:00:00Z',
    status: 401,
    error: 'AUTH_INVALID_SESSION',
    message: 'Sesión no válida',
    path: '/api/members',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('envía el token y tras un 401 refresca y reintenta con el token nuevo', () => {
    tokenStorage.accessToken = 'old-token';

    http.get('/api/members').subscribe(() => undefined);

    const first = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(first.request.headers.get('Authorization')).toBe('Bearer old-token');
    first.flush(unauthorizedBody, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
    expect(refresh.request.method).toBe('POST');
    refresh.flush(tokenResponse);

    const retry = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retry.request.headers.has('X-Retry-Refresh')).toBe(true);
    retry.flush({ content: [] });

    expect(auth.accessToken()).toBe('new-token');
  });

  it('no agrega el header si no hay token', () => {
    http.get('/api/members').subscribe(() => undefined);

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ content: [] });
  });

  it('un 401 en /auth/login no dispara refresh', () => {
    http.post('/api/auth/login', { username: 'admin', password: '123456' }).subscribe({
      error: () => undefined,
    });

    const login = httpMock.expectOne((r) => r.url.endsWith('/api/auth/login'));
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush(unauthorizedBody, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone((r) => r.url.endsWith('/api/auth/refresh'));
  });

  it('si el refresh falla limpia la sesión y redirige a /login', () => {
    tokenStorage.accessToken = 'old-token';
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('/api/members').subscribe({ error: () => undefined });

    const first = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    first.flush(unauthorizedBody, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
    refresh.flush(unauthorizedBody, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('no reintenta dos veces: el reintento con marcador redirige a /login', () => {
    tokenStorage.accessToken = 'old-token';
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('/api/members').subscribe({ error: () => undefined });

    const first = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    first.flush(unauthorizedBody, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne((r) => r.url.endsWith('/api/auth/refresh'));
    refresh.flush(tokenResponse);

    const retry = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    retry.flush(unauthorizedBody, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone((r) => r.url.endsWith('/api/auth/refresh'));
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(auth.isAuthenticated()).toBe(false);
  });
});
