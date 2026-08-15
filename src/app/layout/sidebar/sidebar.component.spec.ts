import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { AccessTokenResponse, UserRole } from '../../interfaces/auth.interface';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let auth: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('muestra las secciones del rol Administrator', () => {
    loginAs('Administrator');
    const fixture = createFixture();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Socios');
    expect(text).toContain('Giros comerciales');
    expect(text).toContain('Reportes');
    expect(text).not.toContain('Cobranza');
  });

  it('oculta los maestros para el rol CashierOperator', () => {
    loginAs('CashierOperator');
    const fixture = createFixture();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cobranza');
    expect(text).not.toContain('Socios');
    expect(text).not.toContain('Giros comerciales');
  });

  function loginAs(role: UserRole): void {
    const response: AccessTokenResponse = {
      accessToken: 'jwt',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { uuid: 'u1', username: 'user', firstName: 'A', lastName: 'B', roleName: role },
    };
    auth.login({ username: 'user', password: 'pass' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/auth/login'));
    req.flush(response);
  }

  function createFixture(): ComponentFixture<SidebarComponent> {
    const fixture: ComponentFixture<SidebarComponent> = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    return fixture;
  }
});
