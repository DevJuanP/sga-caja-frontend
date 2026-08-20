import { test, expect } from '../../fixtures/api-client.fixture';
import { stallFactory } from '../../factories/stall.factory';
import { serviceFactory } from '../../factories/service.factory';
import { accountReceivableFactory } from '../../factories/account-receivable.factory';
import { CxcListPage } from '../../pages/cxc/cxc-list.page';

test('4.5.1 listar y filtrar CxC por servicio muestra solo las filas de ese servicio', async ({
  page,
  apiAdmin,
}) => {
  const stall = await stallFactory.createViaApi(apiAdmin);
  const serviceA = await serviceFactory.createViaApi(apiAdmin, { chargeTarget: 'Stall', cost: 40 });
  const serviceB = await serviceFactory.createViaApi(apiAdmin, { chargeTarget: 'Stall', cost: 60 });
  await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
    stallUuid: stall.uuid,
    serviceUuid: serviceA.uuid,
    amount: 40,
  });
  await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
    stallUuid: stall.uuid,
    serviceUuid: serviceB.uuid,
    amount: 60,
  });

  const list = new CxcListPage(page);
  await list.goto();
  await list.filterByService(serviceA.name);

  // `generate-by-stall` crea una fila por cada puesto activo del sistema — filtrar por
  // Servicio ya aísla el servicio propio, pero para llegar a UNA sola fila hace falta
  // acotar también por el puesto propio (ver hallazgo de la sesión sobre alcance
  // system-wide de este endpoint).
  const ownRow = list.row(serviceA.name).filter({ hasText: stall.number });
  await expect(ownRow).toBeVisible();
  await expect(ownRow).toContainText('PEN');
  await expect(list.row(serviceB.name).filter({ hasText: stall.number })).toHaveCount(0);
});
