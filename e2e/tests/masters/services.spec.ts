import { test, expect } from '../../fixtures/api-client.fixture';
import { serviceFactory } from '../../factories/service.factory';
import { CURRENCY_SYMBOLS } from '../../factories/catalogs';
import { uniqueName } from '../../factories/ids';
import { CrudListPage } from '../../pages/masters/crud-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { ServiceFormPage } from '../../pages/masters/service-form.page';
import { expectRequiredFieldBlocksSave } from '../../pages/masters/form-dialog.util';

const PATH = '/masters/services';

test.describe('Epic 3 · Maestros — Servicios cobrables (RF-05–RF-12, RF-15)', () => {
  test('4.2.x.1 listar muestra la tabla de servicios', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Servicios', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Servicio' })).toBeVisible();
  });

  for (const currencyCode of ['PEN', 'USD'] as const) {
    test(`4.2.x.2 crear un servicio de costo fijo en ${currencyCode}`, async ({ page }) => {
      const list = new CrudListPage(page, PATH);
      const name = uniqueName('Servicio-fijo');

      await list.goto();
      await list.clickCreate('Nuevo servicio');
      await new ServiceFormPage(page).create({
        name,
        currencyCode,
        consumptionBased: false,
        amount: 120,
      });

      await list.search(name);
      await list.expectRowVisible(name);
      await expect(list.row(name)).toContainText(CURRENCY_SYMBOLS[currencyCode]);
    });
  }

  test('4.2.x.2c crear un servicio por consumo oculta el campo de costo fijo', async ({
    page,
  }) => {
    const list = new CrudListPage(page, PATH);
    const name = uniqueName('Servicio-consumo');

    await list.goto();
    await list.clickCreate('Nuevo servicio');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Costo fijo')).toBeVisible();
    await expect(dialog.getByLabel('Costo por unidad')).toHaveCount(0);

    await new ServiceFormPage(page).create({
      name,
      currencyCode: 'PEN',
      consumptionBased: true,
      amount: 5,
    });

    await list.search(name);
    await list.expectRowVisible(name);
    await expect(list.row(name)).toContainText('Medido');
  });

  test('4.2.x.3 editar un servicio propio actualiza su nombre', async ({ page, apiAdmin }) => {
    const service = await serviceFactory.createViaApi(apiAdmin);
    const newName = uniqueName('Servicio-editado');
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(service.name);
    await list.clickRowAction(service.name, 'Editar');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre').fill(newName);
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();

    await list.search(newName);
    await list.expectRowVisible(newName);
  });

  test('4.2.x.4 enviar el formulario vacío deja Guardar deshabilitado', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await list.clickCreate('Nuevo servicio');

    await expectRequiredFieldBlocksSave(page, 'Nombre');
  });

  test('4.2.x.5 desactivar/reactivar un servicio propio se refleja en el filtro de estado', async ({
    page,
    apiAdmin,
  }) => {
    const service = await serviceFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(service.name);
    await list.clickRowAction(service.name, 'Desactivar');
    await new ConfirmDialogPage(page).confirm('Desactivar');

    await list.setActiveFilter('Activos');
    await list.expectRowHidden(service.name);
    await list.setActiveFilter('Inactivos');
    await list.expectRowVisible(service.name);
  });
});
