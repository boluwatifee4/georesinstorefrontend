import { Routes } from '@angular/router';

export const DELIVERY_ZONE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/delivery-mgt/delivery-zones-list/delivery-zones-list.component').then(m => m.DeliveryZonesListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('../../../pages/delivery-mgt/delivery-zone-form/delivery-zone-form.component').then(m => m.DeliveryZoneFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../../../pages/delivery-mgt/delivery-zone-form/delivery-zone-form.component').then(m => m.DeliveryZoneFormComponent),
  },
];
