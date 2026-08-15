import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../interfaces/auth.interface';
import { AuthService } from './auth.service';

export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.user()?.roleName;
    if (role && roles.includes(role)) {
      return true;
    }
    return router.createUrlTree(['/home']);
  };
}
