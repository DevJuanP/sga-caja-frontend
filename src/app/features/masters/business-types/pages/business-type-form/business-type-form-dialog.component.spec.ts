import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BusinessTypeFormDialogComponent } from './business-type-form-dialog.component';

describe('BusinessTypeFormDialogComponent', () => {
  let fixture: ComponentFixture<BusinessTypeFormDialogComponent>;
  let httpMock: HttpTestingController;

  async function setup(data: unknown): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BusinessTypeFormDialogComponent, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BusinessTypeFormDialogComponent);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('valida el nombre obligatorio', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.form.controls.name.invalid).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('crea un giro al enviar', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.controls.name.setValue('Alimentos');
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Alimentos' });
    req.flush({ uuid: 'b1', name: 'Alimentos' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('edita un giro existente', async () => {
    await setup({ uuid: 'b1', name: 'Alimentos' });
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.controls.name.setValue('Abarrotes');
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types/b1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Abarrotes' });
    req.flush({ uuid: 'b1', name: 'Abarrotes' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
