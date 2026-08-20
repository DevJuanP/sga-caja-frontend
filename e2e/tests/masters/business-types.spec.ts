import { test, expect } from '../../fixtures/api-client.fixture';
import { businessTypeFactory } from '../../factories/business-type.factory';
import { uniqueName } from '../../factories/ids';
import { CrudListPage } from '../../pages/masters/crud-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { BusinessTypeFormPage } from '../../pages/masters/business-type-form.page';
import { expectRequiredFieldBlocksSave } from '../../pages/masters/form-dialog.util';

const PATH = '/masters/business-types';

test.describe('Epic 3 · Maestros — Giros comerciales (RF-05–RF-12)', () => {
  test('4.2.x.1 listar muestra la tabla de giros', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Giros comerciales' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
  });

  test('4.2.x.2 crear un giro nuevo lo muestra en la tabla', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    const name = uniqueName('Giro');

    await list.goto();
    await list.clickCreate('Nuevo giro');
    await new BusinessTypeFormPage(page).create(name);

    await list.expectRowVisible(name);
  });

  test('4.2.x.3 editar un giro propio actualiza el nombre en la tabla', async ({
    page,
    apiAdmin,
  }) => {
    const original = await businessTypeFactory.createViaApi(apiAdmin);
    const updatedName = uniqueName('Giro-editado');
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.expectRowVisible(original.name);
    await list.clickRowAction(original.name, 'Editar');
    await new BusinessTypeFormPage(page).create(updatedName);

    await list.expectRowVisible(updatedName);
    await list.expectRowHidden(original.name);
  });

  test('4.2.x.4 enviar el formulario vacío deja Guardar deshabilitado', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await list.clickCreate('Nuevo giro');

    await expectRequiredFieldBlocksSave(page, 'Nombre');
  });

  test('4.2.x.5 eliminar un giro propio (sin puestos asociados) lo quita de la tabla', async ({
    page,
    apiAdmin,
  }) => {
    const businessType = await businessTypeFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.expectRowVisible(businessType.name);
    await list.clickRowAction(businessType.name, 'Eliminar');
    await new ConfirmDialogPage(page).confirm('Eliminar');

    await list.expectRowHidden(businessType.name);
  });
});
