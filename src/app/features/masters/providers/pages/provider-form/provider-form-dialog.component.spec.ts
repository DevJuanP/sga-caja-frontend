import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProviderFormDialogComponent } from './provider-form-dialog.component';

describe('ProviderFormDialogComponent', () => {
  let fixture: ComponentFixture<ProviderFormDialogComponent>;
  let httpMock: HttpTestingController;

  async function setup(data: unknown): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProviderFormDialogComponent, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProviderFormDialogComponent);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('crea un proveedor al enviar', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.setValue({ name: 'San Fernando', document: '20123456789' });
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/providers'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'San Fernando', document: '20123456789' });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('no envía si falta el documento', async () => {
    await setup(null);

    fixture.componentInstance.form.controls.name.setValue('Proveedor X');
    fixture.componentInstance.onSubmit();

    httpMock.expectNone((r) => r.url.endsWith('/api/providers'));
  });
});
