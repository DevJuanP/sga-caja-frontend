import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccessTokenResponse } from '../../interfaces/auth.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

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
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
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
});
