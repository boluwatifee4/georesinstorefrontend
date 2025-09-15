import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { PublicProductsService } from '../../../api/public/products/products.service';
import { ProductsStore } from '../state/products.store';

export const productDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const slug = route.paramMap.get('slug');
  const service = inject(PublicProductsService);
  const store = inject(ProductsStore);
  if (!slug) return null;
  return service.getProductBySlug(slug).pipe(
    // Side effect: push into store
    // Could import tap from rxjs/operators but keep import cost low inline dynamic
    {
      next(product: any) { store.setPrefetchedProduct(product); },
    } as any
  );
};
