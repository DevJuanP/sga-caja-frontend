import { Component, computed, effect, input, output } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { StatusChipComponent, ChipTone } from '../status-chip/status-chip.component';

export interface CxcRow {
  uuid: string;
  serviceName: string;
  destination: string;
  period: string;
  amount: number;
  statusChip: { label: string; tone: ChipTone };
  consumptionBased?: boolean;
}

@Component({
  selector: 'app-cxc-selection',
  imports: [MatTableModule, MatCheckboxModule, MatPaginatorModule, StatusChipComponent],
  templateUrl: './cxc-selection.component.html',
  styleUrl: './cxc-selection.component.css',
})
export class CxcSelectionComponent {
  readonly data = input<CxcRow[]>([]);
  readonly selectable = input(true);
  readonly totalElements = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(20);
  readonly preSelected = input<string[]>([]);

  readonly selectionChange = output<string[]>();
  readonly pageChange = output<PageEvent>();

  readonly displayedColumns = computed(() =>
    this.selectable()
      ? ['select', 'serviceName', 'destination', 'period', 'amountFormatted', 'statusChip']
      : ['serviceName', 'destination', 'period', 'amountFormatted', 'statusChip'],
  );

  readonly selection = new SelectionModel<CxcRow>(true, []);

  constructor() {
    effect(() => {
      const pre = this.preSelected();
      this.selection.clear();
      const toSelect = this.data().filter((row) => pre.includes(row.uuid));
      this.selection.select(...toSelect);
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.data().length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.data());
    }
    this.emitSelection();
  }

  toggleRow(row: CxcRow): void {
    this.selection.toggle(row);
    this.emitSelection();
  }

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  private emitSelection(): void {
    const selectedUuids = this.selection.selected.map((item) => item.uuid);
    this.selectionChange.emit(selectedUuids);
  }
}