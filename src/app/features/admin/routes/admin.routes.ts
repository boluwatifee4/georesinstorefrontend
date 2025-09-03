import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('../layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('../pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'categories',
        loadChildren: () => import('./childrenroutes/categories/categories.routes').then(m => m.CATEGORY_ROUTES)
      },
      {
        path: 'option-groups',
        loadChildren: () => import('./childrenroutes/option-groups/option-groups.routes').then(m => m.OPTION_GROUP_ROUTES)
      },
      {
        path: 'variants',
        loadChildren: () => import('./childrenroutes/variants/variants.routes').then(m => m.VARIANT_ROUTES)
      },
      {
        path: 'products',
        loadChildren: () => import('./childrenroutes/products/products.routes').then(m => m.PRODUCT_ROUTES)
      },
      {
        path: 'delivery-zones',
        loadChildren: () => import('./childrenroutes/delivery-zones/delivery-zones.routes').then(m => m.DELIVERY_ZONE_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () => import('./childrenroutes/orders/orders.routes').then(m => m.ORDER_ROUTES)
      },
      {
        path: 'config',
        loadChildren: () => import('./childrenroutes/config/config.routes').then(m => m.CONFIG_ROUTES)
      },
      {
        path: 'invoice',
        loadComponent: () => import('../pages/invoice-generator/invoice-generator.component').then(m => m.InvoiceGeneratorComponent)
      },
    ]
  }
];
