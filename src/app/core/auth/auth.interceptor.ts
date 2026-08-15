import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];
const RETRY_MARKER = 'X-Retry-Refresh';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));
  const token = tokenStorage.accessToken;

  const outgoing = req.clone({
    withCredentials: true,
    setHeaders: isPublic || !token ? {} : { Authorization: `Bearer ${token}` },
  });

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublic) {
        if (req.headers.has(RETRY_MARKER)) {
          redirectToLogin(auth, router);
          return throwError(() => error);
        }
        return refreshAndRetry(req, next, tokenStorage, auth, router);
      }
      return throwError(() => error);
    }),
  );
};

function refreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  auth: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  return auth.ensureRefresh().pipe(
    switchMap(() => {
      const accessToken = tokenStorage.accessToken;
      const retried = req.clone({
        withCredentials: true,
        setHeaders: {
          Authorization: `Bearer ${accessToken ?? ''}`,
          [RETRY_MARKER]: 'true',
        },
      });
      return next(retried);
    }),
    catchError((error) => {
      redirectToLogin(auth, router);
      return throwError(() => error);
    }),
  );
}

function redirectToLogin(auth: AuthService, router: Router): void {
  auth.clearSession();
  router.navigate(['/login']);
}
