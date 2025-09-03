import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/orders-mgt/orders-list/orders-list.component').then(m => m.OrdersListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('../../../pages/orders-mgt/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
  },
  {
    path: ':id/status',
    loadComponent: () => import('../../../pages/orders-mgt/order-status/order-status.component').then(m => m.OrderStatusComponent),
  },
];
