import { Component, input } from '@angular/core';

/**
 * Encabezado de página (DESIGN §6): título `headline-small` + subtítulo opcional
 * y acciones a la derecha (p. ej. botón "Nuevo …" proyectado).
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
