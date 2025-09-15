import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { PublicProductsService } from '../../../api/public/products/products.service';
import { ProductsStore } from '../state/products.store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const productDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const slug = route.paramMap.get('slug');
  const service = inject(PublicProductsService);
  const store = inject(ProductsStore);
  if (!slug) return null;
  // If current product already matches requested slug, reuse it (avoid duplicate network + SSR duplication)
  const current = store.currentProduct();
  if (current && current.slug === slug) {
    return of(current);
  }
  return service.getProductBySlug(slug).pipe(
    tap(product => store.setPrefetchedProduct(product as any)),
    catchError(err => {
      // swallow error so route can still activate (component can handle its own fetch fallback)
      console.error('Product resolver failed', err);
      return of(null);
    })
  );
};
