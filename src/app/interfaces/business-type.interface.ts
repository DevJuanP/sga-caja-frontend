/** Giro comercial (US-10). Único maestro que usa DELETE (eliminación dura). */
export interface BusinessType {
  uuid: string;
  name: string;
}

export interface BusinessTypeRequest {
  name: string;
}
