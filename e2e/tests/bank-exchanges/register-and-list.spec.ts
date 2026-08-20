import { test, expect } from '../../fixtures/api-client.fixture';
import { memberFactory } from '../../factories/member.factory';
import { serviceFactory } from '../../factories/service.factory';
import { bankFactory } from '../../factories/bank.factory';
import { accountReceivableFactory } from '../../factories/account-receivable.factory';
import { stageUuidByCode } from '../../factories/catalogs';
import { todayIso } from '../../factories/ids';
import { BankExchangeListPage } from '../../pages/bank-exchanges/bank-exchange-list.page';
import { BankExchangeFormPage } from '../../pages/bank-exchanges/bank-exchange-form.page';

test.describe('Epic 7 · Canjes bancarios (RF-24, RF-31)', () => {
  test('4.7.1 registrar un canje bancario para una CxC de socio pendiente', async ({
    page,
    apiAdmin,
  }) => {
    const stageUuid = await stageUuidByCode(apiAdmin, 1);
    const member = await memberFactory.createViaApi(apiAdmin, { stageUuid });
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Member',
      currencyCode: 'USD',
      cost: 55,
    });
    const bank = await bankFactory.createViaApi(apiAdmin, { currencyCode: 'USD' });
    await accountReceivableFactory.generateByMemberViaApi(apiAdmin, {
      memberUuid: member.uuid,
      serviceUuid: service.uuid,
      stageCodes: [1],
      amount: 55,
    });

    const list = new BankExchangeListPage(page);
    await list.goto();
    await list.openCreate();

    const form = new BankExchangeFormPage(page);
    await form.selectCxc(service.name, member.lastName);
    await form.selectBank(bank.name);
    await form.fillDepositDate(todayIso());
    await form.submit();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('USD')).toBeVisible();
    await expect(dialog.getByText('55.00')).toBeVisible();
  });

  test('4.7.2 listar canjes filtrando por banco y abrir el voucher', async ({
    page,
    apiAdmin,
  }) => {
    const stageUuid = await stageUuidByCode(apiAdmin, 1);
    const member = await memberFactory.createViaApi(apiAdmin, { stageUuid });
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Member',
      currencyCode: 'USD',
      cost: 65,
    });
    const bank = await bankFactory.createViaApi(apiAdmin, { currencyCode: 'USD' });
    await accountReceivableFactory.generateByMemberViaApi(apiAdmin, {
      memberUuid: member.uuid,
      serviceUuid: service.uuid,
      stageCodes: [1],
      amount: 65,
    });

    const list = new BankExchangeListPage(page);
    await list.goto();
    await list.openCreate();
    const form = new BankExchangeFormPage(page);
    await form.selectCxc(service.name, member.lastName);
    await form.selectBank(bank.name);
    await form.fillDepositDate(todayIso());
    await form.submit();
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();

    await list.goto();
    await list.filterByBank(bank.name);
    await list.expectRowVisible(service.name);
    await expect(list.row(service.name)).toContainText('USD');
    await expect(list.row(service.name)).not.toContainText('PEN');

    await list.viewVoucher(service.name);
    await expect(page.getByRole('dialog').getByText('USD')).toBeVisible();
  });
});
