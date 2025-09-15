import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { PublicProductsService } from '../../../api/public/products/products.service';
import { ProductsStore } from '../state/products.store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PLATFORM_ID, inject as ngInject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const productDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const slug = route.paramMap.get('slug');
  const service = inject(PublicProductsService);
  const store = inject(ProductsStore);
  const platformId = ngInject(PLATFORM_ID);
  if (!slug) return of(null);

  const current = store.currentProduct();
  if (current && current.slug === slug) {
    return of(current);
  }

  // On the server: block until data fetched for proper SSR.
  if (!isPlatformBrowser(platformId)) {
    return service.getProductBySlug(slug).pipe(
      tap(product => store.setPrefetchedProduct(product as any)),
      catchError(err => {
        console.error('Product resolver (SSR) failed', err);
        return of(null);
      })
    );
  }

  // On the browser: kick off background fetch but resolve immediately so navigation is instant.
  service.getProductBySlug(slug).pipe(
    tap(product => store.setPrefetchedProduct(product as any)),
    catchError(err => {
      console.error('Product resolver (client) failed', err);
      return of(null);
    })
  ).subscribe();
  return of(current || null); // might be null; component shows its own loading state
};
