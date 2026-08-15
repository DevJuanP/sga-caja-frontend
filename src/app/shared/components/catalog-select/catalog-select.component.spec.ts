import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CatalogSelectComponent } from './catalog-select.component';

describe('CatalogSelectComponent', () => {
  let fixture: ComponentFixture<CatalogSelectComponent>;
  let httpMock: HttpTestingController;
  let control: FormControl<string | null>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CatalogSelectComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimationsAsync()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    control = new FormControl<string | null>(null);

    fixture = TestBed.createComponent(CatalogSelectComponent);
    fixture.componentRef.setInput('catalogKey', 'currencies');
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('label', 'Moneda');
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function openPanel(): void {
    (fixture.nativeElement as HTMLElement)
      .querySelector('.mat-mdc-select-trigger')!
      .dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
  }

  it('carga el catálogo y muestra las opciones', async () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/currencies'));
    req.flush([
      { uuid: 'pen', code: 'PEN', name: 'Sol Peruano' },
      { uuid: 'usd', code: 'USD', name: 'Dólar Americano' },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(2);

    openPanel();
    await fixture.whenStable();
    const options = Array.from(document.querySelectorAll('mat-option'));
    expect(options.length).toBe(2);
    expect(options[0]!.textContent).toContain('Sol Peruano');
  });

  it('escribe el uuid seleccionado en el FormControl', async () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/currencies')).flush([
      { uuid: 'pen', code: 'PEN', name: 'Sol Peruano' },
    ]);
    fixture.detectChanges();

    openPanel();
    await fixture.whenStable();
    (document.querySelector('mat-option') as HTMLElement).click();
    fixture.detectChanges();

    expect(control.value).toBe('pen');
  });

  it('incluye la opción "Sin asignar" cuando allowEmpty está activo', async () => {
    fixture.componentRef.setInput('allowEmpty', true);
    httpMock.expectOne((r) => r.url.endsWith('/api/currencies')).flush([
      { uuid: 'pen', code: 'PEN', name: 'Sol Peruano' },
    ]);
    fixture.detectChanges();

    openPanel();
    await fixture.whenStable();
    const options = Array.from(document.querySelectorAll('mat-option'));
    expect(options.length).toBe(2);
    expect(options.some((o) => o.textContent?.includes('Sin asignar'))).toBe(true);
  });
});
