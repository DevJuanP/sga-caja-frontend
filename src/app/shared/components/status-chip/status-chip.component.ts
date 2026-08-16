import { Component, input } from '@angular/core';

export type ChipTone = 'success' | 'warning' | 'neutral' | 'danger';

/**
 * Chip de estado (DESIGN §2.3): color semántico + texto. Nunca usar color solo.
 */
@Component({
  selector: 'app-status-chip',
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.css',
})
export class StatusChipComponent {
  readonly tone = input<ChipTone>('neutral');
  readonly label = input.required<string>();
}
