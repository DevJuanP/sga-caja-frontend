import { expect, Page } from '@playwright/test';

export class CxcSummaryPage {
  constructor(private readonly page: Page) {}

  async gotoForMember(memberUuid: string): Promise<void> {
    await this.page.goto(`/account-receivables/summary?memberUuid=${memberUuid}`);
  }

  async gotoForStall(stallUuid: string): Promise<void> {
    await this.page.goto(`/account-receivables/summary?stallUuid=${stallUuid}`);
  }

  row(uniqueText: string) {
    return this.page.getByRole('row', { name: uniqueText });
  }

  async expectRowVisible(uniqueText: string): Promise<void> {
    await expect(this.row(uniqueText)).toBeVisible();
  }
}
