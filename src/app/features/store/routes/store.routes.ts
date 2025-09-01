import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/store-home.component').then(m => m.StoreHomeComponent),
  },
  // { path: 'categories', loadChildren: () => import('./childrenroutes/categories/categories.routes').then(m => m.CATEGORY_ROUTES) },
  // { path: 'products', loadChildren: () => import('./childrenroutes/products/products.routes').then(m => m.PRODUCT_ROUTES) },
  // { path: 'cart', loadChildren: () => import('./childrenroutes/cart/cart.routes').then(m => m.CART_ROUTES) },
  // { path: 'delivery', loadChildren: () => import('./childrenroutes/delivery/delivery.routes').then(m => m.DELIVERY_ROUTES) },
  // { path: 'orders', loadChildren: () => import('./childrenroutes/orders/orders.routes').then(m => m.ORDER_ROUTES) },
];
