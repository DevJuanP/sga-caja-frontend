import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { formatAmount } from '../../pipes/amount-format.util';

export interface ReceiptData {
  uuid: string;
  receiptTypeName: string;
  correlativeNumber: number;
  issueDate: string;
  amount: number;
  currencyCode?: string;
  paymentDate?: string;
  createdBy?: { username: string };
}

@Component({
  selector: 'app-receipt-viewer',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './receipt-viewer.component.html',
  styleUrl: './receipt-viewer.component.css',
})
export class ReceiptViewerComponent {
  readonly receipt = input.required<ReceiptData>();

  readonly formattedAmount = computed(() => formatAmount(this.receipt().amount));

  print(): void {
    window.print();
  }
}