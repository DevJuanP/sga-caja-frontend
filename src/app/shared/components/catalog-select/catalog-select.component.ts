import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Component, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { switchMap } from 'rxjs';
import { CatalogKey, CatalogService } from '../../../features/catalogs/catalog.service';
import { CatalogItem } from '../../../interfaces/catalog.interface';

/**
 * Select reutilizable alimentado por un catálogo de solo lectura (EPIC 2).
 * Usa el `FormControl` que el padre provee; el valor es el `uuid` del ítem
 * (`null` = sin asignar). El listado se cachea en `CatalogService`.
 */
@Component({
  selector: 'app-catalog-select',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './catalog-select.component.html',
  styleUrl: './catalog-select.component.css',
})
export class CatalogSelectComponent {
  private readonly catalogService = inject(CatalogService);

  readonly catalogKey = input.required<CatalogKey>();
  readonly control = input.required<FormControl<string | null>>();
  readonly label = input<string>();
  readonly placeholder = input<string>('Seleccione...');
  readonly allowEmpty = input(false);

  private readonly items$ = toObservable(this.catalogKey).pipe(
    switchMap((key) => this.catalogService.list<CatalogItem>(key)),
  );
  readonly items = toSignal(this.items$, { initialValue: [] });
}
