import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest, debounceTime, map, startWith } from 'rxjs';

export interface CatalogFilter {
  search: string;
  active: 'true' | 'false' | null;
}

/**
 * Barra de filtros (DESIGN §6): búsqueda con debounce + filtro de activos
 * (Todos/Activos/Inactivos) + botón para limpiar.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css',
})
export class FilterBarComponent {
  readonly placeholder = input('Buscar...');
  readonly showActiveFilter = input(true);

  readonly filterChange = output<CatalogFilter>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly activeControl = new FormControl<'all' | 'true' | 'false'>('all', { nonNullable: true });

  private readonly changes$ = combineLatest([
    this.searchControl.valueChanges.pipe(startWith(''), debounceTime(300), map((v) => v.trim())),
    this.activeControl.valueChanges.pipe(startWith<'all' | 'true' | 'false'>('all')),
  ]).pipe(
    map(
      ([search, active]): CatalogFilter => ({
        search,
        active: active === 'all' ? null : (active as 'true' | 'false'),
      }),
    ),
  );

  constructor() {
    this.changes$.subscribe((value) => this.filterChange.emit(value));
  }

  clear(): void {
    this.searchControl.setValue('');
    this.activeControl.setValue('all');
  }
}
