import { Page } from '@playwright/test';
import { selectMatOption } from '../masters/mat-select.util';

export interface GenerateByStallData {
  serviceName: string;
  periodStartDate: string;
  periodEndDate: string;
  amount?: number;
}

export interface GenerateByMemberData {
  serviceName: string;
  periodStartDate: string;
  periodEndDate: string;
  amount?: number;
  stages: (1 | 2 | 3)[];
  uniqueMembers?: boolean;
}

/** `cxc-generate-dialog` — dos pestañas (Por puestos / Por socios) que comparten
 * estructura pero cada una tiene su propio `mat-select` de Servicio (el diálogo separa
 * `servicesForStall`/`servicesForMember` filtrando por `chargeTargetType`, ver
 * `serviceFactory`'s `chargeTarget` override). */
export class CxcGenerateDialogPage {
  constructor(private readonly page: Page) {}

  private get dialog() {
    return this.page.getByRole('dialog');
  }

  async goToStallTab(): Promise<void> {
    await this.dialog.getByRole('tab', { name: 'Por puestos' }).click();
  }

  async goToMemberTab(): Promise<void> {
    await this.dialog.getByRole('tab', { name: 'Por socios' }).click();
  }

  async fillByStall(data: GenerateByStallData): Promise<void> {
    await this.goToStallTab();
    await selectMatOption(
      this.page,
      this.dialog.getByRole('tabpanel', { name: 'Por puestos' }).getByRole('combobox', { name: 'Servicio' }),
      data.serviceName,
    );
    const panel = this.dialog.getByRole('tabpanel', { name: 'Por puestos' });
    await panel.getByLabel('Fecha inicio').fill(data.periodStartDate);
    await panel.getByLabel('Fecha fin').fill(data.periodEndDate);
    if (data.amount !== undefined) {
      await panel.getByLabel(/^Monto/).fill(String(data.amount));
    }
  }

  async fillByMember(data: GenerateByMemberData): Promise<void> {
    await this.goToMemberTab();
    const panel = this.dialog.getByRole('tabpanel', { name: 'Por socios' });
    await selectMatOption(this.page, panel.getByRole('combobox', { name: 'Servicio' }), data.serviceName);
    await panel.getByLabel('Fecha inicio').fill(data.periodStartDate);
    await panel.getByLabel('Fecha fin').fill(data.periodEndDate);
    if (data.amount !== undefined) {
      await panel.getByLabel(/^Monto/).fill(String(data.amount));
    }
    for (const stage of data.stages) {
      await panel.getByRole('checkbox', { name: `Etapa ${stage}` }).check();
    }
    if (data.uniqueMembers === false) {
      await panel.getByRole('switch', { name: 'Solo socios únicos' }).click();
    }
  }

  amountLabel(panelName: 'Por puestos' | 'Por socios') {
    return this.dialog
      .getByRole('tabpanel', { name: panelName })
      .locator('mat-label', { hasText: 'Monto' });
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Generar', exact: true }).click();
  }

  resultRow(uniqueText: string) {
    return this.dialog.getByRole('row', { name: uniqueText });
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cerrar' }).click();
  }
}
