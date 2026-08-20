import { test, expect } from '../../fixtures/api-client.fixture';
import { memberFactory } from '../../factories/member.factory';
import { stallFactory } from '../../factories/stall.factory';
import { serviceFactory } from '../../factories/service.factory';
import { accountReceivableFactory } from '../../factories/account-receivable.factory';
import { paymentFactory } from '../../factories/payment.factory';
import { firstStageUuid } from '../../factories/catalogs';
import { CxcListPage } from '../../pages/cxc/cxc-list.page';
import { CxcSummaryPage } from '../../pages/cxc/cxc-summary.page';

test('4.5.3 resumen de movimientos por socio muestra el pago liquidado', async ({
  page,
  apiAdmin,
  apiCashier,
}) => {
  const stageUuid = await firstStageUuid(apiAdmin);
  const member = await memberFactory.createViaApi(apiAdmin, { stageUuid });
  const service = await serviceFactory.createViaApi(apiAdmin, { chargeTarget: 'Member', cost: 45 });
  const cxc = await accountReceivableFactory.generateByMemberViaApi(apiAdmin, {
    memberUuid: member.uuid,
    serviceUuid: service.uuid,
    stageCodes: [1, 2, 3],
    amount: 45,
  });
  const payment = await paymentFactory.payViaApi(apiCashier, [cxc.uuid]);

  const summary = new CxcSummaryPage(page);
  await summary.gotoForMember(member.uuid);

  const row = summary.row(service.name);
  await expect(row).toBeVisible();
  await expect(row).toContainText('Pago en caja');
  await expect(row).toContainText(String(payment.receipt.correlativeNumber));
});

test('4.5.4 resumen de movimientos por puesto muestra el pago liquidado', async ({
  page,
  apiAdmin,
  apiCashier,
}) => {
  const stall = await stallFactory.createViaApi(apiAdmin);
  const service = await serviceFactory.createViaApi(apiAdmin, { chargeTarget: 'Stall', cost: 65 });
  const cxc = await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
    stallUuid: stall.uuid,
    serviceUuid: service.uuid,
    amount: 65,
  });
  const payment = await paymentFactory.payViaApi(apiCashier, [cxc.uuid]);

  const summary = new CxcSummaryPage(page);
  await summary.gotoForStall(stall.uuid);

  const row = summary.row(service.name);
  await expect(row).toBeVisible();
  await expect(row).toContainText('Pago en caja');
  await expect(row).toContainText(String(payment.receipt.correlativeNumber));
});

test('4.5.5 "Ver resumen" sin socio ni puesto seleccionado no navega y pide seleccionar uno', async ({
  page,
}) => {
  const list = new CxcListPage(page);
  await list.goto();
  await list.clickSummaryWithoutFilter();

  await expect(page.getByText('Seleccione un socio o puesto para ver el resumen')).toBeVisible();
  await expect(page).toHaveURL(/\/account-receivables$/);
});
