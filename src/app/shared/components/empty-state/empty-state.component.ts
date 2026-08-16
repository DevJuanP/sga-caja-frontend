import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Estado vacío de tablas/listados: ícono + mensaje (DESIGN §6). */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly message = input.required<string>();
}
