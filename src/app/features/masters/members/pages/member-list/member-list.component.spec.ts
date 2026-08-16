import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { MemberListComponent } from './member-list.component';

describe('MemberListComponent', () => {
  let fixture: ComponentFixture<MemberListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MemberListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(MemberListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga y muestra los socios', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.params.get('sort')).toBe('code,asc');
    req.flush({
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
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.rows().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('María Gómez');
  });

  it('aplica el filtro de búsqueda', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/members')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });

    fixture.componentInstance.onFilterChange({ search: 'María', active: 'true' });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.params.get('search')).toBe('María');
    expect(req.request.params.get('active')).toBe('true');
    expect(req.request.params.get('page')).toBe('0');
    req.flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
  });

  it('abre el formulario al crear', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/members')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
    const openSpy = vi.spyOn(dialog, 'open');

    fixture.componentInstance.openCreate();
    expect(openSpy).toHaveBeenCalled();
  });

  it('desactiva un socio tras confirmar', () => {
    const member = {
      uuid: 'm1',
      code: 'S-001',
      firstName: 'María',
      lastName: 'Gómez',
      shareNumber: 'A-12',
      stage: { uuid: 'st1', code: 1, name: 'Socio activo' },
      birthDate: '1990-05-14',
      active: true,
    };
    httpMock.expectOne((r) => r.url.endsWith('/api/members')).flush({
      content: [member],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'deactivate', row: { uuid: 'm1' } });

    const patchReq = httpMock.expectOne((r) => r.url.endsWith('/api/members/m1/deactivate'));
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...member, active: false });

    httpMock.expectOne((r) => r.url.endsWith('/api/members')).flush({
      content: [member],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });
});
