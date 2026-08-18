import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccessTokenResponse } from '../../../../interfaces/auth.interface';
import { AuthService } from '../../../../core/auth/auth.service';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { errorInterceptor } from '../../../../core/auth/error.interceptor';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

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

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function submit(username: string, password: string): void {
    fixture.componentInstance.form.setValue({ username, password });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  it('inicia sesión y navega a catálogos para un Administrator (RF-01)', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    submit('admin', '123456');

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: '123456' });
    req.flush(tokenResponse);

    expect(navigateSpy).toHaveBeenCalledWith(['/masters/members']);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.roleName).toBe('Administrator');
  });

  it('inicia sesión y navega a Cobranza (recibos) para un CashierOperator (RF-01)', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    submit('cajero', '123456');

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/auth/login'));
    req.flush({ ...tokenResponse, user: { ...tokenResponse.user, roleName: 'CashierOperator' } });

    expect(navigateSpy).toHaveBeenCalledWith(['/payments']);
    expect(auth.user()?.roleName).toBe('CashierOperator');
  });

  it('muestra el mensaje de credenciales inválidas ante un error 401', () => {
    submit('admin', 'incorrecta');

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/auth/login'));
    req.flush(
      {
        timestamp: '2026-08-15T10:00:00Z',
        status: 401,
        error: 'AUTH_INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
        path: '/api/auth/login',
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Credenciales inválidas');
    expect(auth.isAuthenticated()).toBe(false);
  });
});
