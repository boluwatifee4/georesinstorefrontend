import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ProductsStore } from '../state/products.store';
import { CategoriesStore } from '../state/categories.store';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const catalogResolver: ResolveFn<boolean> = () => {
  const products = inject(ProductsStore);
  const categories = inject(CategoriesStore);
  // If already have products, skip
  if (products.hasProducts()) return of(true);
  products.loadProducts({ page: 1, limit: 20 });
  categories.loadCategories();
  // Rough completion indicator; stores themselves manage loading flags
  return of(true);
};
