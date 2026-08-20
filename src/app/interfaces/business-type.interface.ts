/** Giro comercial (US-10). "Eliminar" en la UI en realidad desactiva (soft delete). */
export interface BusinessType {
  uuid: string;
  name: string;
  active: boolean;
}

export interface BusinessTypeRequest {
  name: string;
}
