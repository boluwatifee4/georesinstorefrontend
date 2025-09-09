import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../layouts/store-layout/store-layout.component').then(m => m.StoreLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('../pages/store-home/store-home.component').then(m => m.StoreHomeComponent) },
      { path: 'products', loadComponent: () => import('../pages/products/products.component').then(m => m.ProductsComponent) },
      { path: 'products/:slug', loadComponent: () => import('../pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      { path: 'cart', loadComponent: () => import('../pages/cart/cart.component').then(m => m.CartComponent) },
      { path: 'checkout', loadComponent: () => import('../pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'orders/lookup', loadComponent: () => import('../pages/order-lookup/order-lookup.component').then(m => m.OrderLookupComponent) },
    ]
  }
];
