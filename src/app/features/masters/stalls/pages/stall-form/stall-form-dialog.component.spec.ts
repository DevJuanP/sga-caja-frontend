import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StallFormDialogComponent } from './stall-form-dialog.component';

describe('StallFormDialogComponent', () => {
  let fixture: ComponentFixture<StallFormDialogComponent>;
  let httpMock: HttpTestingController;

  async function setup(data: unknown): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [StallFormDialogComponent, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StallFormDialogComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.endsWith('/api/business-types')).flush([
      { uuid: 'bt1', name: 'Alimentos' },
    ]);
    httpMock.expectOne((r) => r.url.endsWith('/api/members')).flush({
      content: [
        {
          uuid: 'm1',
          code: 'S-001',
          firstName: 'María',
          lastName: 'Gómez',
          shareNumber: 'A-12',
          stage: { uuid: 'st1', code: 1, name: 'Socio activo' },
          birthDate: '1990-05-14',
          active: true,
        },
      ],
      page: { size: 200, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('valida el rango de fechas', async () => {
    await setup(null);

    fixture.componentInstance.form.controls.validityStartDate.setValue('2026-12-31');
    fixture.componentInstance.form.controls.validityEndDate.setValue('2026-01-01');
    expect(fixture.componentInstance.form.hasError('rangeInvalid')).toBe(true);

    fixture.componentInstance.form.controls.validityEndDate.setValue('2026-12-31');
    expect(fixture.componentInstance.form.hasError('rangeInvalid')).toBe(false);
  });

  it('crea un puesto al enviar', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.setValue({
      number: 'A-01',
      businessTypeUuid: 'bt1',
      memberUuid: 'm1',
      tenantName: '',
      tenantDocument: '',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
    });
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      number: 'A-01',
      businessTypeUuid: 'bt1',
      memberUuid: 'm1',
      tenantName: '',
      tenantDocument: '',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
    });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('edita un puesto existente', async () => {
    await setup({
      uuid: 'st1',
      number: 'A-01',
      businessType: { uuid: 'bt1', name: 'Alimentos' },
      member: { uuid: 'm1', fullName: 'María Gómez' },
      tenantName: '',
      tenantDocument: '',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
      active: true,
    });
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.controls.tenantName.setValue('Juan Pérez');
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls/st1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      number: 'A-01',
      businessTypeUuid: 'bt1',
      memberUuid: 'm1',
      tenantName: 'Juan Pérez',
      tenantDocument: '',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
    });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
