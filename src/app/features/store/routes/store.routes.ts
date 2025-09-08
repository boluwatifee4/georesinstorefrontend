import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../layouts/store-layout/store-layout.component').then(m => m.StoreLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('../pages/store-home/store-home.component').then(m => m.StoreHomeComponent) },
      { path: 'products', loadComponent: () => import('../pages/products/products.component').then(m => m.ProductsComponent) },
      { path: 'products/:slug', loadComponent: () => import('../pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      // future: cart, checkout etc under /store
    ]
  }
];
