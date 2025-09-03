import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, ActivatedRoute, UrlTree } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AdminApiKeyService } from '../services/admin-api-key.service';

/**
 * Guard to protect admin routes - checks if admin API key is available
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const adminApiKeyService = inject(AdminApiKeyService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If apiKey is present in URL for admin routes, let admin-login process it
  const hasApiKeyInUrl = isPlatformBrowser(platformId) && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('apiKey');
  if (!adminApiKeyService.isApiKeyValid() && hasApiKeyInUrl) {
    return router.parseUrl('/admin-login' as any) as UrlTree;
  }

  if (!adminApiKeyService.isApiKeyValid()) {
    // Store the intended route to redirect after API key is set (only in browser)
    if (isPlatformBrowser(platformId)) {
      sessionStorage.setItem('admin-intended-route', state.url);
    }
    // Redirect to a page that will show the modal
    router.navigate(['/admin-login']);
    return false;
  }

  return true;
};
