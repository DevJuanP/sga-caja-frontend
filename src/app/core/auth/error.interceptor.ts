import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorResponse } from '../../interfaces/common.interface';

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';
const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado.';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as ErrorResponse | undefined;
      const apiError: ApiError = {
        status: error.status,
        code: body?.error ?? error.statusText ?? UNKNOWN_ERROR_CODE,
        message: body?.message ?? error.message ?? UNEXPECTED_ERROR_MESSAGE,
      };
      return throwError(() => apiError);
    }),
  );
