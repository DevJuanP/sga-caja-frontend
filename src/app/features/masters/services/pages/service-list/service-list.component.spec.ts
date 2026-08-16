import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ServiceListComponent } from './service-list.component';

describe('ServiceListComponent', () => {
  let fixture: ComponentFixture<ServiceListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ServiceListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(ServiceListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga y muestra los servicios', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/services'));
    expect(req.request.params.get('sort')).toBe('name,asc');
    req.flush({
      content: [
        {
          uuid: 's1',
          name: 'Luz',
          recurrenceType: { uuid: 'r1', code: 'MONTHLY', name: 'Mensual' },
          chargeTargetType: { uuid: 'c1', code: 'BY_STALL', name: 'Por puesto' },
          currency: { uuid: 'cu1', code: 'PEN', name: 'Sol' },
          consumptionBased: true,
          cost: 0,
          unitCost: 1.5,
          active: true,
        },
      ],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Luz');
    expect(fixture.nativeElement.textContent).toContain('Medido');
  });

  it('desactiva un servicio tras confirmar', () => {
    const service = {
      uuid: 's1',
      name: 'Luz',
      recurrenceType: { uuid: 'r1', code: 'MONTHLY', name: 'Mensual' },
      chargeTargetType: { uuid: 'c1', code: 'BY_STALL', name: 'Por puesto' },
      currency: { uuid: 'cu1', code: 'PEN', name: 'Sol' },
      consumptionBased: false,
      cost: 25,
      unitCost: 0,
      active: true,
    };
    httpMock.expectOne((r) => r.url.endsWith('/api/services')).flush({
      content: [service],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'deactivate', row: { uuid: 's1' } });

    const patchReq = httpMock.expectOne((r) => r.url.endsWith('/api/services/s1/deactivate'));
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...service, active: false });

    httpMock.expectOne((r) => r.url.endsWith('/api/services')).flush({
      content: [service],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });

  it('abre el formulario al crear', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/services')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
    const openSpy = vi.spyOn(dialog, 'open');

    fixture.componentInstance.openCreate();
    expect(openSpy).toHaveBeenCalled();
  });
});
