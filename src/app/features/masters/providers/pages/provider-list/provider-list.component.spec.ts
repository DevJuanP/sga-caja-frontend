import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ProviderListComponent } from './provider-list.component';

describe('ProviderListComponent', () => {
  let fixture: ComponentFixture<ProviderListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProviderListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(ProviderListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga y muestra los proveedores', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/providers'));
    expect(req.request.params.get('sort')).toBeNull();
    req.flush({
      content: [
        { uuid: 'p1', name: 'San Fernando', document: '20123456789', active: true },
      ],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('San Fernando');
  });

  it('aplica el filtro de búsqueda', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/providers')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });

    fixture.componentInstance.onFilterChange({ search: 'San', active: null });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/providers'));
    expect(req.request.params.get('search')).toBe('San');
    req.flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
  });

  it('abre el formulario al crear', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/providers')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
    const openSpy = vi.spyOn(dialog, 'open');

    fixture.componentInstance.openCreate();
    expect(openSpy).toHaveBeenCalled();
  });

  it('desactiva un proveedor tras confirmar', () => {
    const provider = { uuid: 'p1', name: 'San Fernando', document: '20123456789', active: true };
    httpMock.expectOne((r) => r.url.endsWith('/api/providers')).flush({
      content: [provider],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'deactivate', row: { uuid: 'p1' } });

    const patchReq = httpMock.expectOne((r) => r.url.endsWith('/api/providers/p1/deactivate'));
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...provider, active: false });

    httpMock.expectOne((r) => r.url.endsWith('/api/providers')).flush({
      content: [provider],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });
});
