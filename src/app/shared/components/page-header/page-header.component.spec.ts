import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Socios');
    fixture.detectChanges();
  });

  it('muestra el título', () => {
    expect(fixture.nativeElement.textContent).toContain('Socios');
  });

  it('muestra el subtítulo cuando se provee', () => {
    fixture.componentRef.setInput('subtitle', 'Configuración de socios');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Configuración de socios');
  });
});
