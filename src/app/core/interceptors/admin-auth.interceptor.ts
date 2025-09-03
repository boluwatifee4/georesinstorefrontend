import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminApiKeyService } from '../services/admin-api-key.service';

/**
 * Adds Authorization header with admin API key for requests to /admin endpoints
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const adminApiKeyService = inject(AdminApiKeyService);

  // Only add auth header for admin endpoints
  if (req.url.includes('/admin')) {
    const adminApiKey = adminApiKeyService.getApiKey();
    if (adminApiKey) {
      const authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${adminApiKey}`
        }
      });
      return next(authReq);
    }
  }

  return next(req);
};
