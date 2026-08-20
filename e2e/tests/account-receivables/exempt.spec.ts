import { test, expect } from '../../fixtures/api-client.fixture';
import { stallFactory } from '../../factories/stall.factory';
import { serviceFactory } from '../../factories/service.factory';
import { accountReceivableFactory } from '../../factories/account-receivable.factory';
import { CxcListPage } from '../../pages/cxc/cxc-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';

// PATCH .../exempt es CashierOperator-only (@PreAuthorize del backend) — se fuerza el
// storageState de cashier sin importar bajo qué project corra este spec (plan §3.4).
test.use({ storageState: 'e2e/.auth/cashier.json' });

test('4.5.2 exonerar una CxC pendiente muestra moneda+monto en la confirmación y cambia su estado', async ({
  page,
  apiAdmin,
}) => {
  const stall = await stallFactory.createViaApi(apiAdmin);
  const service = await serviceFactory.createViaApi(apiAdmin, {
    chargeTarget: 'Stall',
    currencyCode: 'USD',
    cost: 75,
  });
  await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
    stallUuid: stall.uuid,
    serviceUuid: service.uuid,
    amount: 75,
  });

  const list = new CxcListPage(page);
  await list.goto();
  // Puesto + Servicio combinados: `generate-by-stall` toca TODOS los puestos activos,
  // así que filtrar solo por puesto no aísla esta fila entre corridas en paralelo.
  await list.filterByStall(stall.number);
  await list.filterByService(service.name);
  await list.exempt(stall.number);

  await expect(page.getByRole('dialog')).toContainText('USD');
  await expect(page.getByRole('dialog')).toContainText('75');
  await new ConfirmDialogPage(page).confirm('Exonerar');

  await expect(list.row(stall.number)).toContainText('Exonerado');
});
