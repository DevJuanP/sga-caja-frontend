import { test, expect } from '../../fixtures/api-client.fixture';
import { stallFactory } from '../../factories/stall.factory';
import { serviceFactory } from '../../factories/service.factory';
import { todayIso } from '../../factories/ids';
import { CxcListPage } from '../../pages/cxc/cxc-list.page';
import { CxcGenerateDialogPage } from '../../pages/cxc/cxc-generate-dialog.page';

test.describe('Epic 4 · CxC — Generación por puestos (RF-16–RF-18)', () => {
  test('4.3.1 generar CxC por puestos con servicio de costo fijo en PEN', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      consumptionBased: false,
      currencyCode: 'PEN',
      cost: 150,
    });

    const list = new CxcListPage(page);
    await list.goto();
    await list.openGenerate();
    const dialog = new CxcGenerateDialogPage(page);
    await dialog.fillByStall({
      serviceName: service.name,
      periodStartDate: todayIso(),
      periodEndDate: todayIso(),
      amount: 150,
    });
    await dialog.submit();

    const row = dialog.resultRow(stall.number);
    await expect(row).toBeVisible();
    await expect(row).toContainText('PEN');
    await expect(row).toContainText('150');
  });

  test('4.3.2 generar CxC por puestos con servicio por consumo oculta el campo Monto', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      consumptionBased: true,
    });

    const list = new CxcListPage(page);
    await list.goto();
    await list.openGenerate();
    const dialog = new CxcGenerateDialogPage(page);
    await dialog.goToStallTab();
    const panel = page.getByRole('dialog').getByRole('tabpanel', { name: 'Por puestos' });
    await expect(panel.getByLabel(/^Monto/)).toHaveCount(0);

    await dialog.fillByStall({
      serviceName: service.name,
      periodStartDate: todayIso(),
      periodEndDate: todayIso(),
    });
    await dialog.submit();

    await expect(dialog.resultRow(stall.number)).toBeVisible();
  });

  test('4.3.5 el label de Monto muestra la moneda del servicio seleccionado (USD)', async ({
    page,
    apiAdmin,
  }) => {
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      consumptionBased: false,
      currencyCode: 'USD',
    });

    const list = new CxcListPage(page);
    await list.goto();
    await list.openGenerate();
    const dialog = new CxcGenerateDialogPage(page);
    await dialog.goToStallTab();
    await page
      .getByRole('dialog')
      .getByRole('tabpanel', { name: 'Por puestos' })
      .getByRole('combobox', { name: 'Servicio' })
      .click({ force: true });
    await page.getByRole('option', { name: service.name }).click();
    await expect(page.getByRole('listbox')).toHaveCount(0);

    await expect(dialog.amountLabel('Por puestos')).toContainText('USD');
  });

  test('4.3.6 la columna Moneda del resultado refleja la moneda del servicio (USD, nunca PEN)', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      consumptionBased: false,
      currencyCode: 'USD',
    });

    const list = new CxcListPage(page);
    await list.goto();
    await list.openGenerate();
    const dialog = new CxcGenerateDialogPage(page);
    await dialog.fillByStall({
      serviceName: service.name,
      periodStartDate: todayIso(),
      periodEndDate: todayIso(),
      amount: 80,
    });
    await dialog.submit();

    const row = dialog.resultRow(stall.number);
    await expect(row).toContainText('USD');
    await expect(row).not.toContainText('PEN');
  });
});
