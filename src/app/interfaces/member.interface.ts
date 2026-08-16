import { Stage } from './catalog.interface';

/** Socio (US-11). `stage` viene expandido en las respuestas del backend. */
export interface MemberResponse {
  uuid: string;
  code: string;
  firstName: string;
  lastName: string;
  shareNumber: string;
  stage: Stage;
  birthDate: string;
  active: boolean;
}

export interface MemberRequest {
  code: string;
  firstName: string;
  lastName: string;
  shareNumber: string;
  stageUuid: string;
  birthDate: string;
}
