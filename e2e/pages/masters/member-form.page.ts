import { Page } from '@playwright/test';
import { selectMatOption } from './mat-select.util';

export interface MemberFormData {
  code: string;
  firstName: string;
  lastName: string;
  shareNumber: string;
  /** Nombre exacto de la etapa a seleccionar; si se omite, toma la primera disponible
   * (el contenido del catálogo `Stage` es indiferente para un CRUD feliz). */
  stageName?: string;
  birthDate: string;
}

export class MemberFormPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async fill(data: MemberFormData): Promise<void> {
    await this.dialog.getByLabel('Código').fill(data.code);
    await this.dialog.getByLabel('Nombres').fill(data.firstName);
    await this.dialog.getByLabel('Apellidos').fill(data.lastName);
    await this.dialog.getByLabel('Part. social').fill(data.shareNumber);
    await selectMatOption(
      this.page,
      this.dialog.getByRole('combobox', { name: 'Etapa de socio' }),
      data.stageName,
    );
    await this.dialog.getByLabel('Fecha de nacimiento').fill(data.birthDate);
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  }

  async create(data: MemberFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
