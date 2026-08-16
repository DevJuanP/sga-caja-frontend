import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { BankListComponent } from './bank-list.component';

describe('BankListComponent', () => {
  let fixture: ComponentFixture<BankListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BankListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(BankListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga y muestra los bancos', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/banks'));
    expect(req.request.params.get('sort')).toBe('name,asc');
    req.flush({
      content: [
        {
          uuid: 'b1',
          name: 'BCP',
          accountNumber: '191-1234567-0-12',
          cci: '00219100123456701234',
          currency: { uuid: 'c1', code: 'PEN', name: 'Sol' },
          active: true,
        },
      ],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('BCP');
  });

  it('aplica el filtro de búsqueda', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/banks')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });

    fixture.componentInstance.onFilterChange({ search: 'BCP', active: 'true' });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/banks'));
    expect(req.request.params.get('search')).toBe('BCP');
    expect(req.request.params.get('active')).toBe('true');
    req.flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
  });

  it('abre el formulario al crear', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/banks')).flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
    const openSpy = vi.spyOn(dialog, 'open');

    fixture.componentInstance.openCreate();
    expect(openSpy).toHaveBeenCalled();
  });

  it('desactiva un banco tras confirmar', () => {
    const bank = {
      uuid: 'b1',
      name: 'BCP',
      accountNumber: '191-1234567-0-12',
      cci: '00219100123456701234',
      currency: { uuid: 'c1', code: 'PEN', name: 'Sol' },
      active: true,
    };
    httpMock.expectOne((r) => r.url.endsWith('/api/banks')).flush({
      content: [bank],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'deactivate', row: { uuid: 'b1' } });

    const patchReq = httpMock.expectOne((r) => r.url.endsWith('/api/banks/b1/deactivate'));
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...bank, active: false });

    httpMock.expectOne((r) => r.url.endsWith('/api/banks')).flush({
      content: [bank],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });
});
