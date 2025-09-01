import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('../pages/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  // { path: 'categories', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/categories/categories.routes').then(m => m.CATEGORY_ROUTES) },
  // { path: 'products', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/products/products.routes').then(m => m.PRODUCT_ROUTES) },
  // { path: 'option-groups', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/option-groups/option-groups.routes').then(m => m.OPTION_GROUP_ROUTES) },
  // { path: 'variants', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/variants/variants.routes').then(m => m.VARIANT_ROUTES) },
  // { path: 'delivery-zones', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/delivery-zones/delivery-zones.routes').then(m => m.DELIVERY_ZONE_ROUTES) },
  // { path: 'orders', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/orders/orders.routes').then(m => m.ORDER_ROUTES) },
  // { path: 'config', canActivate: [adminGuard], loadChildren: () => import('./childrenroutes/config/config.routes').then(m => m.CONFIG_ROUTES) },
];
