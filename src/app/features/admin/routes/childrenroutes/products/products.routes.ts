import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/product-mgt/products-list/products-list.component').then(m => m.ProductsListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('../../../pages/product-mgt/products-form/products-form.component').then(m => m.ProductsFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('../../../pages/product-mgt/products-detail/products-detail.component').then(m => m.ProductsDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../../../pages/product-mgt/products-form/products-form.component').then(m => m.ProductsFormComponent),
  }
];
