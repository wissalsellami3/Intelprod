import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);

  if (authService.isAdmin()) {
    return true;
  }

  alertService.error('Access denied. Admin privileges required.');
  router.navigate(['/dashboard']);
  return false;
};