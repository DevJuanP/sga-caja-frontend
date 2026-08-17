/** Lectura de consumo (US-19). */
export interface ConsumptionReadingResponse {
  uuid: string;
  accountReceivableUuid: string;
  initialReading: number;
  finalReading: number;
  unitCost: number;
  calculatedAmount: number;
}

/** Request para registrar una lectura de consumo (US-19). */
export interface RegisterConsumptionReadingRequest {
  accountReceivableUuid: string;
  initialReading: number;
  finalReading: number;
}
