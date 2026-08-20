import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../fixtures/api-client.fixture';
import { stallFactory } from '../../factories/stall.factory';
import { serviceFactory } from '../../factories/service.factory';
import { accountReceivableFactory } from '../../factories/account-receivable.factory';
import { CxcListPage } from '../../pages/cxc/cxc-list.page';
import { ConsumptionReadingDialogPage } from '../../pages/cxc/consumption-reading-dialog.page';

async function setupConsumptionCxc(apiAdmin: APIRequestContext) {
  const stall = await stallFactory.createViaApi(apiAdmin);
  const service = await serviceFactory.createViaApi(apiAdmin, {
    chargeTarget: 'Stall',
    consumptionBased: true,
    unitCost: 5,
    currencyCode: 'PEN',
  });
  const cxc = await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
    stallUuid: stall.uuid,
    serviceUuid: service.uuid,
  });
  return { stall, service, cxc };
}

test.describe('Epic 5 · Lecturas de consumo (RF-17)', () => {
  test('4.4.1 registrar lectura con consumo positivo calcula el importe', async ({
    page,
    apiAdmin,
  }) => {
    // `generate-by-stall` genera una fila por CADA puesto activo del sistema (no solo el
    // propio), y con `fullyParallel` otros tests pueden estar generando CxC para su
    // propio puesto al mismo tiempo, aterrizando también en el puesto de este test (y
    // viceversa). Filtrar solo por Puesto no basta para aislar la fila propia — hace
    // falta combinar Puesto + Servicio, la única combinación que identifica unívocamente
    // la CxC que generó este test (ver hallazgo de la sesión).
    const { stall, service } = await setupConsumptionCxc(apiAdmin);
    const list = new CxcListPage(page);

    await list.goto();
    await list.filterByStall(stall.number);
    await list.filterByService(service.name);
    await list.openReading(stall.number);

    const reading = new ConsumptionReadingDialogPage(page);
    await reading.register(10, 15);

    await expect(reading.fieldValue('Importe calculado')).toContainText('25');
    await expect(reading.fieldValue('Moneda')).toContainText('PEN');
  });

  test('4.4.2 consumo no positivo (final <= inicial) calcula importe 0', async ({
    page,
    apiAdmin,
  }) => {
    // `generate-by-stall` genera una fila por CADA puesto activo del sistema (no solo el
    // propio), y con `fullyParallel` otros tests pueden estar generando CxC para su
    // propio puesto al mismo tiempo, aterrizando también en el puesto de este test (y
    // viceversa). Filtrar solo por Puesto no basta para aislar la fila propia — hace
    // falta combinar Puesto + Servicio, la única combinación que identifica unívocamente
    // la CxC que generó este test (ver hallazgo de la sesión).
    const { stall, service } = await setupConsumptionCxc(apiAdmin);
    const list = new CxcListPage(page);

    await list.goto();
    await list.filterByStall(stall.number);
    await list.filterByService(service.name);
    await list.openReading(stall.number);

    const reading = new ConsumptionReadingDialogPage(page);
    await reading.register(10, 5);

    await expect(reading.fieldValue('Importe calculado')).toContainText('0');
  });

  test('4.4.3 reabrir la lectura de una CxC ya leída muestra la vista de solo lectura', async ({
    page,
    apiAdmin,
  }) => {
    // `generate-by-stall` genera una fila por CADA puesto activo del sistema (no solo el
    // propio), y con `fullyParallel` otros tests pueden estar generando CxC para su
    // propio puesto al mismo tiempo, aterrizando también en el puesto de este test (y
    // viceversa). Filtrar solo por Puesto no basta para aislar la fila propia — hace
    // falta combinar Puesto + Servicio, la única combinación que identifica unívocamente
    // la CxC que generó este test (ver hallazgo de la sesión).
    const { stall, service } = await setupConsumptionCxc(apiAdmin);
    const list = new CxcListPage(page);

    await list.goto();
    await list.filterByStall(stall.number);
    await list.filterByService(service.name);
    await list.openReading(stall.number);
    await new ConsumptionReadingDialogPage(page).register(10, 20);
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();

    await list.openReading(stall.number);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Lectura inicial')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Registrar' })).toHaveCount(0);
    await expect(dialog.getByLabel('Lectura inicial')).toHaveCount(0);
  });
});
