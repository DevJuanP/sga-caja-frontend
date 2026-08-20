import { test, expect } from '../../fixtures/api-client.fixture';
import { memberFactory } from '../../factories/member.factory';
import { todayIso, uniqueCode } from '../../factories/ids';
import { CrudListPage } from '../../pages/masters/crud-list.page';
import { ConfirmDialogPage } from '../../pages/masters/confirm-dialog.page';
import { MemberFormPage } from '../../pages/masters/member-form.page';
import { expectRequiredFieldBlocksSave } from '../../pages/masters/form-dialog.util';

const PATH = '/masters/members';

/** Fecha pasada estable para `birthDate` (el validador solo exige `< hoy`). */
const PAST_BIRTH_DATE = '1990-01-01';

test.describe('Epic 3 · Maestros — Socios (RF-05–RF-12)', () => {
  test('4.2.x.1 listar muestra la tabla de socios', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Socios' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Código' })).toBeVisible();
  });

  test('4.2.x.2 crear un socio nuevo lo muestra al buscar por su código', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    const code = uniqueCode('E2E-M-', 20);

    await list.goto();
    await list.clickCreate('Nuevo socio');
    await new MemberFormPage(page).create({
      code,
      firstName: 'E2E',
      lastName: 'Socio Creado',
      shareNumber: uniqueCode('SH-', 20),
      birthDate: PAST_BIRTH_DATE,
    });

    await list.search(code);
    await list.expectRowVisible(code);
  });

  test('4.2.x.3 editar un socio propio actualiza el apellido', async ({ page, apiAdmin }) => {
    const member = await memberFactory.createViaApi(apiAdmin);
    const newLastName = uniqueCode('Editado-', 20);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(member.code);
    await list.clickRowAction(member.code, 'Editar');
    const form = new MemberFormPage(page);
    await form.fill({
      code: member.code,
      firstName: 'E2E',
      lastName: newLastName,
      shareNumber: uniqueCode('SH-', 20),
      birthDate: PAST_BIRTH_DATE,
    });
    await form.submit();

    await list.expectRowVisible(newLastName);
  });

  test('4.2.x.4 enviar el formulario vacío deja Guardar deshabilitado', async ({ page }) => {
    const list = new CrudListPage(page, PATH);
    await list.goto();
    await list.clickCreate('Nuevo socio');

    await expectRequiredFieldBlocksSave(page, 'Código');
  });

  test('4.2.x.4b fecha de nacimiento futura es rechazada', async ({ page, apiAdmin }) => {
    const member = await memberFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await list.goto();
    await list.search(member.code);
    await list.clickRowAction(member.code, 'Editar');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Fecha de nacimiento').fill(futureDate);
    await dialog.getByLabel('Código').click();

    await expect(dialog.getByText('Debe ser una fecha pasada')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
  });

  test('4.2.x.5 desactivar/reactivar un socio propio se refleja en el filtro de estado', async ({
    page,
    apiAdmin,
  }) => {
    const member = await memberFactory.createViaApi(apiAdmin);
    const list = new CrudListPage(page, PATH);

    await list.goto();
    await list.search(member.code);
    await list.clickRowAction(member.code, 'Desactivar');
    await new ConfirmDialogPage(page).confirm('Desactivar');

    await list.setActiveFilter('Activos');
    await list.expectRowHidden(member.code);
    await list.setActiveFilter('Inactivos');
    await list.expectRowVisible(member.code);

    await list.clickRowAction(member.code, 'Reactivar');
    await new ConfirmDialogPage(page).confirm('Reactivar');

    await list.setActiveFilter('Activos');
    await list.expectRowVisible(member.code);
  });
});
