import { test, expect } from '../../fixtures/api-client.fixture';
import { bankFactory } from '../../factories/bank.factory';
import { uniqueCode, uniqueName } from '../../factories/ids';
import { CrudListPage } from '../../pages/masters/crud-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { BankFormPage } from '../../pages/masters/bank-form.page';
import { expectRequiredFieldBlocksSave } from '../../pages/masters/form-dialog.util';

const PATH = '/masters/banks';

test.describe('Epic 3 · Maestros — Bancos (RF-05–RF-12)', () => {
  test('4.2.x.1 listar muestra la tabla de bancos', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Bancos' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nº de cuenta' })).toBeVisible();
  });

  for (const currencyCode of ['PEN', 'USD'] as const) {
    test(`4.2.x.2 crear un banco en ${currencyCode}`, async ({ page }) => {
      const list = new CrudListPage(page, PATH);
      const name = uniqueName('Banco');
      const accountNumber = uniqueCode('E2E-B-', 40);

      await list.goto();
      await list.clickCreate('Nuevo banco');
      await new BankFormPage(page).create({
        name,
        accountNumber,
        cci: uniqueCode('CCI-', 40),
        currencyCode,
      });

      await list.search(accountNumber);
      await list.expectRowVisible(accountNumber);
      await expect(list.row(accountNumber)).toContainText(currencyCode);
    });
  }

  test('4.2.x.3 editar un banco propio actualiza su nombre', async ({ page, apiAdmin }) => {
    const bank = await bankFactory.createViaApi(apiAdmin);
    const newName = uniqueName('Banco-editado');
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(bank.accountNumber);
    await list.clickRowAction(bank.accountNumber, 'Editar');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre').fill(newName);
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();

    await list.search(bank.accountNumber);
    await expect(list.row(bank.accountNumber)).toContainText(newName);
  });

  test('4.2.x.4 enviar el formulario vacío deja Guardar deshabilitado', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await list.clickCreate('Nuevo banco');

    await expectRequiredFieldBlocksSave(page, 'Nombre');
  });

  test('4.2.x.5 desactivar/reactivar un banco propio se refleja en el filtro de estado', async ({
    page,
    apiAdmin,
  }) => {
    const bank = await bankFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(bank.accountNumber);
    await list.clickRowAction(bank.accountNumber, 'Desactivar');
    await new ConfirmDialogPage(page).confirm('Desactivar');

    await list.setActiveFilter('Activos');
    await list.expectRowHidden(bank.accountNumber);
    await list.setActiveFilter('Inactivos');
    await list.expectRowVisible(bank.accountNumber);
  });
});
