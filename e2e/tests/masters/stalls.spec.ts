import { test, expect } from '../../fixtures/api-client.fixture';
import { businessTypeFactory } from '../../factories/business-type.factory';
import { memberFactory } from '../../factories/member.factory';
import { stallFactory } from '../../factories/stall.factory';
import { todayIso, uniqueCode } from '../../factories/ids';
import { CrudListPage } from '../../pages/masters/crud-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { StallFormPage } from '../../pages/masters/stall-form.page';
import { expectRequiredFieldBlocksSave } from '../../pages/masters/form-dialog.util';
import { selectMatOption } from '../../pages/masters/mat-select.util';

const PATH = '/masters/stalls';

function futureIso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test.describe('Epic 3 · Maestros — Puestos (RF-05–RF-12)', () => {
  test('4.2.x.1 listar muestra la tabla de puestos', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Puestos' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Número' })).toBeVisible();
  });

  test('4.2.x.2a crear un puesto sin socio asociado', async ({ page, apiAdmin }) => {
    const businessType = await businessTypeFactory.createViaApi(apiAdmin);
    const number = uniqueCode('E2E-P-', 20);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.clickCreate('Nuevo puesto');
    await new StallFormPage(page).create({
      number,
      businessTypeName: businessType.name,
      validityStartDate: todayIso(),
      validityEndDate: futureIso(365),
    });

    await list.search(number);
    await list.expectRowVisible(number);
  });

  test('4.2.x.2b crear un puesto con socio asociado', async ({ page, apiAdmin }) => {
    const businessType = await businessTypeFactory.createViaApi(apiAdmin);
    const member = await memberFactory.createViaApi(apiAdmin);
    const number = uniqueCode('E2E-P-', 20);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.clickCreate('Nuevo puesto');
    await new StallFormPage(page).create({
      number,
      businessTypeName: businessType.name,
      memberSearchText: member.code,
      validityStartDate: todayIso(),
      validityEndDate: futureIso(365),
    });

    await list.search(number);
    await list.expectRowVisible(number);
    await expect(list.row(number)).toContainText(member.firstName);
  });

  test('4.2.x.3 editar un puesto propio actualiza sus fechas de vigencia', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin, {
      validityStartDate: todayIso(),
      validityEndDate: futureIso(30),
    });
    const list = new CrudListPage(page, PATH);
    const newEndDate = futureIso(720);

    await list.goto();
    await list.search(stall.number);
    await list.clickRowAction(stall.number, 'Editar');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Vigencia hasta').fill(newEndDate);
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();

    await list.search(stall.number);
    // `crud-table` no formatea columnas `date` (imprime el valor crudo del backend,
    // ISO `yyyy-MM-dd`) — se compara contra ese mismo formato, no una fecha localizada.
    await expect(list.row(stall.number)).toContainText(newEndDate);
  });

  test('4.2.x.4 enviar el formulario vacío deja Guardar deshabilitado', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await list.clickCreate('Nuevo puesto');

    await expectRequiredFieldBlocksSave(page, 'Número');
  });

  test('4.2.x.4b vigencia hasta anterior a vigencia desde es rechazada', async ({
    page,
    apiAdmin,
  }) => {
    const businessType = await businessTypeFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.clickCreate('Nuevo puesto');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Número').fill(uniqueCode('E2E-P-', 20));
    await selectMatOption(
      page,
      dialog.getByRole('combobox', { name: 'Giro comercial' }),
      businessType.name,
    );
    await dialog.getByLabel('Vigencia desde').fill(todayIso());
    await dialog.getByLabel('Vigencia hasta').fill(futureIso(-30));

    await expect(dialog.getByText('La fecha final debe ser posterior a la inicial')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
  });

  test('4.2.x.5 desactivar/reactivar un puesto propio se refleja en el filtro de estado', async ({
    page,
    apiAdmin,
  }) => {
    const stall = await stallFactory.createViaApi(apiAdmin, {
      validityStartDate: todayIso(),
      validityEndDate: futureIso(30),
    });
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(stall.number);
    await list.clickRowAction(stall.number, 'Desactivar');
    await new ConfirmDialogPage(page).confirm('Desactivar');

    await list.setActiveFilter('Activos');
    await list.expectRowHidden(stall.number);
    await list.setActiveFilter('Inactivos');
    await list.expectRowVisible(stall.number);
  });
});
