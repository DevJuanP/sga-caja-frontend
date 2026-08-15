import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { CatalogItem } from '../../interfaces/catalog.interface';

/** Claves de los catálogos de solo lectura (EPIC 2, US-02 … US-09). */
export type CatalogKey =
  | 'currencies'
  | 'stages'
  | 'recurrenceTypes'
  | 'receiptTypes'
  | 'incomeCategories'
  | 'expenseReasons'
  | 'chargeTargetTypes'
  | 'accountReceivableStatuses'
  | 'expenseStatuses';

const CATALOG_PATHS: Record<CatalogKey, string> = {
  currencies: 'currencies',
  stages: 'stages',
  recurrenceTypes: 'recurrence-types',
  receiptTypes: 'receipt-types',
  incomeCategories: 'income-categories',
  expenseReasons: 'expense-reasons',
  chargeTargetTypes: 'charge-target-types',
  accountReceivableStatuses: 'account-receivable-statuses',
  expenseStatuses: 'expense-statuses',
};

/**
 * Servicio compartido de catálogos de solo lectura. Cada listado se cachea tras
 * la primera carga (una sola petición HTTP por catálogo en toda la sesión).
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);
  private readonly cache = new Map<CatalogKey, Observable<CatalogItem[]>>();

  /** Listado del catálogo (cacheado tras la primera carga). */
  list<T extends CatalogItem = CatalogItem>(key: CatalogKey): Observable<T[]> {
    let cached = this.cache.get(key);
    if (!cached) {
      cached = this.api
        .get<CatalogItem[]>(CATALOG_PATHS[key])
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.cache.set(key, cached);
    }
    return cached as Observable<T[]>;
  }

  /** Detalle por uuid (no cacheado; útil para precargar un valor guardado). */
  getDetail<T extends CatalogItem = CatalogItem>(key: CatalogKey, uuid: string): Observable<T> {
    return this.api.get<T>(`${CATALOG_PATHS[key]}/${uuid}`);
  }

  /** Invalida la caché para forzar una recarga en el próximo `list`. */
  invalidate(key: CatalogKey): void {
    this.cache.delete(key);
  }
}
