import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ADMIN_API_KEY } from '../../config/tokens/api.tokens';

/**
 * Adds Authorization header with admin API key for requests to /admin endpoints
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const adminApiKey = inject(ADMIN_API_KEY);
  
  // Only add auth header for admin endpoints
  if (req.url.includes('/admin') && adminApiKey) {
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};
