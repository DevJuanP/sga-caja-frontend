import { CatalogItem } from './catalog.interface';

/** Referencia a un socio desde un puesto (fullName en vez de firstName/lastName). */
export interface MemberRef {
  uuid: string;
  fullName: string;
}

/** Puesto (US-12). `member` es `null` cuando el puesto es de un no socio (inquilino). */
export interface StallResponse {
  uuid: string;
  number: string;
  businessType: CatalogItem;
  member: MemberRef | null;
  tenantName: string;
  tenantDocument: string;
  validityStartDate: string;
  validityEndDate: string;
  active: boolean;
}

export interface StallRequest {
  number: string;
  businessTypeUuid: string;
  memberUuid: string;
  tenantName: string;
  tenantDocument: string;
  validityStartDate: string;
  validityEndDate: string;
}
