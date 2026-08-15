/**
 * Ítem genérico de catálogo de solo lectura (`GET /api/{recurso}` devuelve
 * `List<T>[]` sin paginar). Ver `docs/epics/epic-02-catalogos.md`.
 */
export interface CatalogItem {
  uuid: string;
  name: string;
}

/** Moneda (US-02): incluye `code` corto (PEN / USD) para etiquetas y formato. */
export interface Currency extends CatalogItem {
  code: string;
}

/** Etapa de socio (US-03): incluye `code` numérico usado en el filtro `stageCodes`. */
export interface Stage extends CatalogItem {
  code: number;
}
