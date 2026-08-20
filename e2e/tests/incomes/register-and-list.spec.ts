import { test, expect } from '@playwright/test';
import { uniqueName, todayIso } from '../../factories/ids';
import { IncomeListPage } from '../../pages/incomes/income-list.page';
import { IncomeFormPage } from '../../pages/incomes/income-form.page';

test.describe('Epic 8 · Ingresos externos (RF-25, RF-29)', () => {
  test('4.8.1 registrar un ingreso en PEN', async ({ page }) => {
    const depositorName = uniqueName('Depositante');
    const list = new IncomeListPage(page);
    await list.goto();
    await list.openCreate();
    await new IncomeFormPage(page).create({
      depositorName,
      concept: 'Alquiler de local',
      amount: 120,
      currencyCode: 'PEN',
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('PEN')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).click();

    await list.goto();
    await list.expectRowVisible(depositorName);
    await expect(list.row(depositorName)).toContainText('PEN');
  });

  test('4.8.2 registrar un ingreso en USD', async ({ page }) => {
    const depositorName = uniqueName('Depositante');
    const list = new IncomeListPage(page);
    await list.goto();
    await list.openCreate();
    await new IncomeFormPage(page).create({
      depositorName,
      concept: 'Donación',
      amount: 200,
      currencyCode: 'USD',
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('USD')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).click();

    await list.goto();
    await list.expectRowVisible(depositorName);
    await expect(list.row(depositorName)).toContainText('USD');
    await expect(list.row(depositorName)).not.toContainText('PEN');
  });

  test('4.8.3 listar y filtrar ingresos por fecha muestra cada uno con su propia moneda', async ({
    page,
  }) => {
    const depositorPen = uniqueName('Depositante-PEN');
    const depositorUsd = uniqueName('Depositante-USD');
    const list = new IncomeListPage(page);

    await list.goto();
    await list.openCreate();
    await new IncomeFormPage(page).create({
      depositorName: depositorPen,
      concept: 'Alquiler de local',
      amount: 90,
      currencyCode: 'PEN',
    });
    await page.getByRole('button', { name: 'Cerrar' }).click();

    await list.goto();
    await list.openCreate();
    await new IncomeFormPage(page).create({
      depositorName: depositorUsd,
      concept: 'Donación',
      amount: 150,
      currencyCode: 'USD',
    });
    await page.getByRole('button', { name: 'Cerrar' }).click();

    await list.goto();
    await list.filterByDate(todayIso());

    await expect(list.row(depositorPen)).toContainText('PEN');
    await expect(list.row(depositorUsd)).toContainText('USD');
  });

  test('4.8.4 enviar el formulario vacío deja el registro deshabilitado', async ({ page }) => {
    const list = new IncomeListPage(page);
    await list.goto();
    await list.openCreate();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre del depositante').click();
    await dialog.getByRole('heading').click();

    await expect(dialog.getByRole('button', { name: 'Registrar ingreso' })).toBeDisabled();
  });
});
