import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PaymentDialogComponent } from './payment-dialog.component';

describe('PaymentDialogComponent', () => {
  let fixture: ComponentFixture<PaymentDialogComponent>;
  let httpMock: HttpTestingController;

  const mockDialogData = {
    uuids: ['ar1', 'ar2'],
    total: 230.0,
  };

  const mockDialogRef = {
    close: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PaymentDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el total a cobrar', () => {
    expect(fixture.nativeElement.textContent).toContain('230.00');
  });

  it('muestra la cantidad de CxC seleccionadas', () => {
    expect(fixture.nativeElement.textContent).toContain('2');
  });

  it('tiene botón de confirmar y pagar', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Confirmar y pagar'),
    );
    expect(confirmButton).toBeTruthy();
  });
});