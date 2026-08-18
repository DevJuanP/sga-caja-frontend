import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExpenseBulkUploadDialogComponent } from './expense-bulk-upload-dialog.component';

describe('ExpenseBulkUploadDialogComponent', () => {
  let fixture: ComponentFixture<ExpenseBulkUploadDialogComponent>;
  let httpMock: HttpTestingController;

  function flushAll(): void {
    httpMock.match(() => true);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ExpenseBulkUploadDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseBulkUploadDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushAll();
  });

  afterEach(() => httpMock.verify());

  it('crea el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título "Carga masiva de egresos"', () => {
    const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
    expect(title?.textContent).toContain('Carga masiva de egresos');
  });

  it('muestra el botón de descargar plantilla', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const downloadButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Descargar plantilla'),
    ) as HTMLButtonElement | undefined;
    expect(downloadButton).toBeTruthy();
  });

  it('muestra el botón de cargar deshabilitado inicialmente', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const uploadButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Cargar'),
    ) as HTMLButtonElement | undefined;
    expect(uploadButton?.disabled).toBeTruthy();
  });

  it('muestra el botón de cancelar', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find((btn: unknown) =>
      (btn as HTMLElement).textContent?.includes('Cancelar'),
    ) as HTMLButtonElement | undefined;
    expect(cancelButton).toBeTruthy();
  });
});
