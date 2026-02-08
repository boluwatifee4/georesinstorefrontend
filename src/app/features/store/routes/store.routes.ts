import { Routes } from '@angular/router';
import { catalogResolver } from '../resolvers/catalog.resolver';
import { productDetailResolver } from '../resolvers/product-detail.resolver';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../layouts/store-layout/store-layout.component').then(
        (m) => m.StoreLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../pages/store-home/store-home.component').then(
            (m) => m.StoreHomeComponent,
          ),
        resolve: { init: catalogResolver },
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../pages/products/products.component').then(
            (m) => m.ProductsComponent,
          ),
        resolve: { init: catalogResolver },
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('../pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
        resolve: { product: productDetailResolver },
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('../pages/returns-policy/returns-policy.component').then(
            (m) => m.ReturnsPolicyComponent,
          ),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('../pages/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('../pages/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
      },
      {
        path: 'orders/lookup',
        loadComponent: () =>
          import('../pages/order-lookup/order-lookup.component').then(
            (m) => m.OrderLookupComponent,
          ),
      },
    ],
  },
];
