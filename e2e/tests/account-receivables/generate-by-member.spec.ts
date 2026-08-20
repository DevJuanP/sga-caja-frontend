import { test, expect } from '../../fixtures/api-client.fixture';
import { memberFactory } from '../../factories/member.factory';
import { serviceFactory } from '../../factories/service.factory';
import { stageUuidByCode } from '../../factories/catalogs';
import { todayIso, uniqueCode } from '../../factories/ids';
import { CxcListPage } from '../../pages/cxc/cxc-list.page';
import { CxcGenerateDialogPage } from '../../pages/cxc/cxc-generate-dialog.page';

test.describe('Epic 4 · CxC — Generación por socios (RF-16–RF-18)', () => {
  test('4.3.3 generar CxC por socios filtrando por etapa incluye solo la etapa marcada', async ({
    page,
    apiAdmin,
  }) => {
    const stage1Uuid = await stageUuidByCode(apiAdmin, 1);
    const stage2Uuid = await stageUuidByCode(apiAdmin, 2);
    const memberStage1 = await memberFactory.createViaApi(apiAdmin, {
      lastName: uniqueCode('Etapa1-', 20),
      stageUuid: stage1Uuid,
    });
    const memberStage2 = await memberFactory.createViaApi(apiAdmin, {
      lastName: uniqueCode('Etapa2-', 20),
      stageUuid: stage2Uuid,
    });
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Member',
      consumptionBased: false,
      cost: 50,
    });

    const list = new CxcListPage(page);
    await list.goto();
    await list.openGenerate();
    const dialog = new CxcGenerateDialogPage(page);
    await dialog.fillByMember({
      serviceName: service.name,
      periodStartDate: todayIso(),
      periodEndDate: todayIso(),
      amount: 50,
      stages: [1],
    });
    await dialog.submit();

    await expect(dialog.resultRow(memberStage1.lastName)).toBeVisible();
    await expect(dialog.resultRow(memberStage2.lastName)).toHaveCount(0);
  });

  test('4.3.4 "solo socios únicos" deduplica por nombre completo', async ({ page, apiAdmin }) => {
    const stage1Uuid = await stageUuidByCode(apiAdmin, 1);
    const sharedLastName = uniqueCode('Duplicado-', 20);
    await memberFactory.createViaApi(apiAdmin, {
      firstName: 'E2E',
      lastName: sharedLastName,
      stageUuid: stage1Uuid,
    });
    await memberFactory.createViaApi(apiAdmin, {
      firstName: 'E2E',
      lastName: sharedLastName,
      stageUuid: stage1Uuid,
    });
    const service = await serviceFactory.createViaApi(apiAdmin, {
      chargeTarget: 'Member',
      consumptionBased: false,
      cost: 50,
    });

    const list = new CxcListPage(page);
    await list.goto();

    // Con "solo socios únicos" activo (default): una sola CxC para el nombre duplicado.
    await list.openGenerate();
    const dialogUnique = new CxcGenerateDialogPage(page);
    await dialogUnique.fillByMember({
      serviceName: service.name,
      periodStartDate: todayIso(),
      periodEndDate: todayIso(),
      amount: 50,
      stages: [1],
      uniqueMembers: true,
    });
    await dialogUnique.submit();
    await expect(dialogUnique.resultRow(sharedLastName)).toHaveCount(1);
    await dialogUnique.close();

    // Desactivando el toggle: una CxC por cada socio (2 filas con el mismo nombre).
    await list.openGenerate();
    const dialogAll = new CxcGenerateDialogPage(page);
    await dialogAll.fillByMember({
      serviceName: service.name,
      periodStartDate: todayIso(),
      periodEndDate: todayIso(),
      amount: 50,
      stages: [1],
      uniqueMembers: false,
    });
    await dialogAll.submit();
    await expect(dialogAll.resultRow(sharedLastName)).toHaveCount(2);
  });
});
