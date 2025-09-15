import { inject, PLATFORM_ID } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PublicProductsService } from '../../../api/public/products/products.service';
import { ProductsStore } from '../state/products.store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const productDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  const platformId = inject(PLATFORM_ID);
  const store = inject(ProductsStore);

  // Reuse if cached
  const current = store.currentProduct();
  if (current && current.slug === slug) return of(current);

  // On server: skip dynamic fetch (avoid blocking prerender or failing due to missing slug list)
  if (!isPlatformBrowser(platformId)) {
    return of(null);
  }

  const service = inject(PublicProductsService);
  return service.getProductBySlug(slug).pipe(
    tap(product => store.setPrefetchedProduct(product as any)),
    catchError(err => {
      console.error('Product resolver failed', err);
      return of(null);
    })
  );
};
