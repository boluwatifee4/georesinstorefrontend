import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor that adds no-cache headers to all HTTP requests
 * to prevent browser and proxy caching of API responses
 */
export const noCacheInterceptor: HttpInterceptorFn = (req, next) => {
    // Add no-cache headers to all requests
    const noCacheReq = req.clone({
        setHeaders: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });

    return next(noCacheReq);
};
