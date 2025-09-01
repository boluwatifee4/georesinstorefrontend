import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ADMIN_API_KEY } from '../../config/tokens/api.tokens';

/**
 * Guard to protect admin routes - checks if admin API key is configured
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const adminApiKey = inject(ADMIN_API_KEY);
  const router = inject(Router);

  if (!adminApiKey || adminApiKey.trim() === '') {
    // Redirect to store if no admin key configured
    router.navigate(['/store']);
    return false;
  }

  return true;
};
