import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  let fixture: ComponentFixture<StatusChipComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [StatusChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusChipComponent);
    fixture.componentRef.setInput('label', 'Activo');
    fixture.detectChanges();
  });

  it('muestra la etiqueta', () => {
    expect(fixture.nativeElement.textContent).toContain('Activo');
  });

  it('aplica la clase del tono', () => {
    const element = fixture.nativeElement.querySelector('.chip') as HTMLElement;
    expect(element.classList.contains('chip--neutral')).toBe(true);
  });
});
