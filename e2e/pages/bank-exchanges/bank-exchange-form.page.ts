import { Page } from '@playwright/test';
import { selectMatOption } from '../masters/mat-select.util';

export class BankExchangeFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  /** El option del select de CxC muestra "{servicio} - {socio} (...)" — `generate-by-member`
   * genera esa CxC para TODOS los socios activos de las etapas pedidas (plan/hallazgo de
   * Fase 2), así que el nombre del servicio solo no basta para desambiguar: hace falta
   * combinarlo con un dato único del socio propio (p. ej. su apellido). */
  async selectCxc(serviceNameSubstring: string, memberSubstring: string): Promise<void> {
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'CxC pendiente (socio)' }),
      new RegExp(`${serviceNameSubstring}.*${memberSubstring}`),
    );
  }

  async selectBank(bankName: string): Promise<void> {
    await selectMatOption(this.page, this.dialog.getByRole('combobox', { name: 'Banco' }), bankName);
  }

  async fillDepositDate(date: string): Promise<void> {
    await this.dialog.getByLabel('Fecha de depósito').fill(date);
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Registrar canje' }).click();
  }
}
