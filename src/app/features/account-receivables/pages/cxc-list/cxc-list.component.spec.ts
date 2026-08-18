import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AccountReceivableResponse, AccountReceivableStatus } from '../../../../interfaces/account-receivable.interface';
import { CxcListComponent } from './cxc-list.component';

describe('CxcListComponent', () => {
  let fixture: ComponentFixture<CxcListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  const mockUser = {
    uuid: 'u1',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    roleName: 'Administrator' as const,
  };

  const emptyPage = { content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CxcListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
        { provide: AuthService, useValue: { user: () => mockUser } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(CxcListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function flushAll(): void {
    httpMock.match(() => true).forEach((r) => r.flush(emptyPage));
  }

  it('carga catálogos y CxC', () => {
    const reqs = httpMock.match(() => true);
    expect(reqs.length).toBe(4);

    const cxcReq = reqs.find((r) => r.request.url.endsWith('/api/account-receivables'));
    expect(cxcReq).toBeDefined();
    cxcReq!.flush({
      content: [
        {
          uuid: 'ar1',
          service: { uuid: 's1', name: 'Energía', consumptionBased: false },
          member: { uuid: 'm1', fullName: 'Juan Pérez' },
          stall: null,
          periodStartDate: '2026-08-01',
          periodEndDate: '2026-08-31',
          amount: 150,
          status: { uuid: 'st1', name: 'Pending' },
        },
      ],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });

    for (const r of reqs) {
      if (r !== cxcReq) {
        r.flush(emptyPage);
      }
    }

    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Energía');
  });

  it('abre el diálogo de generar CxC', () => {
    flushAll();

    const mockRef = { afterClosed: () => of(undefined) } as unknown as MatDialogRef<unknown>;
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue(mockRef);

    fixture.componentInstance.openGenerate();
    expect(openSpy).toHaveBeenCalled();
  });

  it('abre el diálogo de lectura para una CxC de consumo', () => {
    const item: AccountReceivableResponse = {
      uuid: 'ar1',
      service: { uuid: 's1', name: 'Agua', consumptionBased: true },
      member: { uuid: 'm1', fullName: 'Juan Pérez' },
      stall: null,
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      amount: 0,
      status: { uuid: 'st1', name: 'Pending' as AccountReceivableStatus },
    };
    const reqs = httpMock.match(() => true);
    const cxcReq = reqs.find((r) => r.request.url.endsWith('/api/account-receivables'));
    cxcReq!.flush({
      content: [item],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    for (const r of reqs) {
      if (r !== cxcReq) r.flush(emptyPage);
    }
    fixture.detectChanges();

    const mockRef = { afterClosed: () => of(undefined) } as unknown as MatDialogRef<unknown>;
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue(mockRef);

    fixture.componentInstance.openReading(item);
    expect(openSpy).toHaveBeenCalled();
  });

  it('exonera una CxC pendiente', () => {
    const item = {
      uuid: 'ar1',
      service: { uuid: 's1', name: 'Energía', consumptionBased: false },
      member: { uuid: 'm1', fullName: 'Juan Pérez' },
      stall: null,
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      amount: 150,
      status: { uuid: 'st1', name: 'Pending' },
    };
    const reqs = httpMock.match(() => true);
    const cxcReq = reqs.find((r) => r.request.url.endsWith('/api/account-receivables'));
    cxcReq!.flush({
      content: [item],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
    for (const r of reqs) {
      if (r !== cxcReq) {
        r.flush(emptyPage);
      }
    }
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'exempt', row: { uuid: 'ar1' } });

    const patchReq = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/ar1/exempt'),
    );
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...item, status: { uuid: 'st2', name: 'Exempt' } });

    httpMock.expectOne((r) => r.url.endsWith('/api/account-receivables')).flush({
      content: [item],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    });
  });
});
