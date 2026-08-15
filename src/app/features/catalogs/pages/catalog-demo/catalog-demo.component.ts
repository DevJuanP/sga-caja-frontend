import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CatalogSelectComponent } from '../../../../shared/components/catalog-select/catalog-select.component';
import { CatalogKey } from '../../catalog.service';

interface DemoCatalog {
  key: CatalogKey;
  label: string;
}

/**
 * Vista de demostración (solo dev) de los catálogos de solo lectura:
 * un `catalog-select` por cada catálogo del EPIC 2 (US-02 … US-09).
 */
@Component({
  selector: 'app-catalog-demo',
  imports: [CatalogSelectComponent],
  templateUrl: './catalog-demo.component.html',
  styleUrl: './catalog-demo.component.css',
})
export class CatalogDemoComponent {
  readonly catalogs: DemoCatalog[] = [
    { key: 'currencies', label: 'Moneda (US-02)' },
    { key: 'stages', label: 'Etapa de socio (US-03)' },
    { key: 'recurrenceTypes', label: 'Tipo de recurrencia (US-04)' },
    { key: 'receiptTypes', label: 'Tipo de comprobante (US-05)' },
    { key: 'incomeCategories', label: 'Categoría de ingreso (US-06)' },
    { key: 'expenseReasons', label: 'Motivo de egreso (US-07)' },
    { key: 'chargeTargetTypes', label: 'Destino de cobro (US-08)' },
    { key: 'accountReceivableStatuses', label: 'Estado de CxC (US-09)' },
    { key: 'expenseStatuses', label: 'Estado de egreso (US-09)' },
  ];

  readonly controls: Record<CatalogKey, FormControl<string | null>> = {
    currencies: new FormControl<string | null>(null),
    stages: new FormControl<string | null>(null),
    recurrenceTypes: new FormControl<string | null>(null),
    receiptTypes: new FormControl<string | null>(null),
    incomeCategories: new FormControl<string | null>(null),
    expenseReasons: new FormControl<string | null>(null),
    chargeTargetTypes: new FormControl<string | null>(null),
    accountReceivableStatuses: new FormControl<string | null>(null),
    expenseStatuses: new FormControl<string | null>(null),
  };
}
