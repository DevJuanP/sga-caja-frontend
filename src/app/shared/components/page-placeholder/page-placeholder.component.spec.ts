import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagePlaceholderComponent } from './page-placeholder.component';

describe('PagePlaceholderComponent', () => {
  let fixture: ComponentFixture<PagePlaceholderComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PagePlaceholderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PagePlaceholderComponent);
    fixture.detectChanges();
  });

  it('muestra el texto por defecto cuando no hay data de ruta', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Módulo');
  });
});
