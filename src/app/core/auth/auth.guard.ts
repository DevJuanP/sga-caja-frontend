import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const redirectToLogin = () => of(router.createUrlTree(['/login']));

  if (!auth.isAuthenticated()) {
    return redirectToLogin();
  }
  if (auth.user()) {
    return of(true);
  }
  return auth.me().pipe(
    map(() => true),
    catchError(() => {
      auth.clearSession();
      return redirectToLogin();
    }),
  );
};
