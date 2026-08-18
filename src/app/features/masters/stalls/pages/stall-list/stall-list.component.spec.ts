import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { StallListComponent } from './stall-list.component';

describe('StallListComponent', () => {
  let fixture: ComponentFixture<StallListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [StallListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(StallListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga y muestra los puestos', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls'));
    expect(req.request.params.get('sort')).toBe('number,asc');
    req.flush({
      content: [
        {
          uuid: 'st1',
          number: 'A-01',
          businessType: { uuid: 'bt1', name: 'Alimentos' },
          member: { uuid: 'm1', fullName: 'María Gómez' },
          tenantName: '',
          tenantDocument: '',
          validityStartDate: '2026-01-01',
          validityEndDate: '2026-12-31',
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
    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });

    fixture.componentInstance.onFilterChange({ search: 'A-01', active: null });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/stalls'));
    expect(req.request.params.get('search')).toBe('A-01');
    req.flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
  });

  it('abre el formulario al crear', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
    const openSpy = vi.spyOn(dialog, 'open');

    fixture.componentInstance.openCreate();
    expect(openSpy).toHaveBeenCalled();

    httpMock.expectOne((r) => r.url.endsWith('/api/business-types')).flush([]);
    httpMock.expectOne((r) => r.url.endsWith('/api/members')).flush({
      content: [],
      page: { size: 200, number: 0, totalElements: 0, totalPages: 0 },
    });
  });

  it('desactiva un puesto tras confirmar', () => {
    const stall = {
      uuid: 'st1',
      number: 'A-01',
      businessType: { uuid: 'bt1', name: 'Alimentos' },
      member: { uuid: 'm1', fullName: 'María Gómez' },
      tenantName: '',
      tenantDocument: '',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
      active: true,
    };
    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [stall],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'deactivate', row: { uuid: 'st1' } });

    const patchReq = httpMock.expectOne((r) => r.url.endsWith('/api/stalls/st1/deactivate'));
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...stall, active: false });

    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [stall],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });

  it('reactiva un puesto inactivo tras confirmar (RF-11)', () => {
    const stall = {
      uuid: 'st2',
      number: 'B-02',
      businessType: { uuid: 'bt1', name: 'Alimentos' },
      member: null,
      tenantName: '',
      tenantDocument: '',
      validityStartDate: '2026-01-01',
      validityEndDate: '2026-12-31',
      active: false,
    };
    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [stall],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'activate', row: { uuid: 'st2' } });

    const patchReq = httpMock.expectOne((r) => r.url.endsWith('/api/stalls/st2/activate'));
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...stall, active: true });

    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [stall],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });

  it('muestra "Reactivar" sólo para puestos inactivos y "Desactivar" sólo para activos', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/stalls')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });

    const activateAction = fixture.componentInstance.rowActions.find((a) => a.id === 'activate');
    const deactivateAction = fixture.componentInstance.rowActions.find((a) => a.id === 'deactivate');

    expect(activateAction?.visible?.({ active: true })).toBe(false);
    expect(activateAction?.visible?.({ active: false })).toBe(true);
    expect(deactivateAction?.visible?.({ active: true })).toBe(true);
    expect(deactivateAction?.visible?.({ active: false })).toBe(false);
  });
});
