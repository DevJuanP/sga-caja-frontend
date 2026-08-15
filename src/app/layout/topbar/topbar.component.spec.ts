import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ThemeService } from '../../core/theme/theme.service';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let theme: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideAnimationsAsync()],
    }).compileComponents();

    theme = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
  });

  it('muestra la marca de la aplicación', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('SGA Caja');
  });

  it('alterna el tema al pulsar el botón', () => {
    const initial = theme.theme();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Cambiar a modo oscuro"]',
    ) as HTMLButtonElement;
    button.click();
    expect(theme.theme()).not.toBe(initial);
  });
});
