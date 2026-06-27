import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { of } from 'rxjs';

export const PRERENDER_PRODUCTS_CACHE = new InjectionToken<any[]>('PRERENDER_PRODUCTS_CACHE');

/**
 * Interceptor that uses a local cache of products during server-side prerendering
 * to avoid making duplicate HTTP requests to the live API and triggering rate limits.
 */
export const serverCacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept product detail GET requests
  if (req.method === 'GET' && req.url.includes('/products/')) {
    // Avoid intercepting special routes like /products/featured
    if (req.url.includes('/products/featured')) {
      return next(req);
    }

    const cache = inject(PRERENDER_PRODUCTS_CACHE, { optional: true });
    if (cache && Array.isArray(cache)) {
      const parts = req.url.split('/products/');
      const slugWithQuery = parts[parts.length - 1];
      const slug = slugWithQuery.split('?')[0]; // Remove query params

      const product = cache.find((p: any) => p.slug === slug);
      if (product) {
        // console.log(`[Prerender Cache] Serving product: ${slug}`);
        return of(new HttpResponse({
          status: 200,
          body: product,
          url: req.url
        }));
      }
    }
  }

  return next(req);
};
