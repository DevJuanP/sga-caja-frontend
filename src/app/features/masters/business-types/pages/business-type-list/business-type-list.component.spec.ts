import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { BusinessTypeListComponent } from './business-type-list.component';

describe('BusinessTypeListComponent', () => {
  let fixture: ComponentFixture<BusinessTypeListComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BusinessTypeListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(BusinessTypeListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('carga y muestra los giros', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/business-types'));
    req.flush([
      { uuid: 'b1', name: 'Alimentos' },
      { uuid: 'b2', name: 'Abarrotes' },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.rows().length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Alimentos');
  });

  it('abre el formulario al crear', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/business-types')).flush([]);
    const openSpy = vi.spyOn(dialog, 'open');

    fixture.componentInstance.openCreate();
    expect(openSpy).toHaveBeenCalled();
  });

  it('elimina un giro tras confirmar', () => {
    httpMock.expectOne((r) => r.url.endsWith('/api/business-types')).flush([
      { uuid: 'b1', name: 'Alimentos' },
    ]);
    fixture.detectChanges();

    fixture.componentInstance.onAction({ actionId: 'delete', row: { uuid: 'b1' } });

    const delReq = httpMock.expectOne((r) => r.url.endsWith('/api/business-types/b1'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null, { status: 204, statusText: 'No Content' });

    httpMock.expectOne((r) => r.url.endsWith('/api/business-types')).flush([]);
  });
});
