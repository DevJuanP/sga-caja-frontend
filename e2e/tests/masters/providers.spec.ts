import { test, expect } from '../../fixtures/api-client.fixture';
import { providerFactory } from '../../factories/provider.factory';
import { uniqueCode, uniqueName } from '../../factories/ids';
import { CrudListPage } from '../../pages/masters/crud-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { ProviderFormPage } from '../../pages/masters/provider-form.page';
import { expectRequiredFieldBlocksSave } from '../../pages/masters/form-dialog.util';

const PATH = '/masters/providers';

test.describe('Epic 3 · Maestros — Proveedores (RF-05–RF-12)', () => {
  test('4.2.x.1 listar muestra la tabla de proveedores', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Proveedores' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Documento' })).toBeVisible();
  });

  test('4.2.x.2 crear un proveedor nuevo lo muestra al buscar por su documento', async ({
    page,
  }) => {
    const list = new CrudListPage(page, PATH);
    const name = uniqueName('Proveedor');
    const document = uniqueCode('E2E-DOC-', 20);

    await list.goto();
    await list.clickCreate('Nuevo proveedor');
    await new ProviderFormPage(page).create({ name, document });

    await list.search(document);
    await list.expectRowVisible(document);
  });

  test('4.2.x.3 editar un proveedor propio actualiza su nombre', async ({ page, apiAdmin }) => {
    const provider = await providerFactory.createViaApi(apiAdmin);
    const newName = uniqueName('Proveedor-editado');
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(provider.name);
    await list.clickRowAction(provider.name, 'Editar');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre').fill(newName);
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();

    await list.search(newName);
    await list.expectRowVisible(newName);
  });

  test('4.2.x.4 enviar el formulario vacío deja Guardar deshabilitado', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await list.clickCreate('Nuevo proveedor');

    await expectRequiredFieldBlocksSave(page, 'Nombre');
  });

  test('4.2.x.5 desactivar/reactivar un proveedor propio se refleja en el filtro de estado', async ({
    page,
    apiAdmin,
  }) => {
    const provider = await providerFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(provider.name);
    await list.clickRowAction(provider.name, 'Desactivar');
    await new ConfirmDialogPage(page).confirm('Desactivar');

    await list.setActiveFilter('Activos');
    await list.expectRowHidden(provider.name);
    await list.setActiveFilter('Inactivos');
    await list.expectRowVisible(provider.name);
  });
});
