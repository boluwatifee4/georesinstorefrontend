import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ProductsStore } from '../state/products.store';
import { CategoriesStore } from '../state/categories.store';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const catalogResolver: ResolveFn<boolean> = () => {
  const platformId = inject(PLATFORM_ID);
  const products = inject(ProductsStore);
  const categories = inject(CategoriesStore);

  // On the server: don't make API calls, just return true
  // This prevents SSR timeouts from hanging HTTP requests
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  // If already have products, skip
  if (products.hasProducts()) return of(true);
  products.loadProducts({ page: 1, limit: 20 });
  categories.loadCategories();
  // Rough completion indicator; stores themselves manage loading flags
  return of(true);
};
