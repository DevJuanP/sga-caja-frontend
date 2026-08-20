import { test, expect } from '../../fixtures/api-client.fixture';
import { stallFactory } from '../../factories/stall.factory';
import { memberFactory } from '../../factories/member.factory';
import { serviceFactory } from '../../factories/service.factory';
import { accountReceivableFactory } from '../../factories/account-receivable.factory';
import { stageUuidByCode } from '../../factories/catalogs';
import { PaymentsListPage } from '../../pages/payments/payments-list.page';
import { PaymentDialogPage } from '../../pages/payments/payment-dialog.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { selectMatOption } from '../../pages/masters/mat-select.util';

test.describe('Epic 6 · Cobranza / Pagos (RF-19–RF-23)', () => {
  test('4.6.1 calcular total y pagar una CxC de puesto', async ({ page, apiAdmin }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      currencyCode: 'PEN',
      cost: 100,
    });
    await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
      stallUuid: stall.uuid,
      serviceUuid: service.uuid,
      amount: 100,
    });

    const list = new PaymentsListPage(page);
    await list.goto();
    await list.filterByService(service.name);
    await list.filterByStall(stall.number);
    await list.selectRow(stall.number);
    await list.computeTotal();

    const dialog = new PaymentDialogPage(page);
    await dialog.expectSummary('PEN', '100.00');
    await dialog.confirmAndPay();
    await dialog.expectReceiptCurrency('PEN');
    await expect(dialog.receiptCorrelative()).not.toBeEmpty();
    await dialog.close();

    await expect(list.row(stall.number)).toContainText('Pagado');
  });

  test('4.6.2 calcular total y pagar una CxC de socio', async ({ page, apiAdmin }) => {
    const stageUuid = await stageUuidByCode(apiAdmin, 1);
    const member = await memberFactory.createViaApi(apiAdmin, { stageUuid });
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Member',
      currencyCode: 'PEN',
      cost: 60,
    });
    await accountReceivableFactory.generateByMemberViaApi(apiAdmin, {
      memberUuid: member.uuid,
      serviceUuid: service.uuid,
      stageCodes: [1],
      amount: 60,
    });

    const list = new PaymentsListPage(page);
    await list.goto();
    await list.goToMemberTab();
    await list.filterByService(service.name);
    await list.filterByMember(new RegExp(member.lastName));
    await list.selectRow(member.lastName);
    await list.computeTotal();

    const dialog = new PaymentDialogPage(page);
    await dialog.expectSummary('PEN', '60.00');
    await dialog.confirmAndPay();
    await dialog.expectReceiptCurrency('PEN');
    await dialog.close();

    await expect(list.row(member.lastName)).toContainText('Pagado');
  });

  test('4.6.3 pagar múltiples CxC del mismo puesto en un solo recibo', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const serviceA = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      cost: 30,
    });
    const serviceB = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      cost: 45,
    });
    await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
      stallUuid: stall.uuid,
      serviceUuid: serviceA.uuid,
      amount: 30,
    });
    await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
      stallUuid: stall.uuid,
      serviceUuid: serviceB.uuid,
      amount: 45,
    });

    const list = new PaymentsListPage(page);
    await list.goto();
    await list.filterByStall(stall.number);
    await list.selectRow(serviceA.name);
    await list.selectRow(serviceB.name);
    await list.computeTotal();

    const dialog = new PaymentDialogPage(page);
    await dialog.expectSummary('PEN', '75.00');
    await dialog.confirmAndPay();
    const correlative = await dialog.receiptCorrelative().textContent();
    await dialog.close();

    await expect(list.row(serviceA.name)).toContainText('Pagado');
    await expect(list.row(serviceB.name)).toContainText('Pagado');
    expect(correlative).toBeTruthy();
  });

  test('4.6.4 pagar una CxC en USD muestra USD en todo el flujo (nunca PEN)', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      currencyCode: 'USD',
      cost: 90,
    });
    await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
      stallUuid: stall.uuid,
      serviceUuid: service.uuid,
      amount: 90,
    });

    const list = new PaymentsListPage(page);
    await list.goto();
    await list.filterByService(service.name);
    await list.filterByStall(stall.number);
    await expect(list.row(stall.number)).toContainText('USD');
    await expect(list.row(stall.number)).not.toContainText('PEN');
    await list.selectRow(stall.number);
    await list.computeTotal();

    const dialog = new PaymentDialogPage(page);
    await dialog.expectSummary('USD', '90.00');
    await dialog.confirmAndPay();
    await dialog.expectReceiptCurrency('USD');
  });

  test('4.6.5 exonerar en lote desde Cobranza pasa las CxC seleccionadas a Exonerado', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const serviceA = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      cost: 20,
    });
    const serviceB = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Stall',
      cost: 25,
    });
    await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
      stallUuid: stall.uuid,
      serviceUuid: serviceA.uuid,
      amount: 20,
    });
    await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
      stallUuid: stall.uuid,
      serviceUuid: serviceB.uuid,
      amount: 25,
    });

    const list = new PaymentsListPage(page);
    await list.goto();
    await list.filterByStall(stall.number);
    await list.markExempt(serviceA.name);
    await list.markExempt(serviceB.name);
    await list.exemptSelected();
    await new ConfirmDialogPage(page).confirm('Exonerar');

    await expect(list.row(serviceA.name)).toContainText('Exonerado');
    await expect(list.row(serviceB.name)).toContainText('Exonerado');
  });

  test('4.6.6 la selección se preserva al cambiar de página', async ({ page, apiAdmin }) => {
    const stall = await stallFactory.createViaApi(apiAdmin);
    const services = await Promise.all(
      Array.from({ length: 11 }, () =>
        serviceFactory.createViaApi(apiAdmin, { chargeTarget: 'Stall', cost: 10 }),
      ),
    );
    for (const service of services) {
      await accountReceivableFactory.generateByStallViaApi(apiAdmin, {
        stallUuid: stall.uuid,
        serviceUuid: service.uuid,
        amount: 10,
      });
    }

    const list = new PaymentsListPage(page);
    await list.goto();
    await list.filterByStall(stall.number);

    await selectMatOption(page, page.getByRole('combobox', { name: 'Items per page:' }), '10', true);
    // No se fija el total exacto (plan §3.3.4): solo que la paginación ya está a 10 por
    // página, lo cual garantiza al menos 2 páginas dado que se generaron 11 CxC propias.
    await expect(page.getByRole('status')).toContainText(/1 – 10 of \d+/);

    // No se asume qué servicio cae en la página 1 (depende del orden del backend) — se
    // toma el texto único de la primera fila realmente renderizada.
    const firstRowText = await page
      .getByRole('row')
      .filter({ hasText: 'E2E-Servicio' })
      .first()
      .textContent();
    const uniqueText = services.find((s) => firstRowText?.includes(s.name))!.name;

    await list.selectRow(uniqueText);
    await expect(list.row(uniqueText).getByRole('checkbox').first()).toBeChecked();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(list.row(uniqueText)).toHaveCount(0);

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(list.row(uniqueText).getByRole('checkbox').first()).toBeChecked();
  });
});
