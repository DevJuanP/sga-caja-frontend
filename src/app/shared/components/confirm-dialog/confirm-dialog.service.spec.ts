import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-dialog-host',
  imports: [MatDialogModule],
  template: '',
})
class DialogHostComponent {}

describe('ConfirmDialogService', () => {
  let fixture: ComponentFixture<DialogHostComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DialogHostComponent],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogHostComponent);
    fixture.detectChanges();
  });

  const data: ConfirmDialogData = {
    title: 'Desactivar socio',
    message: '¿Desea desactivar a María Gómez?',
    confirmLabel: 'Desactivar',
    danger: true,
  };

  it('muestra el título y mensaje', async () => {
    const dialog = TestBed.inject(MatDialog);
    dialog.open(ConfirmDialogComponent, { data });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = document.body.textContent ?? '';
    expect(text).toContain('Desactivar socio');
    expect(text).toContain('¿Desea desactivar a María Gómez?');
  });

  it('confirma y resuelve true', async () => {
    const service = TestBed.inject(ConfirmDialogService);
    let result: boolean | undefined;
    service.confirm(data).subscribe((r) => {
      result = r;
    });

    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = Array.from(document.body.querySelectorAll('mat-dialog-container button'));
    const confirmButton = buttons.find((b) => b.textContent?.includes('Desactivar'));
    (confirmButton as HTMLElement).click();

    await vi.waitFor(() => expect(result).toBe(true));
  });

  it('cancela y resuelve false', async () => {
    const service = TestBed.inject(ConfirmDialogService);
    let result: boolean | undefined;
    service.confirm(data).subscribe((r) => {
      result = r;
    });

    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = Array.from(document.body.querySelectorAll('mat-dialog-container button'));
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancelar'));
    (cancelButton as HTMLElement).click();

    await vi.waitFor(() => expect(result).toBe(false));
  });
});
