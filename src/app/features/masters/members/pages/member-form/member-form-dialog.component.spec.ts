import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MemberFormDialogComponent } from './member-form-dialog.component';

describe('MemberFormDialogComponent', () => {
  let fixture: ComponentFixture<MemberFormDialogComponent>;
  let httpMock: HttpTestingController;

  async function setup(data: unknown): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MemberFormDialogComponent, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MemberFormDialogComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.endsWith('/api/stages')).flush([
      { uuid: 'st1', code: 1, name: 'Socio activo' },
    ]);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('valida los campos obligatorios', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('valida que la fecha de nacimiento sea pasada', async () => {
    await setup(null);
    const control = fixture.componentInstance.form.controls.birthDate;
    control.setValue('2099-01-01');
    expect(control.hasError('pastDate')).toBe(true);
    control.setValue('1990-05-14');
    expect(control.hasError('pastDate')).toBe(false);
  });

  it('crea un socio al enviar', async () => {
    await setup(null);
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.setValue({
      code: 'S-001',
      firstName: 'María',
      lastName: 'Gómez',
      shareNumber: 'A-12',
      stageUuid: 'st1',
      birthDate: '1990-05-14',
    });
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      code: 'S-001',
      firstName: 'María',
      lastName: 'Gómez',
      shareNumber: 'A-12',
      stageUuid: 'st1',
      birthDate: '1990-05-14',
    });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('edita un socio existente', async () => {
    await setup({
      uuid: 'm1',
      code: 'S-001',
      firstName: 'María',
      lastName: 'Gómez',
      shareNumber: 'A-12',
      stage: { uuid: 'st1', code: 1, name: 'Socio activo' },
      birthDate: '1990-05-14',
      active: true,
    });
    const dialogRef = TestBed.inject(MatDialogRef) as unknown as { close: ReturnType<typeof vi.fn> };

    fixture.componentInstance.form.controls.lastName.setValue('Pérez');
    fixture.componentInstance.onSubmit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members/m1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      code: 'S-001',
      firstName: 'María',
      lastName: 'Pérez',
      shareNumber: 'A-12',
      stageUuid: 'st1',
      birthDate: '1990-05-14',
    });
    req.flush({});

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
