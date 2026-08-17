import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptViewerComponent } from './receipt-viewer.component';

describe('ReceiptViewerComponent', () => {
  let fixture: ComponentFixture<ReceiptViewerComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReceiptViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptViewerComponent);
    fixture.componentRef.setInput('receipt', {
      uuid: 'r1',
      receiptTypeName: 'Recibo de ingreso',
      correlativeNumber: 1024,
      issueDate: '2026-08-13',
      amount: 230.0,
    });
    fixture.detectChanges();
  });

  it('muestra el tipo de recibo', () => {
    expect(fixture.nativeElement.textContent).toContain('Recibo de ingreso');
  });

  it('muestra el número correlativo', () => {
    expect(fixture.nativeElement.textContent).toContain('1024');
  });

  it('muestra el monto formateado', () => {
    expect(fixture.nativeElement.textContent).toContain('S/');
    expect(fixture.nativeElement.textContent).toContain('230');
  });

  it('muestra la fecha de emisión', () => {
    expect(fixture.nativeElement.textContent).toContain('2026-08-13');
  });

  it('muestra la nota legal', () => {
    expect(fixture.nativeElement.textContent).toContain('declaración jurada');
  });
});