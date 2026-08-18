import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BankFormDialogComponent } from './bank-form-dialog.component';

describe('BankFormDialogComponent', () => {
  let fixture: ComponentFixture<BankFormDialogComponent>;
  let httpMock: HttpTestingController;

  async function setup(data: unknown): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BankFormDialogComponent, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BankFormDialogComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.endsWith('/api/currencies')).flush([
      { uuid: 'c1', code: 'PEN', name: 'Sol' },
    ]);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('crea un banco al enviar', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.setValue({
      name: 'BCP',
      accountNumber: '191-1234567-0-12',
      cci: '00219100123456701234',
      currencyUuid: 'c1',
    });
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/banks'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'BCP',
      accountNumber: '191-1234567-0-12',
      cci: '00219100123456701234',
      currencyUuid: 'c1',
    });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('no envía si falta el nombre', async () => {
    await setup(null);

    fixture.componentInstance.form.controls.currencyUuid.setValue('c1');
    fixture.componentInstance.onSubmit();

    httpMock.expectNone((r) => r.url.endsWith('/api/banks'));
  });
});
